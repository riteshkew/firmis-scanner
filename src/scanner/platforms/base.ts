import type {
  PlatformType,
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../types/index.js'

export abstract class BasePlatformAnalyzer {
  abstract readonly platformType: PlatformType
  abstract readonly name: string

  abstract detect(): Promise<DetectedPlatform[]>

  abstract discover(basePath: string): Promise<DiscoveredComponent[]>

  abstract analyze(component: DiscoveredComponent): Promise<string[]>

  abstract getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata>

  protected expandHome(path: string): string {
    if (path.startsWith('~/')) {
      return path.replace('~', process.env['HOME'] ?? '')
    }
    return path
  }

  protected async fileExists(path: string): Promise<boolean> {
    try {
      const { access } = await import('node:fs/promises')
      await access(path)
      return true
    } catch {
      return false
    }
  }

  protected async readJSON<T>(path: string): Promise<T | null> {
    try {
      const { readFile } = await import('node:fs/promises')
      const content = await readFile(path, 'utf-8')
      return JSON.parse(content) as T
    } catch {
      return null
    }
  }

  protected async readYAML<T>(path: string): Promise<T | null> {
    try {
      const { readFile } = await import('node:fs/promises')
      const yaml = await import('js-yaml')
      const content = await readFile(path, 'utf-8')
      return yaml.load(content) as T
    } catch {
      return null
    }
  }

  protected async generateId(name: string, basePath: string): Promise<string> {
    const { createHash } = await import('node:crypto')
    const hash = createHash('md5').update(`${name}:${basePath}`).digest('hex')
    return hash.substring(0, 12)
  }
}
