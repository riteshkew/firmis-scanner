# Firmis PRD v5.0 — Enterprise-Grade AI Agent Security for Developers

**Vision:** The open-source security platform for anyone building or running AI agents  
**Version:** 5.0  
**Date:** February 2026  
**Author:** Ritesh (Founder)  
**Status:** Active Development

---

## 1. Vision & Positioning

### The One-Liner

> **"Enterprise-grade AI agent security. Open-source. CLI-first. Free."**

### The Problem

AI agents now have root access to computers, files, emails, messaging apps, and cloud infrastructure. The security tooling for this new paradigm is either:

- **Enterprise-only** ($25K+/year, requires platform subscriptions, SSO, RBAC setup)
- **Scan-only** (checks skills before install, ignores what agents do at runtime)
- **Framework-specific** (works for MCP but not CrewAI, Cursor, Codex, etc.)

Individual developers, small teams, and startups building on AI agent frameworks have **zero** security tooling available at their price point.

### The Insight

The AI agent security market is splitting exactly like application security did a decade ago:

| Era | Enterprise | Developer |
|-----|-----------|-----------|
| **AppSec (2015)** | Veracode, Checkmarx ($100K+/yr) | Snyk (free CLI, npm install) |
| **Agent Security (2026)** | Snyk Evo, PANW, Noma ($25K+/yr) | **Firmis (free CLI, npx install)** |

Snyk disrupted AppSec by giving developers the same capabilities enterprises had, packaged as a free CLI tool with a paid monitoring tier. Firmis does the same for AI agent security.

### Target ICP

**Primary: Individual developers running AI agents**
- Running OpenClaw, Claude Code, Cursor, Codex on personal machines
- Connected to 3+ messaging platforms or data sources
- Installed 10+ skills/tools from community marketplaces
- Technical enough for CLI, not a security expert
- Wants peace of mind, not a security dashboard

**Secondary: Small teams building AI agent products**
- 2-10 person startups shipping agents to users
- Need security for CI/CD pipelines
- Higher willingness to pay, future team/enterprise tier

**Tertiary: AI agent service providers**
- Managing multiple client agent deployments
- Need multi-tenant security monitoring
- Highest ARPU segment

---

## 2. What's Built (Shipped v1.1.0)

### Current Scanner CLI

| Component | Status | Details |
|-----------|--------|---------|
| Scanner CLI | ✅ Shipped | `npx firmis scan`, published on npm, MIT license |
| Platform Analyzers | ✅ 9 platforms | OpenClaw, MCP, Claude, CrewAI, Cursor, Codex, AutoGPT, Nanobot, Supabase |
| Detection Rules | ✅ 108+ rules | 15 YAML files, 14 threat categories |
| Reporters | ✅ 4 formats | Terminal, JSON, SARIF, HTML |
| CLI Commands | ✅ 3 commands | `scan`, `list`, `validate` |
| JS/TS AST | ✅ Babel parser | Code-level static analysis |
| Supabase SQL/RLS | ✅ Semantic analysis | pgsql-parser integration |
| Known-malicious blocklist | ✅ 50+ entries | Skills, authors, C2 infrastructure |
| Confidence model | ✅ Three-tier | suspicious / likely / confirmed |
| .firmisignore | ✅ | Exclusion patterns |
| MCP credential scanning | ✅ | Entropy-based secret detection in configs |
| Security grading | ✅ | A-F letter grades per scan |

### Tech Stack

- **Language:** TypeScript / Node.js (ESM)
- **License:** MIT (scanner)
- **Distribution:** npm (`npx firmis scan`)
- **AST:** Babel (JS/TS), pgsql-parser (SQL)
- **Rules:** YAML-based detection rules with regex + AST matchers
- **Output:** Terminal, JSON, SARIF (GitHub Code Scanning), HTML report

---

## 3. Full Capability Matrix

### Command Overview

| Command | Description | Status | Milestone |
|---------|-------------|--------|-----------|
| `firmis scan` | Static security analysis of agent configs, skills, code | ✅ Shipped | — |
| `firmis list` | List available analyzers and rules | ✅ Shipped | — |
| `firmis validate` | Validate rule files | ✅ Shipped | — |
| `firmis discover` | Auto-detect all agent frameworks, models, MCP servers in a directory | 🔨 Build | M1 |
| `firmis bom` | Generate Agent Bill of Materials (ABOM) | 🔨 Build | M1 |
| `firmis fix` | Auto-remediate detected issues with undo capability | 🔨 Build | M2 |
| `firmis monitor` | Runtime sidecar — watch agent behavior in real-time | 🔨 Build | M3 |
| `firmis redteam` | Adversarial testing — prompt injection, tool abuse, data exfil | 🔨 Build | M4 |
| `firmis threat-model` | Auto-generate threat model from agent architecture | 🔨 Build | M5 |
| `firmis policy` | Define and enforce security policies in plain English or DSL | 🔨 Build | M5 |
| `firmis ci` | Pipeline command: discover → bom → scan → fix → report | 🔨 Build | M3 |
| `firmis report` | Generate compliance-ready security reports | 🔨 Build | M2 |

### Detailed Capability Breakdown

