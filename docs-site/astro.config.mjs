// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.firmislabs.com',
  integrations: [
    starlight({
      title: 'Firmis',
      description: 'AI agent security scanner — detect threats in Claude Skills, MCP Servers, Codex Plugins, and more.',
      social: [
        { icon: 'external', label: 'firmislabs.com', href: 'https://firmislabs.com' },
        { icon: 'github', label: 'GitHub', href: 'https://github.com/riteshkew/firmis-scanner' },
      ],
      editLink: {
        baseUrl: 'https://github.com/riteshkew/firmis-scanner/edit/main/docs-site/',
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Firmis',
            applicationCategory: 'SecurityApplication',
            applicationSubCategory: 'Static Analysis',
            operatingSystem: 'Linux, macOS, Windows',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            url: 'https://firmislabs.com',
            downloadUrl: 'https://www.npmjs.com/package/firmis-scanner',
            featureList: [
              'MCP server security scanning',
              'Claude Skills threat detection',
              'Prompt injection detection',
              'Supply chain vulnerability analysis',
              'Agent BOM (CycloneDX 1.7)',
              '209 YAML detection rules',
              'SARIF and JSON output',
              'CI/CD pipeline integration',
            ],
            runtimePlatform: 'Node.js',
            license: 'https://opensource.org/licenses/MIT',
            author: { '@type': 'Organization', name: 'Firmis Labs' },
          }),
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Quick Start', slug: 'quickstart' },
            { label: 'Installation', slug: 'installation' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'How It Works', slug: 'concepts/how-it-works' },
            { label: 'Threat Model', slug: 'concepts/threat-model' },
            { label: 'Detection Engine', slug: 'concepts/detection-engine' },
            { label: 'Agent BOM', slug: 'concepts/agent-bom' },
            { label: 'Platforms', slug: 'concepts/platforms' },
          ],
        },
        {
          label: 'CLI Reference',
          items: [
            { label: 'scan', slug: 'cli/scan', badge: { text: 'GA', variant: 'success' } },
            { label: 'discover', slug: 'cli/discover', badge: { text: 'GA', variant: 'success' } },
            { label: 'bom', slug: 'cli/bom', badge: { text: 'GA', variant: 'success' } },
            { label: 'ci', slug: 'cli/ci', badge: { text: 'GA', variant: 'success' } },
            { label: 'list', slug: 'cli/list', badge: { text: 'GA', variant: 'success' } },
            { label: 'validate', slug: 'cli/validate', badge: { text: 'GA', variant: 'success' } },
            { label: 'fix', slug: 'cli/fix', badge: { text: 'Beta', variant: 'caution' } },
            { label: 'pentest', slug: 'cli/pentest', badge: { text: 'Beta', variant: 'caution' } },
            { label: 'monitor', slug: 'cli/monitor', badge: { text: 'Beta', variant: 'caution' } },
            { label: 'compliance', slug: 'cli/compliance', badge: { text: 'Beta', variant: 'caution' } },
            { label: 'policy', slug: 'cli/policy', badge: { text: 'Beta', variant: 'caution' } },
          ],
        },
        {
          label: 'Platforms',
          items: [
            { label: 'Claude Skills', slug: 'platforms/claude-skills' },
            { label: 'MCP Servers', slug: 'platforms/mcp-servers' },
            { label: 'Codex Plugins', slug: 'platforms/codex-plugins' },
            { label: 'Cursor Rules', slug: 'platforms/cursor-rules' },
            { label: 'CrewAI Agents', slug: 'platforms/crewai-agents' },
            { label: 'AutoGPT Plugins', slug: 'platforms/autogpt-plugins' },
            { label: 'OpenClaw Skills', slug: 'platforms/openclaw-skills' },
            { label: 'Nanobot Plugins', slug: 'platforms/nanobot-plugins' },
          ],
        },
        {
          label: 'Rules',
          items: [
            { label: 'Overview', slug: 'rules/overview' },
            { label: 'Built-in Rules', slug: 'rules/built-in-rules' },
            { label: 'Custom Rules', slug: 'rules/custom-rules' },
            { label: 'Ignoring Findings', slug: 'rules/ignoring-findings' },
          ],
        },
        {
          label: 'Integrations',
          items: [
            { label: 'GitHub Actions', slug: 'integrations/github-actions' },
            { label: 'GitLab CI', slug: 'integrations/gitlab-ci' },
            { label: 'Pre-commit Hooks', slug: 'integrations/pre-commit-hooks' },
            { label: 'TypeScript API', slug: 'integrations/typescript-api' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Securing MCP Servers', slug: 'guides/securing-mcp-servers' },
            { label: 'Scanning Claude Skills', slug: 'guides/scanning-claude-skills' },
            { label: 'Agent Supply Chain Security', slug: 'guides/agent-supply-chain-security' },
            { label: 'Compliance Reporting', slug: 'guides/compliance-reporting', badge: { text: 'Beta', variant: 'caution' } },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Configuration', slug: 'reference/config-schema' },
            { label: 'SARIF Output', slug: 'reference/sarif-output' },
            { label: 'CycloneDX BOM', slug: 'reference/cyclonedx-bom' },
            { label: 'Threat Categories', slug: 'reference/threat-categories' },
            { label: 'Security Model', slug: 'reference/security-model' },
          ],
        },
        {
          label: 'Project',
          items: [
            { label: 'Changelog', slug: 'changelog' },
            { label: 'Security', slug: 'security' },
            { label: 'Privacy', slug: 'privacy' },
          ],
        },
      ],
    }),
  ],
});
