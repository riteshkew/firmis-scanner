import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'

interface CodexPluginManifest {
  name?: string
  version?: string
  author?: string
  description?: string
  permissions?: string[]
  main?: string
}

export class CodexAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'codex' as const
  readonly name = 'OpenAI Codex Plugins'

  private readonly basePaths = ['~/.codex/plugins/']
  private readonly filePatterns = ['**/*.{js,ts,py}', '**/manifest.json', '**/plugin.json']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []

    for (const path of this.basePaths) {
      const expandedPath = this.expandHome(path)
      if (await this.fileExists(expandedPath)) {
        try {
          const entries = await readdir(expandedPath, { withFileTypes: true })
          const pluginDirs = entries.filter((e) => e.isDirectory())

          detected.push({
            type: this.platformType,
            name: this.name,
            basePath: expandedPath,
            componentCount: pluginDirs.length,
          })
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

    try {
      const entries = await readdir(expandedPath, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) {
          continue
        }

        const pluginPath = join(expandedPath, entry.name)
        const manifestPath = await this.findManifest(pluginPath)

        components.push({
          id: await this.generateId(entry.name, pluginPath),
          name: entry.name,
          path: pluginPath,
          type: 'plugin',
          configPath: manifestPath,
        })
      }
    } catch (error) {
      throw new Error(`Failed to discover Codex plugins: ${error}`)
    }

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
      throw new Error(`Failed to analyze Codex plugin ${component.name}: ${error}`)
    }

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const metadata: ComponentMetadata = {}

    if (component.configPath) {
      const manifest = await this.readJSON<CodexPluginManifest>(component.configPath)
      if (manifest) {
        metadata.version = manifest.version
        metadata.author = manifest.author
        metadata.description = manifest.description
        metadata.permissions = manifest.permissions
        metadata.entryPoints = manifest.main ? [manifest.main] : undefined
      }
    }

    const packageJsonPath = join(component.path, 'package.json')
    if (await this.fileExists(packageJsonPath)) {
      const pkg = await this.readJSON<Record<string, unknown>>(packageJsonPath)
      if (pkg) {
        metadata.version = metadata.version || (pkg.version as string)
        metadata.author = metadata.author || (pkg.author as string)
        metadata.description = metadata.description || (pkg.description as string)
        if (pkg.dependencies) {
          metadata.dependencies = Object.keys(pkg.dependencies as Record<string, string>)
        }
      }
    }

    const requirementsPath = join(component.path, 'requirements.txt')
    if (!metadata.dependencies && (await this.fileExists(requirementsPath))) {
      try {
        const content = await readFile(requirementsPath, 'utf-8')
        metadata.dependencies = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#'))
          .map((line) => line.split('==')[0].split('>=')[0].split('<=')[0].trim())
      } catch {
        // Ignore
      }
    }

    return metadata
  }

  private async findManifest(pluginPath: string): Promise<string | undefined> {
    const possibleFiles = ['manifest.json', 'plugin.json', 'package.json']

    for (const file of possibleFiles) {
      const path = join(pluginPath, file)
      if (await this.fileExists(path)) {
        return path
      }
    }

    return undefined
  }
}
