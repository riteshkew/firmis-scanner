import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'

interface SkillMetadata {
  name?: string
  version?: string
  author?: string
  description?: string
  tools?: string[]
  permissions?: string[]
}

export class ClaudeSkillsAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'claude' as const
  readonly name = 'Claude Skills'

  private readonly basePaths = ['~/.claude/skills/']
  private readonly filePatterns = ['**/*.md', '**/skill.json', '**/package.json']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []

    for (const path of this.basePaths) {
      const expandedPath = this.expandHome(path)
      if (await this.fileExists(expandedPath)) {
        try {
          const entries = await readdir(expandedPath, { withFileTypes: true })
          const skillDirs = entries.filter((e) => e.isDirectory())

          detected.push({
            type: this.platformType,
            name: this.name,
            basePath: expandedPath,
            componentCount: skillDirs.length,
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

        const skillPath = join(expandedPath, entry.name)
        const skillJsonPath = join(skillPath, 'skill.json')

        components.push({
          id: await this.generateId(entry.name, skillPath),
          name: entry.name,
          path: skillPath,
          type: 'skill',
          configPath: (await this.fileExists(skillJsonPath)) ? skillJsonPath : undefined,
        })
      }
    } catch (error) {
      throw new Error(`Failed to discover Claude skills: ${error}`)
    }

    return components
  }

  async analyze(component: DiscoveredComponent): Promise<string[]> {
    const files: string[] = []

    try {
      const matchedFiles = await fg(this.filePatterns, {
        cwd: component.path,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**'],
      })

      files.push(...matchedFiles)
    } catch (error) {
      throw new Error(`Failed to analyze Claude skill ${component.name}: ${error}`)
    }

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const metadata: ComponentMetadata = {}

    if (component.configPath) {
      const skillMeta = await this.readJSON<SkillMetadata>(component.configPath)
      if (skillMeta) {
        metadata.version = skillMeta.version
        metadata.author = skillMeta.author
        metadata.description = skillMeta.description
        metadata.permissions = skillMeta.permissions
        metadata.entryPoints = skillMeta.tools
      }
    }

    const packageJsonPath = join(component.path, 'package.json')
    if (await this.fileExists(packageJsonPath)) {
      const pkg = await this.readJSON<Record<string, unknown>>(packageJsonPath)
      if (pkg) {
        metadata.version = metadata.version || (pkg['version'] as string)
        metadata.author = metadata.author || (pkg['author'] as string)
        metadata.description = metadata.description || (pkg['description'] as string)
        if (pkg['dependencies']) {
          metadata.dependencies = Object.keys(pkg['dependencies'] as Record<string, string>)
        }
      }
    }

    const readmePath = join(component.path, 'README.md')
    if (!metadata.description && (await this.fileExists(readmePath))) {
      try {
        const content = await readFile(readmePath, 'utf-8')
        const firstLine = content.split('\n').find((line) => line.trim() && !line.startsWith('#'))
        if (firstLine) {
          metadata.description = firstLine.trim().substring(0, 200)
        }
      } catch {
        // Ignore
      }
    }

    return metadata
  }
}
