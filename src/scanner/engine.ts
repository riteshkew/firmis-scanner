import { randomUUID } from 'node:crypto'
import type {
  FirmisConfig,
  ScanResult,
  PlatformScanResult,
  ComponentResult,
  Threat,
  DiscoveredComponent,
  DetectedPlatform,
  ScanSummary,
} from '../types/index.js'
import { createEmptySummary, calculateRiskLevel, EarlyExitError } from '../types/index.js'
import { RuleEngine } from '../rules/index.js'
import { PlatformRegistry } from './platforms/index.js'
import { PlatformDiscovery } from './discovery.js'
import { FileAnalyzer } from './analyzer.js'

export class ScanEngine {
  private ruleEngine: RuleEngine
  private discovery: PlatformDiscovery
  private analyzer: FileAnalyzer
  private config: FirmisConfig

  constructor(config: FirmisConfig) {
    this.config = config
    this.ruleEngine = new RuleEngine()
    this.discovery = new PlatformDiscovery()
    this.analyzer = new FileAnalyzer()
  }

  async initialize(): Promise<void> {
    await this.ruleEngine.load(this.config.customRules)
  }

  async scan(): Promise<ScanResult> {
    const scanId = randomUUID()
    const startedAt = new Date()

    if (!this.ruleEngine.isLoaded()) {
      await this.initialize()
    }

    const discoveryResult = await this.discovery.discover(this.config)

    if (this.config.verbose) {
      console.log(`Discovered ${discoveryResult.platforms.length} platforms`)
      console.log(`Total components: ${discoveryResult.totalComponents}`)
    }

    const platformResults: PlatformScanResult[] = []

    for (const detectedPlatform of discoveryResult.platforms) {
      try {
        const platformResult = await this.scanPlatform(detectedPlatform)
        platformResults.push(platformResult)

        if (this.config.failFast && this.hasCriticalThreat(platformResult)) {
          throw new EarlyExitError('Critical threat detected, stopping scan')
        }
      } catch (error) {
        if (error instanceof EarlyExitError) {
          throw error
        }

        if (this.config.verbose) {
          console.error(`Failed to scan platform ${detectedPlatform.name}:`, error)
        }

        platformResults.push({
          platform: detectedPlatform.type,
          basePath: detectedPlatform.basePath,
          components: [],
          threats: [],
        })
      }
    }

    const completedAt = new Date()
    const duration = completedAt.getTime() - startedAt.getTime()
    const summary = this.calculateSummary(platformResults)

    return {
      id: scanId,
      startedAt,
      completedAt,
      duration,
      platforms: platformResults,
      summary,
    }
  }

  private async scanPlatform(detectedPlatform: DetectedPlatform): Promise<PlatformScanResult> {
    const analyzer = PlatformRegistry.getAnalyzer(detectedPlatform.type)
    const components = await analyzer.discover(detectedPlatform.basePath)

    if (this.config.verbose) {
      console.log(`Scanning ${components.length} components in ${detectedPlatform.name}`)
    }

    const componentResults: ComponentResult[] = []
    const allThreats: Threat[] = []

    for (const component of components) {
      try {
        const componentResult = await this.scanComponent(component, analyzer, detectedPlatform.type)
        componentResults.push(componentResult)
        allThreats.push(...componentResult.threats)

        if (this.config.failFast && componentResult.riskLevel === 'critical') {
          throw new EarlyExitError('Critical threat in component, stopping scan')
        }
      } catch (error) {
        if (error instanceof EarlyExitError) {
          throw error
        }

        if (this.config.verbose) {
          console.error(`Failed to scan component ${component.name}:`, error)
        }

        componentResults.push({
          id: component.id,
          name: component.name,
          type: component.type,
          path: component.path,
          filesScanned: 0,
          threats: [],
          riskLevel: 'none',
        })
      }
    }

    return {
      platform: detectedPlatform.type,
      basePath: detectedPlatform.basePath,
      components: componentResults,
      threats: allThreats,
    }
  }

  private async scanComponent(
    component: DiscoveredComponent,
    analyzer: ReturnType<typeof PlatformRegistry.getAnalyzer>,
    platformType: string
  ): Promise<ComponentResult> {
    const filePaths = await analyzer.analyze(component)
    const fileAnalyses = await this.analyzer.analyzeFilesParallel(
      filePaths,
      this.config.concurrency
    )

    const threats: Threat[] = []

    for (const fileAnalysis of fileAnalyses) {
      if (fileAnalysis.parseError) {
        if (this.config.verbose) {
          console.warn(`Parse error in ${fileAnalysis.filePath}: ${fileAnalysis.parseError}`)
        }
        continue
      }

      try {
        const fileThreats = await this.ruleEngine.analyze(
          fileAnalysis.content,
          fileAnalysis.filePath,
          fileAnalysis.ast,
          platformType as Parameters<typeof this.ruleEngine.analyze>[3]
        )

        threats.push(...fileThreats)
      } catch (error) {
        if (this.config.verbose) {
          console.error(`Failed to analyze ${fileAnalysis.filePath}:`, error)
        }
      }
    }

    const riskLevel = calculateRiskLevel(threats)

    return {
      id: component.id,
      name: component.name,
      type: component.type,
      path: component.path,
      filesScanned: fileAnalyses.length,
      threats,
      riskLevel,
    }
  }

  private hasCriticalThreat(platformResult: PlatformScanResult): boolean {
    return platformResult.threats.some((threat) => threat.severity === 'critical')
  }

  private calculateSummary(platformResults: PlatformScanResult[]): ScanSummary {
    const summary = createEmptySummary()

    for (const platformResult of platformResults) {
      for (const component of platformResult.components) {
        summary.totalComponents++
        summary.totalFiles += component.filesScanned

        if (component.threats.length === 0) {
          summary.passedComponents++
        } else {
          summary.failedComponents++
        }

        for (const threat of component.threats) {
          summary.threatsFound++
          summary.bySeverity[threat.severity]++
          summary.byCategory[threat.category]++
        }
      }
    }

    return summary
  }
}
