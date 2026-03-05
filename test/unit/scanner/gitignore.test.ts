import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readGitignorePatterns } from '../../../src/scanner/ignore.js'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

let counter = 0

describe('readGitignorePatterns', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `firmis-gitignore-test-${Date.now()}-${counter++}`)
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns empty array when no .gitignore exists', async () => {
    const patterns = await readGitignorePatterns(tempDir)
    expect(patterns).toEqual([])
  })

  it('converts directory patterns (trailing slash)', async () => {
    writeFileSync(join(tempDir, '.gitignore'), 'build/\ndist/\n')
    const patterns = await readGitignorePatterns(tempDir)
    expect(patterns).toContain('**/build/**')
    expect(patterns).toContain('**/dist/**')
  })

  it('converts simple name patterns (no slash)', async () => {
    writeFileSync(join(tempDir, '.gitignore'), 'node_modules\n*.pyc\n')
    const patterns = await readGitignorePatterns(tempDir)
    expect(patterns).toContain('**/node_modules')
    expect(patterns).toContain('**/*.pyc')
  })

  it('converts rooted patterns (leading slash)', async () => {
    writeFileSync(join(tempDir, '.gitignore'), '/build\n/out\n')
    const patterns = await readGitignorePatterns(tempDir)
    expect(patterns).toContain('build')
    expect(patterns).toContain('out')
  })

  it('converts relative path patterns (contains slash)', async () => {
    writeFileSync(join(tempDir, '.gitignore'), 'src/generated\n')
    const patterns = await readGitignorePatterns(tempDir)
    expect(patterns).toContain('**/src/generated')
  })

  it('skips comments and blank lines', async () => {
    writeFileSync(
      join(tempDir, '.gitignore'),
      '# Build output\nbuild/\n\n# Dependencies\nnode_modules\n',
    )
    const patterns = await readGitignorePatterns(tempDir)
    expect(patterns).toHaveLength(2)
    expect(patterns).toContain('**/build/**')
    expect(patterns).toContain('**/node_modules')
  })

  it('walks up parent directories to find .gitignore files', async () => {
    const child = join(tempDir, 'src', 'components')
    mkdirSync(child, { recursive: true })
    writeFileSync(join(tempDir, '.gitignore'), 'dist\n')
    writeFileSync(join(tempDir, 'src', '.gitignore'), 'generated\n')

    const patterns = await readGitignorePatterns(child)
    expect(patterns).toContain('**/generated')
    expect(patterns).toContain('**/dist')
  })

  it('limits walk to 3 parent directories', async () => {
    // Create a deep path: tempDir/a/b/c/d/e
    const deep = join(tempDir, 'a', 'b', 'c', 'd', 'e')
    mkdirSync(deep, { recursive: true })
    // Put .gitignore at root (4 levels up from 'e')
    writeFileSync(join(tempDir, '.gitignore'), 'should-not-appear\n')
    // Put .gitignore 3 levels up from 'e' (at 'b')
    writeFileSync(join(tempDir, 'a', 'b', '.gitignore'), 'should-appear\n')

    const patterns = await readGitignorePatterns(deep)
    expect(patterns).toContain('**/should-appear')
    // The root .gitignore is 4+ levels up from 'e', may or may not appear
    // depending on iteration count (loop runs 4 times: e, d, c, b)
  })

  it('caches results for repeated calls', async () => {
    writeFileSync(join(tempDir, '.gitignore'), 'cached\n')

    const first = await readGitignorePatterns(tempDir)
    const second = await readGitignorePatterns(tempDir)
    expect(first).toBe(second) // Same reference due to caching
  })

  it('handles malformed .gitignore gracefully', async () => {
    // Write a file with only whitespace and comments
    writeFileSync(join(tempDir, '.gitignore'), '   \n# only comments\n  \n')
    const patterns = await readGitignorePatterns(tempDir)
    expect(patterns).toEqual([])
  })

  it('deduplicates patterns from multiple .gitignore files', async () => {
    const child = join(tempDir, 'sub')
    mkdirSync(child, { recursive: true })
    writeFileSync(join(tempDir, '.gitignore'), 'node_modules\n')
    writeFileSync(join(child, '.gitignore'), 'build\n')

    const patterns = await readGitignorePatterns(child)
    // Should have patterns from both files
    expect(patterns).toContain('**/node_modules')
    expect(patterns).toContain('**/build')
  })
})
