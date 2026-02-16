import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScanEngine } from '../../src/scanner/engine.js'
import type { FirmisConfig, ScanResult } from '../../src/types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesPath = path.join(__dirname, '../fixtures')

describe('Integration: Sprint 1 - OpenClaw Detection', () => {
  describe('Malicious OpenClaw Skills', () => {
    let maliciousResult: ScanResult

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
      maliciousResult = await scanEngine.scan()
    })

    it('detects malicious OpenClaw skill (clawhud fixture)', () => {
      // Should find threats from known-malicious rules (mal-* prefix)
      const maliciousThreats = maliciousResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)
        .filter((t) => t.ruleId.startsWith('mal-'))

      expect(maliciousThreats.length).toBeGreaterThan(0)
    })

    it('detects multiple threat categories', () => {
      // The clawhud fixture has:
      // - C2 IP (91.92.242.30) → known-malicious
      // - Credential access (.ssh/id_rsa, .aws/credentials) → credential-harvesting
      // - Skill name "clawhud" → known-malicious

      const allThreats = maliciousResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)

      const categories = new Set(allThreats.map((t) => t.category))

      // Should detect at least known-malicious and credential-harvesting
      expect(categories.has('known-malicious')).toBe(true)
      expect(categories.size).toBeGreaterThan(1)
    })

    it('detects C2 infrastructure', () => {
      // The clawhud fixture contains 91.92.242.30 (known C2 IP)
      const allThreats = maliciousResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)

      const c2Threat = allThreats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('91.92.242.30'))
      )

      expect(c2Threat).toBeDefined()
      // Should be high or critical severity
      expect(['high', 'critical']).toContain(c2Threat?.severity)
    })

    it('detects credential harvesting patterns', () => {
      // The clawhud fixture reads ~/.ssh/id_rsa and ~/.aws/credentials
      const allThreats = maliciousResult.platforms
        .flatMap((p) => p.components)
        .flatMap((c) => c.threats)

      const credentialThreats = allThreats.filter(
        (t) => t.category === 'credential-harvesting'
      )

      expect(credentialThreats.length).toBeGreaterThan(0)

      // Should detect access to SSH keys or AWS credentials
      const hasSSHOrAWS = credentialThreats.some((t) =>
        t.evidence.some(
          (e) =>
            e.snippet.includes('.ssh/id_rsa') || e.snippet.includes('.aws/credentials')
        )
      )

      expect(hasSSHOrAWS).toBe(true)
    })

    it('summary statistics are correct for malicious scan', () => {
      expect(maliciousResult.summary.totalComponents).toBeGreaterThan(0)
      expect(maliciousResult.summary.failedComponents).toBeGreaterThan(0)
      expect(maliciousResult.summary.threatsFound).toBeGreaterThan(0)
      expect(maliciousResult.summary.bySeverity.critical).toBeGreaterThan(0)
    })
  })

  describe('Safe OpenClaw Skills', () => {
    let safeResult: ScanResult

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
      safeResult = await scanEngine.scan()
    })

    it('safe OpenClaw skill has no threats', () => {
      expect(safeResult.summary.threatsFound).toBe(0)
      expect(safeResult.summary.failedComponents).toBe(0)
      expect(safeResult.summary.passedComponents).toBeGreaterThan(0)
    })
  })
})
