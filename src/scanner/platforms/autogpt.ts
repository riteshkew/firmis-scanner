import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'

interface AutoGPTPluginManifest {
  name?: string
  version?: string
  author?: string
  description?: string
  commands?: Array<{
    name: string
    description: string
  }>
}

// PackageJson interface not needed for AutoGPT - uses Python-based requirements.txt

export class AutoGPTAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'autogpt' as const
  readonly name = 'AutoGPT Plugins'

  private readonly basePaths = ['~/.autogpt/plugins/', '~/AutoGPT/plugins/']
  private readonly filePatterns = ['**/*.py', '**/plugin.json', '**/manifest.json']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []

    for (const path of this.basePaths) {
      const expandedPath = this.expandHome(path)
      if (await this.fileExists(expandedPath)) {
        try {
          const entries = await readdir(expandedPath, { withFileTypes: true })
          const pluginDirs = entries.filter(
            (e) => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('__')
          )

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
        if (
          !entry.isDirectory() ||
          entry.name.startsWith('.') ||
          entry.name.startsWith('__')
        ) {
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
      throw new Error(`Failed to discover AutoGPT plugins: ${error}`)
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
      throw new Error(`Failed to analyze AutoGPT plugin ${component.name}: ${error}`)
    }

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const metadata: ComponentMetadata = {}

    if (component.configPath) {
      const manifest = await this.readJSON<AutoGPTPluginManifest>(component.configPath)
      if (manifest) {
        metadata.version = manifest.version
        metadata.author = manifest.author
        metadata.description = manifest.description

        if (manifest.commands) {
          metadata.permissions = manifest.commands.map((cmd) => cmd.name)
        }
      }
    }

    const initPath = join(component.path, '__init__.py')
    if (await this.fileExists(initPath)) {
      metadata.entryPoints = ['__init__.py']

      if (!metadata.description) {
        try {
          const content = await readFile(initPath, 'utf-8')
          const docstringMatch = content.match(/"""([\s\S]*?)"""/)
          if (docstringMatch?.[1]) {
            const firstLine = docstringMatch[1].split('\n')[0]?.trim() ?? ''
            metadata.description = firstLine.substring(0, 200)
          }
        } catch {
          // Ignore
        }
      }
    }

    const requirementsPath = join(component.path, 'requirements.txt')
    if (await this.fileExists(requirementsPath)) {
      try {
        const content = await readFile(requirementsPath, 'utf-8')
        metadata.dependencies = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#'))
          .map((line) => line.split('==')[0]?.split('>=')[0]?.split('<=')[0]?.trim() ?? line)
      } catch {
        // Ignore
      }
    }

    return metadata
  }

  private async findManifest(pluginPath: string): Promise<string | undefined> {
    const possibleFiles = ['plugin.json', 'manifest.json']

    for (const file of possibleFiles) {
      const path = join(pluginPath, file)
      if (await this.fileExists(path)) {
        return path
      }
    }

    return undefined
  }
}
