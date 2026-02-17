import { describe, it, expect } from 'vitest'
import { loadRules } from '../../src/rules/loader.js'
import { validateRegexPattern } from '../../src/rules/patterns.js'
import type { Rule, RulePattern } from '../../src/types/index.js'

describe('Integration: Sprint 1 - Rule Validation', () => {
  describe('Built-in Rule Loading', () => {
    it('all built-in rules load successfully', async () => {
      const rules = await loadRules()

      // Sprint 1 should have 99 rules across all categories
      expect(rules.length).toBeGreaterThanOrEqual(99)
    })

    it('all rules have required fields', async () => {
      const rules = await loadRules()

      for (const rule of rules) {
        expect(rule.id).toBeDefined()
        expect(rule.name).toBeDefined()
        expect(rule.description).toBeDefined()
        expect(rule.category).toBeDefined()
        expect(rule.severity).toBeDefined()
        expect(rule.patterns).toBeDefined()
        expect(Array.isArray(rule.patterns)).toBe(true)
        expect(rule.patterns.length).toBeGreaterThan(0)
      }
    })

    it('most rules are enabled', async () => {
      const rules = await loadRules()

      const enabledRules = rules.filter((r) => r.enabled)
      // Most rules should be enabled (>90%)
      expect(enabledRules.length).toBeGreaterThan(rules.length * 0.9)
    })
  })

  describe('Regex Pattern Validation', () => {
    it('all regex patterns compile without errors', async () => {
      const rules = await loadRules()
      const regexTypes = ['regex', 'file-access', 'network']
      const errors: Array<{ ruleId: string; pattern: string; error: string }> = []

      for (const rule of rules) {
        for (const pattern of rule.patterns) {
          if (
            regexTypes.includes(pattern.type) &&
            typeof pattern.pattern === 'string'
          ) {
            const error = validateRegexPattern(pattern.pattern)
            if (error) {
              errors.push({
                ruleId: rule.id,
                pattern: pattern.pattern,
                error,
              })
            }
          }
        }
      }

      // All patterns should compile (Sprint 1 fixed PCRE (?i) issues)
      expect(errors).toHaveLength(0)
    })

    it('PCRE patterns are handled by regex compiler', async () => {
      const rules = await loadRules()
      const regexTypes = ['regex', 'file-access', 'network']
      const pcrePatterns: Array<{ ruleId: string; pattern: string }> = []

      for (const rule of rules) {
        for (const pattern of rule.patterns) {
          if (
            regexTypes.includes(pattern.type) &&
            typeof pattern.pattern === 'string'
          ) {
            // Check for PCRE-specific syntax
            if (pattern.pattern.includes('(?i)')) {
              pcrePatterns.push({
                ruleId: rule.id,
                pattern: pattern.pattern,
              })
            }
          }
        }
      }

      // Sprint 1 improved handling of PCRE patterns via matchRegex()
      // The pattern compiler extracts inline flags and converts them
      // So patterns with (?i) are acceptable as long as they compile
      if (pcrePatterns.length > 0) {
        // Verify these patterns actually compile via validateRegexPattern
        for (const { pattern } of pcrePatterns) {
          const error = validateRegexPattern(pattern)
          // Should return null (no error) after flag extraction
          expect(error).toBeNull()
        }
      }
    })
  })

  describe('Rule Category Coverage', () => {
    it('includes known-malicious category rules', async () => {
      const rules = await loadRules()

      const knownMaliciousRules = rules.filter(
        (r) => r.category === 'known-malicious'
      )

      expect(knownMaliciousRules.length).toBeGreaterThan(0)
    })

    it('includes malware-distribution category rules', async () => {
      const rules = await loadRules()

      const malwareRules = rules.filter((r) => r.category === 'malware-distribution')

      expect(malwareRules.length).toBeGreaterThan(0)
    })

    it('includes agent-memory-poisoning category rules', async () => {
      const rules = await loadRules()

      const memoryPoisoningRules = rules.filter(
        (r) => r.category === 'agent-memory-poisoning'
      )

      expect(memoryPoisoningRules.length).toBeGreaterThan(0)
    })

    it('includes credential-harvesting category rules', async () => {
      const rules = await loadRules()

      const credentialRules = rules.filter(
        (r) => r.category === 'credential-harvesting'
      )

      expect(credentialRules.length).toBeGreaterThan(0)
    })

    it('includes all expected categories', async () => {
      const rules = await loadRules()

      const categories = new Set(rules.map((r) => r.category))

      const expectedCategories = [
        'known-malicious',
        'malware-distribution',
        'agent-memory-poisoning',
        'credential-harvesting',
        'data-exfiltration',
        'prompt-injection',
        'privilege-escalation',
        'suspicious-behavior',
      ]

      for (const expected of expectedCategories) {
        expect(categories.has(expected)).toBe(true)
      }
    })
  })

  describe('Known-Malicious Rule Characteristics', () => {
    it('known-malicious rules have low confidence threshold', async () => {
      const rules = await loadRules()

      const knownMaliciousRules = rules.filter(
        (r) => r.category === 'known-malicious'
      )

      for (const rule of knownMaliciousRules) {
        // Known-malicious should have threshold <= 40 (immediate detection)
        expect(rule.confidenceThreshold).toBeLessThanOrEqual(40)
      }
    })

    it('known-malicious rules have high severity', async () => {
      const rules = await loadRules()

      const knownMaliciousRules = rules.filter(
        (r) => r.category === 'known-malicious'
      )

      for (const rule of knownMaliciousRules) {
        // Known-malicious should be high or critical severity
        expect(['high', 'critical']).toContain(rule.severity)
      }
    })
  })

  describe('Pattern Weight Validation', () => {
    it('all pattern weights are within valid range', async () => {
      const rules = await loadRules()

      for (const rule of rules) {
        for (const pattern of rule.patterns) {
          expect(pattern.weight).toBeGreaterThanOrEqual(0)
          expect(pattern.weight).toBeLessThanOrEqual(100)
        }
      }
    })

    it('high-confidence patterns have appropriate weights', async () => {
      const rules = await loadRules()

      const knownMaliciousRules = rules.filter(
        (r) => r.category === 'known-malicious'
      )

      for (const rule of knownMaliciousRules) {
        // Known-malicious patterns should have high weights (80+)
        const maxWeight = Math.max(...rule.patterns.map((p) => p.weight))
        expect(maxWeight).toBeGreaterThanOrEqual(80)
      }
    })
  })

  describe('Rule Pattern Structure', () => {
    it('all patterns have required fields', async () => {
      const rules = await loadRules()

      for (const rule of rules) {
        for (const pattern of rule.patterns) {
          expect(pattern.type).toBeDefined()
          expect(pattern.pattern).toBeDefined()
          expect(typeof pattern.weight).toBe('number')
          expect(pattern.description).toBeDefined()
        }
      }
    })

    it('pattern types are valid', async () => {
      const rules = await loadRules()

      const validTypes = [
        'regex',
        'string-literal',
        'file-access',
        'network',
        'api-call',
        'ast',
        'import',
        'yara',
      ]

      for (const rule of rules) {
        for (const pattern of rule.patterns) {
          expect(validTypes).toContain(pattern.type)
        }
      }
    })
  })

  describe('Rule Distribution', () => {
    it('has appropriate rule distribution across severities', async () => {
      const rules = await loadRules()

      const bySeverity = {
        low: rules.filter((r) => r.severity === 'low').length,
        medium: rules.filter((r) => r.severity === 'medium').length,
        high: rules.filter((r) => r.severity === 'high').length,
        critical: rules.filter((r) => r.severity === 'critical').length,
      }

      // Should have rules across all severity levels
      expect(bySeverity.low).toBeGreaterThan(0)
      expect(bySeverity.medium).toBeGreaterThan(0)
      expect(bySeverity.high).toBeGreaterThan(0)
      expect(bySeverity.critical).toBeGreaterThan(0)

      // Critical and high severity should be significant portion
      const highAndCritical = bySeverity.high + bySeverity.critical
      expect(highAndCritical).toBeGreaterThan(rules.length * 0.3)
    })

    it('has multi-pattern rules for robust detection', async () => {
      const rules = await loadRules()

      // Most rules should have multiple patterns for defense in depth
      const multiPatternRules = rules.filter((r) => r.patterns.length > 1)

      expect(multiPatternRules.length).toBeGreaterThan(rules.length * 0.5)
    })
  })
})
