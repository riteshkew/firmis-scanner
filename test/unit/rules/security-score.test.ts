import { describe, it, expect } from 'vitest'
import { computeSecurityGrade, createEmptySummary } from '../../../src/types/scan.js'
import type { ScanSummary } from '../../../src/types/scan.js'

function makeSummary(overrides: Partial<ScanSummary> = {}): ScanSummary {
  return { ...createEmptySummary(), ...overrides }
}

describe('Security Score (A-F Grade)', () => {
  describe('computeSecurityGrade', () => {
    it('returns A when no threats found', () => {
      const summary = makeSummary({ threatsFound: 0 })
      expect(computeSecurityGrade(summary)).toBe('A')
    })

    it('returns B for only low-severity threats', () => {
      const summary = makeSummary({
        threatsFound: 3,
        bySeverity: { low: 3, medium: 0, high: 0, critical: 0 },
      })
      expect(computeSecurityGrade(summary)).toBe('B')
    })

    it('returns C for medium-severity threats', () => {
      const summary = makeSummary({
        threatsFound: 2,
        bySeverity: { low: 1, medium: 1, high: 0, critical: 0 },
      })
      expect(computeSecurityGrade(summary)).toBe('C')
    })

    it('returns D for high-severity threats', () => {
      const summary = makeSummary({
        threatsFound: 3,
        bySeverity: { low: 1, medium: 1, high: 1, critical: 0 },
      })
      expect(computeSecurityGrade(summary)).toBe('D')
    })

    it('returns F for critical-severity threats', () => {
      const summary = makeSummary({
        threatsFound: 1,
        bySeverity: { low: 0, medium: 0, high: 0, critical: 1 },
      })
      expect(computeSecurityGrade(summary)).toBe('F')
    })

    it('F takes precedence over D (critical overrides high)', () => {
      const summary = makeSummary({
        threatsFound: 5,
        bySeverity: { low: 1, medium: 1, high: 2, critical: 1 },
      })
      expect(computeSecurityGrade(summary)).toBe('F')
    })

    it('D takes precedence over C (high overrides medium)', () => {
      const summary = makeSummary({
        threatsFound: 4,
        bySeverity: { low: 1, medium: 2, high: 1, critical: 0 },
      })
      expect(computeSecurityGrade(summary)).toBe('D')
    })

    it('C takes precedence over B (medium overrides low)', () => {
      const summary = makeSummary({
        threatsFound: 3,
        bySeverity: { low: 2, medium: 1, high: 0, critical: 0 },
      })
      expect(computeSecurityGrade(summary)).toBe('C')
    })
  })

  describe('edge cases', () => {
    it('A grade with zero everything', () => {
      const summary = createEmptySummary()
      expect(computeSecurityGrade(summary)).toBe('A')
    })

    it('F grade with only critical', () => {
      const summary = makeSummary({
        threatsFound: 10,
        bySeverity: { low: 0, medium: 0, high: 0, critical: 10 },
      })
      expect(computeSecurityGrade(summary)).toBe('F')
    })

    it('B grade with many low-severity', () => {
      const summary = makeSummary({
        threatsFound: 100,
        bySeverity: { low: 100, medium: 0, high: 0, critical: 0 },
      })
      expect(computeSecurityGrade(summary)).toBe('B')
    })
  })
})
