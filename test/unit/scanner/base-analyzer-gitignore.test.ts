import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BasePlatformAnalyzer } from '../../../src/scanner/platforms/base.js'
import type {
  PlatformType,
  DetectedPlatform,
  DiscoveredComponent,
  ComponentMetadata,
} from '../../../src/types/index.js'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

/** Concrete subclass to test protected methods */
class TestAnalyzer extends BasePlatformAnalyzer {
  readonly platformType: PlatformType = 'claude'
  readonly name = 'Test Analyzer'

  async detect(): Promise<DetectedPlatform[]> {
    return []
  }
  async discover(): Promise<DiscoveredComponent[]> {
    return []
  }
  async analyze(): Promise<string[]> {
    return []
  }
  async getMetadata(): Promise<ComponentMetadata> {
    return { version: '1.0' }
  }

  // Expose protected methods for testing
  async testGetIgnorePatterns(rootPath: string): Promise<string[]> {
    return this.getIgnorePatterns(rootPath)
  }

  async testIsGitignored(
    parentPath: string,
    dirName: string,
  ): Promise<boolean> {
    return this.isGitignored(parentPath, dirName)
  }
}

let counter = 0

describe('BasePlatformAnalyzer: gitignore integration', () => {
  let tempDir: string
  let analyzer: TestAnalyzer

  beforeEach(() => {
    tempDir = join(tmpdir(), `firmis-base-test-${Date.now()}-${counter++}`)
    mkdirSync(tempDir, { recursive: true })
    analyzer = new TestAnalyzer()
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  describe('getIgnorePatterns', () => {
    it('always includes default ignore patterns', async () => {
      const patterns = await analyzer.testGetIgnorePatterns(tempDir)
      expect(patterns).toContain('**/node_modules/**')
      expect(patterns).toContain('**/.git/**')
      expect(patterns).toContain('**/venv/**')
      expect(patterns).toContain('**/__pycache__/**')
    })

    it('merges .gitignore patterns with defaults', async () => {
      writeFileSync(
        join(tempDir, '.gitignore'),
        'coverage\n.env\n',
      )
      const patterns = await analyzer.testGetIgnorePatterns(tempDir)
      // Default patterns
      expect(patterns).toContain('**/node_modules/**')
      // Gitignore patterns
      expect(patterns).toContain('**/coverage')
      expect(patterns).toContain('**/.env')
    })

    it('includes at least the 4 defaults when no local .gitignore exists', async () => {
      const patterns = await analyzer.testGetIgnorePatterns(tempDir)
      // At least the 4 hardcoded defaults; parent .gitignore may add more
      expect(patterns.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('isGitignored', () => {
    it('returns true for directory matching .gitignore pattern', async () => {
      // Use a nested project dir to avoid cache pollution from other tests
      const project = join(tempDir, 'myproject')
      mkdirSync(project, { recursive: true })
      writeFileSync(join(project, '.gitignore'), 'xdist\nxbuild\n')
      expect(await analyzer.testIsGitignored(project, 'xdist')).toBe(true)
      expect(await analyzer.testIsGitignored(project, 'xbuild')).toBe(true)
    })

    it('returns false for non-matching directory', async () => {
      const project = join(tempDir, 'myproject2')
      mkdirSync(project, { recursive: true })
      writeFileSync(join(project, '.gitignore'), 'xdist\n')
      expect(await analyzer.testIsGitignored(project, 'src')).toBe(false)
      expect(await analyzer.testIsGitignored(project, 'lib')).toBe(false)
    })

    it('returns false for unmatched directory name', async () => {
      // Use a name that won't appear in any parent .gitignore
      expect(
        await analyzer.testIsGitignored(tempDir, 'zzz-unique-dir-name'),
      ).toBe(false)
    })

    it('handles directory patterns with trailing slash', async () => {
      // Use a unique subdir so the readGitignorePatterns cache doesn't
      // interfere from other tests that walked the same parent paths
      const sub = join(tempDir, 'project')
      mkdirSync(sub, { recursive: true })
      writeFileSync(join(sub, '.gitignore'), 'myoutput/\n')
      expect(await analyzer.testIsGitignored(sub, 'myoutput')).toBe(true)
    })

    it('does not match partial directory names', async () => {
      const project = join(tempDir, 'myproject4')
      mkdirSync(project, { recursive: true })
      writeFileSync(join(project, '.gitignore'), 'xdist\n')
      expect(await analyzer.testIsGitignored(project, 'xdistribution')).toBe(
        false,
      )
      expect(await analyzer.testIsGitignored(project, 'my-xdist')).toBe(false)
    })

    it('does not match wildcard patterns as literal dir names', async () => {
      writeFileSync(join(tempDir, '.gitignore'), '*.pyc\n')
      // Wildcard patterns like *.pyc become **/*.pyc after conversion.
      // isGitignored strips **/ prefix → "*.pyc", which doesn't match
      // a real directory name like "cache" literally.
      expect(
        await analyzer.testIsGitignored(tempDir, 'cache'),
      ).toBe(false)
    })
  })
})
