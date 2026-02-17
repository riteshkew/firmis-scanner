/**
 * Cloud Connector - Main client for Firmis Cloud API
 *
 * Handles:
 * - API authentication and request signing
 * - Rate limiting and retry logic
 * - Response caching
 * - Graceful fallback when offline
 */

import { createHash } from 'node:crypto'
import type {
  CloudConfig,
  CloudAPIResult,
  CloudAPIError,
  ThreatEnrichmentRequest,
  ThreatEnrichmentResponse,
  BehavioralAnalysisRequest,
  BehavioralAnalysisResponse,
  SignatureLookupRequest,
  SignatureLookupResponse,
  TelemetryIngestRequest,
  TelemetryIngestResponse,
  ThreatFeedResponse,
} from './types.js'
import { DEFAULT_CLOUD_CONFIG } from './types.js'
import { VERSION } from '../version.js'
const REQUEST_TIMEOUT_MS = 10_000
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1_000

export class CloudConnector {
  private config: CloudConfig
  private installationId: string
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map()

  constructor(config: Partial<CloudConfig> = {}) {
    this.config = { ...DEFAULT_CLOUD_CONFIG, ...config }
    this.installationId = this.generateInstallationId()
  }

  /**
   * Check if cloud features are enabled and configured
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey
  }

  /**
   * Enrich threats with cloud threat intelligence
   */
  async enrichThreats(
    request: ThreatEnrichmentRequest
  ): Promise<CloudAPIResult<ThreatEnrichmentResponse>> {
    if (!this.isEnabled() || !this.config.features.threatEnrichment) {
      return {
        success: false,
        error: { code: 'DISABLED', message: 'Cloud enrichment is disabled' },
      }
    }

    const cacheKey = this.getCacheKey('enrich', request.threats.map((t) => t.signatureHash))
    const cached = this.getFromCache<ThreatEnrichmentResponse>(cacheKey)
    if (cached) {
      return { success: true, data: cached }
    }

    const result = await this.request<ThreatEnrichmentResponse>('POST', '/v1/threats/enrich', request)

    if (result.success) {
      this.setCache(cacheKey, result.data)
    }

    return result
  }

  /**
   * Analyze behavioral features with ML model
   */
  async analyzeBehavior(
    request: BehavioralAnalysisRequest
  ): Promise<CloudAPIResult<BehavioralAnalysisResponse>> {
    if (!this.isEnabled() || !this.config.features.behavioralAnalysis) {
      return {
        success: false,
        error: { code: 'DISABLED', message: 'Behavioral analysis is disabled' },
      }
    }

    const featureHash = this.hashFeatures(request.features)
    const cacheKey = this.getCacheKey('behavioral', [featureHash])
    const cached = this.getFromCache<BehavioralAnalysisResponse>(cacheKey)
    if (cached) {
      return { success: true, data: cached }
    }

    const result = await this.request<BehavioralAnalysisResponse>(
      'POST',
      '/v1/analyze/behavioral',
      request
    )

    if (result.success) {
      this.setCache(cacheKey, result.data)
    }

    return result
  }

