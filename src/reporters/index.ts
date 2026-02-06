import type { Reporter } from './base.js'
import type { OutputFormat } from '../types/index.js'
import { TerminalReporter } from './terminal.js'
import { JsonReporter } from './json.js'
import { SarifReporter } from './sarif.js'
import { HtmlReporter } from './html.js'

export { Reporter, FileReporter } from './base.js'
export { TerminalReporter } from './terminal.js'
export { JsonReporter } from './json.js'
export { SarifReporter } from './sarif.js'
export { HtmlReporter } from './html.js'

export interface ReporterFactoryOptions {
  format: OutputFormat
  outputFile?: string
  verbose?: boolean
  pretty?: boolean
}

export class ReporterFactory {
  static create(options: ReporterFactoryOptions): Reporter {
    switch (options.format) {
      case 'terminal':
        return new TerminalReporter(options.verbose ?? false)

      case 'json':
        if (!options.outputFile) {
          throw new Error('Output file is required for JSON format')
        }
        return new JsonReporter(options.outputFile, options.pretty ?? true)

      case 'sarif':
        if (!options.outputFile) {
          throw new Error('Output file is required for SARIF format')
        }
        return new SarifReporter(options.outputFile)

      case 'html':
        if (!options.outputFile) {
          throw new Error('Output file is required for HTML format')
        }
        return new HtmlReporter(options.outputFile)

      default:
        throw new Error(`Unsupported output format: ${options.format}`)
    }
  }
}
