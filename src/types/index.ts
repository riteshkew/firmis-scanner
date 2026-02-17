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
  SecurityGrade,
} from './scan.js'

export { createEmptySummary, calculateRiskLevel, computeSecurityGrade } from './scan.js'

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
  MatchContext,
  ASTPattern,
  APICallPattern,
  ArgumentPattern,
  PatternContext,
  YaraString,
  YaraPattern,
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
