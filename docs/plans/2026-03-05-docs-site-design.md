# Firmis Documentation Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship docs.firmislabs.com — an agent-first, SEO-optimized documentation site for Firmis Scanner using Astro Starlight, deployed to Cloudflare Pages.

**Architecture:** Astro Starlight static site with MDX content, auto-generated rule catalog and CLI reference pages, llms.txt/llms-full.txt generation at build time, JSON-LD structured data, and Cloudflare Pages deployment. Content lives in a new `docs-site/` directory within the firmis-scanner repo.

**Tech Stack:** Astro 5.x, Starlight 0.32+, MDX, TypeScript, Cloudflare Pages, Node.js 20+

---

## Phase 1: Scaffold & Deploy (Tasks 1–3)

### Task 1: Initialize Starlight Project

**Files:**
- Create: `docs-site/package.json`
- Create: `docs-site/astro.config.mjs`
- Create: `docs-site/tsconfig.json`
- Create: `docs-site/src/content/docs/index.mdx`

**Step 1: Scaffold Starlight**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
npm create astro@latest docs-site -- --template starlight --install --no-git
```

Accept defaults. This creates the full Starlight scaffold.

**Step 2: Verify it builds**

```bash
cd docs-site && npm run build
```

Expected: Build succeeds, `dist/` directory created.

**Step 3: Verify dev server**

```bash
npm run dev
```

Expected: Dev server at `http://localhost:4321` with default Starlight template.

