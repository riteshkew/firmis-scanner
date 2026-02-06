/**
 * Platform types supported by Firmis Scanner
 */
export type PlatformType =
  | 'claude'
  | 'mcp'
  | 'codex'
  | 'cursor'
  | 'crewai'
  | 'autogpt'
  | 'openclaw'
  | 'nanobot'
  | 'langchain'
  | 'custom'

/**
 * Severity levels for threats and rules
 */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * Output format options
 */
export type OutputFormat = 'terminal' | 'json' | 'sarif' | 'html'

/**
 * Scanner configuration
 */
export interface FirmisConfig {
  /** Platforms to scan (undefined = auto-detect all) */
  platforms?: PlatformType[]

  /** Minimum severity to report */
  severity: SeverityLevel

  /** Custom rule directories to load */
  customRules?: string[]

  /** Paths to exclude from scanning */
  exclude?: string[]

  /** Output format */
  output: OutputFormat

  /** Output file path (for JSON/SARIF/HTML) */
  outputFile?: string

  /** Enable verbose logging */
  verbose: boolean

  /** Number of parallel workers */
  concurrency: number

  /** Stop on first critical threat */
  failFast?: boolean
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: FirmisConfig = {
  severity: 'low',
  output: 'terminal',
  verbose: false,
  concurrency: 4,
  failFast: false,
}

/**
 * Severity ordering for comparisons
 */
export const SEVERITY_ORDER: readonly SeverityLevel[] = ['low', 'medium', 'high', 'critical']

/**
 * Check if a severity meets the minimum threshold
 */
export function meetsMinimumSeverity(
  severity: SeverityLevel,
  minimum: SeverityLevel,
): boolean {
  return SEVERITY_ORDER.indexOf(severity) >= SEVERITY_ORDER.indexOf(minimum)
}
