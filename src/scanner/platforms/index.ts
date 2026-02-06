import type { PlatformType } from '../../types/index.js'
import { BasePlatformAnalyzer } from './base.js'
import { ClaudeSkillsAnalyzer } from './claude.js'
import { MCPAnalyzer } from './mcp.js'
import { CodexAnalyzer } from './codex.js'
import { CursorAnalyzer } from './cursor.js'
import { CrewAIAnalyzer } from './crewai.js'
import { AutoGPTAnalyzer } from './autogpt.js'
import { OpenClawAnalyzer } from './openclaw.js'
import { NanobotAnalyzer } from './nanobot.js'

export { BasePlatformAnalyzer } from './base.js'
export { ClaudeSkillsAnalyzer } from './claude.js'
export { MCPAnalyzer } from './mcp.js'
export { CodexAnalyzer } from './codex.js'
export { CursorAnalyzer } from './cursor.js'
export { CrewAIAnalyzer } from './crewai.js'
export { AutoGPTAnalyzer } from './autogpt.js'
export { OpenClawAnalyzer } from './openclaw.js'
export { NanobotAnalyzer } from './nanobot.js'

const PLATFORM_ANALYZERS: Record<PlatformType, new () => BasePlatformAnalyzer> = {
  claude: ClaudeSkillsAnalyzer,
  mcp: MCPAnalyzer,
  codex: CodexAnalyzer,
  cursor: CursorAnalyzer,
  crewai: CrewAIAnalyzer,
  autogpt: AutoGPTAnalyzer,
  openclaw: OpenClawAnalyzer,
  nanobot: NanobotAnalyzer,
  langchain: ClaudeSkillsAnalyzer,
  custom: ClaudeSkillsAnalyzer,
}

export function getPlatformAnalyzer(platform: PlatformType): BasePlatformAnalyzer {
  return PlatformRegistry.getAnalyzer(platform)
}

export function getAllPlatformAnalyzers(): BasePlatformAnalyzer[] {
  return PlatformRegistry.getAllAnalyzers()
}

export class PlatformRegistry {
  private static analyzers = new Map<PlatformType, BasePlatformAnalyzer>()

  static getAnalyzer(platform: PlatformType): BasePlatformAnalyzer {
    if (!this.analyzers.has(platform)) {
      const AnalyzerClass = PLATFORM_ANALYZERS[platform]
      if (!AnalyzerClass) {
        throw new Error(`No analyzer found for platform: ${platform}`)
      }
      this.analyzers.set(platform, new AnalyzerClass())
    }

    return this.analyzers.get(platform)!
  }

  static getAllAnalyzers(): BasePlatformAnalyzer[] {
    const analyzers: BasePlatformAnalyzer[] = []
    const seen = new Set<string>()

    for (const platform of Object.keys(PLATFORM_ANALYZERS) as PlatformType[]) {
      const analyzer = this.getAnalyzer(platform)
      const key = analyzer.constructor.name

      if (!seen.has(key)) {
        analyzers.push(analyzer)
        seen.add(key)
      }
    }

    return analyzers
  }

  static getSupportedPlatforms(): PlatformType[] {
    return Object.keys(PLATFORM_ANALYZERS) as PlatformType[]
  }

  static async detectAll(): Promise<Map<PlatformType, BasePlatformAnalyzer>> {
    const detected = new Map<PlatformType, BasePlatformAnalyzer>()
    const analyzers = this.getAllAnalyzers()

    for (const analyzer of analyzers) {
      try {
        const platforms = await analyzer.detect()
        if (platforms.length > 0) {
          detected.set(analyzer.platformType, analyzer)
        }
      } catch {
        continue
      }
    }

    return detected
  }
}
