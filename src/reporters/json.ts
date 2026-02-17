import { writeFile } from 'node:fs/promises'
import type { FileReporter } from './base.js'
import type { ScanResult } from '../types/index.js'

export class JsonReporter implements FileReporter {
  private readonly outputPath: string | null
  private readonly pretty: boolean

  constructor(outputPath?: string, pretty = true) {
    this.outputPath = outputPath ?? null
    this.pretty = pretty
  }

  async report(result: ScanResult): Promise<void> {
    const json = this.pretty
      ? JSON.stringify(result, null, 2)
      : JSON.stringify(result)

    if (this.outputPath) {
      await writeFile(this.outputPath, json, 'utf-8')
    } else {
      process.stdout.write(json + '\n')
    }
  }

  getOutputPath(): string {
    return this.outputPath ?? '(stdout)'
  }
}
