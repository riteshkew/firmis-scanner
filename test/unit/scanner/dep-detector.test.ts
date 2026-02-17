import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { detectAIDependencies } from '../../../src/scanner/dep-detector.js'

let tempDir: string

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'firmis-dep-test-'))
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

describe('detectAIDependencies', () => {
  describe('npm package detection', () => {
    it('finds AI packages in dependencies', async () => {
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            '@anthropic-ai/sdk': '^1.0.0',
            express: '^4.0.0',
          },
        })
      )

      const result = await detectAIDependencies(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: '@anthropic-ai/sdk',
        version: '^1.0.0',
        source: 'npm',
        category: 'llm-sdk',
      })
    })

    it('finds AI packages in devDependencies', async () => {
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify({
          devDependencies: {
            openai: '^4.0.0',
            typescript: '^5.0.0',
          },
        })
      )

      const result = await detectAIDependencies(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'openai',
        source: 'npm',
        category: 'llm-sdk',
      })
    })

    it('finds multiple AI packages from npm', async () => {
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            '@anthropic-ai/sdk': '^1.0.0',
            langchain: '^0.2.0',
            '@pinecone-database/pinecone': '^2.0.0',
            lodash: '^4.0.0',
          },
        })
      )

      const result = await detectAIDependencies(tempDir)
      const names = result.map(d => d.name)

      expect(names).toContain('@anthropic-ai/sdk')
      expect(names).toContain('langchain')
      expect(names).toContain('@pinecone-database/pinecone')
      expect(names).not.toContain('lodash')
    })

    it('ignores non-AI npm packages', async () => {
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            express: '^4.0.0',
            lodash: '^4.0.0',
            react: '^18.0.0',
          },
        })
      )

      const result = await detectAIDependencies(tempDir)

      expect(result).toHaveLength(0)
    })
  })

  describe('pip package detection via requirements.txt', () => {
    it('finds AI packages from requirements.txt', async () => {
      await writeFile(
        join(tempDir, 'requirements.txt'),
        'anthropic>=1.0.0\nflask==2.0\n'
      )

      const result = await detectAIDependencies(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'anthropic',
        source: 'pip',
        category: 'llm-sdk',
      })
    })

    it('parses version specifiers correctly', async () => {
      await writeFile(
        join(tempDir, 'requirements.txt'),
        'openai>=1.0.0\n'
      )

      const result = await detectAIDependencies(tempDir)

      expect(result[0]).toMatchObject({
        name: 'openai',
        version: '1.0.0',
        source: 'pip',
      })
    })

    it('handles packages with no version', async () => {
      await writeFile(
        join(tempDir, 'requirements.txt'),
        'openai\n'
      )

      const result = await detectAIDependencies(tempDir)

      expect(result[0]).toMatchObject({
        name: 'openai',
        version: null,
        source: 'pip',
      })
    })

    it('skips comments in requirements.txt', async () => {
      await writeFile(
        join(tempDir, 'requirements.txt'),
        '# This is a comment\nanthropicflask==2.0\n# openai is commented out\n'
      )

      const result = await detectAIDependencies(tempDir)

      expect(result).toHaveLength(0)
    })

    it('skips flag lines like -r in requirements.txt', async () => {
      await writeFile(
        join(tempDir, 'requirements.txt'),
        '-r other-requirements.txt\nflask==2.0\n'
      )

      const result = await detectAIDependencies(tempDir)

      expect(result).toHaveLength(0)
    })

    it('finds multiple AI packages from requirements.txt', async () => {
      await writeFile(
        join(tempDir, 'requirements.txt'),
        [
          'anthropic>=1.0.0',
          'flask==2.0',
          '# This is a comment',
          'openai',
          '-r other-requirements.txt',
          'langchain>=0.1.0',
        ].join('\n')
      )

      const result = await detectAIDependencies(tempDir)
      const names = result.map(d => d.name)

      expect(names).toContain('anthropic')
      expect(names).toContain('openai')
      expect(names).toContain('langchain')
      expect(names).not.toContain('flask')
    })

    it('ignores non-AI pip packages', async () => {
      await writeFile(
        join(tempDir, 'requirements.txt'),
        'flask==2.0\nrequests>=2.0\ndjango>=4.0\n'
      )

      const result = await detectAIDependencies(tempDir)

      expect(result).toHaveLength(0)
    })
  })

  describe('pip package detection via pyproject.toml', () => {
    it('finds AI packages from pyproject.toml', async () => {
      await writeFile(
        join(tempDir, 'pyproject.toml'),
        [
          '[project]',
          'dependencies = [',
          '  "langchain>=0.1.0",',
          '  "requests>=2.0"',
          ']',
        ].join('\n')
      )

      const result = await detectAIDependencies(tempDir)
      const names = result.map(d => d.name)

      expect(names).toContain('langchain')
      expect(names).not.toContain('requests')
    })

    it('finds multiple AI packages from pyproject.toml', async () => {
      await writeFile(
        join(tempDir, 'pyproject.toml'),
        [
          '[project]',
          'dependencies = [',
          '  "anthropic>=1.0.0",',
          '  "openai>=1.0.0",',
          '  "requests>=2.0"',
          ']',
        ].join('\n')
      )

      const result = await detectAIDependencies(tempDir)
      const pipNames = result.filter(d => d.source === 'pip').map(d => d.name)

      expect(pipNames).toContain('anthropic')
      expect(pipNames).toContain('openai')
    })

    it('ignores non-AI packages in pyproject.toml', async () => {
      await writeFile(
        join(tempDir, 'pyproject.toml'),
        [
          '[project]',
          'dependencies = [',
          '  "requests>=2.0",',
          '  "click>=8.0"',
          ']',
        ].join('\n')
      )

      const result = await detectAIDependencies(tempDir)

      expect(result).toHaveLength(0)
    })
  })

  describe('deduplication', () => {
    it('deduplicates the same npm package found in multiple package.json files', async () => {
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { '@anthropic-ai/sdk': '^1.0.0' },
        })
      )

      const subDir = join(tempDir, 'sub')
      await mkdir(subDir)
      await writeFile(
        join(subDir, 'package.json'),
        JSON.stringify({
          dependencies: { '@anthropic-ai/sdk': '^1.1.0' },
        })
      )

      const result = await detectAIDependencies(tempDir)
      const anthropicDeps = result.filter(d => d.name === '@anthropic-ai/sdk')

      expect(anthropicDeps).toHaveLength(1)
    })

    it('deduplicates the same pip package from requirements.txt and pyproject.toml', async () => {
      await writeFile(
        join(tempDir, 'requirements.txt'),
        'openai>=1.0.0\n'
      )
      await writeFile(
        join(tempDir, 'pyproject.toml'),
        '[project]\ndependencies = [\n  "openai>=1.0.0"\n]\n'
      )

      const result = await detectAIDependencies(tempDir)
      const openaiDeps = result.filter(d => d.name === 'openai' && d.source === 'pip')

      expect(openaiDeps).toHaveLength(1)
    })

    it('treats npm and pip packages with the same name as distinct', async () => {
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify({ dependencies: { openai: '^4.0.0' } })
      )
      await writeFile(
        join(tempDir, 'requirements.txt'),
        'openai>=1.0.0\n'
      )

      const result = await detectAIDependencies(tempDir)
      const openaiDeps = result.filter(d => d.name === 'openai')

      expect(openaiDeps).toHaveLength(2)
      expect(openaiDeps.map(d => d.source).sort()).toEqual(['npm', 'pip'])
    })
  })

  describe('resilience', () => {
    it('returns empty array for an empty directory', async () => {
      const result = await detectAIDependencies(tempDir)

      expect(result).toEqual([])
    })

    it('does not crash on malformed package.json', async () => {
      await writeFile(join(tempDir, 'package.json'), '{ invalid json }')

      const result = await detectAIDependencies(tempDir)

      expect(result).toEqual([])
    })

    it('does not crash on empty requirements.txt', async () => {
      await writeFile(join(tempDir, 'requirements.txt'), '')

      const result = await detectAIDependencies(tempDir)

      expect(result).toEqual([])
    })

    it('does not crash on empty pyproject.toml', async () => {
      await writeFile(join(tempDir, 'pyproject.toml'), '')

      const result = await detectAIDependencies(tempDir)

      expect(result).toEqual([])
    })
  })
})
