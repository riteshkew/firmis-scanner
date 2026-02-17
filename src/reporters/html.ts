import { writeFile } from 'node:fs/promises'
import type { FileReporter } from './base.js'
import type { ScanResult } from '../types/index.js'
import { getHtmlStyles } from './html-styles.js'
import { getDarkThemeStyles } from './html-dark-theme.js'
import {
  generateHeader,
  generateSummary,
  generatePlatformResults,
  generateRuntimeRisks,
  generateFooter,
} from './html-sections.js'

export class HtmlReporter implements FileReporter {
  private readonly outputPath: string

  constructor(outputPath: string) {
    this.outputPath = outputPath
  }

  async report(result: ScanResult): Promise<void> {
    const html = generateHtml(result)
    await writeFile(this.outputPath, html, 'utf-8')
  }

  getOutputPath(): string {
    return this.outputPath
  }
}

function generateHtml(result: ScanResult): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firmis Scanner Report - ${new Date(result.startedAt).toLocaleString()}</title>
  <style>
    ${getHtmlStyles()}
    ${getDarkThemeStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${generateHeader(result)}
    ${generateSummary(result)}
    ${generatePlatformResults(result)}
    ${generateRuntimeRisks(result)}
    ${generateFooter(result)}
  </div>
</body>
</html>`
}
