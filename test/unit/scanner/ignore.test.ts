import { describe, it, expect } from 'vitest'
import { FirmisIgnore, parseIgnoreFile, matchGlob } from '../../../src/scanner/ignore.js'

describe('FirmisIgnore', () => {
  describe('parseIgnoreFile', () => {
    it('should parse rule IDs', () => {
      const content = `
# Comment
exfil-001
sus-006
      `
      const rules = parseIgnoreFile(content)
      expect(rules).toHaveLength(2)
      expect(rules[0]).toEqual({ ruleId: 'exfil-001' })
      expect(rules[1]).toEqual({ ruleId: 'sus-006' })
    })

    it('should parse file patterns', () => {
      const content = `
**/docs/**
**/README.md
test/*.ts
      `
      const rules = parseIgnoreFile(content)
      expect(rules).toHaveLength(3)
      expect(rules[0]).toEqual({ filePattern: '**/docs/**' })
      expect(rules[1]).toEqual({ filePattern: '**/README.md' })
      expect(rules[2]).toEqual({ filePattern: 'test/*.ts' })
    })

    it('should parse rule:pattern combos', () => {
      const content = `
sus-006:**/crypto-skills/**
cred-004:**/test/**
exfil-001:**/temp/*.js
      `
      const rules = parseIgnoreFile(content)
      expect(rules).toHaveLength(3)
      expect(rules[0]).toEqual({ ruleId: 'sus-006', filePattern: '**/crypto-skills/**' })
      expect(rules[1]).toEqual({ ruleId: 'cred-004', filePattern: '**/test/**' })
      expect(rules[2]).toEqual({ ruleId: 'exfil-001', filePattern: '**/temp/*.js' })
    })

    it('should skip comments and empty lines', () => {
      const content = `
# This is a comment
exfil-001

# Another comment
sus-006

      `
      const rules = parseIgnoreFile(content)
      expect(rules).toHaveLength(2)
    })

    it('should handle mixed formats', () => {
      const content = `
# Ignore specific rules
exfil-001
sus-006

# Ignore file patterns
**/docs/**
**/test/**

# Ignore combinations
cred-004:**/examples/**
      `
      const rules = parseIgnoreFile(content)
      expect(rules).toHaveLength(5)
    })
  })

  describe('matchGlob', () => {
    it('should match ** globstar patterns', () => {
      expect(matchGlob('**/docs/**', 'src/docs/README.md')).toBe(true)
      expect(matchGlob('**/docs/**', 'docs/guide.md')).toBe(true)
      expect(matchGlob('**/docs/**', 'other/file.md')).toBe(false)
    })

    it('should match * wildcard patterns', () => {
      expect(matchGlob('*.md', 'README.md')).toBe(true)
      expect(matchGlob('*.md', 'docs/README.md')).toBe(true)
      expect(matchGlob('*.md', 'file.txt')).toBe(false)
    })

    it('should match specific file patterns', () => {
      expect(matchGlob('README.md', 'README.md')).toBe(true)
      expect(matchGlob('README.md', 'docs/README.md')).toBe(true)
      expect(matchGlob('README.md', 'OTHER.md')).toBe(false)
    })

    it('should match directory patterns', () => {
      expect(matchGlob('test/*.ts', 'test/file.ts')).toBe(true)
      expect(matchGlob('test/*.ts', 'test/deep/file.ts')).toBe(false)
    })

    it('should handle ? wildcard', () => {
      expect(matchGlob('file?.ts', 'file1.ts')).toBe(true)
      expect(matchGlob('file?.ts', 'files/file1.ts')).toBe(true)
      expect(matchGlob('file?.ts', 'file12.ts')).toBe(false)
    })

    it('should handle absolute paths', () => {
      expect(matchGlob('/test/**', '/test/file.ts')).toBe(true)
      expect(matchGlob('/test/**', 'other/test/file.ts')).toBe(false)
    })
  })

  describe('shouldIgnore', () => {
    it('should ignore by rule ID only', () => {
      const ignore = new FirmisIgnore([
        { ruleId: 'exfil-001' },
        { ruleId: 'sus-006' },
      ])

      expect(ignore.shouldIgnore('exfil-001', 'any/file.ts')).toBe(true)
      expect(ignore.shouldIgnore('sus-006', 'other/file.js')).toBe(true)
      expect(ignore.shouldIgnore('cred-001', 'file.ts')).toBe(false)
    })

    it('should ignore by file pattern only', () => {
      const ignore = new FirmisIgnore([
        { filePattern: '**/docs/**' },
        { filePattern: '**/test/**' },
      ])

      expect(ignore.shouldIgnore('any-rule', 'docs/README.md')).toBe(true)
      expect(ignore.shouldIgnore('any-rule', 'src/docs/guide.md')).toBe(true)
      expect(ignore.shouldIgnore('any-rule', 'test/file.ts')).toBe(true)
      expect(ignore.shouldIgnore('any-rule', 'src/main.ts')).toBe(false)
    })

    it('should ignore by rule:pattern combo', () => {
      const ignore = new FirmisIgnore([
        { ruleId: 'sus-006', filePattern: '**/crypto/**' },
        { ruleId: 'cred-004', filePattern: '**/test/**' },
      ])

      // Match rule and pattern
      expect(ignore.shouldIgnore('sus-006', 'crypto/wallet.ts')).toBe(true)
      expect(ignore.shouldIgnore('cred-004', 'test/auth.ts')).toBe(true)

      // Wrong rule, right pattern
      expect(ignore.shouldIgnore('other-rule', 'crypto/wallet.ts')).toBe(false)

      // Right rule, wrong pattern
      expect(ignore.shouldIgnore('sus-006', 'other/file.ts')).toBe(false)

      // Both wrong
      expect(ignore.shouldIgnore('other-rule', 'other/file.ts')).toBe(false)
    })

    it('should handle mixed ignore rules', () => {
      const ignore = new FirmisIgnore([
        { ruleId: 'exfil-001' },
        { filePattern: '**/docs/**' },
        { ruleId: 'sus-006', filePattern: '**/examples/**' },
      ])

      // Rule only
      expect(ignore.shouldIgnore('exfil-001', 'any/file.ts')).toBe(true)

      // Pattern only
      expect(ignore.shouldIgnore('any-rule', 'docs/README.md')).toBe(true)

      // Combo
      expect(ignore.shouldIgnore('sus-006', 'examples/demo.ts')).toBe(true)

      // No match
      expect(ignore.shouldIgnore('other-rule', 'src/main.ts')).toBe(false)
    })

    it('should return false for empty rules', () => {
      const ignore = new FirmisIgnore([])

      expect(ignore.shouldIgnore('any-rule', 'any/file.ts')).toBe(false)
    })
  })

  describe('ruleCount', () => {
    it('should return the number of loaded rules', () => {
      const ignore1 = new FirmisIgnore([])
      expect(ignore1.ruleCount).toBe(0)

      const ignore2 = new FirmisIgnore([
        { ruleId: 'exfil-001' },
        { filePattern: '**/docs/**' },
        { ruleId: 'sus-006', filePattern: '**/test/**' },
      ])
      expect(ignore2.ruleCount).toBe(3)
    })
  })
})
