import { writeFile } from 'node:fs/promises'
import { VERSION } from '../version.js'
import type { FileReporter } from './base.js'
import type { ScanResult, Threat, SeverityLevel } from '../types/index.js'

interface SarifLog {
  $schema: string
  version: string
  runs: SarifRun[]
}

interface SarifRun {
  tool: {
    driver: {
      name: string
      version: string
      informationUri: string
      rules: SarifRule[]
    }
  }
  results: SarifResult[]
}

interface SarifRule {
  id: string
  shortDescription: {
    text: string
  }
  fullDescription: {
    text: string
  }
  defaultConfiguration: {
    level: 'error' | 'warning' | 'note'
  }
  help: {
    text: string
  }
}

interface SarifResult {
  ruleId: string
  level: 'error' | 'warning' | 'note'
  message: {
    text: string
  }
  locations: Array<{
    physicalLocation: {
      artifactLocation: {
        uri: string
      }
      region: {
        startLine: number
        startColumn: number
        endLine?: number
        endColumn?: number
      }
    }
  }>
  properties?: {
    category: string
    confidence: number
    evidence: string[]
  }
}

export class SarifReporter implements FileReporter {
  private readonly outputPath: string

  constructor(outputPath: string) {
    this.outputPath = outputPath
  }

  async report(result: ScanResult): Promise<void> {
    const sarif = this.convertToSarif(result)
    const json = JSON.stringify(sarif, null, 2)
    await writeFile(this.outputPath, json, 'utf-8')
  }

  getOutputPath(): string {
    return this.outputPath
  }

  private convertToSarif(result: ScanResult): SarifLog {
    const threats: Threat[] = []

    for (const platform of result.platforms) {
      for (const component of platform.components) {
        threats.push(...component.threats)
      }
    }

    const rules = this.extractUniqueRules(threats)

    return {
      $schema:
        'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Firmis Scanner',
              version: VERSION,
              informationUri: 'https://firmislabs.com',
              rules,
            },
          },
          results: threats.map((threat) => this.convertThreatToResult(threat)),
        },
      ],
    }
  }

  private extractUniqueRules(threats: Threat[]): SarifRule[] {
    const rulesMap = new Map<string, SarifRule>()

    for (const threat of threats) {
      if (!rulesMap.has(threat.ruleId)) {
        rulesMap.set(threat.ruleId, {
          id: threat.ruleId,
          shortDescription: {
            text: threat.category.replace(/-/g, ' '),
          },
          fullDescription: {
            text: threat.message,
          },
          defaultConfiguration: {
            level: this.mapSeverityToLevel(threat.severity),
          },
          help: {
            text: threat.remediation || 'Review the detected threat and assess security implications.',
          },
        })
      }
    }

    return Array.from(rulesMap.values())
  }

  private convertThreatToResult(threat: Threat): SarifResult {
    return {
      ruleId: threat.ruleId,
      level: this.mapSeverityToLevel(threat.severity),
      message: {
        text: threat.message,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: threat.location.file,
            },
            region: {
              startLine: threat.location.line,
              startColumn: threat.location.column,
              endLine: threat.location.endLine,
              endColumn: threat.location.endColumn,
            },
          },
        },
      ],
      properties: {
        category: threat.category,
        confidence: threat.confidence,
        evidence: threat.evidence.map((e) => e.description),
      },
    }
  }

  private mapSeverityToLevel(
    severity: SeverityLevel
  ): 'error' | 'warning' | 'note' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'note'
    }
  }
}
