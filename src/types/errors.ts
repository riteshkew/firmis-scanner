import type { PlatformType } from './config.js'

/**
 * Base error class for Firmis Scanner
 */
export class FirmisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'FirmisError'
    Error.captureStackTrace?.(this, this.constructor)
  }
}

/**
 * Configuration-related errors
 */
export class ConfigurationError extends FirmisError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', context)
    this.name = 'ConfigurationError'
  }
}

/**
 * Platform detection/analysis errors
 */
export class PlatformError extends FirmisError {
  constructor(
    message: string,
    public readonly platform: PlatformType,
    context?: Record<string, unknown>,
  ) {
    super(message, 'PLATFORM_ERROR', { ...context, platform })
    this.name = 'PlatformError'
  }
}

/**
 * Rule loading/matching errors
 */
export class RuleError extends FirmisError {
  constructor(
    message: string,
    public readonly ruleId: string,
    context?: Record<string, unknown>,
  ) {
    super(message, 'RULE_ERROR', { ...context, ruleId })
    this.name = 'RuleError'
  }
}

/**
 * File parsing errors
 */
export class ParseError extends FirmisError {
  constructor(
    message: string,
    public readonly filePath: string,
    context?: Record<string, unknown>,
  ) {
    super(message, 'PARSE_ERROR', { ...context, filePath })
    this.name = 'ParseError'
  }
}

/**
 * Early exit for fail-fast mode
 */
export class EarlyExitError extends FirmisError {
  constructor(
    message: string,
    public readonly threats: unknown[],
  ) {
    super(message, 'EARLY_EXIT', { threatCount: threats.length })
    this.name = 'EarlyExitError'
  }
}

/**
 * Type guard for FirmisError
 */
export function isFirmisError(error: unknown): error is FirmisError {
  return error instanceof FirmisError
}
