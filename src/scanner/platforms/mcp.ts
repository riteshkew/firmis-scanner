import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
  MCPServerConfig,
} from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'

interface MCPConfig {
  mcpServers?: Record<string, MCPServerConfig>
}

interface PackageJson {
  name?: string
  version?: string
  author?: string
  description?: string
  dependencies?: Record<string, string>
  main?: string
}

export class MCPAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'mcp' as const
  readonly name = 'MCP Servers'

  private readonly configPaths = [
    '~/.config/mcp/mcp.json',
    '~/Library/Application Support/Claude/claude_desktop_config.json',
  ]

  private readonly basePaths = ['~/.config/mcp/', '~/.mcp/servers/']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []

    for (const configPath of this.configPaths) {
      const expandedPath = this.expandHome(configPath)
      if (await this.fileExists(expandedPath)) {
        const config = await this.readJSON<MCPConfig>(expandedPath)
        if (config?.mcpServers) {
          detected.push({
            type: this.platformType,
            name: this.name,
            basePath: expandedPath,
            componentCount: Object.keys(config.mcpServers).length,
          })
        }
      }
    }

    for (const basePath of this.basePaths) {
      const expandedPath = this.expandHome(basePath)
      if (await this.fileExists(expandedPath)) {
        try {
          const entries = await readdir(expandedPath, { withFileTypes: true })
          const serverDirs = entries.filter((e) => e.isDirectory())

          if (serverDirs.length > 0) {
            detected.push({
              type: this.platformType,
              name: this.name,
              basePath: expandedPath,
              componentCount: serverDirs.length,
            })
          }
        } catch {
          continue
        }
      }
    }

    return detected
  }

  async discover(basePath: string): Promise<DiscoveredComponent[]> {
    const components: DiscoveredComponent[] = []
    const expandedPath = this.expandHome(basePath)

    if (expandedPath.endsWith('.json')) {
      return this.discoverFromConfig(expandedPath)
    }

    try {
      const entries = await readdir(expandedPath, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) {
          continue
        }

        const serverPath = join(expandedPath, entry.name)
        const packageJsonPath = join(serverPath, 'package.json')

        components.push({
          id: await this.generateId(entry.name, serverPath),
          name: entry.name,
          path: serverPath,
          type: 'server',
          configPath: (await this.fileExists(packageJsonPath)) ? packageJsonPath : undefined,
        })
      }
    } catch (error) {
      throw new Error(`Failed to discover MCP servers: ${error}`)
    }

    return components
  }

  private async discoverFromConfig(configPath: string): Promise<DiscoveredComponent[]> {
    const components: DiscoveredComponent[] = []
    const config = await this.readJSON<MCPConfig>(configPath)

    if (!config?.mcpServers) {
      return components
    }

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      const serverPath = this.resolveServerPath(serverConfig.command)

      components.push({
        id: await this.generateId(name, serverPath),
        name,
        path: serverPath,
        type: 'server',
        configPath,
      })
    }

    return components
  }

  async analyze(component: DiscoveredComponent): Promise<string[]> {
    const files: string[] = []

    try {
      const patterns = [
        '**/*.{js,ts,py,go,rs}',
        '**/package.json',
        '**/pyproject.toml',
        '**/Cargo.toml',
        '**/go.mod',
      ]

      const matchedFiles = await fg(patterns, {
        cwd: component.path,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      })

      files.push(...matchedFiles)
    } catch (error) {
      throw new Error(`Failed to analyze MCP server ${component.name}: ${error}`)
    }

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const metadata: ComponentMetadata = {}

    const packageJsonPath = join(component.path, 'package.json')
    if (await this.fileExists(packageJsonPath)) {
      const pkg = await this.readJSON<PackageJson>(packageJsonPath)
      if (pkg) {
        metadata.version = pkg.version
        metadata.author = pkg.author
        metadata.description = pkg.description
        metadata.entryPoints = pkg.main ? [pkg.main] : undefined
        if (pkg.dependencies) {
          metadata.dependencies = Object.keys(pkg.dependencies)
        }
      }
    }

    if (component.configPath) {
      const config = await this.readJSON<MCPConfig>(component.configPath)
      const serverConfig = config?.mcpServers?.[component.name]
      if (serverConfig) {
        metadata.entryPoints = [serverConfig.command]
        if (serverConfig.env) {
          metadata.permissions = Object.keys(serverConfig.env).map((key) => `env:${key}`)
        }
      }
    }

    return metadata
  }

  private resolveServerPath(command: string): string {
    if (command.startsWith('node ')) {
      return command.substring(5).split(' ')[0] ?? command
    }
    if (command.startsWith('python ') || command.startsWith('python3 ')) {
      return command.split(' ')[1] ?? command
    }
    return command.split(' ')[0] ?? command
  }
}
