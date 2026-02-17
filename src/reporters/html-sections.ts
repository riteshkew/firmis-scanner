import { VERSION } from '../version.js'
import type { ScanResult, Threat, SeverityLevel, SecurityGrade } from '../types/index.js'

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

const GRADE_COLORS: Record<SecurityGrade, string> = {
  A: '#27ae60',
  B: '#2ecc71',
  C: '#f39c12',
  D: '#e67e22',
  F: '#e74c3c',
}

const THEME_SCRIPT = `<script>(function(){var s=localStorage.getItem('firmis-theme');if(s==='dark')document.body.classList.add('dark');document.addEventListener('DOMContentLoaded',function(){var b=document.getElementById('theme-toggle');if(!b)return;b.textContent=document.body.classList.contains('dark')?'Light Mode':'Dark Mode';b.addEventListener('click',function(){var d=document.body.classList.toggle('dark');localStorage.setItem('firmis-theme',d?'dark':'light');b.textContent=d?'Light Mode':'Dark Mode';});});}());<\/script>`

export function generateHeader(result: ScanResult): string {
  const grade = result.score
  const color = GRADE_COLORS[grade]
  const date = escapeHtml(new Date(result.startedAt).toLocaleString())

  return `
    ${THEME_SCRIPT}
    <div class="header">
      <div class="header-top">
        <div class="header-info">
          <h1>Firmis Scanner Report</h1>
          <p>Generated on ${date}</p>
          <div class="header-controls">
            <button class="theme-toggle" id="theme-toggle">Dark Mode</button>
          </div>
        </div>
        <div class="grade-badge" style="border-color:${color};background:${color}22;">
          <span class="grade-letter" style="color:${color};">${grade}</span>
          <span class="grade-label">Security Grade</span>
        </div>
      </div>
    </div>
    `
}

export function generateCoverageInfo(summary: ScanResult['summary']): string {
  const totalFiles = summary.filesAnalyzed + summary.filesNotAnalyzed
  if (totalFiles === 0 || summary.filesNotAnalyzed === 0) return ''

  const pct = Math.round((summary.filesNotAnalyzed / totalFiles) * 100)
  const warnClass = pct > 20 ? 'warning' : ''
  const capWarning = pct > 20
    ? '<p style="font-size:0.875rem;color:#e67e22;margin-top:0.5rem;">Grade capped at B due to low coverage</p>'
    : ''

  return `
      <div style="margin-top:1.5rem;">
        <div class="summary-card ${warnClass}">
          <h3>Analysis Coverage</h3>
          <p style="font-size:1rem;">${summary.filesAnalyzed}/${totalFiles} files (${pct}% not analyzable)</p>
          ${capWarning}
        </div>
      </div>
    `
}

