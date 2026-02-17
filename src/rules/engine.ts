import type {
  Rule,
  RuleMatch,
  PatternMatch,
  Threat,
  PlatformType,
  SeverityLevel,
  ThreatCategory,
  ConfidenceTier,
  MatchContext,
} from '../types/index.js'
import type { ParseResult } from '@babel/parser'
import type * as t from '@babel/types'
import { loadRules } from './loader.js'
import { matchPattern, detectMatchContext } from './patterns.js'
import { meetsMinimumSeverity } from '../types/index.js'

/** Context-based confidence multipliers */
const CONTEXT_MULTIPLIERS: Record<MatchContext, number> = {
  code_execution: 1.0,
  config: 1.0,
  string_literal: 0.7,
  documentation: 0.15,
}

function computeConfidenceTier(
  matchCount: number,
  ratioConfidence: number,
  maxSingleWeight: number,
  isKnownMalicious: boolean
): ConfidenceTier {
  // Tier 3 - CONFIRMED: 3+ patterns, ratio >= 80%, or known-malicious
  if (isKnownMalicious) return 'confirmed'
  if (matchCount >= 3) return 'confirmed'
  if (ratioConfidence >= 80) return 'confirmed'

  // Tier 2 - LIKELY: 2+ patterns, or single pattern weight >= 90
  if (matchCount >= 2) return 'likely'
  if (maxSingleWeight >= 90) return 'likely'

  // Tier 1 - SUSPICIOUS: single pattern, weight >= 70
  return 'suspicious'
}

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
    let maxSinglePatternWeight = 0
    let matchedPatternCount = 0

    // Detect file context once
    const context = detectMatchContext(filePath)
    const contextMultiplier = CONTEXT_MULTIPLIERS[context]

    for (const pattern of rule.patterns) {
      totalWeight += pattern.weight

      const patternMatches = await matchPattern(pattern, content, ast)
      if (patternMatches.length > 0) {
        matchedWeight += pattern.weight
        matchedPatternCount++

        // Tag each match with context
        for (const match of patternMatches) {
          match.matchContext = context
        }

        matches.push(...patternMatches)
        if (pattern.weight > maxSinglePatternWeight) {
          maxSinglePatternWeight = pattern.weight
        }
      }
    }

    if (totalWeight === 0 || matches.length === 0) return null

    const ratioConfidence = Math.round((matchedWeight / totalWeight) * 100)
    const rawConfidence = Math.max(ratioConfidence, maxSinglePatternWeight)
    const confidence = Math.round(rawConfidence * contextMultiplier)

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

    // Count distinct matched patterns for tier calculation
    const distinctPatternTypes = new Set(ruleMatch.matches.map((m) => m.description))
    const matchedPatternCount = distinctPatternTypes.size
    const maxWeight = Math.max(...ruleMatch.matches.map((m) => m.weight))
    const isKnownMalicious = rule.category === 'known-malicious'

    const confidenceTier = computeConfidenceTier(
      matchedPatternCount,
      ruleMatch.confidence,
      maxWeight,
      isKnownMalicious
    )

    return Array.from(locationMap.entries())
      .filter(([, groupedMatches]) => groupedMatches.length > 0)
      .map(([, groupedMatches]) => {
        const primary = groupedMatches[0]!

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
          confidenceTier,
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
