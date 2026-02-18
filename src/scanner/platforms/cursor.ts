import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'

interface VSCodeExtensionManifest {
  name?: string
  version?: string
  publisher?: string
  description?: string
  main?: string
  activationEvents?: string[]
  contributes?: {
    commands?: Array<{ command: string; title: string }>
  }
}

interface PackageJson {
  name?: string
  version?: string
  author?: string
  description?: string
  dependencies?: Record<string, string>
}

export class CursorAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'cursor' as const
  readonly name = 'Cursor Extensions'

  private readonly basePaths = ['~/.cursor/extensions/', '~/.vscode/extensions/']
  private readonly filePatterns = ['**/*.{js,ts}', '**/package.json']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []

    for (const path of this.basePaths) {
      const expandedPath = this.expandHome(path)
      if (await this.fileExists(expandedPath)) {
        try {
          const entries = await readdir(expandedPath, { withFileTypes: true })
          const extensionDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'))

          detected.push({
            type: this.platformType,
            name: this.name,
            basePath: expandedPath,
            componentCount: extensionDirs.length,
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
        if (!entry.isDirectory() || this.shouldExcludeDir(entry.name)) {
          continue
        }
        if (!this.isValidComponentName(entry.name)) continue

        const extensionPath = join(expandedPath, entry.name)
        const packageJsonPath = join(extensionPath, 'package.json')

        if (await this.fileExists(packageJsonPath)) {
          components.push({
            id: await this.generateId(entry.name, extensionPath),
            name: entry.name,
            path: extensionPath,
            type: 'extension',
            configPath: packageJsonPath,
          })
        }
      }
    } catch (error) {
      throw new Error(`Failed to discover Cursor extensions: ${error}`)
    }

    return components
  }

  async analyze(component: DiscoveredComponent): Promise<string[]> {
    const files: string[] = []

    try {
      const matchedFiles = await fg(this.filePatterns, {
        cwd: component.path,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/out/**', '**/dist/**'],
      })

      files.push(...matchedFiles)
    } catch (error) {
      throw new Error(`Failed to analyze Cursor extension ${component.name}: ${error}`)
    }

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const metadata: ComponentMetadata = {}

    if (component.configPath) {
      const pkg = await this.readJSON<VSCodeExtensionManifest & PackageJson>(component.configPath)
      if (pkg) {
        metadata.version = pkg.version
        metadata.author = pkg.publisher || pkg.author
        metadata.description = pkg.description
        metadata.entryPoints = pkg.main ? [pkg.main] : undefined

        if (pkg.dependencies) {
          metadata.dependencies = Object.keys(pkg.dependencies)
        }

        if (pkg.activationEvents) {
          metadata.permissions = pkg.activationEvents
        }

        if (pkg.contributes?.commands) {
          const commands = pkg.contributes.commands.map((cmd) => cmd.command)
          metadata.permissions = [...(metadata.permissions || []), ...commands]
        }
      }
    }

    return metadata
  }
}
