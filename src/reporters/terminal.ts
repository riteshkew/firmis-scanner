import chalk from 'chalk'
import type { Reporter } from './base.js'
import type {
  ScanResult,
  PlatformScanResult,
  Threat,
  SeverityLevel,
  SecurityGrade,
} from '../types/index.js'

export class TerminalReporter implements Reporter {
  constructor(_verbose = false) {
    // verbose option reserved for future use
  }

  async report(result: ScanResult): Promise<void> {
    this.printHeader()
    this.printPlatformDetection(result.platforms)
    this.printScanProgress(result.summary.totalComponents)
    this.printThreats(result.platforms)
    this.printSummary(result)
  }

  private printHeader(): void {
    console.log()
    console.log(chalk.bold.cyan('  Firmis Scanner v1.1.0'))
    console.log()
  }

  private printPlatformDetection(platforms: PlatformScanResult[]): void {
    console.log(chalk.dim('  Detecting platforms...'))

    for (const platform of platforms) {
      const count = platform.components.length
      const icon = chalk.green('✓')
      const name = this.formatPlatformName(platform.platform)
      const suffix = this.getComponentSuffix(platform.platform)

      console.log(chalk.dim(`  ${icon} ${name}: ${count} ${suffix} found`))
    }

    console.log()
  }

  private printScanProgress(totalComponents: number): void {
    console.log(chalk.dim(`  Scanning ${totalComponents} total components...`))
    console.log()
  }

  private printThreats(platforms: PlatformScanResult[]): void {
    for (const platform of platforms) {
      for (const component of platform.components) {
        if (component.threats.length === 0) continue

        for (const threat of component.threats) {
          this.printThreat(platform.platform, component.name, threat)
        }
      }
    }
  }

  private printThreat(
    platform: string,
    componentName: string,
    threat: Threat
  ): void {
    const icon = this.getSeverityIcon(threat.severity)
    const severityColor = this.getSeverityColor(threat.severity)

    console.log(severityColor(`  ${icon}  THREAT DETECTED`))
    console.log(chalk.dim(`     Platform: ${this.formatPlatformName(platform)}`))

    const componentType = this.getComponentLabel(platform)
    console.log(chalk.dim(`     ${componentType}: ${componentName}`))
    console.log(chalk.dim(`     Risk: ${threat.severity.toUpperCase()}`))
    console.log(chalk.dim(`     Category: ${threat.category}`))
    console.log()

    console.log(chalk.dim('     Evidence:'))
    for (const evidence of threat.evidence) {
      console.log(chalk.dim(`       - ${evidence.description}`))
    }
    console.log()

    const location = threat.location
    console.log(chalk.dim(`     Location: ${location.file}:${location.line}`))
    console.log()
  }

  private printSummary(result: ScanResult): void {
    const { summary, score } = result

    // Display security grade
    const gradeColor = this.getGradeColor(score)
    console.log(gradeColor(`  Security Grade: ${score}`))

    // Show coverage caveat if files were not analyzable
    const totalFiles = summary.filesAnalyzed + summary.filesNotAnalyzed
    if (totalFiles > 0 && summary.filesNotAnalyzed > 0) {
      const pct = Math.round((summary.filesNotAnalyzed / totalFiles) * 100)
      console.log(
        chalk.yellow(`  Coverage: ${summary.filesAnalyzed}/${totalFiles} files analyzed (${pct}% not analyzable)`)
      )
      if (pct > 20) {
        console.log(chalk.yellow('  Grade capped at B due to low coverage'))
      }
    }
    console.log()

    const icon = summary.threatsFound > 0 ? chalk.yellow('⚠') : chalk.green('✓')

    console.log(chalk.bold(`  ${icon} SCAN COMPLETE`))
    console.log(chalk.dim(`    ${summary.passedComponents} components passed`))

    if (summary.threatsFound > 0) {
      const severityBreakdown = this.formatSeverityBreakdown(summary.bySeverity)
      console.log(
        chalk.yellow(`    ${summary.threatsFound} threats detected ${severityBreakdown}`)
      )
    }

    // Show runtime risks disclaimer
    if (result.runtimeRisksNotCovered.length > 0) {
      console.log()
      console.log(chalk.dim('  Note: Static analysis cannot detect:'))
      for (const risk of result.runtimeRisksNotCovered) {
        console.log(chalk.dim(`    - ${risk}`))
      }
    }

    console.log()
    console.log(chalk.dim(`    Duration: ${result.duration}ms`))
    console.log()
  }

  private getGradeColor(grade: SecurityGrade): typeof chalk {
    switch (grade) {
      case 'A':
        return chalk.green.bold
      case 'B':
        return chalk.green
      case 'C':
        return chalk.yellow
      case 'D':
        return chalk.red
      case 'F':
        return chalk.red.bold
    }
  }

  private formatSeverityBreakdown(
    bySeverity: Record<SeverityLevel, number>
  ): string {
    const parts: string[] = []

    if (bySeverity.critical > 0) {
      parts.push(`${bySeverity.critical} CRITICAL`)
    }
    if (bySeverity.high > 0) {
      parts.push(`${bySeverity.high} HIGH`)
    }
    if (bySeverity.medium > 0) {
      parts.push(`${bySeverity.medium} MEDIUM`)
    }
    if (bySeverity.low > 0) {
      parts.push(`${bySeverity.low} LOW`)
    }

    return parts.length > 0 ? `(${parts.join(', ')})` : ''
  }

  private getSeverityIcon(severity: SeverityLevel): string {
    switch (severity) {
      case 'critical':
        return '🔴'
      case 'high':
        return '🟠'
      case 'medium':
        return '🟡'
      case 'low':
        return '🔵'
    }
  }

  private getSeverityColor(severity: SeverityLevel): typeof chalk {
    switch (severity) {
      case 'critical':
        return chalk.red.bold
      case 'high':
        return chalk.red
      case 'medium':
        return chalk.yellow
      case 'low':
        return chalk.blue
    }
  }

  private formatPlatformName(platform: string): string {
    const names: Record<string, string> = {
      claude: 'Claude Skills',
      mcp: 'MCP Servers',
      codex: 'Codex Plugins',
      cursor: 'Cursor Extensions',
      crewai: 'CrewAI Agents',
      autogpt: 'AutoGPT Plugins',
      openclaw: 'OpenClaw Skills',
      nanobot: 'Nanobot Agents',
      langchain: 'LangChain Tools',
      custom: 'Custom Agents',
    }
    return names[platform] || platform
  }

  private getComponentSuffix(platform: string): string {
    const suffixes: Record<string, string> = {
      claude: 'skills',
      mcp: 'servers',
      codex: 'plugins',
      cursor: 'extensions',
      crewai: 'agents',
      autogpt: 'plugins',
      openclaw: 'skills',
      nanobot: 'agents',
      langchain: 'tools',
      custom: 'agents',
    }
    return suffixes[platform] || 'components'
  }

  private getComponentLabel(platform: string): string {
    const labels: Record<string, string> = {
      claude: 'Skill',
      mcp: 'Server',
      codex: 'Plugin',
      cursor: 'Extension',
      crewai: 'Agent',
      autogpt: 'Plugin',
      openclaw: 'Skill',
      nanobot: 'Agent',
      langchain: 'Tool',
      custom: 'Agent',
    }
    return labels[platform] || 'Component'
  }
}
