import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'

interface OpenClawConfig {
  skills?: {
    load?: {
      extraDirs?: string[]
    }
  }
}

interface SkillFrontmatter {
  name?: string
  version?: string
  author?: string
  description?: string
  tools?: string[]
  permissions?: string[]
}

export class OpenClawAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'openclaw' as const
  readonly name = 'OpenClaw Skills'

  private readonly basePaths = ['~/.openclaw/skills/']
  private readonly filePatterns = ['**/*.md', '**/*.js', '**/*.ts', '**/*.py', '**/SKILL.md']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []

    for (const path of this.basePaths) {
      const expandedPath = this.expandHome(path)
      if (await this.fileExists(expandedPath)) {
        try {
          const entries = await readdir(expandedPath, { withFileTypes: true })
          const skillDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'))

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

    // Also check for workspace skills in current directory
    const cwdSkillsPath = join(process.cwd(), 'skills')
    if (await this.fileExists(cwdSkillsPath)) {
      try {
        const entries = await readdir(cwdSkillsPath, { withFileTypes: true })
        const skillDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'))

        if (skillDirs.length > 0) {
          detected.push({
            type: this.platformType,
            name: 'OpenClaw Workspace Skills',
            basePath: cwdSkillsPath,
            componentCount: skillDirs.length,
          })
        }
      } catch {
        // Ignore
      }
    }

    // Check for extra skill dirs from config
    const configPath = this.expandHome('~/.openclaw/openclaw.json')
    if (await this.fileExists(configPath)) {
      const config = await this.readJSON<OpenClawConfig>(configPath)
      if (config?.skills?.load?.extraDirs) {
        for (const extraDir of config.skills.load.extraDirs) {
          const expandedExtra = this.expandHome(extraDir)
          if (await this.fileExists(expandedExtra)) {
            try {
              const entries = await readdir(expandedExtra, { withFileTypes: true })
              const skillDirs = entries.filter((e) => e.isDirectory())

              if (skillDirs.length > 0) {
                detected.push({
                  type: this.platformType,
                  name: 'OpenClaw Extra Skills',
                  basePath: expandedExtra,
                  componentCount: skillDirs.length,
                })
              }
            } catch {
              continue
            }
          }
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
        const skillMdPath = join(skillPath, 'SKILL.md')

        components.push({
          id: await this.generateId(entry.name, skillPath),
          name: entry.name,
          path: skillPath,
          type: 'skill',
          configPath: (await this.fileExists(skillMdPath)) ? skillMdPath : undefined,
        })
      }
    } catch (error) {
      throw new Error(`Failed to discover OpenClaw skills: ${error}`)
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
      throw new Error(`Failed to analyze OpenClaw skill ${component.name}: ${error}`)
    }

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const metadata: ComponentMetadata = {}

    // Parse SKILL.md frontmatter
    if (component.configPath) {
      const skillMeta = await this.parseSkillMd(component.configPath)
      if (skillMeta) {
        metadata.version = skillMeta.version
        metadata.author = skillMeta.author
        metadata.description = skillMeta.description
        metadata.permissions = skillMeta.permissions
        metadata.entryPoints = skillMeta.tools
      }
    }

    // Check for package.json
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

    return metadata
  }

  private async parseSkillMd(filePath: string): Promise<SkillFrontmatter | null> {
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
      return yaml.load(frontmatterContent, { schema: yaml.JSON_SCHEMA }) as SkillFrontmatter
    } catch {
      return null
    }
  }
}
