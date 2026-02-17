import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { detectModelFiles } from '../../../src/scanner/model-detector.js'

let tempDir: string

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'firmis-model-test-'))
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

const MB = 1024 * 1024

async function writeFileOfSize(filePath: string, sizeBytes: number): Promise<void> {
  const buf = Buffer.alloc(sizeBytes, 0)
  await writeFile(filePath, buf)
}

describe('detectModelFiles', () => {
  describe('.gguf files', () => {
    it('detects a .gguf model file', async () => {
      await writeFileOfSize(join(tempDir, 'llama-7b.gguf'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'llama-7b.gguf',
        format: 'GGUF',
      })
    })

    it('reports size in MB for .gguf file', async () => {
      await writeFileOfSize(join(tempDir, 'model.gguf'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result[0]?.sizeMB).not.toBeNull()
      expect(result[0]?.sizeMB).toBeGreaterThan(1)
    })
  })

  describe('.safetensors files', () => {
    it('detects a .safetensors model file', async () => {
      await writeFileOfSize(join(tempDir, 'model.safetensors'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'model.safetensors',
        format: 'SafeTensors',
      })
    })

    it('reports size in MB for .safetensors file', async () => {
      await writeFileOfSize(join(tempDir, 'model.safetensors'), 3 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result[0]?.sizeMB).not.toBeNull()
      expect(result[0]?.sizeMB).toBeGreaterThan(2)
    })
  })

  describe('Ollama Modelfiles', () => {
    it('detects an Ollama Modelfile', async () => {
      await writeFile(
        join(tempDir, 'Modelfile'),
        'FROM llama3\nSYSTEM You are a helpful assistant.\n'
      )

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'Modelfile',
        format: 'Ollama',
      })
    })
  })

  describe('HuggingFace config.json', () => {
    it('detects config.json with model_type key', async () => {
      await writeFile(
        join(tempDir, 'config.json'),
        JSON.stringify({ model_type: 'llama', hidden_size: 4096 })
      )

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'config.json',
        format: 'HuggingFace',
      })
    })

    it('detects config.json with architectures key', async () => {
      await writeFile(
        join(tempDir, 'config.json'),
        JSON.stringify({ architectures: ['LlamaForCausalLM'] })
      )

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ format: 'HuggingFace' })
    })

    it('detects config.json with torch_dtype key', async () => {
      await writeFile(
        join(tempDir, 'config.json'),
        JSON.stringify({ torch_dtype: 'float16' })
      )

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ format: 'HuggingFace' })
    })

    it('detects config.json with transformers_version key', async () => {
      await writeFile(
        join(tempDir, 'config.json'),
        JSON.stringify({ transformers_version: '4.35.0' })
      )

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ format: 'HuggingFace' })
    })

    it('ignores generic config.json without model keys', async () => {
      await writeFile(
        join(tempDir, 'config.json'),
        JSON.stringify({ host: 'localhost', port: 3000, debug: true })
      )

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(0)
    })

    it('returns null sizeMB for HuggingFace config', async () => {
      await writeFile(
        join(tempDir, 'config.json'),
        JSON.stringify({ model_type: 'bert' })
      )

      const result = await detectModelFiles(tempDir)

      expect(result[0]?.sizeMB).toBeNull()
    })
  })

  describe('small .bin file filtering', () => {
    it('skips .bin files under 1MB', async () => {
      await writeFileOfSize(join(tempDir, 'tiny.bin'), 512 * 1024)

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(0)
    })

    it('includes .bin files of 1MB or more', async () => {
      await writeFileOfSize(join(tempDir, 'model.bin'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'model.bin',
        format: 'Binary',
      })
    })

    it('skips .pt files under 1MB', async () => {
      await writeFileOfSize(join(tempDir, 'tiny.pt'), 512 * 1024)

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(0)
    })

    it('skips .pth files under 1MB', async () => {
      await writeFileOfSize(join(tempDir, 'tiny.pth'), 512 * 1024)

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(0)
    })
  })

  describe('correct format labels', () => {
    it('labels .onnx as ONNX', async () => {
      await writeFileOfSize(join(tempDir, 'model.onnx'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result[0]?.format).toBe('ONNX')
    })

    it('labels .h5 as HDF5/Keras', async () => {
      await writeFileOfSize(join(tempDir, 'model.h5'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result[0]?.format).toBe('HDF5/Keras')
    })

    it('labels .tflite as TFLite', async () => {
      await writeFileOfSize(join(tempDir, 'model.tflite'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result[0]?.format).toBe('TFLite')
    })

    it('labels model.json as TensorFlow.js', async () => {
      await writeFile(
        join(tempDir, 'model.json'),
        JSON.stringify({ format: 'graph-model', generatedBy: '2.0' })
      )

      const result = await detectModelFiles(tempDir)

      expect(result[0]?.format).toBe('TensorFlow.js')
    })
  })

  describe('result shape', () => {
    it('includes name, path, format, and sizeMB fields', async () => {
      await writeFileOfSize(join(tempDir, 'model.gguf'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('path')
      expect(result[0]).toHaveProperty('format')
      expect(result[0]).toHaveProperty('sizeMB')
    })

    it('path field is an absolute path', async () => {
      await writeFileOfSize(join(tempDir, 'model.gguf'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result[0]?.path).toMatch(/^\//)
    })
  })

  describe('resilience', () => {
    it('returns empty array for directory with no model files', async () => {
      await writeFile(join(tempDir, 'README.md'), '# project')

      const result = await detectModelFiles(tempDir)

      expect(result).toEqual([])
    })

    it('returns empty array for empty directory', async () => {
      const result = await detectModelFiles(tempDir)

      expect(result).toEqual([])
    })

    it('does not crash on malformed config.json', async () => {
      await writeFile(join(tempDir, 'config.json'), '{ invalid json }')

      const result = await detectModelFiles(tempDir)

      expect(result).toEqual([])
    })

    it('handles model files in subdirectories', async () => {
      const subDir = join(tempDir, 'models')
      await mkdir(subDir)
      await writeFileOfSize(join(subDir, 'model.gguf'), 2 * MB)

      const result = await detectModelFiles(tempDir)

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('model.gguf')
    })
  })
})