**Step 4: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/
git commit -m "feat(docs): scaffold Starlight docs site"
```

---

### Task 2: Configure Starlight Navigation & Theme

**Files:**
- Modify: `docs-site/astro.config.mjs`
- Create: `docs-site/src/content/docs/index.mdx` (replace default)

**Step 1: Configure astro.config.mjs with full sidebar**

Replace the contents of `docs-site/astro.config.mjs` with:

```javascript
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.firmislabs.com',
  integrations: [
    starlight({
      title: 'Firmis',
      description: 'AI agent security scanner — detect threats in Claude Skills, MCP Servers, Codex Plugins, and more.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: [
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
              '199 YAML detection rules',
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
```

**Step 2: Create placeholder logo assets**

```bash
mkdir -p docs-site/src/assets
# Create minimal SVG placeholders (replace with real logos later)
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32"><text y="24" font-size="24" font-family="system-ui" font-weight="700" fill="#1a1a2e">Firmis</text></svg>' > docs-site/src/assets/logo-light.svg
echo '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32"><text y="24" font-size="24" font-family="system-ui" font-weight="700" fill="#e0e0e0">Firmis</text></svg>' > docs-site/src/assets/logo-dark.svg
```

**Step 3: Create custom CSS stub**

```bash
mkdir -p docs-site/src/styles
cat > docs-site/src/styles/custom.css << 'CSS'
/* Firmis docs custom styles */
:root {
  --sl-color-accent-low: #1a1a2e;
  --sl-color-accent: #4a6cf7;
  --sl-color-accent-high: #e8ecff;
}
:root[data-theme='dark'] {
  --sl-color-accent-low: #e8ecff;
  --sl-color-accent: #4a6cf7;
  --sl-color-accent-high: #1a1a2e;
}
CSS
```

**Step 4: Build and verify sidebar renders**

```bash
cd docs-site && npm run build
```

Expected: Build succeeds. (Pages will 404 until content is created — that's fine.)

**Step 5: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/
git commit -m "feat(docs): configure Starlight sidebar, theme, and JSON-LD"
```

---

### Task 3: Deploy to Cloudflare Pages

**Files:**
- Create: `docs-site/wrangler.toml` (optional, can use dashboard instead)

**Step 1: Create Cloudflare Pages project via dashboard or CLI**

```bash
cd docs-site
npx wrangler pages project create firmis-docs --production-branch main
```

**Step 2: Deploy**

```bash
cd docs-site && npm run build
npx wrangler pages deploy dist --project-name firmis-docs
```

Expected: Deployment URL printed (e.g., `https://firmis-docs.pages.dev`).

**Step 3: Configure custom domain**

In Cloudflare dashboard:
1. Pages → firmis-docs → Custom domains → Add `docs.firmislabs.com`
2. This auto-creates the CNAME record if firmislabs.com DNS is on Cloudflare

**Step 4: Verify live site**

```bash
curl -I https://docs.firmislabs.com
```

Expected: HTTP 200 response.

**Step 5: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/wrangler.toml
git commit -m "feat(docs): add Cloudflare Pages deployment config"
```

---

## Phase 2: Core Content Pages (Tasks 4–9)

All content pages follow this structure convention:

```mdx
---
title: "Page Title — Context Phrase"
description: "One-sentence description for SEO and agents."
sidebar:
  label: Short Label
  badge:
    text: GA
    variant: success
---

> One-sentence TL;DR in blockquote.

## Overview
What this is and why it matters. 2-3 sentences max.

## Usage
Code blocks with `title="filename or context"` annotations.

## Options
Tables for all flags, config, parameters.

## Examples
Real-world scenarios with labeled code blocks.

## Related
Links to related pages as a card group.
```

### Task 4: Write Quick Start + Installation Pages

**Files:**
- Create: `docs-site/src/content/docs/quickstart.mdx`
- Create: `docs-site/src/content/docs/installation.mdx`

**Step 1: Write quickstart.mdx**

```mdx
---
title: "Quick Start — Your First Scan in 60 Seconds"
description: "Install Firmis and scan your AI agent components for security threats. Zero config, zero signup, runs entirely offline."
---

import { Aside, Card, CardGrid } from '@astrojs/starlight/components';

> Scan your AI agent code for security threats in one command. No signup, no config, no data uploaded.

<Aside type="tip">
  Firmis runs entirely offline. Your code is never uploaded, transmitted, or collected. [Privacy policy →](/privacy)
</Aside>

## Run your first scan

```bash title="Terminal"
npx firmis scan .
```

That's it. Firmis auto-detects Claude Skills, MCP Servers, Codex Plugins, Cursor Rules, and 4 more platforms in your project.

## What you'll see

```text title="Example output"
 Firmis Scanner v1.3.0

 Scanning: /your/project
 Platforms: mcp (3 servers), claude (2 skills)
 Rules: 199 enabled

 CRITICAL  tp-003  Hidden instruction in tool description
           src/tools/search.ts:14

 HIGH      de-002  Data sent to external URL in tool handler
           src/tools/fetch.ts:42

 HIGH      sd-015  Hardcoded API key detected
           .env.example:3

 Found 3 threats (1 critical, 2 high) in 1.2s
```

## Next steps

<CardGrid>
  <Card title="Scan a specific platform" icon="magnifier">
    `npx firmis scan --platform mcp`

    [CLI Reference →](/cli/scan)
  </Card>
  <Card title="Add to your CI pipeline" icon="rocket">
    One command for discover → BOM → scan → report.

    [CI Integration →](/cli/ci)
  </Card>
  <Card title="Understand the findings" icon="information">
    16 threat categories mapped to MITRE and OWASP.

    [Threat Categories →](/reference/threat-categories)
  </Card>
</CardGrid>
```

**Step 2: Write installation.mdx**

```mdx
---
title: "Installation"
description: "Install Firmis Scanner via npx (zero install), npm, or yarn. Requires Node.js 20+."
---

> Firmis requires Node.js 20 or later. No other dependencies.

## Zero install (recommended)

```bash title="Terminal"
npx firmis scan .
```

No global install needed. Always uses the latest version.

## Global install

```bash title="npm"
npm install -g firmis-scanner
```

```bash title="yarn"
yarn global add firmis-scanner
```

```bash title="pnpm"
pnpm add -g firmis-scanner
```

Then run:

```bash title="Terminal"
firmis scan .
```

## Project dependency

```bash title="Terminal"
npm install --save-dev firmis-scanner
```

```json title="package.json"
{
  "scripts": {
    "security": "firmis scan .",
    "security:ci": "firmis ci --fail-on high --format sarif"
  }
}
```

## Verify installation

```bash title="Terminal"
firmis --version
```

Expected: `firmis-scanner v1.3.0` (or later).

## Requirements

| Requirement | Version |
|---|---|
| Node.js | >= 20.0.0 |
| npm | >= 9.0.0 (ships with Node 20) |
| OS | macOS, Linux, Windows |
| Network | Not required (fully offline) |
```

**Step 3: Build and verify**

```bash
cd docs-site && npm run build
```

Expected: Both pages render without errors.

**Step 4: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/quickstart.mdx docs-site/src/content/docs/installation.mdx
git commit -m "feat(docs): add quickstart and installation pages"
```

---

### Task 5: Write Landing Page (index.mdx)

**Files:**
- Modify: `docs-site/src/content/docs/index.mdx`

**Step 1: Replace the default index with outcome-first landing page**

```mdx
---
title: Firmis — AI Agent Security Scanner
description: "Detect malicious behavior in Claude Skills, MCP Servers, Codex Plugins, Cursor Rules, and more. 199 built-in rules. Zero install. Runs offline."
template: splash
hero:
  title: Security scanner for AI agents
  tagline: Detect threats in Claude Skills, MCP Servers, Codex Plugins, and 5 more platforms. 199 rules. Zero install. Fully offline.
  actions:
    - text: Get started
      link: /quickstart/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/riteshkew/firmis-scanner
      icon: external
      variant: minimal
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## What can you do with Firmis?

<CardGrid>
  <Card title="Find threats in your AI agents" icon="warning">
    Scan for prompt injection, data exfiltration, credential harvesting, and 13 more threat categories.

    [Scan your project →](/cli/scan)
  </Card>
  <Card title="Audit your MCP servers" icon="magnifier">
    Detect tool poisoning, hidden instructions, and unauthorized network access in MCP server configurations.

    [MCP guide →](/platforms/mcp-servers)
  </Card>
  <Card title="Generate a security BOM" icon="document">
    CycloneDX 1.7 Agent Bill of Materials — every component, dependency, and model in your AI stack.

    [Generate BOM →](/cli/bom)
  </Card>
  <Card title="Secure your CI pipeline" icon="rocket">
    One command: discover → BOM → scan → report. SARIF output for GitHub Security tab.

    [CI integration →](/cli/ci)
  </Card>
</CardGrid>

## Supported platforms

| Platform | Components Detected | Maturity |
|---|---|---|
| [Claude Skills](/platforms/claude-skills) | CLAUDE.md, tool definitions, permissions | GA |
| [MCP Servers](/platforms/mcp-servers) | Server configs, tool handlers, transport | GA |
| [Cursor Rules](/platforms/cursor-rules) | .cursorrules, settings, extensions | GA |
| [Codex Plugins](/platforms/codex-plugins) | Plugin manifests, tool definitions | Beta |
| [CrewAI Agents](/platforms/crewai-agents) | Agent configs, tool definitions, tasks | Beta |
| [AutoGPT Plugins](/platforms/autogpt-plugins) | Plugin manifests, commands | Experimental |
| [OpenClaw Skills](/platforms/openclaw-skills) | Skill definitions, handlers | Experimental |
| [Nanobot Plugins](/platforms/nanobot-plugins) | Plugin configs, tool handlers | Experimental |

## How it works

```text
npx firmis scan .
       │
       ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Discovery   │───▶│  Rule Engine  │───▶│   Reporter   │
│              │    │              │    │              │
│ Auto-detect  │    │ 199 YAML     │    │ Terminal     │
│ 8 platforms  │    │ rules across │    │ JSON / SARIF │
│ components   │    │ 16 threat    │    │ HTML report  │
│ dependencies │    │ categories   │    │              │
└─────────────┘    └──────────────┘    └─────────────┘
```

[Learn how the detection engine works →](/concepts/how-it-works)
```

**Step 2: Build and verify**

```bash
cd docs-site && npm run build
```

**Step 3: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/index.mdx
git commit -m "feat(docs): add outcome-first landing page"
```

---

### Task 6: Write CLI Reference Pages (GA commands)

**Files:**
- Create: `docs-site/src/content/docs/cli/scan.mdx`
- Create: `docs-site/src/content/docs/cli/discover.mdx`
- Create: `docs-site/src/content/docs/cli/bom.mdx`
- Create: `docs-site/src/content/docs/cli/ci.mdx`
- Create: `docs-site/src/content/docs/cli/list.mdx`
- Create: `docs-site/src/content/docs/cli/validate.mdx`

Each page follows the exact same structure. Here's `scan.mdx` as the template — all 6 follow this pattern.

**Step 1: Write cli/scan.mdx**

```mdx
---
title: "firmis scan — Scan AI Agent Components"
description: "Scan Claude Skills, MCP Servers, Codex Plugins, and more for security threats. Supports JSON, SARIF, HTML output. 199 built-in detection rules."
sidebar:
  label: scan
  badge:
    text: GA
    variant: success
---

> Scan AI agent components for security threats. Auto-detects platforms or scans a specific one.

## Usage

```bash title="Terminal"
firmis scan [path] [options]
```

If `[path]` is omitted, Firmis scans the current directory.

## Options

| Flag | Type | Default | Description |
|---|---|---|---|
| `--platform <name>` | string | auto-detect | Scan a specific platform: `claude`, `mcp`, `codex`, `cursor`, `crewai`, `autogpt`, `openclaw`, `nanobot` |
| `--all` | boolean | `true` | Scan all detected platforms |
| `--severity <level>` | enum | `low` | Minimum severity to report: `low`, `medium`, `high`, `critical` |
| `--fail-on <level>` | enum | — | Exit non-zero if findings at this severity or above |
| `--json` | boolean | `false` | Output findings as JSON |
| `--sarif` | boolean | `false` | Output findings as SARIF 2.1.0 |
| `--html` | boolean | `false` | Output findings as HTML report |
| `--output <file>` | string | stdout | Write output to file instead of stdout |
| `--config <file>` | string | — | Path to custom config file |
| `--ignore <rules>` | string | — | Skip specific rule IDs (comma-separated) |
| `--concurrency <n>` | number | `4` | Number of parallel workers |
| `--verbose` | boolean | `false` | Show detailed scan progress |
| `--quiet` | boolean | `false` | Suppress terminal output; only exit code |

## Examples

### Scan current directory (auto-detect all platforms)

```bash title="Terminal"
npx firmis scan
```

### Scan only MCP servers with JSON output

```bash title="Terminal"
npx firmis scan --platform mcp --json
```

### Fail CI if high or critical findings

```bash title="Terminal"
npx firmis scan --fail-on high --sarif --output results.sarif
```

### Scan a specific path, ignore false positives

```bash title="Terminal"
npx firmis scan ./packages/agent --ignore sd-045,sd-046
```

### Generate HTML report

```bash title="Terminal"
npx firmis scan --html --output report.html
```

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Scan completed, no findings above `--fail-on` threshold |
| `1` | Findings found above `--fail-on` threshold |
| `2` | Scan error (invalid path, config error, etc.) |

## Related

- [Threat Categories](/reference/threat-categories) — what Firmis detects
- [Ignoring Findings](/rules/ignoring-findings) — suppress specific rules or files
- [CI Pipeline](/cli/ci) — full discover → BOM → scan → report pipeline
```

**Step 2: Write remaining 5 CLI pages**

Write `discover.mdx`, `bom.mdx`, `ci.mdx`, `list.mdx`, `validate.mdx` following the same structure. Use the option tables from the CLI exploration above. Key specifics:

- `discover.mdx`: description "Discover AI platforms, components, dependencies, and models", options: `--platform`, `--json`, `--output`, `--verbose`, `--show-deps`, `--show-models`
- `bom.mdx`: description "Generate Agent Bill of Materials (CycloneDX 1.7)", options: `--platform`, `--output`, `--verbose`
- `ci.mdx`: description "CI pipeline: discover → bom → scan → report", options: `--platform`, `--fail-on`, `--format`, `--output`, `--bom-output`, `--quiet`, `--verbose`
- `list.mdx`: description "List detected AI agent platforms", options: `--json`
- `validate.mdx`: description "Validate rule files (custom and/or built-in)", argument: `[rules...]`, options: `--strict`, `--built-in`

**Step 3: Build and verify**

```bash
cd docs-site && npm run build
```

Expected: All 6 CLI pages render.

**Step 4: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/cli/
git commit -m "feat(docs): add CLI reference pages for all 6 GA commands"
```

---

### Task 7: Write CLI Reference Pages (Beta commands — stubs)

**Files:**
- Create: `docs-site/src/content/docs/cli/fix.mdx`
- Create: `docs-site/src/content/docs/cli/pentest.mdx`
- Create: `docs-site/src/content/docs/cli/monitor.mdx`
- Create: `docs-site/src/content/docs/cli/compliance.mdx`
- Create: `docs-site/src/content/docs/cli/policy.mdx`

**Step 1: Write beta command stubs**

Each beta page follows this pattern:

```mdx
---
title: "firmis fix — Auto-Fix Security Threats"
description: "Automatically remediate detected security threats in AI agent configurations. Beta — APIs may change."
sidebar:
  label: fix
  badge:
    text: Beta
    variant: caution
---

import { Aside } from '@astrojs/starlight/components';

> Automatically remediate detected security threats in AI agent configurations.

<Aside type="caution" title="Beta">
  This feature is in beta. APIs and behavior may change between releases.
  Available in the [Firmis Engine](https://github.com/riteshkew/firmis-engine) private beta.
  [Request access →](mailto:beta@firmislabs.com)
</Aside>

## Usage

```bash title="Terminal"
firmis fix [path] [options]
```

## What it does

The fix engine analyzes scan findings and generates remediation patches:

- Removes hardcoded secrets and replaces with environment variable references
- Rewrites overly permissive tool permissions to least-privilege
- Adds missing input validation to tool handlers
- Quarantines known-malicious components

## Options

| Flag | Type | Default | Description |
|---|---|---|---|
| `--platform <name>` | string | auto-detect | Fix specific platform only |
| `--dry-run` | boolean | `false` | Show proposed fixes without applying |
| `--severity <level>` | enum | `high` | Only fix findings at this severity or above |
| `--output <file>` | string | — | Write fix report to file |
| `--verbose` | boolean | `false` | Show detailed fix progress |
| `--interactive` | boolean | `true` | Prompt before each fix |

## Related

- [scan](/cli/scan) — detect threats before fixing
- [Threat Categories](/reference/threat-categories) — what gets fixed
```

Write similar stubs for `pentest`, `monitor`, `compliance`, `policy` — each with the Beta aside, basic description of what it does, option table, and Related links.

**Step 2: Build and verify**

```bash
cd docs-site && npm run build
```

**Step 3: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/cli/
git commit -m "feat(docs): add beta CLI command stubs (fix, pentest, monitor, compliance, policy)"
```

---

### Task 8: Write Concepts Section

**Files:**
- Create: `docs-site/src/content/docs/concepts/how-it-works.mdx`
- Create: `docs-site/src/content/docs/concepts/threat-model.mdx`
- Create: `docs-site/src/content/docs/concepts/detection-engine.mdx`
- Create: `docs-site/src/content/docs/concepts/agent-bom.mdx`
- Create: `docs-site/src/content/docs/concepts/platforms.mdx`

**Step 1: Write how-it-works.mdx**

```mdx
---
title: "How Firmis Works"
description: "Firmis scans AI agent code using a three-stage pipeline: discovery, rule matching, and reporting. No network access required."
---

> Firmis uses a three-stage pipeline — discover, match, report — to find security threats in AI agent code. Everything runs locally.

## The pipeline

```text
     Your project directory
              │
              ▼
    ┌───────────────────┐
    │   1. Discovery     │  Detect platforms, enumerate components,
    │                    │  resolve dependencies, identify models
    └────────┬──────────┘
              │
              ▼
    ┌───────────────────┐
    │   2. Rule Engine   │  Match 199 YAML rules against each component
    │                    │  using regex, YARA, file-access, and import
    │                    │  pattern matchers. Calculate confidence scores.
    └────────┬──────────┘
              │
              ▼
    ┌───────────────────┐
    │   3. Reporter      │  Output findings as terminal, JSON, SARIF,
    │                    │  or HTML. Generate Agent BOM (CycloneDX 1.7).
    └───────────────────┘
```

## Stage 1: Discovery

Firmis auto-detects which AI platforms are present by scanning for known file patterns:

| Platform | Detection Signal |
|---|---|
| Claude Skills | `CLAUDE.md`, `.claude/` directory |
| MCP Servers | `mcp.json`, `mcp-config.json`, server manifests |
| Codex Plugins | `codex-config.json`, plugin manifests |
| Cursor Rules | `.cursorrules`, `.cursor/` directory |
| CrewAI Agents | `crewai.yaml`, agent/task definitions |
| AutoGPT | `ai_settings.yaml`, plugin manifests |
| OpenClaw | `openclaw.json`, skill definitions |
| Nanobot | `nanobot.yaml`, plugin configs |

Each detected component is added to an internal registry with its file path, content, and metadata.

## Stage 2: Rule engine

Each component is matched against 199 YAML detection rules organized into 16 threat categories. The engine supports 7 pattern matcher types:

| Matcher | Purpose | Example |
|---|---|---|
| `regex` | Regular expression | `AKIA[0-9A-Z]{16}` (AWS key) |
| `yara` | YARA-like binary/text rules | Malware signatures |
| `file-access` | File path access | `~/.aws/credentials` |
| `import` | Module imports | `keytar`, `node-keychain` |
| `network` | Network patterns | DNS lookups, socket connections |
| `string-literal` | Exact string match | Known malicious URLs |
| `text` | Plain text search | Configuration values |

Each pattern has a **weight** (0–100). The rule engine calculates a **confidence score** per finding using `Math.max(ratioConfidence, maxSinglePatternWeight)`. Findings below the rule's `confidenceThreshold` are suppressed.

Markdown and text files receive a **0.15x document multiplier** to reduce false positives from documentation (except `secret-detection` rules, which are exempt).

## Stage 3: Reporting

Findings are deduplicated across platforms (the same file indexed by multiple platforms produces one finding, not five) and output in your chosen format:

- **Terminal** — colored, grouped by severity
- **JSON** — structured array of findings
- **SARIF 2.1.0** — for GitHub Security tab, VS Code SARIF Viewer
- **HTML** — standalone report file

## What Firmis does NOT do

- **Does not modify your code.** Firmis is read-only. The `fix` command (beta) is a separate opt-in feature.
- **Does not require network access.** All rules and detection logic run locally.
- **Does not upload telemetry by default.** Cloud features are opt-in. See [Privacy](/privacy).
- **Does not detect runtime behavioral attacks.** Firmis is a static scanner. It catches patterns in code and configuration, not live execution anomalies.

## Related

- [Detection Engine](/concepts/detection-engine) — deep dive into the rule matching algorithm
- [Threat Model](/concepts/threat-model) — the 16 threat categories explained
- [Platforms](/concepts/platforms) — platform-specific detection details
```

**Step 2: Write remaining concept pages**

Write `threat-model.mdx` (all 16 categories with descriptions, severity distribution, MITRE/OWASP mappings), `detection-engine.mdx` (YARA-like matching, confidence scoring, document multiplier, dedup), `agent-bom.mdx` (CycloneDX 1.7, what goes in the BOM, how to use it), `platforms.mdx` (what "platform" means, auto-detection, how to force a platform).

**Step 3: Build and verify**

```bash
cd docs-site && npm run build
```

**Step 4: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/concepts/
git commit -m "feat(docs): add concepts section (how-it-works, threat-model, detection-engine, agent-bom, platforms)"
```

---

### Task 9: Write Platform Pages

**Files:**
- Create: `docs-site/src/content/docs/platforms/mcp-servers.mdx` (template, then 7 more)

**Step 1: Write mcp-servers.mdx as the template**

```mdx
---
title: "MCP Servers — Security Guide"
description: "Detect tool poisoning, data exfiltration, prompt injection, and supply chain threats in MCP server configurations. 38 detection rules."
sidebar:
  label: MCP Servers
---

import { Aside } from '@astrojs/starlight/components';

> Firmis detects 38 security threats specific to MCP (Model Context Protocol) servers, covering tool poisoning, data exfiltration, and supply chain attacks.

## What Firmis detects in MCP servers

| Threat Category | Rules | Coverage | Example Finding |
|---|---|---|---|
| Tool Poisoning | 6 | High | Hidden `<IMPORTANT>` instructions in tool descriptions |
| Data Exfiltration | 5 | High | `fetch()` calls with local file content in body |
| Credential Harvesting | 4 | High | Access to `~/.aws/credentials` in tool handlers |
| Secret Detection | 12 | High | Hardcoded API keys in server config |
| Prompt Injection | 4 | Medium | Instruction override patterns in tool output |
| Supply Chain | 3 | Medium | Known-vulnerable npm packages in dependencies |
| Network Abuse | 2 | Medium | Unauthorized DNS lookups |
| Permission Overgrant | 2 | Low | Unrestricted file system access in tool permissions |

## Files Firmis scans

| File Pattern | What It Contains |
|---|---|
| `mcp.json` | Server manifest with tool definitions |
| `mcp-config.json` | Server configuration |
| `src/**/*.ts`, `src/**/*.js` | Tool handler implementations |
| `package.json` | Dependencies (for supply chain analysis) |
| `*.env`, `.env.*` | Environment files (for secret detection) |

## Scan MCP servers

```bash title="Terminal"
npx firmis scan --platform mcp
```

```bash title="JSON output for CI"
npx firmis scan --platform mcp --json --fail-on high
```

## Common findings and remediation

### tp-003: Hidden instruction in tool description

```text title="Finding"
CRITICAL  tp-003  Hidden instruction in tool description
          src/tools/search.ts:14
```

**What it means:** The tool's description contains hidden instructions (often wrapped in `<IMPORTANT>` tags) that override the agent's behavior. This is the #1 tool poisoning technique.

**Fix:** Remove hidden instructions. Tool descriptions should only describe the tool's function.

### de-002: Data exfiltration via fetch

```text title="Finding"
HIGH  de-002  Data sent to external URL in tool handler
      src/tools/fetch.ts:42
```

**What it means:** A tool handler reads local data and sends it to an external URL. This is the primary data theft vector in MCP servers.

**Fix:** Audit all `fetch()` calls. Remove or restrict external network access. Use allowlists for permitted domains.

## Related

- [Scan command](/cli/scan) — full CLI reference
- [Tool Poisoning rules](/rules/built-in-rules) — all tool-poisoning detection rules
- [Securing MCP Servers guide](/guides/securing-mcp-servers) — step-by-step hardening walkthrough
```

**Step 2: Write remaining 7 platform pages**

Follow the same structure for `claude-skills.mdx`, `codex-plugins.mdx`, `cursor-rules.mdx`, `crewai-agents.mdx`, `autogpt-plugins.mdx`, `openclaw-skills.mdx`, `nanobot-plugins.mdx`. Each page needs:
- Platform-specific detection matrix table
- File patterns scanned
- Scan command with `--platform` flag
- 2-3 common findings with remediation
- Related links

**Step 3: Build and verify**

```bash
cd docs-site && npm run build
```

**Step 4: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/platforms/
git commit -m "feat(docs): add 8 platform security guide pages"
```

---

## Phase 3: Auto-Generation Pipeline (Tasks 10–12)

### Task 10: Build Rule Catalog Generator

**Files:**
- Create: `docs-site/scripts/generate-rules.ts`
- Create: `docs-site/src/content/docs/rules/built-in-rules.mdx` (generated)

This script reads all 17 YAML rule files and generates a single MDX page with a searchable, filterable catalog.

**Step 1: Write the generator script**

```typescript
// docs-site/scripts/generate-rules.ts
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

interface RulePattern {
  type: string;
  pattern: string;
  weight: number;
  description: string;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  version: string;
  enabled: boolean;
  confidenceThreshold: number;
  platforms?: string[];
  patterns: RulePattern[];
  remediation: string;
  references?: string[];
}

interface RuleFile {
  rules: Rule[];
}

const RULES_DIR = path.resolve(import.meta.dirname, '../../rules');
const OUTPUT_FILE = path.resolve(
  import.meta.dirname,
  '../src/content/docs/rules/built-in-rules.mdx'
);

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function loadAllRules(): Rule[] {
  const files = fs.readdirSync(RULES_DIR).filter((f) => f.endsWith('.yaml'));
  const allRules: Rule[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(RULES_DIR, file), 'utf-8');
    const parsed = yaml.load(content) as RuleFile;
    if (parsed?.rules) {
      allRules.push(...parsed.rules);
    }
  }

  return allRules.sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );
}

function severityBadge(severity: string): string {
  const variants: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  return `${variants[severity] ?? '⚪'} ${severity.toUpperCase()}`;
}

function generateMdx(rules: Rule[]): string {
  const categories = [...new Set(rules.map((r) => r.category))].sort();
  const bySeverity = {
    critical: rules.filter((r) => r.severity === 'critical').length,
    high: rules.filter((r) => r.severity === 'high').length,
    medium: rules.filter((r) => r.severity === 'medium').length,
    low: rules.filter((r) => r.severity === 'low').length,
  };

  let mdx = `---
title: "Built-in Rules — Full Catalog"
description: "Complete catalog of all ${rules.length} built-in detection rules in Firmis Scanner, organized by threat category."
---

> Firmis ships with ${rules.length} built-in detection rules across ${categories.length} threat categories. All rules are open-source YAML files.

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical | ${bySeverity.critical} |
| 🟠 High | ${bySeverity.high} |
| 🟡 Medium | ${bySeverity.medium} |
| 🟢 Low | ${bySeverity.low} |
| **Total** | **${rules.length}** |

## Rules by category

`;

  for (const category of categories) {
    const categoryRules = rules.filter((r) => r.category === category);
    mdx += `### ${category}\n\n`;
    mdx += `| ID | Name | Severity | Confidence | Platforms |\n`;
    mdx += `|---|---|---|---|---|\n`;

    for (const rule of categoryRules) {
      const platforms = rule.platforms?.join(', ') ?? 'all';
      mdx += `| \`${rule.id}\` | ${rule.name} | ${severityBadge(rule.severity)} | ${rule.confidenceThreshold}% | ${platforms} |\n`;
    }

    mdx += `\n`;
  }

  mdx += `## Rule details\n\n`;

  for (const rule of rules) {
    const refs = rule.references?.length
      ? rule.references.map((r) => `- ${r}`).join('\n')
      : 'None';

    mdx += `#### \`${rule.id}\` — ${rule.name}\n\n`;
    mdx += `**Severity:** ${severityBadge(rule.severity)} · `;
    mdx += `**Category:** ${rule.category} · `;
    mdx += `**Confidence threshold:** ${rule.confidenceThreshold}%\n\n`;
    mdx += `${rule.description.trim()}\n\n`;
    mdx += `**Remediation:** ${rule.remediation.trim()}\n\n`;
    mdx += `**References:**\n${refs}\n\n`;
    mdx += `---\n\n`;
  }

  return mdx;
}

const rules = loadAllRules();
const content = generateMdx(rules);
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, content);
console.log(
  `Generated ${OUTPUT_FILE} with ${rules.length} rules across ${[...new Set(rules.map((r) => r.category))].length} categories`
);
```

**Step 2: Add generate script to package.json**

Add to `docs-site/package.json` scripts:

```json
{
  "scripts": {
    "generate:rules": "npx tsx scripts/generate-rules.ts",
    "prebuild": "npm run generate:rules",
    "build": "astro build",
    "dev": "npm run generate:rules && astro dev"
  }
}
```

**Step 3: Install tsx as a dev dependency**

```bash
cd docs-site && npm install -D tsx js-yaml @types/js-yaml
```

**Step 4: Run generator and verify output**

```bash
cd docs-site && npm run generate:rules
```

Expected: `src/content/docs/rules/built-in-rules.mdx` created with all 199 rules.

**Step 5: Build and verify**

```bash
cd docs-site && npm run build
```

**Step 6: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/scripts/generate-rules.ts docs-site/src/content/docs/rules/built-in-rules.mdx docs-site/package.json docs-site/package-lock.json
git commit -m "feat(docs): add auto-generated rule catalog from YAML files"
```

