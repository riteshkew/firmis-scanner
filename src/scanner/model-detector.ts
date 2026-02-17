import { stat, readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import fg from 'fast-glob'

export interface ModelFileInfo {
  name: string
  path: string
  format: string
  sizeMB: number | null
}

const MODEL_GLOB_PATTERNS = [
  '**/*.gguf',
  '**/*.safetensors',
  '**/*.onnx',
  '**/*.pt',
  '**/*.pth',
  '**/*.bin',
  '**/*.h5',
  '**/*.tflite',
  '**/Modelfile',
  '**/model.json',
]

const EXTENSION_TO_FORMAT: Record<string, string> = {
  '.gguf': 'GGUF',
  '.safetensors': 'SafeTensors',
  '.onnx': 'ONNX',
  '.pt': 'PyTorch',
  '.pth': 'PyTorch',
  '.bin': 'Binary',
  '.h5': 'HDF5/Keras',
  '.tflite': 'TFLite',
}

const HUGGINGFACE_KEYS = ['model_type', 'architectures', 'torch_dtype', 'transformers_version']

const GLOB_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/__pycache__/**',
]

const MIN_MODEL_SIZE_MB = 1

export async function detectModelFiles(basePath: string): Promise<ModelFileInfo[]> {
  const models: ModelFileInfo[] = []
  const seen = new Set<string>()

  const weightFiles = await findModelWeightFiles(basePath)
  for (const model of weightFiles) {
    if (!seen.has(model.path)) {
      seen.add(model.path)
      models.push(model)
    }
  }

  const hfModels = await findHuggingFaceConfigs(basePath, seen)
  models.push(...hfModels)

  return models
}

async function findModelWeightFiles(basePath: string): Promise<ModelFileInfo[]> {
  const models: ModelFileInfo[] = []

  try {
    const files = await fg(MODEL_GLOB_PATTERNS, {
      cwd: basePath,
      absolute: true,
      ignore: GLOB_IGNORE,
      deep: 5,
    })

    for (const filePath of files) {
      const model = await buildModelInfo(filePath)
      if (model) {
        models.push(model)
      }
    }
  } catch {
    // Glob failure is non-fatal
  }

  return models
}

async function buildModelInfo(filePath: string): Promise<ModelFileInfo | null> {
  const name = basename(filePath)
  let sizeMB: number | null = null

  try {
    const stats = await stat(filePath)
    sizeMB = stats.size / (1024 * 1024)
    if (shouldSkipSmallFile(name, sizeMB)) {
      return null
    }
  } catch {
    // stat failure is non-fatal
  }

  const format = resolveFormat(name)
  return { name, path: filePath, format, sizeMB }
}

function shouldSkipSmallFile(name: string, sizeMB: number): boolean {
  const smallFileExtensions = ['.bin', '.pt', '.pth']
  return smallFileExtensions.some(ext => name.endsWith(ext)) && sizeMB < MIN_MODEL_SIZE_MB
}

function resolveFormat(name: string): string {
  if (name === 'Modelfile') return 'Ollama'
  if (name === 'model.json') return 'TensorFlow.js'

  const dotIndex = name.lastIndexOf('.')
  if (dotIndex === -1) return 'Unknown'

  const ext = name.slice(dotIndex)
  return EXTENSION_TO_FORMAT[ext] ?? 'Unknown'
}

async function findHuggingFaceConfigs(
  basePath: string,
  seen: Set<string>
): Promise<ModelFileInfo[]> {
  const models: ModelFileInfo[] = []

  try {
    const configFiles = await fg('**/config.json', {
      cwd: basePath,
      absolute: true,
      ignore: [...GLOB_IGNORE, '**/package.json'],
      deep: 5,
    })

    for (const configPath of configFiles) {
      if (seen.has(configPath)) continue
      const model = await tryParseHuggingFaceConfig(configPath)
      if (model) {
        seen.add(configPath)
        models.push(model)
      }
    }
  } catch {
    // Glob failure is non-fatal
  }

  return models
}

async function tryParseHuggingFaceConfig(configPath: string): Promise<ModelFileInfo | null> {
  try {
    const content = await readFile(configPath, 'utf-8')
    const json = JSON.parse(content) as Record<string, unknown>
    const hasModelKeys = HUGGINGFACE_KEYS.some(key => key in json)
    if (!hasModelKeys) return null

    return {
      name: basename(configPath),
      path: configPath,
      format: 'HuggingFace',
      sizeMB: null,
    }
  } catch {
    return null
  }
}