#### `firmis discover` — Agent Discovery Engine

**What it does:** Scans a directory, machine, or CI environment and auto-detects every AI agent framework, model, MCP server, and tool in use. Produces a structured inventory.

**Detects:**
- Agent frameworks: OpenClaw, CrewAI, LangGraph, AutoGen, Cursor, Claude Code, Codex CLI, AutoGPT, Nanobot
- MCP servers: from claude_desktop_config.json, cursor configs, VS Code settings
- Models: API keys referencing OpenAI, Anthropic, Google, Mistral, local models (Ollama, LM Studio)
- Skills/tools: ClawHub skills, MCP tools, custom function definitions
- Data sources: connected databases, file systems, APIs with credentials

**Open-source tools to leverage:**

| Tool | Purpose | License | Integration Method |
|------|---------|---------|-------------------|
| **Syft** (Anchore) | SBOM generation, dependency detection | Apache 2.0 | Shell exec for base dependency scan |
| **Trusera ai-bom** | AI-specific component detection (13 scanners, 9 output formats) | MIT | Reference architecture, port detection logic to TS |
| **OWASP AIBOM Generator** | AI model metadata extraction, CycloneDX format | CC BY-SA | Align output format with CycloneDX ML-BOM spec |

**Implementation approach:** Custom TypeScript scanner that walks file trees looking for known config file patterns (claude_desktop_config.json, .cursor/, crewai.yaml, langgraph configs, package.json AI deps, Python AI imports). No shelling out to Python tools — pure TS for speed and zero-dependency install.

---

#### `firmis bom` — Agent Bill of Materials

**What it does:** Generates a structured, machine-readable inventory of every AI component in a project. Think SBOM but for the AI agent layer.

**Output includes:**
- Skills/plugins installed (name, version, source, hash, trust score)
- MCP servers configured (name, transport, tools exposed, permissions)
- Models referenced (provider, model ID, API endpoint)
- Dependencies with known CVEs (via OSV)
- Secrets detected (API keys, tokens — redacted in output)
- Permissions granted (file system, network, shell, email, messaging)
- Data flows (what data goes where, trust boundaries)

**Output formats:** JSON, CycloneDX ML-BOM, SPDX, SARIF, Markdown

**Open-source tools to leverage:**

| Tool | Purpose | License | Integration |
|------|---------|---------|-------------|
| **OSV-Scanner** (Google) | Vulnerability scanning against OSV database | Apache 2.0 | API calls to osv.dev for dependency CVEs |
| **Syft** | Software composition analysis | Apache 2.0 | Base dependency inventory |
| **CycloneDX libraries** | BOM format generation | Apache 2.0 | npm `@cyclonedx/cyclonedx-library` for TS |

---

#### `firmis fix` — Auto-Remediation Engine

**What it does:** Automatically fixes detected security issues. Safe fixes execute immediately, risky fixes generate fix scripts for review.

**Auto-fix categories (Tier 1 — safe, auto-execute):**
- Remove known-malicious skills from configs
- Tighten overly permissive file system access
- Redact exposed secrets and rotate (with provider API support)
- Add missing `.firmisignore` entries
- Harden MCP server permissions (restrict tool access)
- Fix insecure transport (stdio → SSE with auth)

**Script-fix categories (Tier 2 — generate script, human reviews):**
- Complex permission restructuring
- Multi-file config changes
- Dependency upgrades with breaking changes
- MCP server replacement recommendations

**Every fix:**
- Creates backup of original files
- Generates before/after diff
- Supports `firmis fix --undo` to rollback
- Logs to audit trail (hash-chained for compliance tier)

**Open-source tools to leverage:**

| Tool | Purpose | License | Integration |
|------|---------|---------|-------------|
| **Gitleaks** | Secret detection in code and configs | MIT | Shell exec or port regex patterns to TS |
| **TruffleHog** | Deep secret scanning (git history, live endpoints) | AGPL-3.0 | Reference patterns only (AGPL incompatible for embedding) |
| **detect-secrets** (Yelp) | Secret detection with plugin architecture | Apache 2.0 | Reference patterns, port high-entropy detection |

---

#### `firmis monitor` — Runtime Security Monitor

**What it does:** Continuous runtime protection. Watches every tool call, network request, and data flow from AI agents. This is the $19/mo paid tier.

**Capabilities:**
- Intercept and log all MCP tool calls (inputs + outputs)
- Detect prompt injection attempts in real-time
- Behavioral anomaly detection (baseline normal → alert on deviation)
- Data exfiltration detection (PII in outbound requests)
- Blast radius scoring (how much damage could this action cause?)
- Network call monitoring (unexpected outbound connections)
- Weekly security digest email

**Architecture:** Lightweight proxy/sidecar that sits between the agent and its tools. Two deployment modes:

1. **MCP Proxy Mode:** Intercepts MCP stdio/SSE traffic (inspired by Invariant Gateway architecture)
2. **Network Monitor Mode:** Monitors outbound HTTP from agent processes

**Open-source tools to leverage:**

