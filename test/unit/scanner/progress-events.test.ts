import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ScanEngine } from '../../../src/scanner/engine.js'
import type { ProgressEvent, FirmisConfig } from '../../../src/types/index.js'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

function makeConfig(overrides: Partial<FirmisConfig> = {}): FirmisConfig {
  return {
    severity: 'low',
    output: 'terminal',
    verbose: false,
    concurrency: 4,
    ...overrides,
  }
}

describe('ScanEngine: progress events', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `firmis-progress-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('fires rules_loaded event during initialize', async () => {
    const events: ProgressEvent[] = []
    const config = makeConfig({
      targetPath: tempDir,
      onProgress: (e) => events.push(e),
    })
    const engine = new ScanEngine(config)
    await engine.initialize()

    const rulesLoaded = events.find(e => e.type === 'rules_loaded')
    expect(rulesLoaded).toBeDefined()
    expect(rulesLoaded!.message).toBe('Rules loaded')
  })

  it('fires discovery_complete event during scan', async () => {
    const events: ProgressEvent[] = []
    const config = makeConfig({
      targetPath: tempDir,
      onProgress: (e) => events.push(e),
    })
    const engine = new ScanEngine(config)
    await engine.scan()

    const discoveryComplete = events.find(
      e => e.type === 'discovery_complete',
    )
    expect(discoveryComplete).toBeDefined()
    expect(discoveryComplete!.message).toMatch(/Discovered \d+ platform/)
  })

  it('fires platform_start events for each platform', async () => {
    // Create marker for a specific platform
    mkdirSync(join(tempDir, '.claude'), { recursive: true })

    const events: ProgressEvent[] = []
    const config = makeConfig({
      targetPath: tempDir,
      platforms: ['claude'],
      onProgress: (e) => events.push(e),
    })
    const engine = new ScanEngine(config)
    await engine.scan()

    const platformStarts = events.filter(e => e.type === 'platform_start')
    expect(platformStarts.length).toBeGreaterThanOrEqual(1)
    expect(platformStarts[0].platform).toBeDefined()
    expect(platformStarts[0].message).toMatch(/Scanning/)
  })

  it('fires events in correct order', async () => {
    const eventTypes: string[] = []
    const config = makeConfig({
      targetPath: tempDir,
      onProgress: (e) => eventTypes.push(e.type),
    })
    const engine = new ScanEngine(config)
    await engine.scan()

    // rules_loaded should come first (from initialize)
    const rulesIdx = eventTypes.indexOf('rules_loaded')
    const discoveryIdx = eventTypes.indexOf('discovery_complete')
    expect(rulesIdx).toBeLessThan(discoveryIdx)
  })

  it('works correctly when no onProgress callback provided', async () => {
    const config = makeConfig({ targetPath: tempDir })
    const engine = new ScanEngine(config)
    // Should not throw
    const result = await engine.scan()
    expect(result).toBeDefined()
  })

  it('fires component events when components are found', async () => {
    // Create a fixture that triggers component discovery
    const skillDir = join(tempDir, 'skills', 'test-skill')
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(
      join(skillDir, 'skill.json'),
      JSON.stringify({ name: 'test-skill', version: '1.0.0' }),
    )
    writeFileSync(join(skillDir, 'index.ts'), 'export const x = 1')

    const events: ProgressEvent[] = []
    const config = makeConfig({
      targetPath: tempDir,
      platforms: ['claude'],
      onProgress: (e) => events.push(e),
    })
    const engine = new ScanEngine(config)
    await engine.scan()

    // Check that component events include the component name
    const componentStarts = events.filter(e => e.type === 'component_start')
    const componentCompletes = events.filter(
      e => e.type === 'component_complete',
    )

    // If components were found, component events should fire
    if (componentStarts.length > 0) {
      expect(componentStarts[0].component).toBeDefined()
      expect(componentCompletes.length).toBe(componentStarts.length)
      expect(componentCompletes[0].message).toMatch(/Done:/)
    }
  })

  it('includes all expected event types during a full scan', async () => {
    const eventTypes = new Set<string>()
    const config = makeConfig({
      targetPath: tempDir,
      onProgress: (e) => eventTypes.add(e.type),
    })
    const engine = new ScanEngine(config)
    await engine.scan()

    // At minimum, rules_loaded and discovery_complete should fire
    expect(eventTypes.has('rules_loaded')).toBe(true)
    expect(eventTypes.has('discovery_complete')).toBe(true)
  })
})
