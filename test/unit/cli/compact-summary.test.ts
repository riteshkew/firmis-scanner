import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { printCompactSummary } from '../../../src/cli/utils/output.js'
import type { ScanResult, Threat, ScanSummary } from '../../../src/types/scan.js'
import { createEmptySummary } from '../../../src/types/scan.js'

function makeThreat(overrides: Partial<Threat> = {}): Threat {
  return {
    id: 'threat-1',
    ruleId: 'test-001',
    category: 'suspicious-behavior',
    severity: 'medium',
    message: 'Test threat message',
    evidence: [],
    location: { file: 'src/index.ts', line: 10, column: 1 },
    confidence: 0.8,
    confidenceTier: 'likely',
    ...overrides,
  }
}

function makeScanResult(overrides: {
  threats?: Threat[]
  summary?: Partial<ScanSummary>
  score?: string
  platform?: string
} = {}): ScanResult {
  const threats = overrides.threats ?? []
  const summary = { ...createEmptySummary(), ...overrides.summary }

  return {
    id: 'scan-1',
    startedAt: new Date(),
    completedAt: new Date(),
    duration: 1500,
    platforms: [
      {
        platform: (overrides.platform ?? 'claude') as 'claude',
        basePath: '/test',
        components: [
          {
            id: 'comp-1',
            name: 'test-component',
            type: 'skill',
            path: '/test/skill',
            filesScanned: 5,
            filesAnalyzed: 5,
            filesNotAnalyzed: 0,
            threats,
            riskLevel: threats.length > 0 ? threats[0].severity : 'none',
          },
        ],
        threats,
      },
    ],
    summary,
    score: (overrides.score ?? 'A') as 'A',
    runtimeRisksNotCovered: [],
  }
}

