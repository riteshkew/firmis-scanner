import type { PlatformType, DetectedPlatform, FirmisConfig } from '../types/index.js'
import { PlatformRegistry } from './platforms/index.js'

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
