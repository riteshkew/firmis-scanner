import type { PlatformType, SeverityLevel } from './config.js'
import type { ThreatCategory } from './scan.js'

/**
 * Pattern matching types
 */
export type PatternType =
  | 'regex'
  | 'ast'
  | 'api-call'
  | 'file-access'
  | 'network'
  | 'string-literal'
  | 'import'

/**
 * AST node pattern for matching
 */
export interface ASTPattern {
  nodeType: string
  properties?: Record<string, unknown>
  children?: ASTPattern[]
}

/**
 * API call pattern for matching
 */
export interface APICallPattern {
  object?: string
  method: string
  arguments?: ArgumentPattern[]
}

/**
 * Argument pattern for API calls
 */
export interface ArgumentPattern {
  position: number
  type?: 'string' | 'regex' | 'any'
  value?: string
}

/**
 * Context requirements for pattern matching
 */
export interface PatternContext {
  insideOf?: string[]
  notInsideOf?: string[]
  minMatches?: number
  requiredPatterns?: string[]
}

/**
 * Pattern definition in a rule
 */
export interface RulePattern {
  type: PatternType
  pattern: string | ASTPattern | APICallPattern
  context?: PatternContext
  weight: number
  description: string
}

/**
 * Security detection rule
 */
export interface Rule {
  id: string
  name: string
  description: string
  category: ThreatCategory
  severity: SeverityLevel
  platforms?: PlatformType[]
  patterns: RulePattern[]
  confidenceThreshold: number
  remediation?: string
  references?: string[]
  enabled: boolean
  version: string
}

/**
 * Rule file format (YAML structure)
 */
export interface RuleFile {
  rules: Rule[]
}

/**
 * Pattern match result
 */
export interface PatternMatch {
  patternType: PatternType
  description: string
  snippet?: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  weight: number
}

/**
 * Rule match result with confidence
 */
export interface RuleMatch {
  rule: Rule
  matches: PatternMatch[]
  confidence: number
}