---

### Task 11: Build llms.txt Generator

**Files:**
- Create: `docs-site/scripts/generate-llms-txt.ts`

This script generates `llms.txt` (concise index) and `llms-full.txt` (full docs concatenation) at build time.

**Step 1: Write the generator script**

```typescript
// docs-site/scripts/generate-llms-txt.ts
import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'fast-glob';

const DOCS_DIR = path.resolve(import.meta.dirname, '../src/content/docs');
const PUBLIC_DIR = path.resolve(import.meta.dirname, '../public');
const SITE_URL = 'https://docs.firmislabs.com';

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n/);
  return match ? content.slice(match[0].length).trim() : content.trim();
}

function stripMdxComponents(content: string): string {
  return content
    .replace(/import\s+\{[^}]+\}\s+from\s+'[^']+';?\n?/g, '')
    .replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '')
    .replace(/<[A-Z][a-zA-Z]*[^/]*\/>/g, '')
    .trim();
}

function extractFrontmatter(
  content: string
): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      fm[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
    }
  }
  return fm;
}

function fileToUrl(filePath: string): string {
  const relative = path
    .relative(DOCS_DIR, filePath)
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '');
  return `${SITE_URL}/${relative}`;
}

function generateLlmsTxt(): void {
  const files = globSync('**/*.{md,mdx}', { cwd: DOCS_DIR }).sort();

  // --- llms.txt (concise index) ---
  const sections: Record<string, string[]> = {
    Docs: [],
    'CLI Reference': [],
    Platforms: [],
    Rules: [],
    Reference: [],
    Optional: [],
  };

  for (const file of files) {
    const fullPath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const fm = extractFrontmatter(content);
    const title = fm.title || path.basename(file, path.extname(file));
    const desc = fm.description || '';
    const url = fileToUrl(fullPath);
    const entry = `- [${title}](${url}): ${desc}`;

    if (file.startsWith('cli/')) sections['CLI Reference'].push(entry);
    else if (file.startsWith('platforms/')) sections['Platforms'].push(entry);
    else if (file.startsWith('rules/')) sections['Rules'].push(entry);
    else if (file.startsWith('reference/')) sections['Reference'].push(entry);
    else if (
      file.startsWith('concepts/') ||
      file.startsWith('guides/') ||
      file.startsWith('integrations/')
    )
      sections['Optional'].push(entry);
    else sections['Docs'].push(entry);
  }

  let llmsTxt = `# Firmis

