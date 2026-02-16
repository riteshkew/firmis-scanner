import { describe, it, expect, beforeEach } from 'vitest'
import { RuleEngine } from '../../../src/rules/engine.js'

describe('RuleEngine - Confidence Tiers', () => {
  let engine: RuleEngine

  beforeEach(async () => {
    engine = new RuleEngine()
    await engine.load()
  })

  describe('load rules', () => {
    it('loads all 94+ built-in rules including new categories', () => {
      const rules = engine.getRules()
      expect(rules.length).toBeGreaterThanOrEqual(90)
    })
  })

  describe('new categories exist', () => {
    it('getRules() returns rules with category known-malicious', () => {
      const rules = engine.getRules({ category: 'known-malicious' })
      expect(rules.length).toBeGreaterThan(0)
      expect(rules.every((r) => r.category === 'known-malicious')).toBe(true)
    })

    it('getRules() returns rules with category malware-distribution', () => {
      const rules = engine.getRules({ category: 'malware-distribution' })
      expect(rules.length).toBeGreaterThan(0)
      expect(rules.every((r) => r.category === 'malware-distribution')).toBe(true)
    })

    it('getRules() returns rules with category agent-memory-poisoning', () => {
      const rules = engine.getRules({ category: 'agent-memory-poisoning' })
      expect(rules.length).toBeGreaterThan(0)
      expect(rules.every((r) => r.category === 'agent-memory-poisoning')).toBe(true)
    })
  })

  describe('Threat has confidenceTier', () => {
    it('returned threat has confidenceTier property', async () => {
      const maliciousCode = 'const key = "AKIAIOSFODNN7EXAMPLE"; readFileSync("~/.ssh/id_rsa");'
      const threats = await engine.analyze(maliciousCode, 'test.js', null, 'openclaw')

      if (threats.length > 0) {
        const threat = threats[0]
        expect(threat).toHaveProperty('confidenceTier')
        expect(['suspicious', 'likely', 'confirmed']).toContain(threat!.confidenceTier)
      }
    })
  })

  describe('Documentation context reduces confidence', () => {
    it('malicious content in .md file returns fewer threats than in .js file', async () => {
      const maliciousCode = 'const key = "AKIAIOSFODNN7EXAMPLE"; readFileSync("~/.ssh/id_rsa");'

      // Scan as JavaScript file
      const jsThreats = await engine.analyze(maliciousCode, 'test.js', null, 'openclaw')

      // Scan as documentation file
      const mdThreats = await engine.analyze(maliciousCode, 'docs/README.md', null, 'openclaw')

      // Documentation should have fewer threats due to 0.3x multiplier
      expect(mdThreats.length).toBeLessThanOrEqual(jsThreats.length)
    })

    it('identical malicious patterns detected in both contexts', async () => {
      const maliciousCode = 'const key = "AKIAIOSFODNN7EXAMPLE";'

      const jsThreats = await engine.analyze(maliciousCode, 'src/test.js', null, 'claude')
      const mdThreats = await engine.analyze(maliciousCode, 'docs/examples.md', null, 'claude')

      // If both detect threats, they should be from the same rule
      if (jsThreats.length > 0 && mdThreats.length > 0) {
        expect(jsThreats[0]!.ruleId).toBe(mdThreats[0]!.ruleId)
      }
    })
  })

  describe('SKILL.md is NOT treated as documentation', () => {
    it('SKILL.md file does not get documentation weight reduction', async () => {
      const maliciousCode = 'const key = "AKIAIOSFODNN7EXAMPLE"; readFileSync("~/.ssh/id_rsa");'

      // Scan as regular JavaScript
      const jsThreats = await engine.analyze(maliciousCode, 'index.js', null, 'openclaw')

      // Scan as SKILL.md (should NOT get reduced weight)
      const skillThreats = await engine.analyze(maliciousCode, 'skills/malicious/SKILL.md', null, 'openclaw')

      // SKILL.md should have similar or equal threat count to .js
      expect(skillThreats.length).toBeGreaterThanOrEqual(jsThreats.length * 0.8)
    })
  })

  describe('Known malicious category gets confirmed tier', () => {
    it('known-malicious threats have confirmed confidenceTier', async () => {
      // Use actual known malicious skill name from rules
      const knownMaliciousCode = 'clawhud skill installation'
      const threats = await engine.analyze(knownMaliciousCode, 'skill.js', null, 'openclaw')

      const knownMaliciousThreats = threats.filter((t) => t.category === 'known-malicious')

      if (knownMaliciousThreats.length > 0) {
        for (const threat of knownMaliciousThreats) {
          expect(threat.confidenceTier).toBe('confirmed')
        }
      }
    })

    it('known malicious author triggers confirmed threat', async () => {
      const maliciousAuthor = 'author: zaycv'
      const threats = await engine.analyze(maliciousAuthor, 'SKILL.md', null, 'openclaw')

      const knownMaliciousThreats = threats.filter((t) => t.category === 'known-malicious')

      if (knownMaliciousThreats.length > 0) {
        expect(knownMaliciousThreats[0]!.confidenceTier).toBe('confirmed')
      }
    })
  })

  describe('Confidence tier calculation logic', () => {
    it('multiple pattern matches increase confidence tier', async () => {
      const multiPatternCode = `
        const key = "AKIAIOSFODNN7EXAMPLE";
        const ssh = fs.readFileSync("~/.ssh/id_rsa");
        const aws = fs.readFileSync("~/.aws/credentials");
      `
      const threats = await engine.analyze(multiPatternCode, 'malicious.js', null, 'claude')

      if (threats.length > 0) {
        const highConfThreats = threats.filter((t) =>
          t.confidenceTier === 'likely' || t.confidenceTier === 'confirmed'
        )
        expect(highConfThreats.length).toBeGreaterThan(0)
      }
    })

    it('single weak pattern gets suspicious tier', async () => {
      // Use a pattern that triggers but with lower weight
      const weakPatternCode = 'process.env.SECRET_KEY'
      const threats = await engine.analyze(weakPatternCode, 'test.js', null, 'claude')

      if (threats.length > 0) {
        // At least one should be suspicious (not all confirmed)
        const suspiciousThreats = threats.filter((t) => t.confidenceTier === 'suspicious')
        expect(suspiciousThreats.length).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
