import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { Threat, SeverityLevel } from '../types/index.js'

export interface DependencyEntry {
  name: string
  version: string
  ecosystem: 'npm' | 'PyPI'
}

interface OsvVuln {
  id: string
  summary?: string
  severity?: Array<{ type: string; score: string }>
  references?: Array<{ url: string }>
}

interface OsvBatchResponse {
  results: Array<{ vulns?: OsvVuln[] }>
}

// Extract a leading semver digit sequence; skip range-only strings
function extractVersion(raw: string): string | undefined {
  const cleaned = raw.trim().replace(/^[~^>=<! ]+/, '')
  return /^\d[\d.]*/.test(cleaned) ? cleaned : undefined
}

// Map a raw CVSS string to severity
function cvssScore(score: string | undefined): SeverityLevel {
  const n = parseFloat(score ?? '0')
  if (n >= 9.0) return 'critical'
  if (n >= 7.0) return 'high'
  if (n >= 4.0) return 'medium'
  return 'low'
}

function worstSeverity(sev: OsvVuln['severity']): SeverityLevel {
  if (!sev?.length) return 'medium'
  const order: SeverityLevel[] = ['low', 'medium', 'high', 'critical']
  return sev
    .map(s => cvssScore(s.score))
    .reduce((a, b) => (order.indexOf(b) > order.indexOf(a) ? b : a))
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parsePackageJson(content: string): DependencyEntry[] {
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(content) as Record<string, unknown> } catch { return [] }
  const deps: DependencyEntry[] = []
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const block = parsed[section]
    if (typeof block !== 'object' || !block) continue
    for (const [name, raw] of Object.entries(block)) {
      if (typeof raw !== 'string') continue
      const version = extractVersion(raw)
      if (version) deps.push({ name, version, ecosystem: 'npm' })
    }
  }
  return deps
}

function parseRequirementsTxt(content: string): DependencyEntry[] {
  return content.split('\n').flatMap(rawLine => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('-')) return []
    const m = line.match(/^([A-Za-z0-9_.-]+(?:\[[^\]]*\])?)\s*[=~><]+\s*([^\s,;#]+)/)
    if (!m) return []
    const name = (m[1] ?? '').replace(/\[.*\]/, '')
    const version = extractVersion(m[2] ?? '')
    return name && version ? [{ name, version, ecosystem: 'PyPI' as const }] : []
  })
}

function parsePyprojectToml(content: string): DependencyEntry[] {
  const deps: DependencyEntry[] = []
  let inDeps = false
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('[')) {
      inDeps = ['[tool.poetry.dependencies]', '[tool.poetry.dev-dependencies]', '[project]'].includes(line)
      continue
    }
    if (!inDeps || line.startsWith('dependencies')) continue
    const m = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(?:\{[^}]*version\s*=\s*"([^"]+)"|"([^"]+)")/i)
    if (!m) continue
    const name = m[1]
    if (!name || name === 'python') continue
    const version = extractVersion(m[2] ?? m[3] ?? '')
    if (version) deps.push({ name, version, ecosystem: 'PyPI' })
  }
  return deps
}

/** Parse a dependency manifest file into typed entries. */
export async function parseDependencyFile(filePath: string): Promise<DependencyEntry[]> {
  let content: string
  try { content = await readFile(filePath, 'utf-8') } catch { return [] }
  const base = filePath.split('/').pop() ?? ''
  if (base === 'package.json') return parsePackageJson(content)
  if (base === 'requirements.txt') return parseRequirementsTxt(content)
  if (base === 'pyproject.toml') return parsePyprojectToml(content)
  return []
}

// ─── OSV API ──────────────────────────────────────────────────────────────────

const OSV_URL = 'https://api.osv.dev/v1/querybatch'

async function callOsv(
  deps: Array<{ dep: DependencyEntry; filePath: string }>
): Promise<Array<{ dep: DependencyEntry; filePath: string; vulns: OsvVuln[] }>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(OSV_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: deps.map(({ dep }) => ({
          package: { name: dep.name, ecosystem: dep.ecosystem },
          version: dep.version,
        })),
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = (await res.json()) as OsvBatchResponse
    return body.results.map((r, i) => ({
      dep: deps[i]!.dep,
      filePath: deps[i]!.filePath,
      vulns: r.vulns ?? [],
    }))
  } finally {
    clearTimeout(timer)
  }
}

function buildThreat(vuln: OsvVuln, dep: DependencyEntry, filePath: string): Threat {
  const severity = worstSeverity(vuln.severity)
  const cvss = vuln.severity?.find(s => s.type.startsWith('CVSS'))?.score ?? 'unknown'
  const ref = vuln.references?.[0]?.url ?? `https://osv.dev/vulnerability/${vuln.id}`
  return {
    id: randomUUID(),
    ruleId: `osv-${vuln.id}`,
    category: 'supply-chain',
    severity,
    message: `Vulnerable dependency: ${dep.name}@${dep.version} — ${vuln.summary ?? vuln.id} (CVSS: ${cvss})`,
    evidence: [{
      type: 'config',
      description: `${dep.ecosystem} package ${dep.name}@${dep.version} has known vulnerability ${vuln.id}`,
      snippet: `"${dep.name}": "${dep.version}"`,
    }],
    location: { file: filePath, line: 1, column: 0 },
    confidence: 100,
    confidenceTier: 'confirmed',
    remediation: `Update ${dep.name} to a patched version. See: ${ref}`,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface OsvCheckResult {
  threats: Threat[]
  dependencyFiles: string[]
}

/** Check dependency files in targetPath for OSV vulnerabilities. */
export async function runOsvCheck(targetPath: string, verbose: boolean): Promise<OsvCheckResult> {
  const files = ['package.json', 'requirements.txt', 'pyproject.toml'].map(f => join(targetPath, f))
  const foundFiles: string[] = []
  const allDeps: Array<{ dep: DependencyEntry; filePath: string }> = []

  for (const filePath of files) {
    const deps = await parseDependencyFile(filePath)
    if (deps.length > 0) {
      foundFiles.push(filePath)
      deps.forEach(dep => allDeps.push({ dep, filePath }))
    }
  }

  if (allDeps.length === 0) return { threats: [], dependencyFiles: [] }
  if (verbose) console.log(`OSV: checking ${allDeps.length} dependencies from ${foundFiles.length} file(s)`)

  // OSV allows max 1000 per batch
  const BATCH = 1000
  const threats: Threat[] = []

  for (let i = 0; i < allDeps.length; i += BATCH) {
    const chunk = allDeps.slice(i, i + BATCH)
    let results: Array<{ dep: DependencyEntry; filePath: string; vulns: OsvVuln[] }>
    try {
      results = await callOsv(chunk)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`OSV: API unreachable (${msg}), skipping vulnerability check`)
      return { threats: [], dependencyFiles: foundFiles }
    }
    for (const { dep, filePath, vulns } of results) {
      threats.push(...vulns.map(v => buildThreat(v, dep, filePath)))
    }
  }

  if (verbose) console.log(`OSV: found ${threats.length} vulnerabilities`)
  return { threats, dependencyFiles: foundFiles }
}
