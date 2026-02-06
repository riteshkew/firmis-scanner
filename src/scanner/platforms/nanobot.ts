import { readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'

interface NanobotConfig {
  name?: string
  version?: string
  description?: string
  agents?: Record<string, NanobotAgent>
  mcpServers?: Record<string, unknown>
}

interface NanobotAgent {
  name?: string
  description?: string
  prompt?: string
  tools?: string[]
  mcpServers?: string[]
}

interface AgentFrontmatter {
  name?: string
  description?: string
  tools?: string[]
  mcpServers?: string[]
}

export class NanobotAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'nanobot' as const
  readonly name = 'Nanobot Agents'

  private readonly configFiles = ['nanobot.yaml', 'nanobot.yml']
  private readonly filePatterns = ['**/*.yaml', '**/*.yml', '**/*.md', '**/*.js', '**/*.ts', '**/*.go']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []
    const cwd = process.cwd()

    // Check for nanobot.yaml in current directory and subdirectories
    const configFiles = await fg(this.configFiles, {
      cwd,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/vendor/**'],
    })

    for (const configFile of configFiles) {
      const basePath = dirname(configFile)
      const config = await this.readYAML<NanobotConfig>(configFile)

      let agentCount = 0
      if (config?.agents) {
        agentCount = Object.keys(config.agents).length
      }

      // Also check for agents/ directory
      const agentsDir = join(basePath, 'agents')
      if (await this.fileExists(agentsDir)) {
        try {
          const entries = await readdir(agentsDir, { withFileTypes: true })
          const agentFiles = entries.filter(
            (e) => e.isFile() && /\.(md|yaml|yml)$/i.test(e.name)
          )
          agentCount = Math.max(agentCount, agentFiles.length)
        } catch {
          // Ignore
        }
      }

      if (agentCount > 0 || config) {
        detected.push({
          type: this.platformType,
          name: this.name,
          basePath,
          componentCount: Math.max(agentCount, 1),
        })
      }
    }

    // Also check for standalone agents/ directory without nanobot.yaml
    const standaloneAgentsDir = join(cwd, 'agents')
    if (await this.fileExists(standaloneAgentsDir)) {
      const hasNanobotAgent = await this.hasNanobotAgents(standaloneAgentsDir)
      if (hasNanobotAgent) {
        const entries = await readdir(standaloneAgentsDir, { withFileTypes: true })
        const agentFiles = entries.filter(
          (e) => e.isFile() && /\.(md|yaml|yml)$/i.test(e.name)
        )

        if (agentFiles.length > 0 && !detected.some((d) => d.basePath === cwd)) {
          detected.push({
            type: this.platformType,
            name: this.name,
            basePath: cwd,
            componentCount: agentFiles.length,
          })
        }
      }
    }

    return detected
  }

  async discover(basePath: string): Promise<DiscoveredComponent[]> {
    const components: DiscoveredComponent[] = []

    // Check for nanobot.yaml config
    for (const configName of this.configFiles) {
      const configPath = join(basePath, configName)
      if (await this.fileExists(configPath)) {
        const config = await this.readYAML<NanobotConfig>(configPath)

        if (config?.agents) {
          for (const [agentName, agent] of Object.entries(config.agents)) {
            components.push({
              id: await this.generateId(agentName, basePath),
              name: agent.name || agentName,
              path: basePath,
              type: 'agent',
              configPath,
            })
          }
        }

        // If no agents defined but config exists, treat the whole thing as one agent
        if (!config?.agents || Object.keys(config.agents).length === 0) {
          components.push({
            id: await this.generateId(config?.name || 'nanobot', basePath),
            name: config?.name || 'nanobot',
            path: basePath,
            type: 'agent',
            configPath,
          })
        }

        break
      }
    }

    // Check for agents/ directory
    const agentsDir = join(basePath, 'agents')
    if (await this.fileExists(agentsDir)) {
      try {
        const entries = await readdir(agentsDir, { withFileTypes: true })

        for (const entry of entries) {
          if (!entry.isFile() || !/\.(md|yaml|yml)$/i.test(entry.name)) {
            continue
          }

          const agentPath = join(agentsDir, entry.name)
          const agentName = entry.name.replace(/\.(md|yaml|yml)$/i, '')

          // Avoid duplicates
          if (!components.some((c) => c.name === agentName)) {
            components.push({
              id: await this.generateId(agentName, agentsDir),
              name: agentName,
              path: agentsDir,
              type: 'agent',
              configPath: agentPath,
            })
          }
        }
      } catch (error) {
        throw new Error(`Failed to discover Nanobot agents: ${error}`)
      }
    }

    return components
  }

  async analyze(component: DiscoveredComponent): Promise<string[]> {
    const files: string[] = []

    // For agents defined in nanobot.yaml, scan the whole project
    const basePath = component.path.endsWith('agents')
      ? dirname(component.path)
      : component.path

    try {
      const matchedFiles = await fg(this.filePatterns, {
        cwd: basePath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/vendor/**', '**/.venv/**'],
      })

      files.push(...matchedFiles)
    } catch (error) {
      throw new Error(`Failed to analyze Nanobot agent ${component.name}: ${error}`)
    }

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const metadata: ComponentMetadata = {}

    if (component.configPath) {
      // Check if it's a YAML file or MD file
      if (/\.ya?ml$/i.test(component.configPath)) {
        const config = await this.readYAML<NanobotConfig>(component.configPath)
        if (config) {
          metadata.version = config.version
          metadata.description = config.description

          // Get agent-specific info if available
          const agent = config.agents?.[component.name]
          if (agent) {
            metadata.description = metadata.description || agent.description
            metadata.entryPoints = agent.tools
          }

          // Get MCP servers as dependencies
          if (config.mcpServers) {
            metadata.dependencies = Object.keys(config.mcpServers)
          }
        }
      } else if (/\.md$/i.test(component.configPath)) {
        // Parse MD frontmatter
        const agentMeta = await this.parseAgentMd(component.configPath)
        if (agentMeta) {
          metadata.description = agentMeta.description
          metadata.entryPoints = agentMeta.tools
          metadata.dependencies = agentMeta.mcpServers
        }
      }
    }

    // Check for mcp-servers.yaml
    const basePath = component.path.endsWith('agents')
      ? dirname(component.path)
      : component.path
    const mcpServersPath = join(basePath, 'mcp-servers.yaml')
    if (await this.fileExists(mcpServersPath)) {
      const mcpConfig = await this.readYAML<Record<string, unknown>>(mcpServersPath)
      if (mcpConfig) {
        metadata.dependencies = metadata.dependencies || Object.keys(mcpConfig)
      }
    }

    return metadata
  }

  private async hasNanobotAgents(agentsDir: string): Promise<boolean> {
    try {
      const entries = await readdir(agentsDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && /\.(md|yaml|yml)$/i.test(entry.name)) {
          const filePath = join(agentsDir, entry.name)
          const content = await this.readAgentFile(filePath)
          // Check for Nanobot-style agent definition
          if (content && (content.includes('mcpServers') || content.includes('MCP') || content.includes('nanobot'))) {
            return true
          }
        }
      }
    } catch {
      return false
    }
    return false
  }

  private async readAgentFile(filePath: string): Promise<string | null> {
    try {
      const { readFile } = await import('node:fs/promises')
      return await readFile(filePath, 'utf-8')
    } catch {
      return null
    }
  }

  private async parseAgentMd(filePath: string): Promise<AgentFrontmatter | null> {
    try {
      const { readFile } = await import('node:fs/promises')
      const content = await readFile(filePath, 'utf-8')

      // Parse YAML frontmatter between --- markers
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      const frontmatterContent = frontmatterMatch?.[1]
      if (!frontmatterContent) {
        return null
      }

      const yaml = await import('js-yaml')
      return yaml.load(frontmatterContent) as AgentFrontmatter
    } catch {
      return null
    }
  }
}
