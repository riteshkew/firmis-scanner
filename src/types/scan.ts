import type { PlatformType, SeverityLevel } from './config.js'

/**
 * Component types across platforms
 */
export type ComponentType = 'skill' | 'server' | 'plugin' | 'extension' | 'agent'

/**
 * Threat categories
 */
export type ThreatCategory =
  | 'credential-harvesting'
  | 'data-exfiltration'
  | 'prompt-injection'
  | 'privilege-escalation'
  | 'suspicious-behavior'
  | 'network-abuse'
  | 'file-system-abuse'
  | 'access-control'
  | 'insecure-config'
  | 'known-malicious'
  | 'malware-distribution'
  | 'agent-memory-poisoning'

/**
 * Confidence tiers for threat classification
 */
export type ConfidenceTier = 'suspicious' | 'likely' | 'confirmed'

/**
 * Source location in a file
 */
export interface SourceLocation {
  file: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
}

/**
 * Evidence supporting threat detection
 */
export interface Evidence {
  type: 'code' | 'config' | 'pattern' | 'network' | 'file-access'
  description: string
  snippet?: string
  line?: number
}

/**
 * Detected security threat
 */
export interface Threat {
  id: string
  ruleId: string
  category: ThreatCategory
  severity: SeverityLevel
  message: string
  evidence: Evidence[]
  location: SourceLocation
  confidence: number
  confidenceTier: ConfidenceTier
  remediation?: string
}

/**
 * Result of scanning a single component
 */
export interface ComponentResult {
  id: string
  name: string
  type: ComponentType
  path: string
  filesScanned: number
  threats: Threat[]
  riskLevel: SeverityLevel | 'none'
}

/**
 * Result of scanning a platform
 */
export interface PlatformScanResult {
  platform: PlatformType
  basePath: string
  components: ComponentResult[]
  threats: Threat[]
}

/**
 * Aggregated scan statistics
 */
export interface ScanSummary {
  totalComponents: number
  totalFiles: number
  threatsFound: number
  byCategory: Record<ThreatCategory, number>
  bySeverity: Record<SeverityLevel, number>
  passedComponents: number
  failedComponents: number
}

/**
 * Complete scan result
 */
export interface ScanResult {
  id: string
  startedAt: Date
  completedAt: Date
  duration: number
  platforms: PlatformScanResult[]
  summary: ScanSummary
}

/**
 * Create an empty scan summary
 */
export function createEmptySummary(): ScanSummary {
  return {
    totalComponents: 0,
    totalFiles: 0,
    threatsFound: 0,
    byCategory: {
      'credential-harvesting': 0,
      'data-exfiltration': 0,
      'prompt-injection': 0,
      'privilege-escalation': 0,
      'suspicious-behavior': 0,
      'network-abuse': 0,
      'file-system-abuse': 0,
      'access-control': 0,
      'insecure-config': 0,
      'known-malicious': 0,
      'malware-distribution': 0,
      'agent-memory-poisoning': 0,
    },
    bySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    passedComponents: 0,
    failedComponents: 0,
  }
}

/**
 * Calculate risk level from threats
 */
export function calculateRiskLevel(threats: Threat[]): SeverityLevel | 'none' {
  if (threats.length === 0) return 'none'

  const severities = threats.map((t) => t.severity)
  if (severities.includes('critical')) return 'critical'
  if (severities.includes('high')) return 'high'
  if (severities.includes('medium')) return 'medium'
  return 'low'
}
