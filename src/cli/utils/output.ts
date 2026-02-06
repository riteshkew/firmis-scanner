import chalk from 'chalk'

const VERSION = '1.0.0'

export function printHeader(): void {
  console.log()
  console.log(chalk.bold.white(`  Firmis Scanner v${VERSION}`))
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

export function printThreat(threat: {
  platform: string
  name: string
  severity: string
  category: string
  evidence: Array<{ description: string }>
  location: { file: string; line: number }
}): void {
  console.log()
  console.log(chalk.yellow.bold('  ⚠️  THREAT DETECTED'))
  console.log(chalk.gray(`     Platform: ${threat.platform}`))
  console.log(chalk.white(`     Component: ${threat.name}`))
  console.log(chalk.red(`     Risk: ${threat.severity.toUpperCase()}`))
  console.log(chalk.gray(`     Category: ${threat.category}`))
  console.log()
  console.log(chalk.gray('     Evidence:'))
  for (const e of threat.evidence) {
    console.log(chalk.gray(`       - ${e.description}`))
  }
  console.log()
  console.log(chalk.gray(`     Location: ${threat.location.file}:${threat.location.line}`))
}

export function printSummary(summary: {
  passedComponents: number
  threatsFound: number
  bySeverity: Record<string, number>
}): void {
  console.log()
  console.log(chalk.bold('  SCAN COMPLETE'))
  console.log(chalk.green(`    ${summary.passedComponents} components passed`))

  if (summary.threatsFound > 0) {
    const parts: string[] = []
    if (summary.bySeverity['critical'] ?? 0 > 0) {
      parts.push(`${summary.bySeverity['critical']} CRITICAL`)
    }
    if (summary.bySeverity['high'] ?? 0 > 0) {
      parts.push(`${summary.bySeverity['high']} HIGH`)
    }
    if (summary.bySeverity['medium'] ?? 0 > 0) {
      parts.push(`${summary.bySeverity['medium']} MEDIUM`)
    }
    if (summary.bySeverity['low'] ?? 0 > 0) {
      parts.push(`${summary.bySeverity['low']} LOW`)
    }
    console.log(chalk.red(`    ${summary.threatsFound} threats detected (${parts.join(', ')})`))
  }
  console.log()
}