function buildSeverityBars(bySeverity: Record<SeverityLevel, number>): string {
  const total = Object.values(bySeverity).reduce((a, b) => a + b, 0)
  if (total === 0) return ''

  const levels: SeverityLevel[] = ['critical', 'high', 'medium', 'low']
  const rows = levels
    .filter(lvl => bySeverity[lvl] > 0)
    .map(lvl => {
      const pct = Math.round((bySeverity[lvl] / total) * 100)
      return `
        <div class="severity-bar">
          <span class="severity-bar-label">${lvl}</span>
          <div class="severity-bar-track">
            <div class="severity-bar-fill ${lvl}" style="--target-width:${pct}%;"></div>
          </div>
          <span class="severity-bar-count">${bySeverity[lvl]}</span>
        </div>`
    })
    .join('')

  return `
      <div class="severity-bar-row">
        <h3>By Severity</h3>
        ${rows}
      </div>`
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
      ${buildSeverityBars(summary.bySeverity)}
    </div>
    `
}

export function generateNoThreats(): string {
  return `
    <div class="no-threats">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3>No threats detected</h3>
      <p>All components passed security checks.</p>
    </div>
    `
}

function buildCopyPrompt(threat: Threat): string {
  const evidenceLines = threat.evidence
    .map(e => `  - ${e.description}`)
    .join('\\n')
  return [
    `I found this security issue in my AI agent code:`,
    `- Issue: ${threat.message}`,
    `- Severity: ${threat.severity}`,
    `- Category: ${threat.category}`,
    `- File: ${threat.location.file}:${threat.location.line}`,
    `- Evidence:\\n${evidenceLines}`,
    `Please help me fix this vulnerability.`,
  ].join('\\n')
}

function buildThreatHeader(componentName: string, threat: Threat, escapedPrompt: string): string {
  const onclick = `(function(btn){navigator.clipboard.writeText('${escapedPrompt}').then(function(){var t=btn.textContent;btn.textContent='Copied!';setTimeout(function(){btn.textContent=t;},2000);});})(this)`
  return `<div class="threat-header severity-${threat.severity}">
        <div class="threat-title">${escapeHtml(threat.message)}</div>
        <div class="threat-meta">
          <span>Component: <strong>${escapeHtml(componentName)}</strong></span>
          <span>Severity: <span class="badge badge-${threat.severity}">${threat.severity}</span></span>
          <span>Category: <strong>${formatCategory(threat.category)}</strong></span>
          <span>Confidence: <strong>${Math.round(threat.confidence)}%</strong></span>
        </div>
        <div class="threat-actions">
          <button class="copy-claude-btn" onclick="${onclick}">Copy for Claude</button>
        </div>
      </div>`
}

export function generateThreat(componentName: string, threat: Threat): string {
  const anchor = `threat-${escapeHtml(threat.id)}`
  const escapedPrompt = escapeHtml(buildCopyPrompt(threat))
  const header = buildThreatHeader(componentName, threat, escapedPrompt)
  const evidenceItems = threat.evidence
    .map(e => `<li class="evidence-item">${escapeHtml(e.description)}</li>`)
    .join('')
  const remediation = threat.remediation
    ? `<div class="threat-section"><h4>Remediation</h4><p>${escapeHtml(threat.remediation)}</p></div>`
    : ''

  return `
    <div class="threat" id="${anchor}">
      ${header}
      <div class="threat-body">
        <div class="threat-section">
          <h4>Evidence</h4>
          <ul class="evidence-list">${evidenceItems}</ul>
        </div>
        <div class="threat-section">
          <h4>Location</h4>
          <div class="code-location">${escapeHtml(threat.location.file)}:${threat.location.line}:${threat.location.column}</div>
        </div>
        ${remediation}
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
              ${components.length} components scanned &middot; ${totalThreats} threats detected
            </p>
          </div>
          ${threatsHtml}
        </div>
        `
    })
    .join('')
}

export function generateRuntimeRisks(result: ScanResult): string {
  const risks = result.runtimeRisksNotCovered
  if (risks.length === 0) return ''

  const items = risks
    .map(r => `<li class="runtime-risk-item">${escapeHtml(r)}</li>`)
    .join('')

  return `
    <div class="runtime-risks">
      <div class="runtime-risks-card">
        <h3>Runtime Risks Not Covered by Static Analysis</h3>
        <p>These risks require runtime monitoring to detect. Static scanning cannot observe them.</p>
        <ul style="list-style:none;">${items}</ul>
      </div>
    </div>
    `
}

export function generateFooter(result: ScanResult): string {
  return `
    <div class="footer">
      <p>Generated by Firmis Scanner v${VERSION} &middot; Duration: ${result.duration}ms</p>
      <p style="margin-top:0.5rem;">
        <a href="https://firmislabs.com" style="color:#667eea;text-decoration:none;">firmislabs.com</a>
      </p>
      <a class="firmis-badge" href="https://firmislabs.com" target="_blank" rel="noopener">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Scanned by Firmis
      </a>
    </div>
    `
}
