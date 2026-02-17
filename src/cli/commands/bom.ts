import { resolve, basename } from 'node:path'
import { writeFile, readFile } from 'node:fs/promises'
import { Command } from 'commander'
import chalk from 'chalk'
import { PlatformDiscovery } from '../../scanner/discovery.js'
import { PlatformRegistry } from '../../scanner/platforms/index.js'
import { createSpinner } from '../utils/progress.js'
import { printHeader } from '../utils/output.js'
import type {
  PlatformType,
  DiscoveredComponent,
  ComponentMetadata,
} from '../../types/index.js'
import { detectAIDependencies } from '../../scanner/dep-detector.js'
import { detectModelFiles } from '../../scanner/model-detector.js'
import { generateBom, type CycloneDXBom } from '../../scanner/bom-generator.js'

interface BomOptions {
  platform?: string
  output?: string
  verbose?: boolean
}

async function getProjectInfo(
  targetPath: string,
): Promise<{ name: string; version: string }> {
  try {
    const pkgPath = resolve(targetPath, 'package.json')
    const content = await readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(content) as { name?: string; version?: string }
    return {
      name: pkg.name ?? basename(targetPath),
      version: pkg.version ?? '0.0.0',
    }
  } catch {
    return { name: basename(targetPath), version: '0.0.0' }
  }
}

async function discoverComponents(
  targetPath: string | undefined,
  platformFilter?: string,
): Promise<{
  platforms: Array<{
    type: string
    name: string
    components: Array<{
      id: string
      name: string
      path: string
      type: string
      metadata: ComponentMetadata
    }>
  }>
}> {
  const discovery = new PlatformDiscovery()
  const resolvedPath = targetPath ? resolve(targetPath) : undefined

  let result
  if (resolvedPath) {
    const platforms = platformFilter
      ? [platformFilter as PlatformType]
      : PlatformRegistry.getSupportedPlatforms()
    result = await discovery.discoverAtPath(platforms, resolvedPath)
  } else if (platformFilter) {
    result = await discovery.discoverSpecific([platformFilter as PlatformType])
  } else {
    result = await discovery.discoverAll()
  }

  const platforms = []

  for (const detectedPlatform of result.platforms) {
    const analyzer = PlatformRegistry.getAnalyzer(detectedPlatform.type)
    let components: DiscoveredComponent[] = []
    try {
      components = await analyzer.discover(detectedPlatform.basePath)
    } catch {
      continue
    }

    const enrichedComponents = []
    for (const comp of components) {
      let metadata: ComponentMetadata = {}
      try {
        metadata = await analyzer.getMetadata(comp)
      } catch {
        // best effort
      }
      enrichedComponents.push({
        id: comp.id,
        name: comp.name,
        path: comp.path,
        type: comp.type,
        metadata,
      })
    }

    platforms.push({
      type: detectedPlatform.type,
      name: detectedPlatform.name,
      components: enrichedComponents,
    })
  }

  return { platforms }
}

function printBomSummary(bom: CycloneDXBom): void {
  console.log(chalk.bold('  Agent Bill of Materials (CycloneDX 1.7)'))
  console.log()

  const components = bom.components
  const apps = components.filter((c) => c.type === 'application')
  const libs = components.filter((c) => c.type === 'library')
  const models = components.filter((c) => c.type === 'machine-learning-model')

  console.log(`    Serial: ${chalk.dim(bom.serialNumber)}`)
  console.log(`    Components: ${components.length}`)

  if (apps.length > 0) {
    console.log(`      Applications: ${apps.length}`)
  }
  if (libs.length > 0) {
    console.log(`      Libraries: ${libs.length}`)
  }
  if (models.length > 0) {
    console.log(`      ML Models: ${models.length}`)
  }

  console.log(`    Dependencies: ${bom.dependencies.length}`)
  console.log()
}

async function action(
  targetPath: string | undefined,
  options: BomOptions,
): Promise<void> {
  printHeader()

  const spinner = createSpinner('Generating Agent BOM...')
  spinner.start()

  try {
    const scanPath = targetPath ? resolve(targetPath) : process.cwd()
    const projectInfo = await getProjectInfo(scanPath)

    const { platforms } = await discoverComponents(
      targetPath,
      options.platform,
    )
    const dependencies = await detectAIDependencies(scanPath)
    const models = await detectModelFiles(scanPath)

    const bom = generateBom({
      projectName: projectInfo.name,
      projectVersion: projectInfo.version,
      platforms,
      dependencies,
      models,
    })

    spinner.succeed('Agent BOM generated')

    const jsonOutput = JSON.stringify(bom, null, 2)

    if (options.output) {
      await writeFile(options.output, jsonOutput, 'utf-8')
      printBomSummary(bom)
      console.log(chalk.dim(`  Saved to ${options.output}`))
    } else {
      console.log(jsonOutput)
    }
  } catch (error) {
    spinner.fail('BOM generation failed')
    console.error(
      chalk.red('  Error:'),
      error instanceof Error ? error.message : 'Unknown error',
    )
    process.exit(1)
  }
}

export const bomCommand = new Command('bom')
  .description('Generate Agent Bill of Materials (CycloneDX 1.7)')
  .argument('[path]', 'Path to scan (default: current directory)')
  .option(
    '--platform <name>',
    'Include specific platform only',
  )
  .option('--output <file>', 'Save BOM to file (default: stdout)')
  .option('--verbose', 'Enable verbose logging', false)
  .action(action)
