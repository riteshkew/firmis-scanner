import { describe, it, expect, afterEach } from 'vitest'
import { writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { ScanEngine } from '../../src/scanner/engine.js'
import type { FirmisConfig } from '../../src/types/index.js'

describe('.firmisignore integration', () => {
  const fixturesDir = join(process.cwd(), 'test', 'fixtures', 'openclaw-malicious')
  const ignoreFile = join(fixturesDir, '.firmisignore')

  afterEach(async () => {
    // Clean up .firmisignore file if it exists
    try {
      await rm(ignoreFile, { force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should filter threats by file pattern', async () => {
    // Create a .firmisignore that ignores specific skills
    await writeFile(
      ignoreFile,
      `# Ignore specific skills
**/clawhud/**
`
    )

    const config: FirmisConfig = {
      path: fixturesDir,
      platforms: ['claude-skills'],
      customRules: undefined,
    }

    const engine = new ScanEngine(config)
    const result = await engine.scan()

    const threatFiles = result.platforms.flatMap(p =>
      p.components.flatMap(c => c.threats.map(t => t.location.file))
    )

    // Should not have any threats from clawhud
    const hasClawhudThreats = threatFiles.some(f => f.includes('clawhud'))
    expect(hasClawhudThreats).toBe(false)
  })
})