| Tool | Purpose | License | Integration |
|------|---------|---------|-------------|
| **Invariant Gateway** | MCP proxy with guardrail enforcement | Apache 2.0 | Fork/adapt for Firmis runtime engine |
| **Lasso MCP Gateway** | MCP security gateway with plugin system | Apache 2.0 | Plugin architecture reference |
| **Invariant Guardrails** | Policy enforcement DSL for agent actions | Apache 2.0 | Adapt .gr policy format |
| **Presidio** (Microsoft) | PII detection engine | MIT | API or local mode for data exfil detection |

**Implementation approach:** Build a TypeScript MCP proxy that intercepts stdio transport (most common). Use Invariant's gateway architecture as reference but implement in TS/Node for consistency with scanner CLI. Policy enforcement via adapted .gr DSL or plain-English rules compiled to matchers.

---

#### `firmis redteam` — Adversarial Testing Engine

**What it does:** Automated adversarial testing of live AI agents. Fires prompt injection attacks, attempts tool abuse, tests data exfiltration vectors, and reports vulnerabilities.

**Attack categories:**
- **Prompt injection:** Direct, indirect, cross-tool, multi-turn
- **Tool abuse:** Unauthorized tool invocation, parameter tampering, escalation chains
- **Data exfiltration:** PII extraction, credential theft via tool outputs
- **Jailbreaking:** Role-play attacks, encoding tricks, multi-turn manipulation
- **Memory poisoning:** Context window manipulation, instruction overrides

**Test modes:**
- `firmis redteam --quick` — 50 attacks, 5 minutes, top vulnerabilities
- `firmis redteam --full` — 500+ attacks, comprehensive coverage, OWASP-aligned report
- `firmis redteam --ci` — Fail/pass threshold for pipeline gates

**Open-source tools to leverage:**

| Tool | Purpose | License | Integration |
|------|---------|---------|-------------|
| **Promptfoo** | Red team framework with adaptive attack generation | MIT | Primary engine — excellent TS/JS integration, CI/CD native, OWASP/NIST mapping |
| **DeepTeam** | 40+ vulnerability classes, 10+ attack strategies | Apache 2.0 | Reference attack library, port attack patterns |
| **Garak** (NVIDIA) | 100+ adversarial probes for LLMs | Apache 2.0 | Reference probe library for comprehensive coverage |
| **PyRIT** (Microsoft) | Multi-turn attack orchestration | MIT | Reference multi-turn attack chains |
| **AgentDojo** (Invariant) | Agent-specific security benchmarking | MIT | Benchmark framework for agent tool-use attacks |

**Recommended approach:** Use Promptfoo as primary engine — it's TypeScript-native, has excellent CI/CD integration, supports OWASP Top 10 mapping, and has the best developer UX. Supplement with attack patterns from Garak and DeepTeam for comprehensive coverage. AgentDojo provides agent-specific benchmarks that other tools lack.

---

#### `firmis threat-model` — Automated Threat Modeling

**What it does:** Auto-generates a threat model from agent configuration. Maps attack surfaces, trust boundaries, data flows, and applies STRIDE + ASTRIDE (AI-specific extensions).

**Output:**
- Component inventory (agents, tools, models, data stores)
- Trust boundary map
- Data flow diagram (text-based)
- STRIDE threat classification per component
- ASTRIDE AI-specific threats (prompt injection, context poisoning, reasoning subversion, unsafe tool invocation)
- Risk scoring (likelihood × impact)
- Recommended mitigations prioritized by effort

**Open-source tools to leverage:**

| Tool | Purpose | License | Integration |
|------|---------|---------|-------------|
| **STRIDE-GPT** | AI-powered STRIDE threat modeling | MIT | Reference prompting approach, adapt for CLI output |
| **ASTRIDE framework** | STRIDE extension for agentic AI threats | Research | Implement A-category threats for agent-specific risks |
| **OWASP Top 10 for Agentic AI (ASI)** | Standardized agent threat taxonomy | CC BY-SA | Map findings to ASI01-ASI10 categories |
| **CSA MAESTRO** | Agentic AI threat modeling framework | — | Reference architectural pattern detection |

**Implementation approach:** LLM-powered analysis using Claude API (or local model). Feed agent config + discovery output → structured threat model. No web UI needed — output as Markdown, JSON, or SARIF. STRIDE-GPT's prompting approach is well-validated; adapt for CLI-first workflow with ASTRIDE extensions for agent-specific threats.

---

#### `firmis policy` — Policy Engine

**What it does:** Define security policies in plain English or structured DSL. Enforce at scan-time and runtime.

**Policy types:**
- **Allowlist/blocklist:** "Only allow MCP servers from verified publishers"
- **Permission boundaries:** "No skill may access the file system and network simultaneously"
- **Data policies:** "Never send PII to external APIs"
- **Behavioral:** "Alert if any tool makes more than 10 API calls per minute"
- **Compliance:** "All agent components must have a known license"

**Policy formats:**
- Plain English (compiled to rules via LLM)
- YAML policy files (deterministic, no LLM needed)
- Invariant .gr DSL (for runtime enforcement)

**Open-source tools to leverage:**

