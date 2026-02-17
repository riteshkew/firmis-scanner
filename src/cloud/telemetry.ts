/**
 * Privacy-Preserving Telemetry Module
 *
 * Handles:
 * - Anonymous scan result reporting
 * - Pattern hash generation (no actual patterns sent)
 * - Confirmation/false-positive feedback
 * - Batching and compression
 */

import { createHash, randomUUID } from 'node:crypto'
import type {
  TelemetryEvent,
  TelemetryContribution,
  CloudConfig,
} from './types.js'
import type {
  ScanResult,
  Threat,
  PlatformType,
} from '../types/index.js'
import { CloudConnector } from './connector.js'
import { VERSION } from '../version.js'
const BATCH_SIZE = 10
const FLUSH_INTERVAL_MS = 60_000 // 1 minute

export class TelemetryReporter {
  private connector: CloudConnector
  private config: CloudConfig['telemetry']
  private eventQueue: TelemetryEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null

  constructor(connector: CloudConnector, config: CloudConfig['telemetry']) {
    this.connector = connector
    this.config = config

    if (this.config.enabled) {
      this.startFlushTimer()
    }
  }

  /**
   * Report a completed scan
   */
  async reportScan(result: ScanResult): Promise<void> {
    if (!this.config.enabled) return

    const event = this.createTelemetryEvent(result)
    this.eventQueue.push(event)

    if (this.eventQueue.length >= BATCH_SIZE) {
      await this.flush()
    }
  }

  /**
   * Report user feedback on a threat
   */
  async reportFeedback(
    _threatId: string,
    signatureHash: string,
    type: 'confirm' | 'false-positive'
  ): Promise<void> {
    if (!this.config.enabled) return

    const contribution: TelemetryContribution = {
      patternHash: signatureHash,
      confirmed: type === 'confirm' ? true : undefined,
      falsePositive: type === 'false-positive' ? true : undefined,
    }

    const event: TelemetryEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      scannerVersion: VERSION,
      installationId: '', // Will be set by connector
      platforms: [],
      threats: [],
      contributions: [contribution],
    }

    this.eventQueue.push(event)
    await this.flush()
  }

  /**
   * Flush pending events to cloud
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = this.eventQueue.splice(0, BATCH_SIZE)

    try {
      await this.connector.sendTelemetry({ events })
    } catch {
      // Re-queue events on failure (will be retried)
      this.eventQueue.unshift(...events)
    }
  }

  /**
   * Stop the flush timer
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Create a telemetry event from scan result
   */
  private createTelemetryEvent(result: ScanResult): TelemetryEvent {
    const platforms = result.platforms.map((p) => ({
      type: p.platform as PlatformType,
      componentCount: p.components.length,
    }))

    const threats = this.anonymizeThreats(result)

    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      scannerVersion: VERSION,
      installationId: '', // Will be set by connector
      platforms,
      threats,
    }
  }

  /**
   * Anonymize threats for telemetry
   */
  private anonymizeThreats(result: ScanResult): TelemetryEvent['threats'] {
    const threats: TelemetryEvent['threats'] = []

    for (const platform of result.platforms) {
      for (const component of platform.components) {
        for (const threat of component.threats) {
          threats.push({
            signatureHash: this.hashThreat(threat),
            category: threat.category,
            severity: threat.severity,
            confidence: threat.confidence,
          })
        }
      }
    }

    return threats
  }

  /**
   * Generate a privacy-preserving hash for a threat
   *
   * The hash is based on the rule ID and pattern characteristics,
   * NOT on actual code content or file paths.
   */
  private hashThreat(threat: Threat): string {
    // Only include non-identifying information
    const data = [
      threat.ruleId,
      threat.category,
      threat.severity,
      // Include evidence types but not content
      threat.evidence.map((e) => e.type).sort().join(','),
    ].join(':')

    return `sha256:${createHash('sha256').update(data).digest('hex')}`
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {
        // Silently ignore flush errors
      })
    }, FLUSH_INTERVAL_MS)

    // Ensure timer doesn't prevent process exit
    this.flushTimer.unref()
  }
}

/**
 * Generate a signature hash for a pattern
 *
 * This is used to create privacy-preserving identifiers for patterns
 * that can be looked up in the cloud database without revealing
 * the actual pattern content.
 */
export function generateSignatureHash(
  ruleId: string,
  patternType: string,
  patternDescription: string
): string {
  const data = [ruleId, patternType, patternDescription].join(':')
  return `sha256:${createHash('sha256').update(data).digest('hex')}`
}
