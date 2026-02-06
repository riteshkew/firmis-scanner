import type {
  Rule,
  RuleMatch,
  PatternMatch,
  Threat,
  PlatformType,
  SeverityLevel,
  ThreatCategory,
} from '../types/index.js'
import type { ParseResult } from '@babel/parser'
import type * as t from '@babel/types'
import { loadRules } from './loader.js'
import { matchPattern } from './patterns.js'
import { meetsMinimumSeverity } from '../types/index.js'

export class RuleEngine {
  private rules: Rule[] = []
  private loaded = false

  async load(customRulePaths?: string[]): Promise<void> {
    this.rules = await loadRules()

    if (customRulePaths) {
      for (const rulePath of customRulePaths) {
        const customRules = await loadRules(rulePath)
        this.rules.push(...customRules)
      }
    }

    this.loaded = true
  }

  isLoaded(): boolean {
    return this.loaded
  }

  getRules(options?: {
    severity?: SeverityLevel
    category?: ThreatCategory
    platform?: PlatformType
  }): Rule[] {
    let filtered = this.rules.filter((r) => r.enabled)

    if (options?.platform) {
      filtered = filtered.filter(
        (r) => !r.platforms || r.platforms.includes(options.platform!)
      )
    }

    if (options?.severity) {
      filtered = filtered.filter((r) => meetsMinimumSeverity(r.severity, options.severity!))
    }

    if (options?.category) {
      filtered = filtered.filter((r) => r.category === options.category)
    }

    return filtered
  }

  async analyze(
    content: string,
    filePath: string,
    ast: ParseResult<t.File> | null,
    platform: PlatformType
  ): Promise<Threat[]> {
    if (!this.loaded) {
      throw new Error('RuleEngine not loaded. Call load() first.')
    }

    const threats: Threat[] = []
    const rules = this.getRules({ platform })

    for (const rule of rules) {
      const ruleMatches = await this.matchRule(rule, content, filePath, ast)
      if (ruleMatches) {
        const ruleThreats = this.createThreats(rule, ruleMatches, filePath)
        threats.push(...ruleThreats)
      }
    }

    return threats
  }

  async analyzeWithRules(
    content: string,
    filePath: string,
    ast: ParseResult<t.File> | null,
    platform: PlatformType
  ): Promise<RuleMatch[]> {
    if (!this.loaded) {
      throw new Error('RuleEngine not loaded. Call load() first.')
    }

    const ruleMatches: RuleMatch[] = []
    const rules = this.getRules({ platform })

    for (const rule of rules) {
      const matches = await this.matchRule(rule, content, filePath, ast)
      if (matches) {
        ruleMatches.push(matches)
      }
    }

    return ruleMatches
  }

  private async matchRule(
    rule: Rule,
    content: string,
    filePath: string,
    ast: ParseResult<t.File> | null
  ): Promise<RuleMatch | null> {
    const matches: PatternMatch[] = []
    let totalWeight = 0
    let matchedWeight = 0

    for (const pattern of rule.patterns) {
      totalWeight += pattern.weight

      const patternMatches = await matchPattern(pattern, content, ast)
      if (patternMatches.length > 0) {
        matchedWeight += pattern.weight
        matches.push(...patternMatches)
      }
    }

    if (totalWeight === 0) return null

    const confidence = Math.round((matchedWeight / totalWeight) * 100)

    if (confidence < rule.confidenceThreshold) {
      return null
    }

    return {
      rule,
      matches,
      confidence,
    }
  }

  private createThreats(rule: Rule, ruleMatch: RuleMatch, filePath: string): Threat[] {
    const locationMap = new Map<string, PatternMatch[]>()

    for (const match of ruleMatch.matches) {
      const key = `${match.line}:${match.column}`
      if (!locationMap.has(key)) {
        locationMap.set(key, [])
      }
      locationMap.get(key)!.push(match)
    }

    return Array.from(locationMap.entries()).map(([, groupedMatches]) => {
      const primary = groupedMatches[0]

      return {
        id: `${rule.id}-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}-${primary.line}`,
        ruleId: rule.id,
        category: rule.category,
        severity: rule.severity,
        message: rule.description,
        evidence: groupedMatches.map((m) => ({
          type: mapPatternTypeToEvidenceType(m.patternType),
          description: m.description,
          snippet: m.snippet,
          line: m.line,
        })),
        location: {
          file: filePath,
          line: primary.line,
          column: primary.column,
          endLine: primary.endLine,
          endColumn: primary.endColumn,
        },
        confidence: ruleMatch.confidence,
        remediation: rule.remediation,
      }
    })
  }
}

function mapPatternTypeToEvidenceType(
  patternType: string
): 'code' | 'config' | 'pattern' | 'network' | 'file-access' {
  switch (patternType) {
    case 'api-call':
    case 'ast':
    case 'import':
      return 'code'
    case 'network':
      return 'network'
    case 'file-access':
      return 'file-access'
    case 'regex':
    case 'string-literal':
      return 'pattern'
    default:
      return 'pattern'
  }
}