| Tool | Purpose | License | Integration |
|------|---------|---------|-------------|
| **Invariant Guardrails** | Policy DSL for agent runtime | Apache 2.0 | Adapt .gr format for Firmis policies |
| **OPA (Open Policy Agent)** | General-purpose policy engine | Apache 2.0 | Reference Rego policy language design |

---

#### `firmis ci` — CI/CD Pipeline Command

**What it does:** Single command that orchestrates the full security pipeline for CI/CD integration.

**Pipeline:** `discover` → `bom` → `scan` → `fix --safe-only` → `report`

**CI integrations:**
- GitHub Actions (SARIF upload to Code Scanning)
- GitLab CI (SAST report format)
- Generic (exit codes: 0=pass, 1=warnings, 2=failures)

**Usage:**
```bash
# In GitHub Actions
- run: npx firmis ci --fail-on critical --format sarif --output results.sarif

# In any CI
npx firmis ci --fail-on high --format json
```

---

## 4. Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FIRMIS CLI                            │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ discover │ │   bom    │ │   scan   │ │   fix    │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │            │            │            │          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ redteam  │ │ threat-  │ │  policy  │ │    ci    │   │
│  │          │ │  model   │ │          │ │          │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │            │            │            │          │
│  ┌────┴────────────┴────────────┴────────────┴────┐     │
│  │              CORE ENGINE                        │     │
│  │                                                 │     │
│  │  ┌─────────────┐  ┌──────────────┐             │     │
│  │  │  Discovery   │  │  AST Engine  │             │     │
│  │  │  Engine      │  │  (Babel/TS)  │             │     │
│  │  └─────────────┘  └──────────────┘             │     │
│  │  ┌─────────────┐  ┌──────────────┐             │     │
│  │  │  Rule Engine │  │  ABOM Gen    │             │     │
│  │  │  (YAML)      │  │  (CycloneDX) │             │     │
│  │  └─────────────┘  └──────────────┘             │     │
│  │  ┌─────────────┐  ┌──────────────┐             │     │
│  │  │  Fix Engine  │  │  Policy Eng  │             │     │
│  │  │  (backup+do) │  │  (YAML/.gr)  │             │     │
│  │  └─────────────┘  └──────────────┘             │     │
│  │  ┌─────────────┐  ┌──────────────┐             │     │
│  │  │  Red Team    │  │  Threat      │             │     │
│  │  │  (Promptfoo) │  │  Model (LLM) │             │     │
│  │  └─────────────┘  └──────────────┘             │     │
│  └─────────────────────────────────────────────────┘     │
│                          │                               │
│  ┌───────────────────────┴──────────────────────────┐    │
│  │              PLATFORM ANALYZERS                   │    │
│  │  OpenClaw │ MCP │ Claude │ CrewAI │ Cursor │ ...  │    │
│  └───────────────────────────────────────────────────┘    │
│                          │                               │
│  ┌───────────────────────┴──────────────────────────┐    │
│  │              OUTPUT LAYER                         │    │
│  │  Terminal │ JSON │ SARIF │ HTML │ CycloneDX │ MD  │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              FIRMIS MONITOR (Runtime — $19/mo)           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │              MCP PROXY / SIDECAR                  │    │
│  │                                                   │    │
│  │  Agent ──→ [Firmis Proxy] ──→ MCP Server         │    │
│  │                  │                                │    │
│  │          ┌───────┴───────┐                        │    │
│  │          │ Policy Engine │                        │    │
│  │          │ PII Detector  │                        │    │
│  │          │ Anomaly Det.  │                        │    │
│  │          │ Blast Radius  │                        │    │
│  │          │ Audit Logger  │                        │    │
│  │          └───────────────┘                        │    │
│  └──────────────────────────────────────────────────┘    │
│                          │                               │
│  ┌───────────────────────┴──────────────────────────┐    │
│  │              FIRMIS CLOUD (optional)               │    │
│  │  Dashboard │ Alerts │ Weekly Digest │ Audit Trail  │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript/Node.js | Same ecosystem as target users, `npx` zero-install |
| AST parsing | Babel (JS/TS), tree-sitter (Python — future) | No Python dependency for MVP |
| Rule format | YAML | Human-readable, git-diffable, community-contributable |
| BOM format | CycloneDX ML-BOM | Industry standard, tool ecosystem compatibility |
| Runtime proxy | Custom TS MCP proxy | Consistency with CLI, no Python/Docker dependency |
| Red teaming | Promptfoo integration | TS-native, best CI/CD integration, OWASP mapping |
| Threat modeling | LLM-powered (Claude API) | Most accurate for novel agent architectures |
| Policy DSL | YAML + adapted .gr | Deterministic by default, LLM-compiled plain English optional |

---

## 5. Open-Core Boundary

### What's Free (MIT License — Forever)

| Capability | Included |
|------------|----------|
| `firmis scan` | Full static analysis, all 9+ platform analyzers, 108+ rules |
| `firmis discover` | Agent framework and component auto-detection |
| `firmis bom` | Agent Bill of Materials generation (all formats) |
| `firmis fix` | Auto-remediation with backup/undo |
| `firmis list` / `firmis validate` | Rule management |
| `firmis ci` | CI/CD pipeline integration |
| `firmis report` | Security reports (terminal, JSON, SARIF, HTML, Markdown) |
| Community rules | YAML detection rules (CC BY-SA, community-contributable) |
| GitHub Code Scanning | SARIF upload support |

