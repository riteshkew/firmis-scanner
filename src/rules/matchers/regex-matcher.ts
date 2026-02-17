import type { PatternMatch, MatchContext } from '../../types/index.js'

const isVerbose = (): boolean =>
  typeof process !== 'undefined' && process.env['FIRMIS_VERBOSE'] === '1'

export function detectMatchContext(filePath: string): MatchContext {
  const lower = filePath.toLowerCase()

  if (
    lower.endsWith('.json') ||
    lower.endsWith('.yaml') ||
    lower.endsWith('.yml') ||
    lower.endsWith('.toml') ||
    lower.endsWith('.env') ||
    lower.endsWith('.ini')
  ) {
    return 'config'
  }

  if (!lower.endsWith('/skill.md')) {
    if (
      lower.endsWith('.md') ||
      lower.endsWith('.mdx') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.rst')
    ) {
      return 'documentation'
    }
    if (
      lower.includes('/docs/') ||
      lower.includes('/doc/') ||
      lower.includes('/readme') ||
      lower.includes('/examples/')
    ) {
      return 'documentation'
    }
  }

  return 'code_execution'
}

export function getLineAndColumn(
  content: string,
  index: number
): { line: number; column: number } {
  const lines = content.slice(0, index).split('\n')
  const line = lines.length
  const lastLine = lines[lines.length - 1]
  const column = lastLine?.length ?? 0
  return { line, column }
}

function parseInlineFlags(pattern: string): { cleanPattern: string; flags: string } {
  let flags = 'gm'
  let cleanPattern = pattern
  const inlineFlagMatch = pattern.match(/^\(\?([gimsuy]+)\)/)
  if (inlineFlagMatch && inlineFlagMatch[1]) {
    const inlineFlags = inlineFlagMatch[1]
    cleanPattern = pattern.slice(inlineFlagMatch[0].length)
    for (const flag of inlineFlags) {
      if (!flags.includes(flag)) {
        flags += flag
      }
    }
  }
  return { cleanPattern, flags }
}

export function matchRegex(
  pattern: string,
  content: string,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  try {
    const { cleanPattern, flags } = parseInlineFlags(pattern)
    const regex = new RegExp(cleanPattern, flags)
    const lines = content.split('\n')

    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      const { line, column } = getLineAndColumn(content, match.index)
      const snippet = lines[line - 1]?.trim() ?? ''
      // Skip matches inside comments (SQL --, JS //, shell #)
      if (/^(--|\/\/|#)\s/.test(snippet)) continue
      matches.push({
        patternType: 'regex',
        description,
        snippet,
        line,
        column,
        weight,
      })
    }
  } catch (error) {
    if (isVerbose()) {
      console.warn(
        `[firmis] Regex compile failed for pattern: ${pattern} — ${error instanceof Error ? error.message : String(error)}`
      )
    }
    return []
  }

  return matches
}

/**
 * Pre-compile a regex pattern to check validity.
 * Returns an error message if invalid, null if valid.
 */
export function validateRegexPattern(pattern: string): string | null {
  try {
    const { cleanPattern, flags } = parseInlineFlags(pattern)
    new RegExp(cleanPattern, flags)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

export function matchStringLiteral(
  pattern: string,
  content: string,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []
  const lines = content.split('\n')
  let index = 0

  while ((index = content.indexOf(pattern, index)) !== -1) {
    const { line, column } = getLineAndColumn(content, index)
    matches.push({
      patternType: 'string-literal',
      description,
      snippet: lines[line - 1]?.trim(),
      line,
      column,
      weight,
    })
    index += pattern.length
  }

  return matches
}

export function matchFileAccess(
  pattern: string,
  content: string,
  description: string,
  weight: number
): PatternMatch[] {
  const regexPattern = pattern
    .replace(/~/g, '(~|homedir\\(\\)|process\\.env\\.HOME)')
    .replace(/\//g, '[\\\\/]')
    .replace(/\*/g, '[^\\s\'"]*')
    .replace(/\./g, '\\.')

  return matchRegex(regexPattern, content, description, weight)
}
