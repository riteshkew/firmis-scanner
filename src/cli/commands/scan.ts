import { Command } from 'commander'
import { ScanEngine } from '../../scanner/engine.js'
import { ReporterFactory } from '../../reporters/index.js'
import { createSpinner } from '../utils/progress.js'
import {
  printHeader,
  printThreat,
  printSummary,
  printDetectedPlatforms,
  printVerbose,
  printError,
  formatPlatformName,
} from '../utils/output.js'
import type {
  FirmisConfig,
  OutputFormat,
  SeverityLevel,
  PlatformType,
} from '../../types/index.js'

interface ScanOptions {
  platform?: string
  all?: boolean
  json?: boolean
  sarif?: boolean
  html?: boolean
  severity?: string
  config?: string
  output?: string
  verbose?: boolean
  concurrency?: string
}

async function action(_targetPath: string | undefined, options: ScanOptions): Promise<void> {
  const config = buildConfig(options)

  if (config.output === 'terminal') {
    printHeader()
  }

  const scanEngine = new ScanEngine(config)

  const spinner = config.output === 'terminal' ? createSpinner('Loading rules...') : null
  spinner?.start()

  try {
    await scanEngine.initialize()

    if (spinner) {
      spinner.succeed('Rules loaded')
      spinner.start('Detecting platforms...')
    }

    printVerbose('Starting platform discovery', config.verbose)

    const result = await scanEngine.scan()

    spinner?.stop()

    if (result.platforms.length === 0) {
      if (config.output === 'terminal') {
        printError('No AI platforms detected. Try specifying a path or installing AI tools.')
      }
      process.exit(1)
    }

    if (config.output === 'terminal') {
      const detectedPlatforms = result.platforms.map((p) => ({
        type: p.platform,
        name: formatPlatformName(p.platform),
        basePath: p.basePath,
        componentCount: p.components.length,
      }))

      printDetectedPlatforms(detectedPlatforms)

      for (const platform of result.platforms) {
        for (const component of platform.components) {
          for (const threat of component.threats) {
            printThreat(threat, formatPlatformName(platform.platform))
          }
        }
      }

      printSummary(result)
    } else {
      const reporter = ReporterFactory.create({
        format: config.output,
        outputFile: config.outputFile,
        verbose: config.verbose,
        pretty: true,
      })

      await reporter.report(result)

      if (config.outputFile) {
        console.log(`Report saved to ${config.outputFile}`)
      }
    }

    if (result.summary.threatsFound > 0) {
      process.exit(1)
    }
  } catch (error) {
    spinner?.fail('Scan failed')
    printError(error instanceof Error ? error.message : 'Unknown error occurred')
    process.exit(1)
  }
}

function buildConfig(options: ScanOptions): FirmisConfig {
  let output: OutputFormat = 'terminal'
  if (options.json === true) output = 'json'
  if (options.sarif === true) output = 'sarif'
  if (options.html === true) output = 'html'

  return {
    platforms: options.platform ? [options.platform as PlatformType] : undefined,
    severity: (options.severity ?? 'low') as SeverityLevel,
    output,
    outputFile: options.output,
    verbose: options.verbose ?? false,
    concurrency: parseInt(options.concurrency ?? '4', 10),
  }
}

export const scanCommand = new Command('scan')
  .description('Scan AI agent components for security threats')
  .argument('[path]', 'Path to scan (default: auto-detect)')
  .option('--platform <name>', 'Scan specific platform (claude|mcp|codex|cursor|crewai|autogpt)')
  .option('--all', 'Scan all detected platforms (default)', true)
  .option('--json', 'Output in JSON format')
  .option('--sarif', 'Output in SARIF format')
  .option('--html', 'Output in HTML format')
  .option('--severity <level>', 'Minimum severity level (low|medium|high|critical)', 'low')
  .option('--config <file>', 'Custom configuration file')
  .option('--output <file>', 'Output file path (for JSON/SARIF/HTML)')
  .option('--verbose', 'Enable verbose logging', false)
  .option('--concurrency <n>', 'Number of parallel workers', '4')
  .action(action)
