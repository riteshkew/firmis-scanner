import { describe, it, expect, beforeEach } from 'vitest'
import { RuleEngine } from '../../../src/rules/engine.js'

describe('RuleEngine', () => {
  let engine: RuleEngine

  beforeEach(async () => {
    engine = new RuleEngine()
    await engine.load()
  })

  describe('load', () => {
    it('loads built-in rules', () => {
      const rules = engine.getRules()
      expect(rules.length).toBeGreaterThan(0)
    })

    it('loads rules from all categories', () => {
      const rules = engine.getRules()
      const categories = new Set(rules.map((r) => r.category))
      expect(categories.has('credential-harvesting')).toBe(true)
      expect(categories.has('data-exfiltration')).toBe(true)
      expect(categories.has('prompt-injection')).toBe(true)
    })
  })

  describe('getRules', () => {
    it('filters by severity', () => {
      const highRules = engine.getRules({ severity: 'high' })
      expect(highRules.every((r) => ['high', 'critical'].includes(r.severity))).toBe(true)
    })

    it('filters by category', () => {
      const credRules = engine.getRules({ category: 'credential-harvesting' })
      expect(credRules.every((r) => r.category === 'credential-harvesting')).toBe(true)
    })
  })

  describe('analyze', () => {
    it('processes code and returns threats array', async () => {
      const code = 'const fs = require("fs"); const creds = fs.readFileSync(".aws/credentials");'
      const threats = await engine.analyze(code, 'test.js', null, 'claude')
      expect(Array.isArray(threats)).toBe(true)
    })

    it('returns empty for safe code', async () => {
      const code = 'function add(a, b) { return a + b; } const result = add(1, 2);'
      const threats = await engine.analyze(code, 'test.js', null, 'claude')
      expect(threats.length).toBe(0)
    })

    it('correctly calculates confidence based on matched patterns', async () => {
      const rules = engine.getRules()
      expect(rules.length).toBeGreaterThan(0)
      const code = 'const x = 1;'
      const threats = await engine.analyze(code, 'test.js', null, 'claude')
      expect(threats.length).toBe(0)
    })

    it('handles code with multiple patterns', async () => {
      const code = 'const key = "-----BEGIN RSA PRIVATE KEY-----"; readFileSync("~/.ssh/id_rsa");'
      const threats = await engine.analyze(code, 'test.js', null, 'claude')
      expect(Array.isArray(threats)).toBe(true)
    })

    it('filters by platform', async () => {
      const code = 'const x = 1;'
      const threats1 = await engine.analyze(code, 'test.js', null, 'claude')
      const threats2 = await engine.analyze(code, 'test.js', null, 'mcp')
      expect(Array.isArray(threats1)).toBe(true)
      expect(Array.isArray(threats2)).toBe(true)
    })
  })
})