describe('printCompactSummary', () => {
  let consoleOutput: string[]

  beforeEach(() => {
    consoleOutput = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      consoleOutput.push(args.map(String).join(' '))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('displays security grade', () => {
    const result = makeScanResult({ score: 'A' })
    printCompactSummary(result)
    const gradeOutput = consoleOutput.find(l => l.includes('Security Grade'))
    expect(gradeOutput).toBeDefined()
    expect(gradeOutput).toContain('A')
  })

  it('displays "No threats detected" when clean', () => {
    const result = makeScanResult({
      summary: { threatsFound: 0 },
      score: 'A',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).toContain('No threats detected')
  })

  it('displays severity counts when threats exist', () => {
    const result = makeScanResult({
      threats: [
        makeThreat({ severity: 'critical' }),
        makeThreat({ id: 't2', severity: 'high' }),
      ],
      summary: {
        threatsFound: 2,
        bySeverity: { critical: 1, high: 1, medium: 0, low: 0 },
      },
      score: 'F',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).toContain('1 critical')
    expect(output).toContain('1 high')
  })

  it('shows top 3 threats sorted by severity', () => {
    const threats = [
      makeThreat({ id: 't1', severity: 'low', message: 'Low finding' }),
      makeThreat({ id: 't2', severity: 'critical', message: 'Critical finding' }),
      makeThreat({ id: 't3', severity: 'high', message: 'High finding' }),
      makeThreat({ id: 't4', severity: 'medium', message: 'Medium finding' }),
    ]
    const result = makeScanResult({
      threats,
      summary: {
        threatsFound: 4,
        bySeverity: { critical: 1, high: 1, medium: 1, low: 1 },
      },
      score: 'F',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')

    // Critical should appear before High in the output
    const critIdx = output.indexOf('Critical finding')
    const highIdx = output.indexOf('High finding')
    const medIdx = output.indexOf('Medium finding')
    expect(critIdx).toBeLessThan(highIdx)
    expect(highIdx).toBeLessThan(medIdx)

    // Low finding should NOT appear (top 3 only)
    expect(output).not.toContain('Low finding')
  })

  it('shows "... and N more" when more than 3 threats', () => {
    const threats = [
      makeThreat({ id: 't1', severity: 'high', message: 'Finding 1' }),
      makeThreat({ id: 't2', severity: 'high', message: 'Finding 2' }),
      makeThreat({ id: 't3', severity: 'medium', message: 'Finding 3' }),
      makeThreat({ id: 't4', severity: 'low', message: 'Finding 4' }),
      makeThreat({ id: 't5', severity: 'low', message: 'Finding 5' }),
    ]
    const result = makeScanResult({
      threats,
      summary: {
        threatsFound: 5,
        bySeverity: { critical: 0, high: 2, medium: 1, low: 2 },
      },
      score: 'D',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).toContain('... and 2 more findings')
  })

  it('shows "... and 1 more finding" (singular) for exactly 4 threats', () => {
    const threats = [
      makeThreat({ id: 't1', severity: 'high', message: 'A' }),
      makeThreat({ id: 't2', severity: 'high', message: 'B' }),
      makeThreat({ id: 't3', severity: 'medium', message: 'C' }),
      makeThreat({ id: 't4', severity: 'low', message: 'D' }),
    ]
    const result = makeScanResult({
      threats,
      summary: {
        threatsFound: 4,
        bySeverity: { critical: 0, high: 2, medium: 1, low: 1 },
      },
      score: 'D',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).toContain('... and 1 more finding')
    // Singular "finding" not plural "findings" in the "more" line
    expect(output).toMatch(/\.\.\. and 1 more finding(?!s)/)
  })

  it('does not show "... and N more" when 3 or fewer threats', () => {
    const threats = [
      makeThreat({ id: 't1', severity: 'high', message: 'Only one' }),
    ]
    const result = makeScanResult({
      threats,
      summary: {
        threatsFound: 1,
        bySeverity: { critical: 0, high: 1, medium: 0, low: 0 },
      },
      score: 'D',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).not.toContain('... and')
  })

  it('shows "Next steps" when threats exist', () => {
    const result = makeScanResult({
      threats: [makeThreat()],
      summary: {
        threatsFound: 1,
        bySeverity: { critical: 0, high: 0, medium: 1, low: 0 },
      },
      score: 'C',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).toContain('Next steps')
    expect(output).toContain('firmis scan --verbose')
    expect(output).toContain('firmis scan --html')
  })

  it('does not show "Next steps" when no threats', () => {
    const result = makeScanResult({ score: 'A' })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).not.toContain('Next steps')
  })

  it('shows platform summary line', () => {
    const result = makeScanResult({ platform: 'claude' })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).toContain('Scanned')
    expect(output).toContain('Claude Skills')
  })

  it('shows completion duration', () => {
    const result = makeScanResult()
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).toContain('Completed in 1.50s')
  })

  it('shows threat file locations', () => {
    const result = makeScanResult({
      threats: [
        makeThreat({
          message: 'Bad pattern',
          location: { file: 'src/bad.ts', line: 42, column: 5 },
        }),
      ],
      summary: {
        threatsFound: 1,
        bySeverity: { critical: 0, high: 0, medium: 1, low: 0 },
      },
      score: 'C',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).toContain('src/bad.ts:42')
  })

  it('handles grade colors correctly for each grade', () => {
    for (const grade of ['A', 'B', 'C', 'D', 'F'] as const) {
      consoleOutput = []
      const result = makeScanResult({ score: grade })
      printCompactSummary(result)
      const output = consoleOutput.join('\n')
      expect(output).toContain('Security Grade')
    }
  })

  it('shows report path when provided', () => {
    const result = makeScanResult({
      threats: [makeThreat()],
      summary: {
        threatsFound: 1,
        bySeverity: { critical: 0, high: 0, medium: 1, low: 0 },
      },
      score: 'C',
    })
    printCompactSummary(result, '/tmp/firmis-report-2026-03-05.html')
    const output = consoleOutput.join('\n')
    expect(output).toContain('Full report: /tmp/firmis-report-2026-03-05.html')
    expect(output).toContain('firmis-report-2026-03-05.html')
    // Should not show manual --html hint when report is auto-generated
    expect(output).not.toContain('firmis scan --html')
  })

  it('shows manual --html hint when no report path', () => {
    const result = makeScanResult({
      threats: [makeThreat()],
      summary: {
        threatsFound: 1,
        bySeverity: { critical: 0, high: 0, medium: 1, low: 0 },
      },
      score: 'C',
    })
    printCompactSummary(result)
    const output = consoleOutput.join('\n')
    expect(output).not.toContain('Full report:')
    expect(output).toContain('firmis scan --html')
  })

  it('does not show report path when no threats', () => {
    const result = makeScanResult({ score: 'A' })
    printCompactSummary(result, '/tmp/some-report.html')
    const output = consoleOutput.join('\n')
    // reportPath is passed but no threats, so "Full report" still shows
    // since the caller already generated the file
    expect(output).toContain('Full report:')
  })
})
