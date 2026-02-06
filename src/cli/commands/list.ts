import { Command } from 'commander'
import { PlatformDiscovery } from '../../scanner/discovery.js'
import { printHeader, formatPlatformList } from '../utils/output.js'
import { createSpinner } from '../utils/progress.js'
// DetectedPlatform type is implicit from discovery.discoverAll()

interface ListOptions {
  json?: boolean
}

async function action(options: ListOptions): Promise<void> {
  if (!options.json) {
    printHeader()
  }

  const discovery = new PlatformDiscovery()
  const spinner = options.json ? null : createSpinner('Detecting platforms...')

  spinner?.start()

  const result = await discovery.discoverAll()

  spinner?.stop()

  if (options.json) {
    const output = {
      platforms: result.platforms.map((p) => ({
        type: p.type,
        name: p.name,
        basePath: p.basePath,
        componentCount: p.componentCount || 0,
      })),
      totalComponents: result.totalComponents,
    }
    console.log(JSON.stringify(output, null, 2))
  } else {
    formatPlatformList(result.platforms)
  }
}

export const listCommand = new Command('list')
  .description('List detected AI agent platforms')
  .option('--json', 'Output in JSON format')
  .action(action)
