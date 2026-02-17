import { resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { Command } from 'commander'
import chalk from 'chalk'
import { PlatformDiscovery } from '../../scanner/discovery.js'
import { PlatformRegistry } from '../../scanner/platforms/index.js'
import { createSpinner } from '../utils/progress.js'
import { printHeader, printVerbose } from '../utils/output.js'
import type {
  PlatformType,
  ComponentMetadata,
  DiscoveredComponent,
  DetectedPlatform,
} from '../../types/index.js'
import { detectAIDependencies, type DependencyInfo } from '../../scanner/dep-detector.js'
import { detectModelFiles, type ModelFileInfo } from '../../scanner/model-detector.js'

interface DiscoverOptions {
  platform?: string
  json?: boolean
  output?: string
  verbose?: boolean
  showDeps?: boolean
  showModels?: boolean
}

interface ComponentInventory {
  id: string
  name: string
  path: string
  type: string
  configPath?: string
  metadata: ComponentMetadata
}

interface PlatformInventory {
  type: string
  name: string
  basePath: string
  components: ComponentInventory[]
}

export interface DiscoveryInventory {
  version: string
  timestamp: string
  platforms: PlatformInventory[]
  dependencies: DependencyInfo[]
  models: ModelFileInfo[]
  summary: {
    platformCount: number
    componentCount: number
    dependencyCount: number
    modelCount: number
  }
}

async function buildComponentInventory(
  component: DiscoveredComponent,
  analyzer: ReturnType<typeof PlatformRegistry.getAnalyzer>
): Promise<ComponentInventory> {
  let metadata: ComponentMetadata = {}
  try {
    metadata = await analyzer.getMetadata(component)
  } catch {
    // metadata extraction is best-effort
  }
  return {
    id: component.id,
    name: component.name,
    path: component.path,
    type: component.type,
    configPath: component.configPath,
    metadata,
  }
}

async function buildPlatformInventory(
  detectedPlatform: DetectedPlatform
): Promise<PlatformInventory> {
  const analyzer = PlatformRegistry.getAnalyzer(detectedPlatform.type)

  let components: DiscoveredComponent[] = []
  try {
    components = await analyzer.discover(detectedPlatform.basePath)
  } catch {
    // discovery failure is non-fatal
  }

  const componentInventories: ComponentInventory[] = []
  for (const component of components) {
    const inventory = await buildComponentInventory(component, analyzer)
    componentInventories.push(inventory)
  }

  return {
    type: detectedPlatform.type,
    name: detectedPlatform.name,
    basePath: detectedPlatform.basePath,
    components: componentInventories,
  }
}

async function runDiscovery(
  targetPath: string | undefined,
  options: DiscoverOptions
): Promise<DiscoveryInventory> {
  const discovery = new PlatformDiscovery()
  const resolvedPath = targetPath ? resolve(targetPath) : undefined

  let result
  if (resolvedPath) {
    const platforms = options.platform
      ? [options.platform as PlatformType]
      : PlatformRegistry.getSupportedPlatforms()
    result = await discovery.discoverAtPath(platforms, resolvedPath)
  } else if (options.platform) {
    result = await discovery.discoverSpecific([options.platform as PlatformType])
  } else {
    result = await discovery.discoverAll()
  }

  const platformInventories: PlatformInventory[] = []
  for (const detectedPlatform of result.platforms) {
    const inventory = await buildPlatformInventory(detectedPlatform)
    platformInventories.push(inventory)
  }

  const scanPath = resolvedPath ?? process.cwd()
  const dependencies = options.showDeps !== false ? await detectAIDependencies(scanPath) : []
  const models = options.showModels !== false ? await detectModelFiles(scanPath) : []

  const totalComponents = platformInventories.reduce(
    (sum, p) => sum + p.components.length,
    0
  )

  return {
    version: '1.3.0',
    timestamp: new Date().toISOString(),
    platforms: platformInventories,
    dependencies,
    models,
    summary: {
      platformCount: platformInventories.length,
      componentCount: totalComponents,
      dependencyCount: dependencies.length,
      modelCount: models.length,
    },
  }
}

function printComponentDetails(component: ComponentInventory): void {
  console.log(`    ${chalk.cyan('├')} ${component.name} [${component.type}]`)
}

function printComponentVerbose(component: ComponentInventory): void {
  console.log(`    ${chalk.dim('│')}   Path: ${chalk.dim(component.path)}`)
  if (component.metadata.version) {
    console.log(`    ${chalk.dim('│')}   Version: ${component.metadata.version}`)
  }
  if (component.metadata.author) {
    console.log(`    ${chalk.dim('│')}   Author: ${component.metadata.author}`)
  }
  if (component.metadata.permissions && component.metadata.permissions.length > 0) {
    console.log(`    ${chalk.dim('│')}   Permissions: ${component.metadata.permissions.join(', ')}`)
  }
  if (component.metadata.dependencies && component.metadata.dependencies.length > 0) {
    console.log(`    ${chalk.dim('│')}   Dependencies: ${component.metadata.dependencies.length}`)
  }
}

function printPlatforms(platforms: PlatformInventory[], verbose: boolean): void {
  for (const platform of platforms) {
    const count = platform.components.length
    const label = count === 1 ? 'component' : 'components'
    console.log(`  ${chalk.green('●')} ${chalk.bold(platform.name)} (${count} ${label})`)
    console.log(`    ${chalk.dim(platform.basePath)}`)

    for (const component of platform.components) {
      printComponentDetails(component)
      if (verbose) {
        printComponentVerbose(component)
      }
    }
    console.log()
  }
}

function printDependencies(dependencies: DependencyInfo[]): void {
  if (dependencies.length === 0) return
  console.log(chalk.bold('  AI Dependencies'))
  console.log()
  for (const dep of dependencies) {
    const sourceLabel = dep.source === 'npm' ? chalk.red('npm') : chalk.blue('pip')
    console.log(`    ${sourceLabel} ${chalk.bold(dep.name)}${dep.version ? ` @ ${dep.version}` : ''}`)
  }
  console.log()
}

function printModels(models: ModelFileInfo[], verbose: boolean): void {
  if (models.length === 0) return
  console.log(chalk.bold('  Model Files'))
  console.log()
  for (const model of models) {
    const sizeStr = model.sizeMB ? ` (${model.sizeMB.toFixed(1)} MB)` : ''
    console.log(`    ${chalk.magenta('●')} ${model.name} [${model.format}]${sizeStr}`)
    if (verbose) {
      console.log(`      ${chalk.dim(model.path)}`)
    }
  }
  console.log()
}

function printSummarySection(
  inventory: DiscoveryInventory
): void {
  const { summary } = inventory
  console.log(chalk.bold('  Summary'))
  console.log(`    Platforms: ${summary.platformCount}`)
  console.log(`    Components: ${summary.componentCount}`)
  if (summary.dependencyCount > 0) {
    console.log(`    AI Dependencies: ${summary.dependencyCount}`)
  }
  if (summary.modelCount > 0) {
    console.log(`    Model Files: ${summary.modelCount}`)
  }
  console.log()
}

function printDiscoveryResult(inventory: DiscoveryInventory, verbose: boolean): void {
  console.log(chalk.bold('  Discovery Results'))
  console.log()

  if (inventory.platforms.length === 0) {
    console.log(chalk.dim('  No AI platforms detected'))
    console.log()
  } else {
    printPlatforms(inventory.platforms, verbose)
  }

  printDependencies(inventory.dependencies)
  printModels(inventory.models, verbose)
  printSummarySection(inventory)
}

async function action(targetPath: string | undefined, options: DiscoverOptions): Promise<void> {
  if (!options.json) {
    printHeader()
  }

  printVerbose('Starting discovery', options.verbose ?? false)

  const spinner = options.json ? null : createSpinner('Discovering AI platforms...')
  spinner?.start()

  try {
    const inventory = await runDiscovery(targetPath, options)

    spinner?.stop()

    if (options.json) {
      const jsonOutput = JSON.stringify(inventory, null, 2)
      if (options.output) {
        await writeFile(options.output, jsonOutput, 'utf-8')
        console.log(`Discovery saved to ${options.output}`)
      } else {
        console.log(jsonOutput)
      }
      return
    }

    printDiscoveryResult(inventory, options.verbose ?? false)

    if (options.output) {
      await writeFile(options.output, JSON.stringify(inventory, null, 2), 'utf-8')
      console.log(chalk.dim(`  Discovery saved to ${options.output}`))
    }
  } catch (error) {
    spinner?.fail('Discovery failed')
    console.error(chalk.red('  Error:'), error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

export const discoverCommand = new Command('discover')
  .description('Discover AI platforms, components, dependencies, and models')
  .argument('[path]', 'Path to discover (default: auto-detect)')
  .option('--platform <name>', 'Discover specific platform (claude|mcp|codex|cursor|crewai|autogpt|openclaw|nanobot)')
  .option('--json', 'Output in JSON format')
  .option('--output <file>', 'Save discovery to file')
  .option('--verbose', 'Show detailed component metadata', false)
  .option('--show-deps', 'Show AI-related dependencies (default: true)', true)
  .option('--show-models', 'Show detected model files (default: true)', true)
  .action(action)
