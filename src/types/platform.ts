import type { PlatformType } from './config.js'
import type { ComponentType } from './scan.js'

/**
 * Platform-specific configuration
 */
export interface PlatformConfig {
  basePaths: string[]
  filePatterns: string[]
  configFiles: string[]
}

/**
 * Discovered component before analysis
 */
export interface DiscoveredComponent {
  id: string
  name: string
  path: string
  type: ComponentType
  configPath?: string
}

/**
 * Metadata extracted from component
 */
export interface ComponentMetadata {
  version?: string
  author?: string
  description?: string
  permissions?: string[]
  dependencies?: string[]
  entryPoints?: string[]
}

/**
 * Platform detection result
 */
export interface DetectedPlatform {
  type: PlatformType
  name: string
  basePath: string
  componentCount?: number
}

/**
 * MCP server configuration format
 */
export interface MCPServerConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
}

/**
 * CrewAI agent configuration
 */
export interface CrewAgent {
  name?: string
  role?: string
  goal?: string
  backstory?: string
}

/**
 * CrewAI configuration file format
 */
export interface CrewConfig {
  agents?: CrewAgent[]
  tasks?: unknown[]
}
