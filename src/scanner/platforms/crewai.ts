import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
  CrewConfig,
  CrewAgent,
} from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'

interface PackageJson {
  name?: string
  version?: string
  author?: string
  description?: string
  dependencies?: Record<string, string>
}

export class CrewAIAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'crewai' as const
  readonly name = 'CrewAI Agents'

  private readonly filePatterns = ['**/*.{py,yaml,yml}', '**/crew.yaml', '**/agents.yaml']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []
    const cwd = process.cwd()

    const crewFiles = await fg(['**/crew.yaml', '**/crew.yml'], {
      cwd,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/venv/**', '**/.venv/**'],
    })

    if (crewFiles.length > 0) {
      const uniquePaths = new Set(
        crewFiles.map((file) => {
          const parts = file.split('/')
          parts.pop()
          return parts.join('/')
        })
      )

      for (const path of uniquePaths) {
        detected.push({
          type: this.platformType,
          name: this.name,
          basePath: path,
          componentCount: 1,
        })
      }
    }

    return detected
  }

  async discover(basePath: string): Promise<DiscoveredComponent[]> {
    const components: DiscoveredComponent[] = []

    const crewConfigPath = await this.findCrewConfig(basePath)
    if (!crewConfigPath) {
      return components
    }

    const agentsConfigPath = await this.findAgentsConfig(basePath)
    const crewName = basePath.split('/').pop() || 'crew'

    components.push({
      id: await this.generateId(crewName, basePath),
      name: crewName,
      path: basePath,
      type: 'agent',
      configPath: crewConfigPath,
    })

    return components
  }

  async analyze(component: DiscoveredComponent): Promise<string[]> {
    const files: string[] = []

    try {
      const matchedFiles = await fg(this.filePatterns, {
        cwd: component.path,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/venv/**', '**/__pycache__/**'],
      })

      files.push(...matchedFiles)
    } catch (error) {
      throw new Error(`Failed to analyze CrewAI agent ${component.name}: ${error}`)
    }

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const metadata: ComponentMetadata = {}

    if (component.configPath) {
      const crewConfig = await this.readYAML<CrewConfig>(component.configPath)
      if (crewConfig) {
        if (crewConfig.agents) {
          const agentNames = crewConfig.agents
            .map((agent: CrewAgent) => agent.name || agent.role)
            .filter((name): name is string => !!name)
          metadata.entryPoints = agentNames
        }
      }
    }

    const agentsConfigPath = await this.findAgentsConfig(component.path)
    if (agentsConfigPath) {
      const agentsConfig = await this.readYAML<{ agents?: CrewAgent[] }>(agentsConfigPath)
      if (agentsConfig?.agents) {
        const agentRoles = agentsConfig.agents
          .map((agent) => agent.role)
          .filter((role): role is string => !!role)
        metadata.permissions = agentRoles
      }
    }

    const pyprojectPath = join(component.path, 'pyproject.toml')
    if (await this.fileExists(pyprojectPath)) {
      try {
        const content = await this.readPyProject(pyprojectPath)
        if (content) {
          metadata.version = content.version
          metadata.description = content.description
          metadata.dependencies = content.dependencies
        }
      } catch {
        // Ignore
      }
    }

    const requirementsPath = join(component.path, 'requirements.txt')
    if (!metadata.dependencies && (await this.fileExists(requirementsPath))) {
      const deps = await this.parseRequirements(requirementsPath)
      if (deps.length > 0) {
        metadata.dependencies = deps
      }
    }

    return metadata
  }

  private async findCrewConfig(basePath: string): Promise<string | undefined> {
    const possibleFiles = ['crew.yaml', 'crew.yml', 'config/crew.yaml', 'config/crew.yml']

    for (const file of possibleFiles) {
      const path = join(basePath, file)
      if (await this.fileExists(path)) {
        return path
      }
    }

    return undefined
  }

  private async findAgentsConfig(basePath: string): Promise<string | undefined> {
    const possibleFiles = ['agents.yaml', 'agents.yml', 'config/agents.yaml', 'config/agents.yml']

    for (const file of possibleFiles) {
      const path = join(basePath, file)
      if (await this.fileExists(path)) {
        return path
      }
    }

    return undefined
  }

  private async readPyProject(
    path: string
  ): Promise<{ version?: string; description?: string; dependencies?: string[] } | null> {
    try {
      const { readFile } = await import('node:fs/promises')
      const content = await readFile(path, 'utf-8')

      const versionMatch = content.match(/version\s*=\s*"([^"]+)"/)
      const descMatch = content.match(/description\s*=\s*"([^"]+)"/)

      const dependencies: string[] = []
      const depsMatch = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/)
      if (depsMatch) {
        const depsStr = depsMatch[1]
        const depMatches = depsStr.matchAll(/"([^"]+)"/g)
        for (const match of depMatches) {
          const dep = match[1].split('==')[0].split('>=')[0].split('<=')[0].trim()
          dependencies.push(dep)
        }
      }

      return {
        version: versionMatch?.[1],
        description: descMatch?.[1],
        dependencies: dependencies.length > 0 ? dependencies : undefined,
      }
    } catch {
      return null
    }
  }

  private async parseRequirements(path: string): Promise<string[]> {
    try {
      const { readFile } = await import('node:fs/promises')
      const content = await readFile(path, 'utf-8')
      return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => line.split('==')[0].split('>=')[0].split('<=')[0].trim())
    } catch {
      return []
    }
  }
}