> AI agent security scanner. Static analysis only — does not modify code or require network access. Detects threats in Claude Skills, MCP Servers, Codex Plugins, Cursor Rules, CrewAI, AutoGPT, OpenClaw, and Nanobot. 199 YAML detection rules across 16 threat categories. Zero install: \`npx firmis scan\`. Fully offline. MIT licensed.

`;

  for (const [section, entries] of Object.entries(sections)) {
    if (entries.length === 0) continue;
    llmsTxt += `## ${section}\n\n${entries.join('\n')}\n\n`;
  }

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'), llmsTxt);
  console.log(`Generated llms.txt (${llmsTxt.length} chars)`);

  // --- llms-full.txt (full concatenation) ---
  let fullTxt = `# Firmis — Complete Documentation\n\n`;
  fullTxt += `> Generated at build time. Full documentation for LLM consumption.\n\n`;

  for (const file of files) {
    const fullPath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const fm = extractFrontmatter(content);
    const title = fm.title || path.basename(file, path.extname(file));
    const body = stripMdxComponents(stripFrontmatter(content));
    const url = fileToUrl(fullPath);

    fullTxt += `---\n\n`;
    fullTxt += `# ${title}\n\n`;
    fullTxt += `URL: ${url}\n\n`;
    fullTxt += `${body}\n\n`;
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'llms-full.txt'), fullTxt);
  console.log(`Generated llms-full.txt (${fullTxt.length} chars)`);
}

