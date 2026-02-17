import { VERSION } from '../version.js'
import type { ScanResult, Threat, SeverityLevel } from '../types/index.js'

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, char => map[char] ?? char)
}

export function formatPlatformName(platform: string): string {
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
  return names[platform] ?? platform
}

export function formatCategory(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function generateHeader(result: ScanResult): string {
  return `
    <div class="header">
      <h1>Firmis Scanner Report</h1>
      <p>Generated on ${new Date(result.startedAt).toLocaleString()}</p>
    </div>
    `
}

export function generateCoverageInfo(summary: ScanResult['summary']): string {
  const totalFiles = summary.filesAnalyzed + summary.filesNotAnalyzed
  if (totalFiles === 0 || summary.filesNotAnalyzed === 0) return ''

  const pct = Math.round((summary.filesNotAnalyzed / totalFiles) * 100)
  const warnClass = pct > 20 ? 'warning' : ''
  const capWarning = pct > 20
    ? '<p style="font-size: 0.875rem; color: #e67e22; margin-top: 0.5rem;">Grade capped at B due to low coverage</p>'
    : ''

  return `
      <div style="margin-top: 1.5rem;">
        <div class="summary-card ${warnClass}">
          <h3>Analysis Coverage</h3>
          <p style="font-size: 1rem;">${summary.filesAnalyzed}/${totalFiles} files analyzed (${pct}% not analyzable)</p>
          ${capWarning}
        </div>
      </div>
    `
}

export function generateSeverityBreakdown(
  bySeverity: Record<SeverityLevel, number>
): string {
  const total = Object.values(bySeverity).reduce((a, b) => a + b, 0)
  if (total === 0) return ''

  const criticalBadge = bySeverity.critical > 0
    ? `<span class="badge badge-critical">Critical: ${bySeverity.critical}</span>`
    : ''
  const highBadge = bySeverity.high > 0
    ? `<span class="badge badge-high">High: ${bySeverity.high}</span>`
    : ''
  const mediumBadge = bySeverity.medium > 0
    ? `<span class="badge badge-medium">Medium: ${bySeverity.medium}</span>`
    : ''
  const lowBadge = bySeverity.low > 0
    ? `<span class="badge badge-low">Low: ${bySeverity.low}</span>`
    : ''

  return `
      <div style="margin-top: 1.5rem;">
        <h3 style="margin-bottom: 0.75rem; font-size: 0.875rem; color: #666;">By Severity</h3>
        <div style="display: flex; gap: 0.5rem;">
          ${criticalBadge}
          ${highBadge}
          ${mediumBadge}
          ${lowBadge}
        </div>
      </div>
    `
}

export function generateSummary(result: ScanResult): string {
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
      ${generateCoverageInfo(summary)}
      ${generateSeverityBreakdown(summary.bySeverity)}
    </div>
    `
}

export function generateNoThreats(): string {
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

export function generateThreat(componentName: string, threat: Threat): string {
  const remediationSection = threat.remediation
    ? `
        <div class="threat-section">
          <h4>Remediation</h4>
          <p>${escapeHtml(threat.remediation)}</p>
        </div>
        `
    : ''

  return `
    <div class="threat">
      <div class="threat-header severity-${threat.severity}">
        <div class="threat-title">${escapeHtml(threat.message)}</div>
        <div class="threat-meta">
          <span>Component: <strong>${escapeHtml(componentName)}</strong></span>
          <span>Severity: <span class="badge badge-${threat.severity}">${threat.severity}</span></span>
          <span>Category: <strong>${formatCategory(threat.category)}</strong></span>
          <span>Confidence: <strong>${Math.round(threat.confidence)}%</strong></span>
        </div>
      </div>
      <div class="threat-body">
        <div class="threat-section">
          <h4>Evidence</h4>
          <ul class="evidence-list">
            ${threat.evidence.map(e => `<li class="evidence-item">${escapeHtml(e.description)}</li>`).join('')}
          </ul>
        </div>
        <div class="threat-section">
          <h4>Location</h4>
          <div class="code-location">
            ${escapeHtml(threat.location.file)}:${threat.location.line}:${threat.location.column}
          </div>
        </div>
        ${remediationSection}
      </div>
    </div>
    `
}

export function generateThreats(
  components: ScanResult['platforms'][0]['components']
): string {
  return components
    .filter(c => c.threats.length > 0)
    .map(component =>
      component.threats
        .map(threat => generateThreat(component.name, threat))
        .join('')
    )
    .join('')
}

export function generatePlatformResults(result: ScanResult): string {
  return result.platforms
    .map(platform => {
      const totalThreats = platform.threats.length
      const { components } = platform
      const threatsHtml = totalThreats > 0
        ? generateThreats(components)
        : generateNoThreats()

      return `
        <div class="platform-section">
          <div class="platform-header">
            <h2>${formatPlatformName(platform.platform)}</h2>
            <p class="platform-stats">
              ${components.length} components scanned · ${totalThreats} threats detected
            </p>
          </div>
          ${threatsHtml}
        </div>
        `
    })
    .join('')
}

export function generateFooter(result: ScanResult): string {
  return `
    <div class="footer">
      <p>Generated by Firmis Scanner v${VERSION} · Duration: ${result.duration}ms</p>
      <p style="margin-top: 0.5rem;">
        <a href="https://firmislabs.com" style="color: #667eea; text-decoration: none;">firmislabs.com</a>
      </p>
    </div>
    `
}
