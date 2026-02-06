import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScanEngine } from '../../src/scanner/engine.js'
import { RuleEngine } from '../../src/rules/engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesPath = path.join(__dirname, '../fixtures')

describe('Integration: Full Scan', () => {
  let scanEngine: ScanEngine
  let ruleEngine: RuleEngine

  beforeAll(async () => {
    ruleEngine = new RuleEngine()
    await ruleEngine.load()
    scanEngine = new ScanEngine(ruleEngine)
  })

  it('detects malicious skill', async () => {
    const skillPath = path.join(fixturesPath, 'claude-skills/malicious-skill')
    const result = await scanEngine.scanPath(skillPath, { platform: 'claude' })

    expect(result.summary.threatsFound).toBeGreaterThan(0)
    expect(result.summary.byCategory['credential-harvesting']).toBeGreaterThan(0)
  })

  it('passes safe skill', async () => {
    const skillPath = path.join(fixturesPath, 'claude-skills/safe-skill')
    const result = await scanEngine.scanPath(skillPath, { platform: 'claude' })

    expect(result.summary.threatsFound).toBe(0)
  })

  it('detects prompt injection', async () => {
    const skillPath = path.join(fixturesPath, 'claude-skills/prompt-injection-skill')
    const result = await scanEngine.scanPath(skillPath, { platform: 'claude' })

    expect(result.summary.threatsFound).toBeGreaterThan(0)
    expect(result.summary.byCategory['prompt-injection']).toBeGreaterThan(0)
  })

  it('completes scan within time limit', async () => {
    const start = Date.now()
    await scanEngine.scanPath(fixturesPath, {})
    const duration = Date.now() - start

    expect(duration).toBeLessThan(30000)
  })

  it('generates correct summary statistics', async () => {
    const result = await scanEngine.scanPath(fixturesPath, {})

    expect(result.summary.totalComponents).toBeGreaterThan(0)
    expect(result.summary.passedComponents + result.summary.failedComponents).toBe(
      result.summary.totalComponents,
    )
  })
})
