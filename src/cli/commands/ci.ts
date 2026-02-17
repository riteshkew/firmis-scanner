import { resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { Command } from 'commander'
import chalk from 'chalk'
import { ScanEngine } from '../../scanner/engine.js'
import { ReporterFactory } from '../../reporters/index.js'
import { createSpinner } from '../utils/progress.js'
import { printHeader, printSummary, printThreat, formatPlatformName } from '../utils/output.js'
import type { FirmisConfig, SeverityLevel, PlatformType } from '../../types/index.js'
import { meetsMinimumSeverity } from '../../types/index.js'
import { detectAIDependencies } from '../../scanner/dep-detector.js'
import { detectModelFiles } from '../../scanner/model-detector.js'
import { generateBom } from '../../scanner/bom-generator.js'

interface CiOptions {
  platform?: string
  failOn?: string
  output?: string
  format?: string
  bomOutput?: string
  quiet?: boolean
  verbose?: boolean
}

async function action(
  targetPath: string | undefined,
  options: CiOptions,
): Promise<void> {
  if (!options.quiet) {
    printHeader()
    console.log(chalk.bold('  CI Pipeline: discover → bom → scan → report'))
    console.log()
  }

  const scanPath = targetPath ? resolve(targetPath) : process.cwd()

  // Step 1: Scan (includes discovery internally)
  const spinner = options.quiet ? null : createSpinner('Running security scan...')
  spinner?.start()

  const config: FirmisConfig = {
    platforms: options.platform ? [options.platform as PlatformType] : undefined,
    targetPath: targetPath ? resolve(targetPath) : undefined,
    severity: 'low',
    output: 'terminal',
    verbose: options.verbose ?? false,
    concurrency: 4,
    quiet: options.quiet ?? false,
    failOnSeverity: options.failOn as SeverityLevel | undefined,
  }

  const scanEngine = new ScanEngine(config)

  try {
    await scanEngine.initialize()
    spinner?.succeed('Rules loaded')

    spinner?.start('Scanning...')
    const scanResult = await scanEngine.scan()
    spinner?.succeed('Scan complete')

    // Step 2: Generate BOM
    spinner?.start('Generating Agent BOM...')
    const dependencies = await detectAIDependencies(scanPath)
    const models = await detectModelFiles(scanPath)

    const projectName = scanResult.platforms[0]
      ? `agent-stack-${scanResult.platforms.map((p) => p.platform).join('-')}`
      : 'agent-stack'

    const bom = generateBom({
      projectName,
      projectVersion: '1.3.0',
      platforms: scanResult.platforms.map((p) => ({
        type: p.platform,
        name: formatPlatformName(p.platform),
        components: p.components.map((c) => ({
          id: c.id,
          name: c.name,
          path: c.path,
          type: c.type,
          metadata: {},
        })),
      })),
      dependencies,
      models,
    })

    spinner?.succeed('Agent BOM generated')

    // Save BOM if requested
    if (options.bomOutput) {
      await writeFile(options.bomOutput, JSON.stringify(bom, null, 2), 'utf-8')
      if (!options.quiet) {
        console.log(chalk.dim(`  BOM saved to ${options.bomOutput}`))
      }
    }

    // Step 3: Report
    const format = options.format ?? 'sarif'
    if (options.output) {
      const reporter = ReporterFactory.create({
        format: format as 'json' | 'sarif' | 'html',
        outputFile: options.output,
        verbose: options.verbose ?? false,
        pretty: true,
      })
      await reporter.report(scanResult)
      if (!options.quiet) {
        console.log(chalk.dim(`  Report saved to ${options.output}`))
      }
    }

    // Terminal output (unless quiet)
    if (!options.quiet) {
      console.log()
      for (const platform of scanResult.platforms) {
        for (const component of platform.components) {
          for (const threat of component.threats) {
            printThreat(threat, formatPlatformName(platform.platform))
          }
        }
      }
      printSummary(scanResult)
    }

    // Step 4: Exit code
    if (config.failOnSeverity) {
      const hasFailure = scanResult.platforms.some((p) =>
        p.components.some((c) =>
          c.threats.some((t) =>
            meetsMinimumSeverity(t.severity, config.failOnSeverity!),
          ),
        ),
      )
      if (hasFailure) {
        if (!options.quiet) {
          console.log(
            chalk.red(
              `  CI failed: threats at or above ${config.failOnSeverity} severity`,
            ),
          )
        }
        process.exit(1)
      }
    } else if (scanResult.summary.threatsFound > 0) {
      process.exit(1)
    }
  } catch (error) {
    spinner?.fail('CI pipeline failed')
    console.error(
      chalk.red('  Error:'),
      error instanceof Error ? error.message : 'Unknown error',
    )
    process.exit(1)
  }
}

export const ciCommand = new Command('ci')
  .description('CI pipeline: discover → bom → scan → report')
  .argument('[path]', 'Path to scan (default: current directory)')
  .option('--platform <name>', 'Scan specific platform only')
  .option(
    '--fail-on <severity>',
    'Exit non-zero only for this severity or above (low|medium|high|critical)',
  )
  .option(
    '--format <type>',
    'Report format (json|sarif|html)',
    'sarif',
  )
  .option('--output <file>', 'Save report to file')
  .option('--bom-output <file>', 'Save Agent BOM to file')
  .option('--quiet', 'Suppress terminal output', false)
  .option('--verbose', 'Enable verbose logging', false)
  .action(action)