generateLlmsTxt();
```

**Step 2: Add to prebuild pipeline**

Update `docs-site/package.json` scripts:

```json
{
  "scripts": {
    "generate:rules": "npx tsx scripts/generate-rules.ts",
    "generate:llms": "npx tsx scripts/generate-llms-txt.ts",
    "generate": "npm run generate:rules && npm run generate:llms",
    "prebuild": "npm run generate",
    "build": "astro build",
    "dev": "npm run generate && astro dev"
  }
}
```

**Step 3: Install fast-glob**

```bash
cd docs-site && npm install -D fast-glob
```

**Step 4: Run and verify**

```bash
cd docs-site && npm run generate:llms
cat public/llms.txt | head -20
```

Expected: `llms.txt` with Firmis description and categorized page links. `llms-full.txt` with all page content concatenated.

**Step 5: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/scripts/generate-llms-txt.ts docs-site/public/llms.txt docs-site/public/llms-full.txt docs-site/package.json
git commit -m "feat(docs): add llms.txt and llms-full.txt auto-generation"
```

---

### Task 12: Build FAQPage JSON-LD Component

**Files:**
- Create: `docs-site/src/components/FaqSchema.astro`
- Modify: `docs-site/src/content/docs/index.mdx` (add FAQ section + schema)

**Step 1: Write FAQPage schema component**

