import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PlatformType, DetectedPlatform, FirmisConfig } from '../types/index.js'
import { PlatformRegistry } from './platforms/index.js'

/**
 * Quick filesystem probe to detect which platforms are plausibly present.
 * Avoids running all 8 analyzers on large directories.
 */
async function detectPlausiblePlatforms(targetPath: string): Promise<PlatformType[]> {
  const detected: PlatformType[] = []
  const probe = (rel: string) => existsSync(join(targetPath, rel))

  if (probe('.claude') || probe('skills')) detected.push('claude')
  if (probe('mcp.json') || probe('claude_desktop_config.json')) detected.push('mcp')
  if (probe('.cursor')) detected.push('cursor')
  if (probe('crew.yaml') || probe('crew.yml')) detected.push('crewai')
  if (probe('nanobot.yaml')) detected.push('nanobot')
  if (probe('.openclaw')) detected.push('openclaw')

  // Check package.json deps for platform hints
  const pkgPath = join(targetPath, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const raw = await readFile(pkgPath, 'utf-8')
      const pkg = JSON.parse(raw) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      if ('@modelcontextprotocol/sdk' in deps) detected.push('mcp')
      if ('crewai' in deps) detected.push('crewai')
    } catch {
      // ignore parse errors
    }
  }

  return [...new Set(detected)]
}

export interface DiscoveryResult {
  platforms: DetectedPlatform[]
  totalComponents: number
}

export class PlatformDiscovery {
  async discoverAll(): Promise<DiscoveryResult> {
    const detectedMap = await PlatformRegistry.detectAll()
    const platforms: DetectedPlatform[] = []
    let totalComponents = 0

    for (const [, analyzer] of detectedMap) {
      const detectedPlatforms = await analyzer.detect()
      platforms.push(...detectedPlatforms)

      for (const platform of detectedPlatforms) {
        totalComponents += platform.componentCount || 0
      }
    }

    return {
      platforms,
      totalComponents,
    }
  }

  async discoverSpecific(platformTypes: PlatformType[]): Promise<DiscoveryResult> {
    const platforms: DetectedPlatform[] = []
    let totalComponents = 0

    for (const platformType of platformTypes) {
      try {
        const analyzer = PlatformRegistry.getAnalyzer(platformType)
        const detectedPlatforms = await analyzer.detect()
        platforms.push(...detectedPlatforms)

        for (const platform of detectedPlatforms) {
          totalComponents += platform.componentCount || 0
        }
      } catch (error) {
        continue
      }
    }

    return {
      platforms,
      totalComponents,
    }
  }

  async discover(config: FirmisConfig): Promise<DiscoveryResult> {
    // If a target path is specified with specific platforms, use it directly
    if (config.targetPath && config.platforms && config.platforms.length > 0) {
      return this.discoverAtPath(config.platforms, config.targetPath)
    }

    // If a target path is specified without platforms, smart-detect first
    if (config.targetPath) {
      const plausible = await detectPlausiblePlatforms(config.targetPath)
      const platformsToScan = plausible.length > 0
        ? plausible
        : PlatformRegistry.getSupportedPlatforms()
      return this.discoverAtPath(platformsToScan, config.targetPath)
    }

    if (config.platforms && config.platforms.length > 0) {
      return this.discoverSpecific(config.platforms)
    }

    return this.discoverAll()
  }

  async discoverAtPath(platformTypes: PlatformType[], targetPath: string): Promise<DiscoveryResult> {
    const platforms: DetectedPlatform[] = []

    for (const platformType of platformTypes) {
      const analyzer = PlatformRegistry.getAnalyzer(platformType)
      platforms.push({
        type: platformType,
        name: analyzer.name,
        basePath: targetPath,
        componentCount: 0, // Will be resolved during discover()
      })
    }

    return {
      platforms,
      totalComponents: 0,
    }
  }

  getSupportedPlatforms(): PlatformType[] {
    return PlatformRegistry.getSupportedPlatforms()
  }
}