### What's Paid

| Tier | Price | Capabilities |
|------|-------|-------------|
| **Developer** | $19/mo | `firmis monitor` runtime sidecar, behavioral baseline, anomaly detection, blast radius scoring, weekly security digest, PII detection, 1 agent |
| **Team** | $99/mo | Everything in Developer + multi-agent monitoring, `firmis redteam` cloud execution, shared policies, team dashboard, 10 agents |
| **Enterprise** | $199/mo | Everything in Team + `firmis threat-model`, compliance evidence generation, audit trail (hash-chained), SSO, 100 agents, priority support |

### Moat Layers by Tier

| Tier | Moat Mechanism | Switching Cost |
|------|----------------|---------------|
| Free | Community rules, ABOM history | Lose scan history, re-learn tool |
| Developer | Behavioral baseline (learns what's "normal" for your agent) | Competitor starts cold, no baseline |
| Team | Shared policy library, team audit trail | Re-create policies, lose team history |
| Enterprise | 12+ months compliance evidence, hash-chain audit trail | Gap in compliance record, non-transferable |

---

## 6. Roadmap — Milestone-Based

### Milestone Philosophy

Each milestone ships a **complete, useful, independently valuable** capability. No half-built features. Every milestone ends with something users can adopt and that generates either installs (free) or revenue (paid).

### M0: Foundation Hardening (Week 1-2) — ✅ IN PROGRESS

**Goal:** Integrate external security tools into existing scanner. Make scan results dramatically more comprehensive.

| Deliverable | Tool Integration | Priority |
|-------------|-----------------|----------|
| Secret detection in scans | Gitleaks patterns (ported to TS regex) | P0 |
| Dependency CVE scanning | OSV API (osv.dev REST API calls) | P0 |
| Malware signature matching | YARA-X patterns (ported to TS) | P1 |
| HTML report with AI fix suggestions | Claude API for fix explanations | P0 |
| Email gate on HTML report | Resend for lead capture | P1 |

**Exit criteria:** `npx firmis scan` now finds secrets, CVEs, and malware in addition to config issues. HTML report is shareable and captures emails.

**KPI:** 1,000 scans completed, 200 email captures

---

### M1: Discovery + ABOM (Week 3-5)

**Goal:** Let users see everything AI-related in their project. First step toward inventory and compliance.

| Deliverable | Details | Priority |
|-------------|---------|----------|
| `firmis discover` command | Auto-detect 9+ frameworks, MCP servers, models, skills | P0 |
| `firmis bom` command | Generate Agent Bill of Materials | P0 |
| CycloneDX ML-BOM output | Standards-compliant BOM format | P0 |
| Risk scoring per component | Score each skill, MCP server, dependency by risk level | P1 |
| `firmis ci` command | Pipeline orchestration: discover → bom → scan → report | P1 |

**Exit criteria:** `firmis discover` correctly identifies agent components across OpenClaw, MCP, CrewAI, Cursor, Claude Code. `firmis bom` generates valid CycloneDX ML-BOM.

**KPI:** 500 GitHub stars, 2,000 npm weekly downloads

**Why this milestone matters for GTM:** ABOM is a category-creating capability. No other open-source tool generates an AI-specific bill of materials. This is the "Show HN" moment — data-driven, novel, shareable output. Every scan generates a finding that surprises the user ("I didn't know I had 47 AI components").

---

### M2: Auto-Fix + Reports (Week 6-8)

**Goal:** Close the loop from detection to remediation. Move from "here's what's wrong" to "it's fixed."

| Deliverable | Details | Priority |
|-------------|---------|----------|
| `firmis fix` command | Auto-remediate safe issues (Tier 1) | P0 |
| Fix scripts for risky changes (Tier 2) | Generate .sh scripts for human review | P0 |
| Backup + undo for all fixes | `firmis fix --undo` restores original state | P0 |
| `firmis report` command | Compliance-ready reports (Markdown, HTML, PDF-ready) | P1 |
| Audit trail logging | Hash-chained log of every scan + fix (future compliance moat) | P1 |

**Exit criteria:** `firmis fix` successfully auto-remediates malicious skill removal, secret redaction, permission tightening. Zero data loss from fixes (backup always works).

**KPI:** 50 paid monitoring trials initiated, 1,000 GitHub stars

**Why this milestone matters:** Auto-fix is the moat. Competitors avoid it due to liability. By doing safe auto-fixes with mandatory backup/undo, Firmis becomes the first CLI tool that actually fixes agent security issues, not just reports them.

---

### M3: Runtime Monitor — The $19/mo Tier (Week 9-14)

**Goal:** Ship the paid product. Continuous runtime security monitoring for AI agents.

| Deliverable | Details | Priority |
|-------------|---------|----------|
| MCP stdio proxy | Intercept all MCP tool calls between agent and servers | P0 |
| Tool call logging | Log every tool invocation with inputs/outputs | P0 |
| Behavioral baseline | Learn what's "normal" for this agent over 7 days | P0 |
| Anomaly detection | Alert when agent behavior deviates from baseline | P0 |
| PII detection in tool outputs | Flag when PII appears in outbound data | P1 |
| Blast radius scoring | Score each action by potential damage | P1 |
| Weekly security digest | Email summary of agent activity + threats detected | P1 |
| Stripe billing integration | $19/mo subscription management | P0 |
| Simple web dashboard | View active monitors, alerts, weekly reports | P1 |

**Exit criteria:** `firmis monitor` successfully intercepts MCP traffic, logs tool calls, detects anomalies, sends weekly digest. Billing works. 50 paying users.

**KPI:** 50 paying users × $19/mo = $950 MRR

**Why this milestone matters:** This validates the business model. Runtime monitoring is the wedge nobody else occupies at this price point. Every enterprise tool does this for $25K+/year. Firmis does it for $228/year. The 100x price difference is the distribution story.

---

### M4: Red Teaming (Week 15-20)

**Goal:** Let developers adversarially test their agents before deployment. Shift-left for agent security.

| Deliverable | Details | Priority |
|-------------|---------|----------|
| `firmis redteam` command | Automated adversarial testing against live agents | P0 |
| Promptfoo integration | Leverage Promptfoo's attack generation engine | P0 |
| Prompt injection test suite | 50+ injection variants (direct, indirect, multi-turn) | P0 |
| Tool abuse test suite | Unauthorized invocation, parameter tampering | P1 |
| Data exfiltration test suite | PII extraction, credential theft attempts | P1 |
| OWASP LLM Top 10 mapping | Map findings to OWASP standard categories | P1 |
| CI/CD fail gates | `--fail-on critical` for pipeline blocking | P0 |
| Quick mode (5 min) / Full mode (30 min) | Configurable depth | P1 |

**Exit criteria:** `firmis redteam` finds real vulnerabilities in test agents. OWASP-aligned report output. CI/CD integration working.

**KPI:** 200 paying users, red team command adopted by 30% of active users

**Why this milestone matters:** Red teaming is the highest-value capability for the "cautious developer evaluating AI agents" persona. It answers "is my agent safe?" with data, not vibes. This is also the capability most likely to drive Team tier upgrades ($99/mo) because teams want to run red team in CI/CD.

---

### M5: Threat Modeling + Policy Engine (Week 21-28)

**Goal:** Enterprise-grade capabilities that create compliance moat and drive Enterprise tier.

| Deliverable | Details | Priority |
|-------------|---------|----------|
| `firmis threat-model` command | Auto-generate threat model from agent config | P1 |
| STRIDE + ASTRIDE framework | Standard + AI-specific threat categories | P1 |
| `firmis policy` command | Define and enforce security policies | P1 |
| Plain English policy compilation | LLM-compiled natural language policies | P2 |
| YAML policy files | Deterministic, no-LLM policy enforcement | P1 |
| Compliance evidence package | Aggregate scan + fix + monitor data for auditors | P1 |
| Multi-agent Team dashboard | Centralized view for Team tier | P1 |

**Exit criteria:** Threat model output is useful and accurate for real agent architectures. Policy engine enforces rules at scan-time and runtime. Enterprise tier has 10+ customers.

**KPI:** 500 paying users, $15K MRR, Enterprise tier validated

---

## 7. Revenue Model

### Pricing

| Tier | Price | Target | Key Capability |
|------|-------|--------|---------------|
| Free | $0 | Individual developers | scan + discover + bom + fix + ci + report |
| Developer | $19/mo | Power users, prosumers | + runtime monitor + behavioral baseline + weekly digest |
| Team | $99/mo | Small teams, startups | + red team cloud + shared policies + team dashboard + 10 agents |
| Enterprise | $199/mo | Growing companies | + threat model + compliance evidence + audit trail + 100 agents |

### Unit Economics Target

| Metric | Target | Notes |
|--------|--------|-------|
| ARPU | $45/mo | Blended (heavy free tier) |
| Gross Margin | >90% | Infra costs ~$2/user/mo |
| CAC | <$50 | PLG, community-driven |
| LTV | $540 | 12-month avg tenure |
| LTV:CAC | >10:1 | |
| Monthly Churn | <5% | Baseline + audit trail = stickiness |
| Free → Paid | >5% | Runtime monitor is clear upgrade path |

### Revenue Projections

| Month | Free Users | Paid Users | MRR | ARR |
|-------|-----------|-----------|-----|-----|
| 3 (M2 complete) | 2,000 | 50 | $950 | $11.4K |
| 6 (M3 complete) | 5,000 | 200 | $5,000 | $60K |
| 9 (M4 complete) | 10,000 | 500 | $15,000 | $180K |
| 12 (M5 complete) | 20,000 | 1,000 | $35,000 | $420K |
| 18 | 40,000 | 2,500 | $80,000 | $960K |

---

## 8. Open-Source Tool Integration Map

### Full dependency matrix for all planned capabilities:

| Firmis Capability | OSS Tool | What We Use From It | License | Integration Risk |
|-------------------|----------|---------------------|---------|-----------------|
| **Secret Detection** | Gitleaks | Regex patterns for 800+ secret types | MIT | LOW — port patterns to TS |
| **CVE Scanning** | OSV-Scanner (Google) | osv.dev API for vulnerability lookup | Apache 2.0 | LOW — REST API, no binary dep |
| **Malware Signatures** | YARA-X | Rule format for malware pattern matching | BSD-3 | MED — port rules, skip binary |
| **SBOM Base** | Syft (Anchore) | Dependency detection logic reference | Apache 2.0 | LOW — reference only |
| **AI-BOM** | Trusera ai-bom | AI component scanner architecture | MIT | LOW — reference, build in TS |
| **BOM Format** | CycloneDX | ML-BOM specification + TS library | Apache 2.0 | LOW — npm package available |
| **BOM Format** | OWASP AIBOM | Field mappings and completeness scoring | CC BY-SA | LOW — spec reference |
| **Runtime Proxy** | Invariant Gateway | MCP proxy architecture, trace format | Apache 2.0 | MED — adapt from Python to TS |
| **Runtime Policy** | Invariant Guardrails | .gr policy DSL for runtime enforcement | Apache 2.0 | MED — adapt DSL to TS engine |
| **PII Detection** | Presidio (Microsoft) | PII entity recognition | MIT | MED — REST API or port regex |
| **Red Teaming** | Promptfoo | Attack generation, evaluation, CI/CD | MIT | LOW — TS native, npm package |
| **Red Teaming** | DeepTeam | 40+ vulnerability classes, attack patterns | Apache 2.0 | LOW — reference attack library |
| **Red Teaming** | Garak (NVIDIA) | 100+ adversarial probes | Apache 2.0 | LOW — reference probe patterns |
| **Red Teaming** | PyRIT (Microsoft) | Multi-turn attack orchestration patterns | MIT | LOW — reference only |
| **Red Teaming** | AgentDojo (Invariant) | Agent-specific security benchmarks | MIT | LOW — benchmark reference |
| **Threat Modeling** | STRIDE-GPT | LLM prompting for STRIDE analysis | MIT | LOW — adapt prompts for CLI |
| **Threat Modeling** | ASTRIDE | AI-specific STRIDE extension (A-category) | Research | LOW — implement threat taxonomy |
| **Threat Framework** | OWASP Agentic AI Top 10 | ASI01-ASI10 threat categories | CC BY-SA | LOW — taxonomy reference |
| **Threat Framework** | MAESTRO (CSA) | Architectural pattern detection for agents | — | LOW — pattern reference |
| **Policy Engine** | OPA | Rego policy language design patterns | Apache 2.0 | LOW — design reference only |

### Integration Philosophy

**Rule: No Python runtime dependencies.** Everything ships as a single `npx` command. Zero-install, zero-config.

- **Port patterns, not binaries:** Extract regex patterns, rule files, and attack libraries from Python tools. Re-implement matching in TypeScript.
- **API over binary:** For heavy tools (OSV, Presidio), call their APIs rather than bundling binaries.
- **Reference, don't fork:** For architecture inspiration (Invariant Gateway, Lasso), study the design and re-implement in TS. Don't maintain a Python fork.
- **Exception:** Promptfoo is TS-native and can be used directly as an npm dependency for red teaming.

---

## 9. Distribution & GTM

### Channel Priority

| Channel | M0-M1 | M2-M3 | M4-M5 |
|---------|-------|-------|-------|
| **GitHub / npm** | ★★★ Core | ★★★ | ★★★ |
| **ClawHub skill** | ★★★ Launch | ★★ | ★ |
| **Hacker News** | ★★★ (ABOM launch, red team findings) | ★★ | ★ |
| **OpenClaw Discord** | ★★★ | ★★ | ★ |
| **X/Twitter** | ★★★ | ★★★ | ★★ |
| **DEV.to / Reddit** | ★★ | ★★★ | ★★ |
| **SEO content** | ★ Start | ★★ Scale | ★★★ |
| **Product Hunt** | — | ★★★ (at M3 launch) | — |
| **Security researcher outreach** | ★★ | ★★★ | ★★ |
| **Partnerships (DigitalOcean, exe.dev)** | — | ★ | ★★★ |

### Key Launch Moments

| Milestone | Launch Event | Target Channel |
|-----------|-------------|---------------|
| M1 (ABOM) | "Show HN: I generated an AI Bill of Materials for 100 repos" | HN, X, GitHub |
| M2 (Fix) | "Firmis now auto-fixes agent security issues" | X, Discord, DEV.to |
| M3 (Monitor) | Product Hunt launch: "Runtime security for AI agents — $19/mo" | PH, HN, X |
| M4 (Red Team) | "I red-teamed 50 OpenClaw agents — here's what broke" | HN, X, Reddit, security blogs |

### Content Strategy

| Content Type | Frequency | Purpose |
|--------------|-----------|---------|
| Weekly Threat Report | Weekly | Authority, SEO, newsletter growth |
| ABOM showcase posts | Per milestone | Shareable findings, awareness |
| "How to secure [framework]" guides | Bi-weekly | SEO, capture search intent |
| Red team findings | Monthly | Press-worthy, trust-building |
| Video demos (60-sec terminal recordings) | Per feature | Visual proof, social distribution |

---

## 10. Competitive Positioning

### The Market Map

```
                    CONTINUOUS MONITORING + RED TEAM + ABOM
                           │
                           │    ┌────────────────────────┐
                           │    │                        │
                           │    │  Enterprise Players    │
                           │    │  Snyk Evo ($25K+/yr)   │
                           │    │  PANW AI Security      │
                           │    │  Noma ($50K+)          │
                           │    │  Zenity ($50K+)        │
                           │    │                        │
                           │    └────────────────────────┘
                           │
                           │    ┌────────────────────────┐
                           │    │                        │
                           │    │   ★ FIRMIS ★           │
                           │    │                        │
                           │    │   Same capabilities    │
                           │    │   Open-source CLI      │
                           │    │   $0-199/mo            │
                           │    │   9+ platforms          │
                           │    │   Zero-config install   │
                           │    │                        │
                           │    └────────────────────────┘
                           │
    FREE ──────────────────┼────────────────── $25K+/yr
                           │
        Snyk mcp-scan      │    
        Cisco MCP Scanner  │    
        Bitdefender        │    
        SafeClaw           │
                           │
                    POINT-IN-TIME SCAN ONLY
```

### Why Firmis Wins at the Developer Layer

| Dimension | Enterprise Tools | Firmis |
|-----------|-----------------|--------|
| **Time to first scan** | Days (SSO, onboarding, RBAC) | 30 seconds (`npx firmis scan`) |
| **Price** | $25K-100K/year | $0-199/mo |
| **Platform coverage** | MCP + generic AI apps | 9+ specific platforms |
| **Distribution** | Enterprise sales team | npm, GitHub, community |
| **Auto-fix** | PRs + tickets (enterprise workflow) | Direct file fix + undo (developer workflow) |
| **ABOM** | Dashboard view | CLI output, CycloneDX export, CI/CD native |
| **Red teaming** | Managed service, scheduled | On-demand, `npx firmis redteam`, CI/CD gates |
| **Runtime** | Managed sidecar, SOC integration | Self-hosted proxy, $19/mo |
| **Open-source** | No | Yes (MIT scanner) |

### Competitive Soundbites

| Vs. | Message |
|-----|---------|
| **Enterprise tools** | "Same capabilities, 99% less cost, zero-config install" |
| **Snyk mcp-scan** | "We scan 9 platforms, not just MCP. We fix, monitor, and red team — not just scan" |
| **Cisco Scanner** | "Cisco scans skills. We scan skills, monitor runtime, generate ABOMs, and auto-fix" |
| **DIY / No security** | "Your agent has root access. 341 malicious skills exist. Run one command to find out if you're safe" |

---

## 11. Success Metrics

### North Star

**Free users × conversion rate × ARPU = MRR**

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| **npm weekly downloads** | 2,000 | 5,000 | 15,000 |
| **GitHub stars** | 1,000 | 3,000 | 8,000 |
| **Paying users** | 50 | 200 | 1,000 |
| **MRR** | $950 | $5,000 | $35,000 |
| **ARR** | $11.4K | $60K | $420K |

### Product Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Scan completion rate | >90% | Tool actually works on real projects |
| Issues found per scan | >3 avg | Justifies the tool's existence |
| Fix success rate | >95% | Trust in auto-remediation |
| Monitor uptime | >99% | Reliability of paid tier |
| Time to first scan | <60 seconds | Zero-friction adoption |
| ABOM generation success | >95% | Core differentiator works |

### Business Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Free → paid conversion | >5% | Business model viability |
| Monthly churn (paid) | <5% | Behavioral baseline = stickiness |
| NPS | >50 | Product-market fit signal |
| Organic referral rate | >20% | PLG working |
| SEO organic traffic | 10K/mo by M6 | Sustainable acquisition |

---

## 12. Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MCP proxy breaks agent functionality | Medium | High | Extensive testing, passthrough mode, instant disable |
| False positives in scan erode trust | Medium | High | Three-tier confidence model, community feedback loop |
| Auto-fix causes data loss | Low | Critical | Mandatory backup before every fix, undo command |
| Promptfoo dependency breaks | Low | Medium | Abstraction layer, can swap red team engine |
| LLM costs for threat modeling too high | Medium | Low | Cache results, offer without LLM (rule-based fallback) |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Enterprise players release free tiers | Medium | High | Ship fast, build community moat, 9+ platform advantage |
| OpenClaw security crisis fades from news | Medium | Medium | Expand beyond OpenClaw — position as multi-framework |
| Developers don't pay $19/mo | Medium | Medium | Prove value in free tier first, make upgrade path obvious |
| Snyk bundles agent scan in free tier | Medium | High | Multi-platform depth they can't match, community ownership |

### Mitigation Priority

1. **Speed:** Ship M1-M3 before enterprise tools release free tiers
2. **Breadth:** 9+ platform analyzers is a moat — nobody else covers this many
3. **Community:** MIT license + contributable YAML rules = community ownership
4. **Data moat:** Behavioral baselines and audit trails create switching costs from Day 1

---

*End of PRD v5.0*

*"Enterprise-grade AI agent security. Open-source. CLI-first. Free."*