```astro
---
// docs-site/src/components/FaqSchema.astro
interface FAQ {
  question: string;
  answer: string;
}
interface Props {
  faqs: FAQ[];
}
const { faqs } = Astro.props;
const schema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

**Step 2: Add FAQ section to landing page**

Append to `docs-site/src/content/docs/index.mdx` (after the "How it works" section):

```mdx
import FaqSchema from '../../components/FaqSchema.astro';

<FaqSchema faqs={[
  {
    question: "How do I scan MCP servers for security issues?",
    answer: "Run npx firmis scan --platform mcp in your project directory. Firmis detects tool poisoning, data exfiltration, credential harvesting, and more. No configuration needed."
  },
  {
    question: "What security risks exist in Claude Skills?",
    answer: "Claude Skills can contain prompt injection attacks, hidden instructions that override agent behavior, hardcoded API keys, and unauthorized file system access. Firmis detects these with 45+ dedicated rules."
  },
  {
    question: "Does Firmis upload my code?",
    answer: "No. Firmis runs entirely offline. Your code never leaves your machine. No telemetry is collected by default."
  },
  {
    question: "How do I add Firmis to my CI/CD pipeline?",
    answer: "Run npx firmis ci --fail-on high --format sarif in your pipeline. This runs the full discover, BOM, scan, report pipeline and exits non-zero if high or critical findings are detected."
  },
  {
    question: "What is an Agent Bill of Materials (Agent BOM)?",
    answer: "An Agent BOM is a CycloneDX 1.7 inventory of all AI agent components, dependencies, and models in your project. Generate one with npx firmis bom. It lists every platform, tool, and package for supply chain visibility."
  },
  {
    question: "How do I detect prompt injection in AI agents?",
    answer: "Firmis includes 13 prompt injection detection rules that scan tool descriptions, system prompts, and handler code for instruction override patterns, hidden directives, and context manipulation techniques."
  }
]} />
```

**Step 3: Build and verify**

```bash
cd docs-site && npm run build
# Check that JSON-LD is in the HTML output
grep -l "FAQPage" dist/index.html
```

**Step 4: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/components/FaqSchema.astro docs-site/src/content/docs/index.mdx
git commit -m "feat(docs): add FAQPage JSON-LD schema for AEO"
```

