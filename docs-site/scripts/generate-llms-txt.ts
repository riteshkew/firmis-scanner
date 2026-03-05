import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'
import fg from 'fast-glob'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://docs.firmislabs.com'

const LLMS_TXT_HEADER = `# Firmis

> AI agent security scanner. Static analysis only — does not modify code or require network access. Detects threats in Claude Skills, MCP Servers, Codex Plugins, Cursor Rules, CrewAI, AutoGPT, OpenClaw, and Nanobot. 199 YAML detection rules across 16 threat categories. Zero install: \`npx firmis scan\`. Fully offline. MIT licensed.

`

// Section order: primary sections first, optional last
const SECTION_ORDER: Record<string, number> = {
  docs: 0,
  cli: 1,
  platforms: 2,
  rules: 3,
  reference: 4,
  integrations: 5,
  concepts: 6,
  guides: 7,
}

const SECTION_LABELS: Record<string, string> = {
  docs: 'Docs',
  cli: 'CLI Reference',
  platforms: 'Platforms',
  rules: 'Rules',
  reference: 'Reference',
  integrations: 'Integrations',
  concepts: 'Concepts',
  guides: 'Guides',
}

// Sections that go into ## Optional in llms.txt
const OPTIONAL_SECTIONS = new Set(['concepts', 'guides', 'integrations'])

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocPage {
  filePath: string
  relativePath: string
  section: string
  slug: string
  url: string
  title: string
  description: string
  rawContent: string
}

// ── Frontmatter ───────────────────────────────────────────────────────────────

