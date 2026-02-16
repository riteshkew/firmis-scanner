import { Command } from 'commander'
import { validateCustomRules, loadRules } from '../../rules/loader.js'
import { validateRegexPattern } from '../../rules/patterns.js'
import { printHeader, printError } from '../utils/output.js'
import chalk from 'chalk'
import type { PatternType } from '../../types/index.js'

interface ValidateOptions {
  strict?: boolean
  builtIn?: boolean
}

async function action(rulePaths: string[], options: ValidateOptions): Promise<void> {
  printHeader()

  if (rulePaths.length === 0 && !options.builtIn) {
    printError('No rule files or directories specified. Use --built-in to validate built-in rules.')
    console.log('Usage: firmis validate <path...> [--built-in]')
    process.exit(1)
  }

  console.log(chalk.bold('  Validating rules...'))
  console.log()

  let hasErrors = false

  // Validate built-in rules
  if (options.builtIn || rulePaths.length === 0) {
    console.log(chalk.bold('  Built-in rules:'))
    try {
      const rules = await loadRules()
      const regexErrors = validateRuleRegexPatterns(rules)

      if (regexErrors.length === 0) {
        console.log(chalk.green(`  ✓ ${rules.length} built-in rules loaded and validated`))
      } else {
        hasErrors = true
        for (const err of regexErrors) {
          console.log(chalk.yellow(`  ⚠ Rule ${err.ruleId}: ${err.message}`))
        }
        console.log(
          chalk.yellow(`  ${regexErrors.length} regex pattern(s) have compilation issues`)
        )
      }
      console.log()
    } catch (error) {
      hasErrors = true
      console.log(chalk.red(`  ✗ Failed to load built-in rules: ${error instanceof Error ? error.message : String(error)}`))
      console.log()
    }
  }

  // Validate custom rule paths
  if (rulePaths.length > 0) {
    console.log(chalk.bold('  Custom rules:'))

    const result = await validateCustomRules(rulePaths)

    for (const validPath of result.valid) {
      console.log(chalk.green('  ✓'), chalk.dim(validPath))
    }

    for (const invalid of result.invalid) {
      hasErrors = true
      console.log(chalk.red('  ✗'), chalk.dim(invalid.path))
      console.log(chalk.red(`     ${invalid.error}`))
    }

    console.log()

    // Also validate regex patterns in custom rules
    for (const validPath of result.valid) {
      try {
        const rules = await loadRules(validPath)
        const regexErrors = validateRuleRegexPatterns(rules)
        if (regexErrors.length > 0) {
          hasErrors = options.strict === true
          for (const err of regexErrors) {
            console.log(chalk.yellow(`  ⚠ Rule ${err.ruleId}: ${err.message}`))
          }
        }
      } catch {
        // Already reported above
      }
    }

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
  }

  if (hasErrors) {
    process.exit(1)
  }
}

interface RegexError {
  ruleId: string
  message: string
}

function validateRuleRegexPatterns(rules: Array<{ id: string; patterns: Array<{ type: PatternType; pattern: string | unknown }> }>): RegexError[] {
  const errors: RegexError[] = []
  const regexTypes: PatternType[] = ['regex', 'file-access', 'network']

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (regexTypes.includes(pattern.type) && typeof pattern.pattern === 'string') {
        const error = validateRegexPattern(pattern.pattern)
        if (error) {
          errors.push({
            ruleId: rule.id,
            message: `Invalid regex "${pattern.pattern}": ${error}`,
          })
        }
      }
    }
  }

  return errors
}

export const validateCommand = new Command('validate')
  .description('Validate rule files (custom and/or built-in)')
  .argument('[rules...]', 'Rule files or directories to validate')
  .option('--strict', 'Enable strict validation mode (regex warnings become errors)')
  .option('--built-in', 'Also validate built-in rules')
  .action(action)