---

## Phase 4: Rules, Reference, & Remaining Content (Tasks 13–17)

### Task 13: Write Rules Section (overview, custom-rules, ignoring-findings)

**Files:**
- Create: `docs-site/src/content/docs/rules/overview.mdx`
- Create: `docs-site/src/content/docs/rules/custom-rules.mdx`
- Create: `docs-site/src/content/docs/rules/ignoring-findings.mdx`

**Step 1: Write rules/overview.mdx**

Cover: what rules are, YAML format overview, 7 pattern types, severity levels, confidence scoring. Link to built-in-rules catalog and custom-rules.

**Step 2: Write rules/custom-rules.mdx**

Cover: full YAML schema with annotated example, all fields documented in a table, pattern types with examples, how to validate (`firmis validate`), where to place custom rules. Include a complete working custom rule that the reader can copy and test immediately.

**Step 3: Write rules/ignoring-findings.mdx**

Migrate content from existing `docs/FIRMISIGNORE.md` into MDX format. Cover: .firmisignore file locations, syntax, three rule types (rule ID, file pattern, rule:file combo), examples.

**Step 4: Build and commit**

```bash
cd docs-site && npm run build
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/rules/
git commit -m "feat(docs): add rules section (overview, custom-rules, ignoring-findings)"
```

---

### Task 14: Write Reference Section

**Files:**
- Create: `docs-site/src/content/docs/reference/config-schema.mdx`
- Create: `docs-site/src/content/docs/reference/sarif-output.mdx`
- Create: `docs-site/src/content/docs/reference/cyclonedx-bom.mdx`
- Create: `docs-site/src/content/docs/reference/threat-categories.mdx`
- Create: `docs-site/src/content/docs/reference/security-model.mdx`

**Step 1: Write reference/threat-categories.mdx**

Table of all 16 categories with: category name, description, rule count, severity range, MITRE ATT&CK mapping, OWASP LLM Top 10 mapping. This is the most agent-useful page in the entire site.

**Step 2: Write reference/security-model.mdx**

This is the honesty page. Cover:
- What Firmis detects (static patterns, known-bad, supply chain, secrets)
- What Firmis does NOT detect (runtime behavioral, zero-day obfuscation, encrypted payloads, semantic logic bombs)
- Confidence model explained
- False positive expectations and .firmisignore escape hatch
- How to report FPs

**Step 3: Write reference/config-schema.mdx**

Document `firmis.config.ts` — all fields, types, defaults, examples.

**Step 4: Write reference/sarif-output.mdx**

Document the SARIF 2.1.0 output: field mapping, how to view in GitHub Security tab, VS Code SARIF Viewer integration.

**Step 5: Write reference/cyclonedx-bom.mdx**

Document the CycloneDX 1.7 Agent BOM: what goes in it, component types, how it differs from standard SBOMs, how to consume it.

**Step 6: Build and commit**

```bash
cd docs-site && npm run build
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/reference/
git commit -m "feat(docs): add reference section (threat-categories, security-model, config, sarif, bom)"
```

---

### Task 15: Write Integrations Section

**Files:**
- Create: `docs-site/src/content/docs/integrations/github-actions.mdx`
- Create: `docs-site/src/content/docs/integrations/gitlab-ci.mdx`
- Create: `docs-site/src/content/docs/integrations/pre-commit-hooks.mdx`
- Create: `docs-site/src/content/docs/integrations/typescript-api.mdx`

**Step 1: Write integrations/github-actions.mdx**

Complete GitHub Actions workflow with:
- Basic scan workflow
- SARIF upload to GitHub Security tab
- PR comment with findings summary
- Caching node_modules for speed
- Branch protection rule suggestion

**Step 2: Write integrations/gitlab-ci.mdx**

GitLab CI/CD pipeline equivalent.

**Step 3: Write integrations/pre-commit-hooks.mdx**

Pre-commit hook configuration using husky or pre-commit framework.

