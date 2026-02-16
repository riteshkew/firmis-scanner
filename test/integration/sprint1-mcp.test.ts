import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScanEngine } from '../../src/scanner/engine.js'
import type { FirmisConfig, ScanResult } from '../../src/types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesPath = path.join(__dirname, '../fixtures')

describe('Integration: Sprint 1 - MCP Config Scanning', () => {
  describe('Vulnerable MCP Config', () => {
    let vulnerableResult: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['mcp'],
        targetPath: path.join(fixturesPath, 'mcp-config-vulnerable/mcp.json'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      vulnerableResult = await scanEngine.scan()
    })

    it('detects credentials in MCP config file', () => {
      const allThreats = vulnerableResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)

      const credentialThreats = allThreats.filter(
        (t) => t.category === 'credential-harvesting'
      )

      expect(credentialThreats.length).toBeGreaterThan(0)
    })

    it('detects AWS credentials (AKIA prefix)', () => {
      const allThreats = vulnerableResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)

      const awsThreat = allThreats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('AKIAIOSFODNN7EXAMPLE'))
      )

      expect(awsThreat).toBeDefined()
      // May be categorized as credential-harvesting or agent-memory-poisoning
      // (MCP config with credentials could match either)
      expect(['credential-harvesting', 'agent-memory-poisoning']).toContain(
        awsThreat?.category
      )
    })

    it('detects GitHub Personal Access Token', () => {
      const allThreats = vulnerableResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)

      const githubThreat = allThreats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('ghp_'))
      )

      expect(githubThreat).toBeDefined()
    })

    it('detects OpenAI API key', () => {
      const allThreats = vulnerableResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)

      const openaiThreat = allThreats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('sk-'))
      )

      expect(openaiThreat).toBeDefined()
    })

    it('detects database connection strings', () => {
      const allThreats = vulnerableResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)

      const dbThreat = allThreats.find((t) =>
        t.evidence.some(
          (e) =>
            e.snippet.includes('postgresql://') && e.snippet.includes('supersecret')
        )
      )

      expect(dbThreat).toBeDefined()
    })

    it('summary shows multiple credential threats', () => {
      expect(vulnerableResult.summary.threatsFound).toBeGreaterThan(0)
      expect(vulnerableResult.summary.failedComponents).toBeGreaterThan(0)

      // Should have high or critical severity threats
      const criticalAndHigh =
        vulnerableResult.summary.bySeverity.critical +
        vulnerableResult.summary.bySeverity.high

      expect(criticalAndHigh).toBeGreaterThan(0)
    })
  })

  describe('Safe MCP Config', () => {
    let safeResult: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['mcp'],
        targetPath: path.join(fixturesPath, 'mcp-config-safe/mcp.json'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      safeResult = await scanEngine.scan()
    })

    it('safe MCP config has no credential threats', () => {
      const credentialThreats = safeResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)
        .filter((t) => t.category === 'credential-harvesting')

      expect(credentialThreats.length).toBe(0)
    })

    it('safe MCP config summary shows clean scan', () => {
      // May have 0 threats if config is truly safe, or very low severity if
      // safe patterns accidentally match low-weight patterns
      expect(safeResult.summary.bySeverity.critical).toBe(0)
      expect(safeResult.summary.bySeverity.high).toBe(0)
    })
  })
})
