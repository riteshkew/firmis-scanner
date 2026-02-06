import type { ScanResult } from '../types/index.js'

export interface Reporter {
  report(result: ScanResult): Promise<void>
}

export interface FileReporter extends Reporter {
  getOutputPath(): string
}
