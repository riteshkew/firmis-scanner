import { describe, it, expect } from 'vitest'
import { matchPattern } from '../../../src/rules/patterns.js'
import type { RulePattern } from '../../../src/types/index.js'

describe('matchPattern', () => {
  describe('regex patterns', () => {
    it('matches simple regex', async () => {
      const pattern: RulePattern = {
        type: 'regex',
        pattern: 'AKIA[0-9A-Z]{16}',
        weight: 100,
        description: 'AWS key',
      }
      const content = 'const key = "AKIAIOSFODNN7EXAMPLE"'
      const matches = await matchPattern(pattern, content, null)
      expect(matches.length).toBe(1)
    })

    it('returns empty for no match', async () => {
      const pattern: RulePattern = {
        type: 'regex',
        pattern: 'password123',
        weight: 50,
        description: 'Test',
      }
      const content = 'const safe = "hello"'
      const matches = await matchPattern(pattern, content, null)
      expect(matches.length).toBe(0)
    })
  })

  describe('string-literal patterns', () => {
    it('matches exact strings', async () => {
      const pattern: RulePattern = {
        type: 'string-literal',
        pattern: '.ssh/id_rsa',
        weight: 80,
        description: 'SSH key path',
      }
      const content = 'const path = "~/.ssh/id_rsa"'
      const matches = await matchPattern(pattern, content, null)
      expect(matches.length).toBe(1)
    })
  })

  describe('file-access patterns', () => {
    it('matches file paths', async () => {
      const pattern: RulePattern = {
        type: 'file-access',
        pattern: '~/.aws/credentials',
        weight: 90,
        description: 'AWS creds',
      }
      const content = 'fs.readFileSync("~/.aws/credentials")'
      const matches = await matchPattern(pattern, content, null)
      expect(matches.length).toBeGreaterThan(0)
    })
  })
})
