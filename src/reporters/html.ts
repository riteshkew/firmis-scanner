import { writeFile } from 'node:fs/promises'
import type { FileReporter } from './base.js'
import type { ScanResult, Threat, SeverityLevel } from '../types/index.js'

export class HtmlReporter implements FileReporter {
  private readonly outputPath: string

  constructor(outputPath: string) {
    this.outputPath = outputPath
  }

  async report(result: ScanResult): Promise<void> {
    const html = this.generateHtml(result)
    await writeFile(this.outputPath, html, 'utf-8')
  }

  getOutputPath(): string {
    return this.outputPath
  }

  private generateHtml(result: ScanResult): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firmis Scanner Report - ${new Date(result.startedAt).toLocaleString()}</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  <div class="container">
    ${this.generateHeader(result)}
    ${this.generateSummary(result)}
    ${this.generatePlatformResults(result)}
    ${this.generateFooter(result)}
  </div>
</body>
</html>`
  }

  private getStyles(): string {
    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .header p {
      opacity: 0.9;
      font-size: 0.95rem;
    }

    .summary {
      padding: 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .summary h2 {
      margin-bottom: 1.5rem;
      color: #333;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }

    .summary-card.danger {
      border-left-color: #e74c3c;
    }

    .summary-card.warning {
      border-left-color: #f39c12;
    }

    .summary-card.success {
      border-left-color: #27ae60;
    }

    .summary-card h3 {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .summary-card p {
      font-size: 2rem;
      font-weight: 600;
      color: #333;
    }

    .platform-section {
      padding: 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .platform-section:last-of-type {
      border-bottom: none;
    }

    .platform-header {
      margin-bottom: 1.5rem;
    }

    .platform-header h2 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .platform-stats {
      color: #666;
      font-size: 0.9rem;
    }

    .threat {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .threat-header {
      padding: 1rem 1.5rem;
      border-left: 4px solid #e74c3c;
    }

    .threat-header.severity-critical {
      border-left-color: #c0392b;
      background: #fdecea;
    }

    .threat-header.severity-high {
      border-left-color: #e74c3c;
      background: #fdecea;
    }

    .threat-header.severity-medium {
      border-left-color: #f39c12;
      background: #fef5e7;
    }

    .threat-header.severity-low {
      border-left-color: #3498db;
      background: #ebf5fb;
    }

    .threat-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .threat-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.875rem;
    }

    .threat-meta span {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-critical {
      background: #c0392b;
      color: white;
    }

    .badge-high {
      background: #e74c3c;
      color: white;
    }

    .badge-medium {
      background: #f39c12;
      color: white;
    }

    .badge-low {
      background: #3498db;
      color: white;
    }

    .threat-body {
      padding: 1.5rem;
    }

    .threat-section {
      margin-bottom: 1.5rem;
    }

    .threat-section:last-child {
      margin-bottom: 0;
    }

    .threat-section h4 {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .evidence-list {
      list-style: none;
    }

    .evidence-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .evidence-item:last-child {
      border-bottom: none;
    }

    .evidence-item::before {
      content: "→";
      color: #667eea;
      margin-right: 0.5rem;
      font-weight: bold;
    }

    .code-location {
      background: #f8f9fa;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.875rem;
      color: #555;
    }

    .footer {
      padding: 2rem;
      background: #f8f9fa;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
    }

    .no-threats {
      text-align: center;
      padding: 3rem;
      color: #27ae60;
    }

    .no-threats svg {
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
    }
    `
  }

  private generateHeader(result: ScanResult): string {
    return `
    <div class="header">
      <h1>Firmis Scanner Report</h1>
      <p>Generated on ${new Date(result.startedAt).toLocaleString()}</p>
    </div>
    `
  }

  private generateSummary(result: ScanResult): string {
    const { summary } = result
    const hasThreatClass = summary.threatsFound > 0 ? 'danger' : 'success'

    return `
    <div class="summary">
      <h2>Scan Summary</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Components Scanned</h3>
          <p>${summary.totalComponents}</p>
        </div>
        <div class="summary-card">
          <h3>Files Analyzed</h3>
          <p>${summary.totalFiles}</p>
        </div>
        <div class="summary-card ${hasThreatClass}">
          <h3>Threats Detected</h3>
          <p>${summary.threatsFound}</p>
        </div>
        <div class="summary-card success">
          <h3>Components Passed</h3>
          <p>${summary.passedComponents}</p>
        </div>
      </div>
      ${this.generateSeverityBreakdown(summary.bySeverity)}
    </div>
    `
  }

  private generateSeverityBreakdown(
    bySeverity: Record<SeverityLevel, number>
  ): string {
    const total = Object.values(bySeverity).reduce((a, b) => a + b, 0)
    if (total === 0) return ''

    return `
      <div style="margin-top: 1.5rem;">
        <h3 style="margin-bottom: 0.75rem; font-size: 0.875rem; color: #666;">By Severity</h3>
        <div style="display: flex; gap: 0.5rem;">
          ${bySeverity.critical > 0 ? `<span class="badge badge-critical">Critical: ${bySeverity.critical}</span>` : ''}
          ${bySeverity.high > 0 ? `<span class="badge badge-high">High: ${bySeverity.high}</span>` : ''}
          ${bySeverity.medium > 0 ? `<span class="badge badge-medium">Medium: ${bySeverity.medium}</span>` : ''}
          ${bySeverity.low > 0 ? `<span class="badge badge-low">Low: ${bySeverity.low}</span>` : ''}
        </div>
      </div>
    `
  }

  private generatePlatformResults(result: ScanResult): string {
    return result.platforms
      .map((platform) => {
        const totalThreats = platform.threats.length
        const components = platform.components

        return `
        <div class="platform-section">
          <div class="platform-header">
            <h2>${this.formatPlatformName(platform.platform)}</h2>
            <p class="platform-stats">
              ${components.length} components scanned · ${totalThreats} threats detected
            </p>
          </div>
          ${totalThreats > 0 ? this.generateThreats(components) : this.generateNoThreats()}
        </div>
        `
      })
      .join('')
  }

  private generateThreats(
    components: ScanResult['platforms'][0]['components']
  ): string {
    return components
      .filter((c) => c.threats.length > 0)
      .map((component) => {
        return component.threats
          .map((threat) => this.generateThreat(component.name, threat))
          .join('')
      })
      .join('')
  }

  private generateThreat(componentName: string, threat: Threat): string {
    return `
    <div class="threat">
      <div class="threat-header severity-${threat.severity}">
        <div class="threat-title">${this.escapeHtml(threat.message)}</div>
        <div class="threat-meta">
          <span>Component: <strong>${this.escapeHtml(componentName)}</strong></span>
          <span>Severity: <span class="badge badge-${threat.severity}">${threat.severity}</span></span>
          <span>Category: <strong>${this.formatCategory(threat.category)}</strong></span>
          <span>Confidence: <strong>${Math.round(threat.confidence)}%</strong></span>
        </div>
      </div>
      <div class="threat-body">
        <div class="threat-section">
          <h4>Evidence</h4>
          <ul class="evidence-list">
            ${threat.evidence.map((e) => `<li class="evidence-item">${this.escapeHtml(e.description)}</li>`).join('')}
          </ul>
        </div>
        <div class="threat-section">
          <h4>Location</h4>
          <div class="code-location">
            ${this.escapeHtml(threat.location.file)}:${threat.location.line}:${threat.location.column}
          </div>
        </div>
        ${threat.remediation ? `
        <div class="threat-section">
          <h4>Remediation</h4>
          <p>${this.escapeHtml(threat.remediation)}</p>
        </div>
        ` : ''}
      </div>
    </div>
    `
  }

  private generateNoThreats(): string {
    return `
    <div class="no-threats">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3>No threats detected</h3>
      <p>All components passed security checks.</p>
    </div>
    `
  }

  private generateFooter(result: ScanResult): string {
    return `
    <div class="footer">
      <p>Generated by Firmis Scanner v1.0.0 · Duration: ${result.duration}ms</p>
      <p style="margin-top: 0.5rem;">
        <a href="https://firmislabs.com" style="color: #667eea; text-decoration: none;">firmislabs.com</a>
      </p>
    </div>
    `
  }

  private formatPlatformName(platform: string): string {
    const names: Record<string, string> = {
      claude: 'Claude Skills',
      mcp: 'MCP Servers',
      codex: 'OpenAI Codex Plugins',
      cursor: 'Cursor Extensions',
      crewai: 'CrewAI Agents',
      autogpt: 'AutoGPT Plugins',
      openclaw: 'OpenClaw Skills',
      nanobot: 'Nanobot Agents',
      langchain: 'LangChain Tools',
      custom: 'Custom Agents',
    }
    return names[platform] || platform
  }

  private formatCategory(category: string): string {
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (char) => map[char] ?? char)
  }
}
