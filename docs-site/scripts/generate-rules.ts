import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Types ────────────────────────────────────────────────────────────────────

interface RulePattern {
  type: string
  pattern: string
  weight: number
  description?: string
}

interface Rule {
  id: string
  name: string
  description: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  version: string
  enabled: boolean
  confidenceThreshold: number
  patterns: RulePattern[]
  remediation: string
  references?: string[]
  platforms?: string[]
}

interface RuleFile {
  rules: Rule[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: '🔴 Critical',
  high: '🟠 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
}

const CATEGORY_LABELS: Record<string, string> = {
  'access-control': 'Access Control',
  'agent-memory-poisoning': 'Agent Memory Poisoning',
  'credential-harvesting': 'Credential Harvesting',
  'data-exfiltration': 'Data Exfiltration',
  'file-system-abuse': 'File System Abuse',
  'insecure-config': 'Insecure Configuration',
  'known-malicious': 'Known Malicious Patterns',
  'malware-distribution': 'Malware Distribution',
  'malware-signatures': 'Malware Signatures',
  'network-abuse': 'Network Abuse',
  'permission-overgrant': 'Permission Overgrant',
  'privilege-escalation': 'Privilege Escalation',
  'prompt-injection': 'Prompt Injection',
  'secret-detection': 'Secret Detection',
  'supply-chain': 'Supply Chain',
  'suspicious-behavior': 'Suspicious Behavior',
  'tool-poisoning': 'Tool Poisoning',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadAllRules(rulesDir: string): Rule[] {
  const files = readdirSync(rulesDir).filter(f => f.endsWith('.yaml'))
  const allRules: Rule[] = []

  for (const file of files) {
    const raw = readFileSync(join(rulesDir, file), 'utf8')
    const parsed = yaml.load(raw) as RuleFile | null

    if (!parsed?.rules || parsed.rules.length === 0) {
      continue
    }

    allRules.push(...parsed.rules)
  }

  return allRules
}

function sortRules(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => {
    const sevDiff =
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
    if (sevDiff !== 0) return sevDiff
    return a.id.localeCompare(b.id)
  })
}

function groupByCategory(rules: Rule[]): Map<string, Rule[]> {
  const map = new Map<string, Rule[]>()
  for (const rule of rules) {
    const existing = map.get(rule.category) ?? []
    existing.push(rule)
    map.set(rule.category, existing)
  }
  return map
}

function countBySeverity(rules: Rule[]): Record<string, number> {
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }
  for (const rule of rules) {
    if (rule.severity in counts) {
      counts[rule.severity]++
    }
  }
  return counts
}

function escapeMarkdown(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()
}

function platformsList(platforms?: string[]): string {
  if (!platforms || platforms.length === 0) return 'All'
  if (platforms.length >= 6) return 'All'
  return platforms.join(', ')
}

// ── MDX Generation ───────────────────────────────────────────────────────────

function generateSummaryTable(counts: Record<string, number>): string {
  const rows = ['critical', 'high', 'medium', 'low']
    .map(sev => `| ${SEVERITY_BADGE[sev]} | ${counts[sev] ?? 0} |`)
    .join('\n')

  return `| Severity | Count |
|----------|-------|
${rows}`
}

function generateCategoryTable(rules: Rule[]): string {
  const header = `| ID | Name | Severity | Confidence | Platforms |
|----|------|----------|------------|-----------|`

  const rows = rules
    .map(rule => {
      const badge = SEVERITY_BADGE[rule.severity] ?? rule.severity
      const name = escapeMarkdown(rule.name)
      const platforms = platformsList(rule.platforms)
      return `| \`${rule.id}\` | ${name} | ${badge} | ${rule.confidenceThreshold}% | ${platforms} |`
    })
    .join('\n')

  return `${header}\n${rows}`
}

function generateRuleDetail(rule: Rule): string {
  const badge = SEVERITY_BADGE[rule.severity] ?? rule.severity
  const categoryLabel =
    CATEGORY_LABELS[rule.category] ?? rule.category
  const platforms = platformsList(rule.platforms)
  const remediation = (rule.remediation ?? 'No remediation guidance available.').trim()

  const refsSection =
    rule.references && rule.references.length > 0
      ? `\n**References:**\n${rule.references.map(r => `- ${r}`).join('\n')}\n`
      : ''

  return `#### \`${rule.id}\` — ${escapeMarkdown(rule.name)}

**Severity:** ${badge} | **Category:** ${categoryLabel} | **Confidence threshold:** ${rule.confidenceThreshold}% | **Platforms:** ${platforms}

${rule.description}

**Remediation:**

${remediation}
${refsSection}`
}

function generateCategorySection(
  category: string,
  rules: Rule[]
): string {
  const label = CATEGORY_LABELS[category] ?? category
  const table = generateCategoryTable(rules)
  const details = rules.map(generateRuleDetail).join('\n---\n\n')

  return `## ${label}

${table}

### Rule Details

${details}`
}

function generateMdx(rules: Rule[]): string {
  const sorted = sortRules(rules)
  const byCategory = groupByCategory(sorted)
  const counts = countBySeverity(sorted)
  const totalRules = sorted.length
  const totalCategories = byCategory.size

  const summaryTable = generateSummaryTable(counts)

  const categorySections = Array.from(byCategory.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, catRules]) => generateCategorySection(category, catRules))
    .join('\n\n---\n\n')

  return `---
title: Built-in Rules
description: Complete reference for all ${totalRules} built-in Firmis detection rules across ${totalCategories} threat categories.
---

{/* This file is auto-generated by scripts/generate-rules.ts. Do not edit manually. */}

Firmis ships with **${totalRules} built-in detection rules** across **${totalCategories} threat categories**, covering prompt injection, credential harvesting, supply chain attacks, and more.

## Summary

${summaryTable}

---

${categorySections}
`
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const rulesDir = join(__dirname, '..', '..', 'rules')
  const outPath = join(
    __dirname,
    '..',
    'src',
    'content',
    'docs',
    'rules',
    'built-in-rules.mdx'
  )

  const rules = loadAllRules(rulesDir)
  const mdx = generateMdx(rules)

  writeFileSync(outPath, mdx, 'utf8')

  const byCategory = groupByCategory(rules)
  console.log(
    `Generated ${outPath} with ${rules.length} rules across ${byCategory.size} categories`
  )
}

main()
