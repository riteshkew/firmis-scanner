import { calculateRiskLevel } from '../types/index.js'
import type { PlatformScanResult } from '../types/index.js'

/**
 * Remove duplicate threats that appear across multiple platforms for the
 * same (ruleId, file, line) triple. Platforms are processed in array order;
 * the first occurrence wins and subsequent duplicates are dropped.
 * Threats within a single platform are never filtered.
 */
export function deduplicateCrossPlatformThreats(
  results: PlatformScanResult[]
): PlatformScanResult[] {
  const seen = new Set<string>()

  return results.map(platformResult => {
    const dedupedComponents = platformResult.components.map(component => {
      const dedupedThreats = component.threats.filter(threat => {
        const key = `${threat.ruleId}::${threat.location.file}::${threat.location.line}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      return {
        ...component,
        threats: dedupedThreats,
        riskLevel: calculateRiskLevel(dedupedThreats),
      }
    })

    const platformThreats = dedupedComponents.flatMap(c => c.threats)

    return {
      ...platformResult,
      components: dedupedComponents,
      threats: platformThreats,
    }
  })
}