**Step 4: Write integrations/typescript-api.mdx**

Programmatic usage of the scanner as a library:
```typescript title="my-scanner.ts"
import { scan, discover } from 'firmis-scanner';

const findings = await scan({ path: '.', platforms: ['mcp'] });
console.log(findings);
```

**Step 5: Build and commit**

```bash
cd docs-site && npm run build
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/integrations/
git commit -m "feat(docs): add integrations section (github-actions, gitlab-ci, pre-commit, typescript-api)"
```

---

### Task 16: Write Guides Section

**Files:**
- Create: `docs-site/src/content/docs/guides/securing-mcp-servers.mdx`
- Create: `docs-site/src/content/docs/guides/scanning-claude-skills.mdx`
- Create: `docs-site/src/content/docs/guides/agent-supply-chain-security.mdx`
- Create: `docs-site/src/content/docs/guides/compliance-reporting.mdx`

Each guide is a task-oriented walkthrough: start with a problem, walk through the solution, end with verification.

**Step 1: Write securing-mcp-servers.mdx**

Walk through: install → scan → interpret findings → fix top threats → add to CI. Include real examples from the Firmis dogfood scan.

**Step 2: Write scanning-claude-skills.mdx**

Similar walkthrough for Claude Skills.

**Step 3: Write agent-supply-chain-security.mdx**

Cover: what supply chain attacks look like in AI agents, how Firmis detects them, OSV integration, dependency analysis.

**Step 4: Write compliance-reporting.mdx (Beta stub)**

Brief description of compliance capabilities with Beta aside.

**Step 5: Build and commit**

```bash
cd docs-site && npm run build
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/guides/
git commit -m "feat(docs): add guides section (mcp, claude, supply-chain, compliance)"
```

---

### Task 17: Write Project Pages (Changelog, Security, Privacy)

**Files:**
- Create: `docs-site/src/content/docs/changelog.mdx`
- Create: `docs-site/src/content/docs/security.mdx`
- Create: `docs-site/src/content/docs/privacy.mdx`

**Step 1: Write changelog.mdx**

Generate from git tags and existing commit history. Follow Keep a Changelog format.

**Step 2: Write security.mdx**

Migrate from existing `SECURITY.md` — vulnerability disclosure policy, supported versions, contact.

**Step 3: Write privacy.mdx**

Migrate from existing `docs/PRIVACY.md` — data collection table, offline-first, opt-in cloud.

**Step 4: Build and commit**

```bash
cd docs-site && npm run build
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/src/content/docs/
git commit -m "feat(docs): add changelog, security, and privacy pages"
```

---

## Phase 5: Final Polish & Verification (Tasks 18–20)

### Task 18: Add well-known Files

**Files:**
- Create: `docs-site/public/.well-known/ai-plugin.json`
- Create: `docs-site/public/robots.txt`

**Step 1: Write ai-plugin.json**

```json
{
  "schema_version": "v1",
  "name": "firmis",
  "description": "AI agent security scanner — detect threats in Claude Skills, MCP Servers, Codex Plugins, and more",
  "auth": { "type": "none" },
  "api": {
    "type": "cli",
    "installation": "npx firmis",
    "commands": {
      "scan": "npx firmis scan [path] --json",
      "discover": "npx firmis discover [path] --json",
      "bom": "npx firmis bom [path]",
      "ci": "npx firmis ci [path] --format sarif"
    }
  },
  "docs_url": "https://docs.firmislabs.com/llms.txt",
  "logo_url": "https://firmislabs.com/logo.png",
  "contact_email": "security@firmislabs.com",
  "legal_info_url": "https://docs.firmislabs.com/privacy"
}
```

**Step 2: Write robots.txt**

```text
User-agent: *
Allow: /

Sitemap: https://docs.firmislabs.com/sitemap-index.xml
```

**Step 3: Commit**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add docs-site/public/
git commit -m "feat(docs): add ai-plugin.json and robots.txt"
```

---

### Task 19: Full Build Verification

**Step 1: Clean build**

```bash
cd docs-site && rm -rf dist && npm run build
```

Expected: Build succeeds with zero errors.

**Step 2: Verify key files exist in output**

```bash
ls dist/llms.txt dist/llms-full.txt dist/.well-known/ai-plugin.json dist/robots.txt dist/sitemap-index.xml
```

Expected: All files present.

**Step 3: Verify page count**

```bash
find dist -name "index.html" | wc -l
```

Expected: ~45+ HTML pages (landing + quickstart + installation + 5 concepts + 11 CLI + 8 platforms + 4 rules + 5 reference + 4 integrations + 4 guides + 3 project pages).

**Step 4: Verify JSON-LD in landing page**

```bash
grep "SoftwareApplication" dist/index.html && grep "FAQPage" dist/index.html
```

Expected: Both found.

**Step 5: Verify llms.txt content**

```bash
head -5 dist/llms.txt
```

Expected: `# Firmis` header with blockquote description.

---

### Task 20: Deploy and Verify Production

**Step 1: Deploy**

```bash
cd docs-site && npx wrangler pages deploy dist --project-name firmis-docs
```

**Step 2: Verify live URLs**

```bash
curl -s https://docs.firmislabs.com/llms.txt | head -5
curl -s https://docs.firmislabs.com/.well-known/ai-plugin.json | head -5
curl -I https://docs.firmislabs.com/quickstart/
curl -I https://docs.firmislabs.com/cli/scan/
```

Expected: All return HTTP 200 with correct content.

**Step 3: Final commit and tag**

```bash
cd /Users/riteshkewlani/github/firmis-scanner
git add -A
git commit -m "feat(docs): docs.firmislabs.com v1.0 — Starlight site with AEO, llms.txt, 199-rule catalog"
git tag docs/v1.0
```

---

## Task Summary

| Phase | Tasks | Description |
|---|---|---|
| 1: Scaffold & Deploy | 1–3 | Starlight init, sidebar config, Cloudflare Pages |
| 2: Core Content | 4–9 | Quickstart, landing, CLI ref, concepts, platforms |
| 3: Auto-Generation | 10–12 | Rule catalog, llms.txt, FAQ schema generators |
| 4: Remaining Content | 13–17 | Rules, reference, integrations, guides, project pages |
| 5: Polish & Verify | 18–20 | ai-plugin.json, robots.txt, full build, deploy |
