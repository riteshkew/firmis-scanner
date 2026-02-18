import type {
  PlatformType,
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../types/index.js'

/** Directories that should never be treated as agent components. */
const DEFAULT_EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  '.git',
  'vendor',
  'venv',
  '.venv',
  '__pycache__',
  'coverage',
  '.nyc_output',
])

export abstract class BasePlatformAnalyzer {
  abstract readonly platformType: PlatformType
  abstract readonly name: string

  abstract detect(): Promise<DetectedPlatform[]>

  abstract discover(basePath: string): Promise<DiscoveredComponent[]>

  abstract analyze(component: DiscoveredComponent): Promise<string[]>

  abstract getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata>

  /** Returns true if a directory name should be skipped during discovery. */
  protected shouldExcludeDir(name: string): boolean {
    return name.startsWith('.') || DEFAULT_EXCLUDE_DIRS.has(name)
  }

  /**
   * Returns true if a directory name is a valid component name.
   * Rejects path traversal sequences, null bytes, overly long names,
   * and HTML/template injection markers.
   */
  protected isValidComponentName(name: string): boolean {
    if (name.includes('..') || name.includes('\0')) return false
    if (name.length > 255) return false
    if (/[<>{}|]/.test(name)) return false
    return true
  }

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
      // Use JSON_SCHEMA to prevent code execution via YAML parsing
      return yaml.load(content, { schema: yaml.JSON_SCHEMA }) as T
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
