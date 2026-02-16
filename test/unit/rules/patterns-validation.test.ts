import { describe, it, expect } from 'vitest'
import { validateRegexPattern } from '../../../src/rules/patterns.js'

describe('validateRegexPattern', () => {
  it('returns null for valid regex patterns', () => {
    const result = validateRegexPattern('AKIA[0-9A-Z]{16}')
    expect(result).toBeNull()
  })

  it('returns null for regex with inline (?i) flag', () => {
    const result = validateRegexPattern('(?i)author:\\s*zaycv')
    expect(result).toBeNull()
  })

  it('returns error string for invalid regex', () => {
    const result = validateRegexPattern('[unclosed')
    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
  })

  it('returns null for complex patterns with alternation', () => {
    const result = validateRegexPattern('(curl|wget|fetch)\\s+.*\\.(zip|tar\\.gz)')
    expect(result).toBeNull()
  })

  it('returns null for empty pattern string', () => {
    const result = validateRegexPattern('')
    expect(result).toBeNull()
  })

  it('returns null for patterns with escaped special characters', () => {
    const result = validateRegexPattern('\\bclawhubb\\b')
    expect(result).toBeNull()
  })

  it('returns error for unescaped special characters that break regex', () => {
    const result = validateRegexPattern('(')
    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
  })

  it('returns null for patterns with lookahead assertions', () => {
    const result = validateRegexPattern('password(?=.*[0-9])')
    expect(result).toBeNull()
  })

  it('returns null for patterns with character classes', () => {
    const result = validateRegexPattern('[A-Za-z0-9+/=]{40,}')
    expect(result).toBeNull()
  })

  it('returns null for patterns with multiple inline flags', () => {
    const result = validateRegexPattern('(?im)^author:\\s*zaycv')
    expect(result).toBeNull()
  })
})
