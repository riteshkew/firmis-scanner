// Configuration types
export type {
  PlatformType,
  SeverityLevel,
  OutputFormat,
  FirmisConfig,
} from './config.js'

export { DEFAULT_CONFIG, SEVERITY_ORDER, meetsMinimumSeverity } from './config.js'

// Scan result types
export type {
  ComponentType,
  ThreatCategory,
  ConfidenceTier,
  SourceLocation,
  Evidence,
  Threat,
  ComponentResult,
  PlatformScanResult,
  ScanSummary,
  ScanResult,
} from './scan.js'

export { createEmptySummary, calculateRiskLevel } from './scan.js'

// Platform types
export type {
  PlatformConfig,
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
  MCPServerConfig,
  CrewAgent,
  CrewConfig,
} from './platform.js'

// Rule types
export type {
  PatternType,
  ASTPattern,
  APICallPattern,
  ArgumentPattern,
  PatternContext,
  RulePattern,
  Rule,
  RuleFile,
  PatternMatch,
  RuleMatch,
} from './rule.js'

// Error types
export {
  FirmisError,
  ConfigurationError,
  PlatformError,
  RuleError,
  ParseError,
  EarlyExitError,
  isFirmisError,
} from './errors.js'

// Supabase types
export type {
  SupabaseTable,
  SupabasePolicy,
  SupabaseBucket,
  SupabaseAuthConfig,
  SupabaseProject,
} from './supabase.js'
