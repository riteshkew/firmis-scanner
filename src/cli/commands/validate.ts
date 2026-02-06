import { Command } from 'commander'
import { validateCustomRules } from '../../rules/loader.js'
import { printHeader, printError } from '../utils/output.js'
import chalk from 'chalk'

interface ValidateOptions {
  strict?: boolean
}

async function action(rulePaths: string[], _options: ValidateOptions): Promise<void> {
  printHeader()

  if (rulePaths.length === 0) {
    printError('No rule files or directories specified')
    console.log('Usage: firmis validate <path...>')
    process.exit(1)
  }

  console.log(chalk.bold('  Validating custom rules...'))
  console.log()

  const result = await validateCustomRules(rulePaths)

  for (const validPath of result.valid) {
    console.log(chalk.green('  ✓'), chalk.dim(validPath))
  }

  for (const invalid of result.invalid) {
    console.log(chalk.red('  ✗'), chalk.dim(invalid.path))
    console.log(chalk.red(`     ${invalid.error}`))
  }

  console.log()

  const total = result.valid.length + result.invalid.length
  const successRate = total > 0 ? Math.round((result.valid.length / total) * 100) : 0

  if (result.invalid.length === 0) {
    console.log(
      chalk.green.bold(`  ✓ All ${result.valid.length} rule file(s) are valid`)
    )
  } else {
    console.log(
      chalk.yellow(`  ${result.valid.length}/${total} rule file(s) valid (${successRate}%)`)
    )
    console.log(chalk.red(`  ${result.invalid.length} file(s) have errors`))
  }

  console.log()

  if (result.invalid.length > 0) {
    process.exit(1)
  }
}

export const validateCommand = new Command('validate')
  .description('Validate custom rule files')
  .argument('<rules...>', 'Rule files or directories to validate')
  .option('--strict', 'Enable strict validation mode')
  .action(action)
