import chalk from 'chalk'
import type { ScanResult, Threat, DetectedPlatform, SeverityLevel } from '../../types/index.js'

export function formatPlatformName(platform: string): string {
  const names: Record<string, string> = {
    claude: 'Claude Skills',
    mcp: 'MCP Servers',
    codex: 'OpenAI Codex',
    cursor: 'Cursor Extensions',
    crewai: 'CrewAI Agents',
    autogpt: 'AutoGPT Plugins',
    langchain: 'LangChain Tools',
    custom: 'Custom Agents',
  }
  return names[platform] || platform
}

function formatSeverity(severity: SeverityLevel): string {
  const colors = {
    low: chalk.yellow,
    medium: chalk.hex('#FFA500'),
    high: chalk.red,
    critical: chalk.bold.red,
  }
  return colors[severity](severity.toUpperCase())
}

function getSeverityIcon(severity: SeverityLevel): string {
  const icons = {
    low: '⚠️ ',
    medium: '⚠️ ',
    high: '🚨',
    critical: '🔴',
  }
  return icons[severity]
}

export function printHeader(): void {
  console.log()
  console.log(chalk.bold.cyan('  Firmis Scanner'))
  console.log()
}

export function printSuccess(message: string): void {
  console.log(chalk.green('  ✓'), message)
}

export function printWarning(message: string): void {
  console.log(chalk.yellow('  ⚠'), message)
}

export function printError(message: string): void {
  console.log(chalk.red('  ✗'), message)
}

export function printInfo(message: string): void {
  console.log(chalk.blue('  ℹ'), message)
}

export function printVerbose(message: string, verbose: boolean): void {
  if (verbose) {
    console.log(chalk.dim(`  [DEBUG] ${message}`))
  }
}

export function printDetectedPlatforms(platforms: DetectedPlatform[]): void {
  console.log(chalk.bold('  Detecting platforms...'))

  if (platforms.length === 0) {
    console.log(chalk.dim('  No platforms detected'))
    console.log()
    return
  }

  for (const platform of platforms) {
    const icon = chalk.green('✓')
    const name = platform.name
    const count = platform.componentCount || 0
    const label = count === 1 ? 'component' : 'components'

    console.log(`  ${icon} ${chalk.bold(name)}: ${count} ${label} found`)
  }
  console.log()
}

export function printThreat(threat: Threat, platformName: string): void {
  const icon = getSeverityIcon(threat.severity)
  const severity = formatSeverity(threat.severity)

  console.log()
  console.log(chalk.bold(`  ${icon} THREAT DETECTED`))
  console.log(`     Platform: ${chalk.cyan(platformName)}`)
  console.log(`     Risk: ${severity}`)
  console.log(`     Category: ${chalk.yellow(threat.category)}`)
  console.log()
  console.log(`     ${chalk.bold(threat.message)}`)
  console.log()

  if (threat.evidence.length > 0) {
    console.log(`     ${chalk.dim('Evidence:')}`)
    for (const evidence of threat.evidence) {
      console.log(`       - ${evidence.description}`)
      if (evidence.snippet) {
        const snippet = evidence.snippet.trim()
        const lines = snippet.split('\n').slice(0, 3)
        for (const line of lines) {
          console.log(chalk.dim(`         ${line}`))
        }
        if (snippet.split('\n').length > 3) {
          console.log(chalk.dim('         ...'))
        }
      }
    }
    console.log()
  }

  console.log(
    `     Location: ${chalk.dim(`${threat.location.file}:${threat.location.line}:${threat.location.column}`)}`
  )

  if (threat.remediation) {
    console.log()
    console.log(`     ${chalk.bold('Remediation:')}`)
    console.log(`     ${chalk.dim(threat.remediation)}`)
  }

  console.log()
}

export function printSummary(result: ScanResult): void {
  const { summary } = result
  const passed = summary.passedComponents
  const failed = summary.failedComponents
  const total = summary.totalComponents
  const threats = summary.threatsFound

  console.log(chalk.bold('  SCAN COMPLETE'))
  console.log()

  if (threats === 0) {
    console.log(`    ${chalk.green('✓')} ${chalk.bold.green('No threats detected')}`)
  } else {
    console.log(
      `    ${chalk.red('✗')} ${chalk.bold.red(`${threats} threat${threats === 1 ? '' : 's'} detected`)}`
    )
  }

  console.log()
  console.log(`    Components scanned: ${total}`)
  console.log(`    ${chalk.green('Passed')}: ${passed}`)
  if (failed > 0) {
    console.log(`    ${chalk.red('Failed')}: ${failed}`)
  }
  console.log()

  if (summary.bySeverity.critical > 0) {
    console.log(`    ${formatSeverity('critical')}: ${summary.bySeverity.critical}`)
  }
  if (summary.bySeverity.high > 0) {
    console.log(`    ${formatSeverity('high')}: ${summary.bySeverity.high}`)
  }
  if (summary.bySeverity.medium > 0) {
    console.log(`    ${formatSeverity('medium')}: ${summary.bySeverity.medium}`)
  }
  if (summary.bySeverity.low > 0) {
    console.log(`    ${formatSeverity('low')}: ${summary.bySeverity.low}`)
  }

  if (threats > 0) {
    console.log()
  }

  const duration = (result.duration / 1000).toFixed(2)
  console.log(`    ${chalk.dim(`Completed in ${duration}s`)}`)
  console.log()
}

export function formatPlatformList(platforms: DetectedPlatform[]): void {
  if (platforms.length === 0) {
    console.log(chalk.dim('  No platforms detected'))
    return
  }

  console.log()
  console.log(chalk.bold('  Detected Platforms:'))
  console.log()

  for (const platform of platforms) {
    const name = platform.name
    const count = platform.componentCount || 0
    const label = count === 1 ? 'component' : 'components'

    console.log(`  ${chalk.cyan('●')} ${chalk.bold(name)}`)
    console.log(`    Path: ${chalk.dim(platform.basePath)}`)
    console.log(`    Components: ${count} ${label}`)
    console.log()
  }
}
