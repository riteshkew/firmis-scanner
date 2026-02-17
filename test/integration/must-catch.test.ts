import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScanEngine } from '../../src/scanner/engine.js'
import type { FirmisConfig, ScanResult } from '../../src/types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesPath = path.join(__dirname, '../fixtures')

describe('Integration: Must-Catch - Critical Malicious Patterns', () => {
  describe('OpenClaw Malicious Fixture', () => {
    let result: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['openclaw'],
        targetPath: path.join(fixturesPath, 'openclaw-malicious'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      result = await scanEngine.scan()
    })

    it('must detect known C2 IP addresses', () => {
      const allThreats = result.platforms
        .flatMap(p => p.components)
        .flatMap(c => c.threats)

      const c2Threat = allThreats.find(t =>
        t.evidence.some(e => e.snippet?.includes('91.92.242.30'))
      )

      expect(c2Threat).toBeDefined()
    })

    it('must detect credential file access patterns', () => {
      const allThreats = result.platforms
        .flatMap(p => p.components)
        .flatMap(c => c.threats)

      const hasCredentialEvidence = allThreats.some(t =>
        t.evidence.some(
          e =>
            e.snippet?.includes('.ssh/id_rsa') ||
            e.snippet?.includes('.aws/credentials')
        )
      )

      expect(hasCredentialEvidence).toBe(true)
    })

    it('must flag known malicious skill names', () => {
      const allThreats = result.platforms
        .flatMap(p => p.components)
        .flatMap(c => c.threats)

      const malThreats = allThreats.filter(t => t.ruleId.startsWith('mal-'))

      expect(malThreats.length).toBeGreaterThan(0)
    })

    it('must produce grade D or worse for malicious code', () => {
      expect(['D', 'F']).toContain(result.score)
    })

    it('must categorize threats correctly', () => {
      expect(result.summary.byCategory['known-malicious']).toBeGreaterThan(0)
    })
  })

  describe('MCP Config Vulnerable Fixture', () => {
    let result: ScanResult

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
      result = await scanEngine.scan()
    })

    it('must detect vulnerable MCP server configs', () => {
      expect(result.summary.threatsFound).toBeGreaterThan(0)
    })
  })

  describe('MCP Config Vulnerable (Directory Discovery)', () => {
    let result: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['mcp'],
        targetPath: path.join(fixturesPath, 'mcp-config-vulnerable'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      result = await scanEngine.scan()
    })

    it('must discover and scan mcp.json within directory', () => {
      expect(result.summary.threatsFound).toBeGreaterThan(0)
    })

    it('must detect hardcoded secrets in MCP env config', () => {
      const allThreats = result.platforms
        .flatMap(p => p.components)
        .flatMap(c => c.threats)

      const secretThreats = allThreats.filter(t =>
        t.category === 'secret-detection' || t.category === 'credential-harvesting'
      )
      expect(secretThreats.length).toBeGreaterThan(0)
    })
  })

  describe('Malware Patterns Fixture', () => {
    let result: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['openclaw'],
        targetPath: path.join(fixturesPath, 'malware-patterns'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      result = await scanEngine.scan()
    })

    it('must detect malware distribution patterns', () => {
      expect(result.summary.threatsFound).toBeGreaterThan(0)
      expect(['D', 'F']).toContain(result.score)
    })

    it('must flag malware-distribution category', () => {
      expect(result.summary.byCategory['malware-distribution']).toBeGreaterThan(0)
    })
  })

  describe('Memory Poisoning Fixture', () => {
    let result: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['openclaw'],
        targetPath: path.join(fixturesPath, 'memory-poisoning'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      result = await scanEngine.scan()
    })

    it('must detect memory poisoning patterns', () => {
      expect(result.summary.threatsFound).toBeGreaterThan(0)
      expect(['C', 'D', 'F']).toContain(result.score)
    })

    it('must flag agent-memory-poisoning category', () => {
      expect(result.summary.byCategory['agent-memory-poisoning']).toBeGreaterThan(0)
    })
  })
})
