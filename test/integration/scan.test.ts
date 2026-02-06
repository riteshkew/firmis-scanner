import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScanEngine } from '../../src/scanner/engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesPath = path.join(__dirname, '../fixtures')

describe('Integration: Full Scan', () => {
  let scanEngine: ScanEngine

  beforeAll(async () => {
    scanEngine = new ScanEngine({
      severity: 'low',
      output: 'terminal',
      verbose: false,
      concurrency: 4,
    })
    await scanEngine.initialize()
  })

  it.skip('detects malicious skill', async () => {
    // Requires fixtures to be set up
    const result = await scanEngine.scan()
    expect(result.summary.threatsFound).toBeGreaterThan(0)
  })

  it.skip('passes safe skill', async () => {
    // Requires fixtures to be set up
    const result = await scanEngine.scan()
    expect(result.summary.threatsFound).toBe(0)
  })

  it.skip('detects prompt injection', async () => {
    // Requires fixtures to be set up
    const result = await scanEngine.scan()
    expect(result.summary.threatsFound).toBeGreaterThan(0)
  })

  it('completes scan within time limit', async () => {
    const start = Date.now()
    await scanEngine.scan()
    const duration = Date.now() - start

    // Should complete quickly when no platforms are detected
    expect(duration).toBeLessThan(30000)
  })

  it.skip('generates correct summary statistics', async () => {
    // Requires fixtures to be set up
    const result = await scanEngine.scan()

    expect(result.summary.totalComponents).toBeGreaterThan(0)
    expect(result.summary.passedComponents + result.summary.failedComponents).toBe(
      result.summary.totalComponents,
    )
  })
})
