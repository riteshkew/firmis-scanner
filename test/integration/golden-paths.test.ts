import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScanEngine } from '../../src/scanner/engine.js'
import type { FirmisConfig, ScanResult } from '../../src/types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesPath = path.join(__dirname, '../fixtures')

describe('Integration: Golden Paths - Known-Safe Codebases', () => {
  describe('Safe OpenClaw Fixture', () => {
    let result: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['openclaw'],
        targetPath: path.join(fixturesPath, 'openclaw-safe'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      result = await scanEngine.scan()
    })

    it('safe OpenClaw project produces grade A', () => {
      expect(result.score).toBe('A')
      expect(result.summary.threatsFound).toBe(0)
    })

    it('safe project has no failed components', () => {
      expect(result.summary.failedComponents).toBe(0)
    })
  })

  describe('Safe MCP Config Fixture', () => {
    let result: ScanResult

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
      result = await scanEngine.scan()
    })

    it('safe MCP config produces clean scan', () => {
      expect(result.summary.threatsFound).toBe(0)
    })
  })

  describe('Documentation False-Positive Fixture', () => {
    // This fixture contains markdown/docs that mention malicious patterns
    // (e.g. C2 IPs, credential paths) in an educational context.
    // The scanner must not flag documentation mentions as real threats.
    let result: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['openclaw'],
        targetPath: path.join(fixturesPath, 'documentation-fp'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      result = await scanEngine.scan()
    })

    it('documentation mentioning threats is not flagged', () => {
      expect(result.summary.threatsFound).toBe(0)
    })
  })

  describe('Codex Plugins Fixture', () => {
    let result: ScanResult

    beforeAll(async () => {
      const config: FirmisConfig = {
        platforms: ['openclaw'],
        targetPath: path.join(fixturesPath, 'codex-plugins'),
        severity: 'low',
        output: 'terminal',
        verbose: false,
        concurrency: 4,
      }

      const scanEngine = new ScanEngine(config)
      await scanEngine.initialize()
      result = await scanEngine.scan()
    })

    it('safe codex plugins produce grade A', () => {
      expect(result.score).toBe('A')
      expect(result.summary.threatsFound).toBe(0)
    })
  })
})
