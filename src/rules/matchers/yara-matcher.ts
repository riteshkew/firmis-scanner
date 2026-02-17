import type { PatternMatch, YaraPattern, YaraString } from '../../types/index.js'
import { getLineAndColumn } from './regex-matcher.js'

interface StringMatchResult {
  id: string
  offsets: number[]
}

/**
 * Match a YARA-like pattern against file content.
 *
 * Supports:
 * - text strings with optional 'i' (case-insensitive) modifier
 * - hex strings with ?? wildcards (e.g., "4D 5A ?? 00")
 * - regex strings
 * - Conditions: "any of them", "all of them", "N of them",
 *   "any of ($prefix*)", "all of ($prefix*)", "N of ($prefix*)"
 */
export function matchYara(
  pattern: YaraPattern,
  content: string,
  description: string,
  weight: number
): PatternMatch[] {
  const stringResults = evaluateStrings(pattern.strings, content)
  const conditionMet = evaluateCondition(pattern.condition, stringResults)

  if (!conditionMet) return []

  const matches: PatternMatch[] = []
  const lines = content.split('\n')

  for (const result of stringResults) {
    if (result.offsets.length === 0) continue
    const strDef = pattern.strings[result.id]
    for (const offset of result.offsets) {
      const { line, column } = getLineAndColumn(content, offset)
      const snippet = lines[line - 1]?.trim() ?? ''
      matches.push({
        patternType: 'yara',
        description: `${description} [${result.id}: ${strDef?.type ?? 'unknown'}]`,
        snippet,
        line,
        column,
        weight,
      })
    }
  }

  return matches.length > 0 ? matches : [{
    patternType: 'yara',
    description,
    line: 1,
    column: 0,
    weight,
  }]
}

function evaluateStrings(
  strings: Record<string, YaraString>,
  content: string
): StringMatchResult[] {
  const results: StringMatchResult[] = []

  for (const [id, strDef] of Object.entries(strings)) {
    const offsets = matchString(strDef, content)
    results.push({ id, offsets })
  }

  return results
}

function matchString(strDef: YaraString, content: string): number[] {
  switch (strDef.type) {
    case 'text':
      return matchTextString(strDef.value, content, strDef.modifiers ?? [])
    case 'hex':
      return matchHexString(strDef.value, content)
    case 'regex':
      return matchRegexString(strDef.value, content, strDef.modifiers ?? [])
    default:
      return []
  }
}

function matchTextString(
  value: string,
  content: string,
  modifiers: string[]
): number[] {
  const offsets: number[] = []
  const caseInsensitive = modifiers.includes('i')

  if (caseInsensitive) {
    const lowerContent = content.toLowerCase()
    const lowerValue = value.toLowerCase()
    let pos = 0
    while ((pos = lowerContent.indexOf(lowerValue, pos)) !== -1) {
      offsets.push(pos)
      pos += lowerValue.length
    }
  } else {
    let pos = 0
    while ((pos = content.indexOf(value, pos)) !== -1) {
      offsets.push(pos)
      pos += value.length
    }
  }

  return offsets
}

function matchHexString(hexPattern: string, content: string): number[] {
  const tokens = hexPattern.trim().split(/\s+/)
  const bytePattern: Array<number | null> = tokens.map((tok) =>
    tok === '??' ? null : parseInt(tok, 16)
  )

  if (bytePattern.some((b) => b !== null && (isNaN(b) || b < 0 || b > 255))) {
    return []
  }

  const offsets: number[] = []

  // Use charCodeAt for direct byte comparison — avoids UTF-8 encoding issues
  for (let i = 0; i <= content.length - bytePattern.length; i++) {
    let match = true
    for (let j = 0; j < bytePattern.length; j++) {
      if (bytePattern[j] !== null && content.charCodeAt(i + j) !== bytePattern[j]) {
        match = false
        break
      }
    }
    if (match) offsets.push(i)
  }

  return offsets
}

function matchRegexString(
  value: string,
  content: string,
  modifiers: string[]
): number[] {
  const offsets: number[] = []
  try {
    let flags = 'gm'
    if (modifiers.includes('i')) flags += 'i'
    if (modifiers.includes('s')) flags += 's'
    const regex = new RegExp(value, flags)

    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      offsets.push(match.index)
      if (match.index === regex.lastIndex) regex.lastIndex++
    }
  } catch {
    return []
  }

  return offsets
}

/**
 * Evaluate a YARA condition string.
 *
 * Supported forms:
 *   "any of them"          - at least 1 string matched
 *   "all of them"          - every string matched
 *   "N of them"            - at least N strings matched
 *   "any of ($prefix*)"    - at least 1 string starting with $prefix matched
 *   "all of ($prefix*)"    - every string starting with $prefix matched
 *   "N of ($prefix*)"      - at least N strings starting with $prefix matched
 */
function evaluateCondition(
  condition: string,
  results: StringMatchResult[]
): boolean {
  const trimmed = condition.trim().toLowerCase()

  const ofMatch = trimmed.match(/^(\d+|any|all)\s+of\s+(.+)$/)
  if (!ofMatch) return false

  const quantifierStr = ofMatch[1]!
  const target = ofMatch[2]!.trim()

  let targetResults: StringMatchResult[]
  if (target === 'them') {
    targetResults = results
  } else {
    const prefixMatch = target.match(/^\(\s*\$([a-z_][a-z0-9_]*)\*\s*\)$/i)
    if (!prefixMatch) return false
    const prefix = '$' + prefixMatch[1]
    targetResults = results.filter((r) => r.id.startsWith(prefix))
  }

  if (targetResults.length === 0) return false

  const matchedCount = targetResults.filter((r) => r.offsets.length > 0).length

  if (quantifierStr === 'any') return matchedCount >= 1
  if (quantifierStr === 'all') return matchedCount === targetResults.length

  const n = parseInt(quantifierStr, 10)
  return !isNaN(n) && matchedCount >= n
}

/**
 * Validate a YARA pattern structure.
 * Returns null if valid, error message if invalid.
 */
export function validateYaraPattern(pattern: unknown): string | null {
  if (typeof pattern !== 'object' || pattern === null) {
    return 'YARA pattern must be an object with strings and condition'
  }

  const p = pattern as Record<string, unknown>

  if (!p['strings'] || typeof p['strings'] !== 'object') {
    return 'YARA pattern must have a strings object'
  }

  if (!p['condition'] || typeof p['condition'] !== 'string') {
    return 'YARA pattern must have a condition string'
  }

  const strings = p['strings'] as Record<string, unknown>
  for (const [id, def] of Object.entries(strings)) {
    if (!id.startsWith('$')) {
      return `YARA string ID "${id}" must start with $`
    }
    if (typeof def !== 'object' || def === null) {
      return `YARA string "${id}" must be an object`
    }
    const d = def as Record<string, unknown>
    if (!['text', 'hex', 'regex'].includes(d['type'] as string)) {
      return `YARA string "${id}" type must be text, hex, or regex`
    }
    if (typeof d['value'] !== 'string') {
      return `YARA string "${id}" must have a value string`
    }
  }

  return null
}
