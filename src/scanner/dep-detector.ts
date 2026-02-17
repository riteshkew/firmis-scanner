import { readFile } from 'node:fs/promises'
import fg from 'fast-glob'

export interface DependencyInfo {
  name: string
  version: string | null
  source: 'npm' | 'pip'
  category: 'llm-sdk' | 'agent-framework' | 'ml-library' | 'vector-db'
}

const AI_NPM_PACKAGES: Record<string, DependencyInfo['category']> = {
  '@anthropic-ai/sdk': 'llm-sdk',
  '@anthropic-ai/bedrock-sdk': 'llm-sdk',
  'openai': 'llm-sdk',
  '@google/generative-ai': 'llm-sdk',
  'langchain': 'agent-framework',
  '@langchain/core': 'agent-framework',
  '@langchain/openai': 'agent-framework',
  '@langchain/anthropic': 'agent-framework',
  'llamaindex': 'agent-framework',
  'ai': 'llm-sdk',
  '@ai-sdk/openai': 'llm-sdk',
  '@ai-sdk/anthropic': 'llm-sdk',
  '@modelcontextprotocol/sdk': 'agent-framework',
  'crewai': 'agent-framework',
  'autogen': 'agent-framework',
  '@pinecone-database/pinecone': 'vector-db',
  'chromadb': 'vector-db',
  'weaviate-ts-client': 'vector-db',
  '@qdrant/js-client-rest': 'vector-db',
  'cohere-ai': 'llm-sdk',
  'replicate': 'llm-sdk',
  'ollama': 'llm-sdk',
  'transformers': 'ml-library',
  'onnxruntime-node': 'ml-library',
}

const AI_PIP_PACKAGES: Record<string, DependencyInfo['category']> = {
  'anthropic': 'llm-sdk',
  'openai': 'llm-sdk',
  'google-generativeai': 'llm-sdk',
  'langchain': 'agent-framework',
  'langchain-core': 'agent-framework',
  'langchain-openai': 'agent-framework',
  'langchain-anthropic': 'agent-framework',
  'llama-index': 'agent-framework',
  'crewai': 'agent-framework',
  'autogen': 'agent-framework',
  'transformers': 'ml-library',
  'torch': 'ml-library',
  'tensorflow': 'ml-library',
  'sentence-transformers': 'ml-library',
  'pinecone-client': 'vector-db',
  'chromadb': 'vector-db',
  'weaviate-client': 'vector-db',
  'qdrant-client': 'vector-db',
  'cohere': 'llm-sdk',
  'replicate': 'llm-sdk',
  'ollama': 'llm-sdk',
  'huggingface-hub': 'ml-library',
}

export async function detectAIDependencies(basePath: string): Promise<DependencyInfo[]> {
  const deps: DependencyInfo[] = []
  const seen = new Set<string>()

  const npmDeps = await detectNpmDependencies(basePath)
  for (const dep of npmDeps) {
    const key = `npm:${dep.name}`
    if (!seen.has(key)) {
      deps.push(dep)
      seen.add(key)
    }
  }

  const pipDeps = await detectPipDependencies(basePath)
  for (const dep of pipDeps) {
    const key = `pip:${dep.name}`
    if (!seen.has(key)) {
      deps.push(dep)
      seen.add(key)
    }
  }

  return deps
}

async function detectNpmDependencies(basePath: string): Promise<DependencyInfo[]> {
  const deps: DependencyInfo[] = []

  try {
    const packageJsonFiles = await fg('**/package.json', {
      cwd: basePath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      deep: 3,
    })

    for (const pkgPath of packageJsonFiles) {
      try {
        const content = await readFile(pkgPath, 'utf-8')
        const pkg = JSON.parse(content) as {
          dependencies?: Record<string, string>
          devDependencies?: Record<string, string>
        }

        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
        for (const [name, version] of Object.entries(allDeps)) {
          const category = AI_NPM_PACKAGES[name]
          if (category) {
            deps.push({ name, version: version ?? null, source: 'npm', category })
          }
        }
      } catch {
        continue
      }
    }
  } catch {
    // Glob failure is non-fatal
  }

  return deps
}

async function detectPipDependencies(basePath: string): Promise<DependencyInfo[]> {
  const deps: DependencyInfo[] = []

  const reqDeps = await detectRequirementsTxt(basePath)
  deps.push(...reqDeps)

  const pyprojectDeps = await detectPyprojectToml(basePath)
  deps.push(...pyprojectDeps)

  return deps
}

async function detectRequirementsTxt(basePath: string): Promise<DependencyInfo[]> {
  const deps: DependencyInfo[] = []

  try {
    const reqFiles = await fg('**/requirements*.txt', {
      cwd: basePath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/venv/**', '**/.venv/**'],
      deep: 3,
    })

    for (const reqPath of reqFiles) {
      try {
        const content = await readFile(reqPath, 'utf-8')
        const lines = content.split('\n')

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue

          const match = trimmed.match(/^([a-zA-Z0-9_-]+(?:\[[a-zA-Z0-9_,-]+\])?)(?:[><=!~]+(.+))?/)
          if (match) {
            const rawName = match[1] ?? ''
            const name = rawName.replace(/\[.*\]/, '')
            const category = AI_PIP_PACKAGES[name]
            if (category) {
              deps.push({ name, version: match[2] ?? null, source: 'pip', category })
            }
          }
        }
      } catch {
        continue
      }
    }
  } catch {
    // Glob failure is non-fatal
  }

  return deps
}

async function detectPyprojectToml(basePath: string): Promise<DependencyInfo[]> {
  const deps: DependencyInfo[] = []

  try {
    const pyprojectFiles = await fg('**/pyproject.toml', {
      cwd: basePath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/venv/**', '**/.venv/**'],
      deep: 3,
    })

    for (const pyPath of pyprojectFiles) {
      try {
        const content = await readFile(pyPath, 'utf-8')
        for (const [name, category] of Object.entries(AI_PIP_PACKAGES)) {
          if (content.includes(`"${name}`) || content.includes(`'${name}`)) {
            const escapedName = name.replace(/[-_]/g, '[-_]')
            const versionMatch = content.match(
              new RegExp(`["']${escapedName}(?:[><=!~]+([^"']+))?["']`)
            )
            deps.push({ name, version: versionMatch?.[1] ?? null, source: 'pip', category })
          }
        }
      } catch {
        continue
      }
    }
  } catch {
    // Glob failure is non-fatal
  }

  return deps
}
