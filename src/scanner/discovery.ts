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
    if (config.platforms && config.platforms.length > 0) {
      return this.discoverSpecific(config.platforms)
    }

    return this.discoverAll()
  }

  getSupportedPlatforms(): PlatformType[] {
    return PlatformRegistry.getSupportedPlatforms()
  }
}