function extractFrontmatter(content: string): {
  title: string
  description: string
  body: string
} {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!fmMatch) {
    return { title: '', description: '', body: content }
  }

  const fm = fmMatch[1] ?? ''
  const body = fmMatch[2] ?? ''

  const titleMatch = fm.match(/^title:\s*["']?(.*?)["']?\s*$/m)
  const descMatch = fm.match(/^description:\s*["']?(.*?)["']?\s*$/m)

  return {
    title: (titleMatch?.[1] ?? '').trim(),
    description: (descMatch?.[1] ?? '').trim(),
    body,
  }
}

// ── MDX Cleaning ─────────────────────────────────────────────────────────────

function stripMdxSyntax(content: string): string {
  // Remove all import statements (named, default, namespace, side-effect)
  let cleaned = content.replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
  cleaned = cleaned.replace(/^import\s+['"][^'"]+['"]\s*;?\s*$/gm, '')

  // Remove self-closing JSX tags: <Component ... />
  cleaned = cleaned.replace(/<[A-Z][A-Za-z]*[^>]*\/>/g, '')

  // Remove JSX block tags with content: <Component ...>...</Component>
  // Handle multi-line blocks
  cleaned = cleaned.replace(/<([A-Z][A-Za-z]*)[^>]*>[\s\S]*?<\/\1>/gm, '')

  // Remove any remaining lone opening/closing JSX tags
  cleaned = cleaned.replace(/<\/?[A-Z][A-Za-z]*[^>]*>/g, '')

  // Collapse multiple blank lines into two
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned.trim()
}

// ── URL mapping ───────────────────────────────────────────────────────────────

function filePathToUrl(relativePath: string): string {
  // e.g. "cli/scan.mdx" → "https://docs.firmislabs.com/cli/scan"
  // e.g. "index.mdx" → "https://docs.firmislabs.com/"
  const withoutExt = relativePath.replace(/\.(mdx|md)$/, '')
  if (withoutExt === 'index') {
    return BASE_URL + '/'
  }
  return `${BASE_URL}/${withoutExt}`
}

function getSection(relativePath: string): string {
  const parts = relativePath.split('/')
  if (parts.length === 1) {
    // Top-level files like quickstart.mdx, installation.mdx
    return 'docs'
  }
  return parts[0] ?? 'docs'
}

// ── File discovery ────────────────────────────────────────────────────────────

function discoverPages(contentDir: string): DocPage[] {
  const files = fg.globSync('**/*.{mdx,md}', {
    cwd: contentDir,
    absolute: false,
  })

  const pages: DocPage[] = []

  for (const file of files) {
    const filePath = join(contentDir, file)
    const rawContent = readFileSync(filePath, 'utf8')
    const { title, description, body } = extractFrontmatter(rawContent)

    const section = getSection(file)
    const url = filePathToUrl(file)
    const slug = file.replace(/\.(mdx|md)$/, '')

    pages.push({
      filePath,
      relativePath: file,
      section,
      slug,
      url,
      title,
      description,
      rawContent: body,
    })
  }

  return pages
}

// ── llms.txt generation ───────────────────────────────────────────────────────

function formatPageLink(page: DocPage): string {
  const desc = page.description ? `: ${page.description}` : ''
  return `- [${page.title}](${page.url})${desc}`
}

function generateLlmsTxt(pages: DocPage[]): string {
  // Group by section
  const bySection = new Map<string, DocPage[]>()

  for (const page of pages) {
    // Skip index page from section listings (it's covered by the header)
    if (page.slug === 'index') continue

    const existing = bySection.get(page.section) ?? []
    existing.push(page)
    bySection.set(page.section, existing)
  }

  // Sort sections by defined order
  const sortedSections = Array.from(bySection.keys()).sort((a, b) => {
    const orderA = SECTION_ORDER[a] ?? 99
    const orderB = SECTION_ORDER[b] ?? 99
    return orderA - orderB
  })

  const primarySections: string[] = []
  const optionalPages: DocPage[] = []

  for (const section of sortedSections) {
    const sectionPages = bySection.get(section) ?? []
    const label = SECTION_LABELS[section] ?? capitalize(section)
    const links = sectionPages.map(formatPageLink).join('\n')

    if (OPTIONAL_SECTIONS.has(section)) {
      optionalPages.push(...sectionPages)
    } else {
      primarySections.push(`## ${label}\n\n${links}`)
    }
  }

  let output = LLMS_TXT_HEADER
  output += primarySections.join('\n\n')

  if (optionalPages.length > 0) {
    const optionalLinks = optionalPages.map(formatPageLink).join('\n')
    output += `\n\n## Optional\n\n${optionalLinks}`
  }

  output += '\n'
  return output
}

// ── llms-full.txt generation ──────────────────────────────────────────────────

function generateLlmsFullTxt(pages: DocPage[]): string {
  // Sort by section order, then by filename within section
  const sorted = [...pages].sort((a, b) => {
    const orderA = SECTION_ORDER[a.section] ?? 99
    const orderB = SECTION_ORDER[b.section] ?? 99
    if (orderA !== orderB) return orderA - orderB
    return a.relativePath.localeCompare(b.relativePath)
  })

  const parts: string[] = []

  for (const page of sorted) {
    const cleanedBody = stripMdxSyntax(page.rawContent)
    const header = `# ${page.title}\n\nURL: ${page.url}\n`
    parts.push(`${header}\n${cleanedBody}`)
  }

  return parts.join('\n\n---\n\n') + '\n'
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  const contentDir = join(__dirname, '..', 'src', 'content', 'docs')
  const publicDir = join(__dirname, '..', 'public')

  mkdirSync(publicDir, { recursive: true })

  const pages = discoverPages(contentDir)

  const llmsTxt = generateLlmsTxt(pages)
  const llmsTxtPath = join(publicDir, 'llms.txt')
  writeFileSync(llmsTxtPath, llmsTxt, 'utf8')
  console.warn(`Generated ${relative(join(__dirname, '..'), llmsTxtPath)} (${llmsTxt.length} bytes, ${pages.length} pages)`)

  const llmsFullTxt = generateLlmsFullTxt(pages)
  const llmsFullTxtPath = join(publicDir, 'llms-full.txt')
  writeFileSync(llmsFullTxtPath, llmsFullTxt, 'utf8')
  console.warn(`Generated ${relative(join(__dirname, '..'), llmsFullTxtPath)} (${llmsFullTxt.length} bytes)`)
}

main()
