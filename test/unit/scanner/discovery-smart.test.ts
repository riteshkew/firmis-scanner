import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PlatformDiscovery } from '../../../src/scanner/discovery.js'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { FirmisConfig } from '../../../src/types/config.js'

function makeConfig(overrides: Partial<FirmisConfig> = {}): FirmisConfig {
  return {
    severity: 'low',
    output: 'terminal',
    verbose: false,
    concurrency: 4,
    ...overrides,
  }
}

describe('PlatformDiscovery: smart platform detection', () => {
  let tempDir: string
  let discovery: PlatformDiscovery

  beforeEach(() => {
    tempDir = join(tmpdir(), `firmis-discovery-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    discovery = new PlatformDiscovery()
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('detects claude platform via .claude directory', async () => {
    mkdirSync(join(tempDir, '.claude'), { recursive: true })
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('claude')
  })

  it('detects claude platform via skills directory', async () => {
    mkdirSync(join(tempDir, 'skills'), { recursive: true })
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('claude')
  })

  it('detects mcp platform via mcp.json', async () => {
    writeFileSync(join(tempDir, 'mcp.json'), '{}')
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('mcp')
  })

  it('detects mcp platform via claude_desktop_config.json', async () => {
    writeFileSync(join(tempDir, 'claude_desktop_config.json'), '{}')
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('mcp')
  })

  it('detects cursor platform via .cursor directory', async () => {
    mkdirSync(join(tempDir, '.cursor'), { recursive: true })
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('cursor')
  })

  it('detects crewai platform via crew.yaml', async () => {
    writeFileSync(join(tempDir, 'crew.yaml'), 'agents: []')
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('crewai')
  })

  it('detects crewai platform via crew.yml', async () => {
    writeFileSync(join(tempDir, 'crew.yml'), 'agents: []')
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('crewai')
  })

  it('detects nanobot platform via nanobot.yaml', async () => {
    writeFileSync(join(tempDir, 'nanobot.yaml'), '{}')
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('nanobot')
  })

  it('detects openclaw platform via .openclaw directory', async () => {
    mkdirSync(join(tempDir, '.openclaw'), { recursive: true })
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('openclaw')
  })

  it('detects mcp via package.json @modelcontextprotocol/sdk dep', async () => {
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({
        dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
      }),
    )
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('mcp')
  })

  it('detects crewai via package.json devDependencies', async () => {
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({
        devDependencies: { crewai: '^2.0.0' },
      }),
    )
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('crewai')
  })

  it('deduplicates when both marker file and package.json match', async () => {
    writeFileSync(join(tempDir, 'mcp.json'), '{}')
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({
        dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
      }),
    )
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const mcpPlatforms = result.platforms.filter(p => p.type === 'mcp')
    expect(mcpPlatforms).toHaveLength(1)
  })

  it('falls back to all platforms when no markers found', async () => {
    // Empty directory — no marker files
    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    // Should try all 8 platforms
    expect(result.platforms.length).toBeGreaterThanOrEqual(8)
  })

  it('detects multiple platforms simultaneously', async () => {
    mkdirSync(join(tempDir, '.claude'), { recursive: true })
    mkdirSync(join(tempDir, '.cursor'), { recursive: true })
    writeFileSync(join(tempDir, 'mcp.json'), '{}')

    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('claude')
    expect(platformTypes).toContain('cursor')
    expect(platformTypes).toContain('mcp')
  })

  it('uses explicit platforms when specified (bypasses smart detection)', async () => {
    // Even though .claude exists, specifying platform should override
    mkdirSync(join(tempDir, '.claude'), { recursive: true })
    const result = await discovery.discover(
      makeConfig({ targetPath: tempDir, platforms: ['mcp'] }),
    )
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toEqual(['mcp'])
  })

  it('handles malformed package.json gracefully', async () => {
    writeFileSync(join(tempDir, 'package.json'), 'not valid json{{{')
    mkdirSync(join(tempDir, '.claude'), { recursive: true })

    const result = await discovery.discover(makeConfig({ targetPath: tempDir }))
    const platformTypes = result.platforms.map(p => p.type)
    expect(platformTypes).toContain('claude')
  })
})