  /**
   * Lookup signature hashes in threat database
   */
  async lookupSignatures(
    hashes: string[]
  ): Promise<CloudAPIResult<SignatureLookupResponse>> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: { code: 'DISABLED', message: 'Cloud is disabled' },
      }
    }

    // Check cache for each hash, only query unknown ones
    const result: SignatureLookupResponse = { signatures: {} }
    const uncachedHashes: string[] = []

    for (const hash of hashes) {
      const cacheKey = this.getCacheKey('sig', [hash])
      const cached = this.getFromCache<{ known: boolean; data?: unknown }>(cacheKey)
      if (cached) {
        result.signatures[hash] = cached as SignatureLookupResponse['signatures'][string]
      } else {
        uncachedHashes.push(hash)
      }
    }

    if (uncachedHashes.length === 0) {
      return { success: true, data: result }
    }

    const request: SignatureLookupRequest = { hashes: uncachedHashes }
    const apiResult = await this.request<SignatureLookupResponse>(
      'POST',
      '/v1/signatures/lookup',
      request
    )

    if (apiResult.success) {
      // Cache individual results
      for (const [hash, info] of Object.entries(apiResult.data.signatures)) {
        this.setCache(this.getCacheKey('sig', [hash]), info)
        result.signatures[hash] = info
      }
      return { success: true, data: result }
    }

    // If API failed but we have some cached, return partial result
    if (Object.keys(result.signatures).length > 0) {
      return { success: true, data: result }
    }

    return apiResult
  }

  /**
   * Get real-time threat feed updates
   */
  async getThreatFeed(since?: string): Promise<CloudAPIResult<ThreatFeedResponse>> {
    if (!this.isEnabled() || !this.config.features.realTimeFeeds) {
      return {
        success: false,
        error: { code: 'DISABLED', message: 'Real-time feeds are disabled' },
      }
    }

    const params = since ? `?since=${encodeURIComponent(since)}` : ''
    return this.request<ThreatFeedResponse>('GET', `/v1/feeds/threats${params}`)
  }

  /**
   * Send anonymous telemetry data
   */
  async sendTelemetry(
    request: TelemetryIngestRequest
  ): Promise<CloudAPIResult<TelemetryIngestResponse>> {
    if (!this.config.telemetry.enabled) {
      return {
        success: false,
        error: { code: 'DISABLED', message: 'Telemetry is disabled' },
      }
    }

    // Anonymize installation ID for telemetry endpoint
    const anonymizedRequest: TelemetryIngestRequest = {
      events: request.events.map((event) => ({
        ...event,
        installationId: this.config.telemetry.anonymous
          ? this.getRotatingAnonymousId()
          : this.installationId,
      })),
    }

    return this.request<TelemetryIngestResponse>(
      'POST',
      '/v1/telemetry/ingest',
      anonymizedRequest
    )
  }

  /**
   * Core request method with retry logic
   */
  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown
  ): Promise<CloudAPIResult<T>> {
    const url = `${this.config.endpoint}${path}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Scanner-Version': VERSION,
      'X-Installation-ID': this.installationId,
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }

    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }

    let lastError: CloudAPIError | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, options)

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>
          lastError = {
            code: `HTTP_${response.status}`,
            message: (errorBody['message'] as string) || response.statusText,
            details: errorBody,
          }

          // Don't retry client errors (4xx) except rate limits
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            return { success: false, error: lastError! }
          }

          // Wait before retry for rate limits or server errors
          if (attempt < MAX_RETRIES - 1) {
            const delay = response.status === 429
              ? this.parseRetryAfter(response.headers.get('Retry-After'))
              : RETRY_DELAY_MS * Math.pow(2, attempt)
            await this.sleep(delay)
          }
          continue
        }

        const data = await response.json()
        return { success: true, data: data as T }
      } catch (error) {
        lastError = {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown network error',
        }

        // Wait before retry
        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY_MS * Math.pow(2, attempt))
        }
      }
    }

    return { success: false, error: lastError || { code: 'UNKNOWN', message: 'Request failed' } }
  }

  /**
   * Generate a stable installation ID from machine characteristics
   */
  private generateInstallationId(): string {
    const data = [
      process.env['HOME'] || process.env['USERPROFILE'] || '',
      process.platform,
      process.arch,
    ].join(':')

    return createHash('sha256').update(data).digest('hex').slice(0, 32)
  }

  /**
   * Get a rotating anonymous ID (changes weekly)
   */
  private getRotatingAnonymousId(): string {
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    const data = `${this.installationId}:${weekNumber}`
    return createHash('sha256').update(data).digest('hex').slice(0, 32)
  }

  /**
   * Hash behavioral features for cache key
   */
  private hashFeatures(features: BehavioralAnalysisRequest['features']): string {
    const data = JSON.stringify(features)
    return createHash('sha256').update(data).digest('hex').slice(0, 16)
  }

  /**
   * Create cache key
   */
  private getCacheKey(prefix: string, parts: string[]): string {
    return `${prefix}:${parts.join(':')}`
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    if (!this.config.cache.enabled) return null

    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache entry with TTL
   */
  private setCache(key: string, data: unknown): void {
    if (!this.config.cache.enabled) return

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.config.cache.ttlSeconds * 1000,
    })
  }

  /**
   * Parse Retry-After header
   */
  private parseRetryAfter(header: string | null): number {
    if (!header) return RETRY_DELAY_MS

    const seconds = parseInt(header, 10)
    if (!isNaN(seconds)) {
      return seconds * 1000
    }

    // Try parsing as HTTP date
    const date = Date.parse(header)
    if (!isNaN(date)) {
      return Math.max(0, date - Date.now())
    }

    return RETRY_DELAY_MS
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
