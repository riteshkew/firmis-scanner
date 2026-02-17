# Firmis Unified Plan v5.0

**The Immune System for AI Agents** (Internal Architecture Document)

**Date:** 2026-02-17
**Version:** 5.2 (supersedes PRDv2.0.md/v4.0, ARCHITECTURE.md v2.0)
**Status:** Master Plan — Source of Truth
**Stack:** TypeScript/Node.js CLI (scanner + monitor-free + pentest) + Lasso MCP Gateway/Python (monitor-paid) + API wrappers (web scanners) + Next.js Landing
**Target:** Two-ring ICP — Outer: any developer running AI agents (free adoption). Inner: agent builders deploying for business clients (paid).
**Customer-Facing Positioning:** "The security layer for AI agents" (Agentic Security category)
**Internal Architecture Model:** Immune System (7 layers) — repackage externally as "Agentic Security Maturity Model"

---

## 1. The Immune System Thesis

Firmis is an immune system for AI agents. Not a scanner. Not a firewall. Not a dashboard. An immune system — the only architecture that defends an open system against unbounded unknown threats without shutting it down.

> **Customer-Facing Note:** The immune system model is the internal architecture thesis. Externally, position as "Agentic Security" — the category buyers and auditors recognize. The 7-layer model should be published as the "Agentic Security Maturity Model" — an industry framework for assessing agent security posture. This is a long-term moat: if auditors adopt the framework, Firmis becomes the default tool.

### Why "Immune System" Is the Correct Architecture

AI agents are open by design. They must accept external tools, data, and instructions to be useful. This is identical to the biological challenge: an organism that seals itself off dies. An organism that accepts everything also dies. The immune system is evolution's answer to this paradox — and it's ours.

No single mechanism is sufficient. mcp-scan gives you innate pattern matching only. Lasso gives you adaptive patrol only. LlamaFirewall gives you a generic firewall only. Firmis is the only platform delivering all seven layers.

### Layer Mapping

| Immune Layer | Biological Function | Firmis Component | Command | Status |
|---|---|---|---|---|
| **Physical barriers** | Skin, mucous membranes | Docker sandboxes, E2B (not us) | — | We complement, don't replace |
| **Innate immunity** | Pattern recognition (PAMPs), phagocytes | Static scan — YAML rules + secret detection + YARA patterns | `firmis scan` | **SHIPPED** (176+ rules, YARA engine) |
| **Immune surveillance** | Dendritic cells sampling tissues | Auto-detect all frameworks, tools, models | `firmis discover` | Partial, M1 formalizes |
| **Cellular registry** | MHC presentation — "what cells exist" | Agent Bill of Materials (CycloneDX) | `firmis bom` | Not built, M1 |
| **Inoculation / Stress test** | Vaccine challenge, immune stress test | Active pentesting — adversarial probing of MCP servers and agents | `firmis pentest` | Not built, M2 |
| **Inflammatory response** | Cytokines, neutrophil recruitment | Quarantine, credential rotation, config hardening | `firmis fix` | Not built, M2 |
| **Adaptive patrol** | T-cells, B-cells circulating | MCP stdio proxy, runtime policy enforcement | `firmis monitor` | Not built, M3 |
| **Medical record** | Patient history, treatment record | HTML report with AI fix prompts, scan history | `firmis report` | Partial, M0 enhances |
| **Immune memory** | Memory B/T cells — instant recall | Known-malicious blocklist, IOC database, YARA signatures | Internal | Partial (50+ blocklist, 6 YARA sigs) |
| **Vaccination** | Pre-exposure priming, herd immunity | Community threat feed, anonymous telemetry | Cloud | Not built, M4 |

### The Inoculation Layer (New in v5)

Biological immune systems are stress-tested through inoculation — deliberately introducing weakened pathogens to train the immune response. Without stress testing, you don't know if your defenses actually work until a real attack happens.

`firmis pentest` is inoculation for AI agents. It actively probes MCP servers and agent configurations with adversarial inputs — tool poisoning attempts, prompt injection, credential extraction, authorization boundary violations — and reports what succeeded. Static scanning (innate immunity) finds structural weaknesses. Pentesting finds functional weaknesses — things that look safe in config but break under adversarial pressure.

This is the difference between checking that a lock exists (scan) and actually trying to pick it (pentest).

### The 5-Part Blog Arc ("The Immune System")

1. **"Your AI Agents Have No Immune System"** — Why AI agents are uniquely vulnerable (open by design)
2. **"We Scanned 4,812 AI Agent Skills — Here's What We Found"** — Original research with real scan data
3. **"Tool Poisoning: The Attack Your Security Team Has Never Heard Of"** — MCP-specific threats (84.2% success rate)
4. **"The Inflammatory Response: Auto-Fixing AI Security Without Breaking Everything"** — How `firmis fix` works
5. **"Herd Immunity for AI Agents: The Case for Community Threat Intelligence"** — The vaccination model

---

## 2. What Exists Today (v1.3.0)

### Shipped

- 8 platform analyzers: OpenClaw, MCP, Claude, CrewAI, Cursor, Codex, AutoGPT, Nanobot
- 176+ YAML rules across 15 rule files, 14 threat categories
- 60 secret-detection rules (Gitleaks-style patterns)
- 6 YARA malware signature rules (pure TS engine — obfuscated payloads, reverse shells, credential stealers, package hijacking, coin miners, RAT/backdoor)
- OSV vulnerability scanning via api.osv.dev batch API
- Three-tier confidence model (suspicious / likely / confirmed)
- Context-aware matching (code vs docs vs config) with documentation multiplier
- 4 reporters: terminal (A-F grade), JSON, SARIF, HTML (enhanced with AI fix prompts, dark theme)
- 3 CLI commands: `scan`, `list`, `validate`
- 5 rule matchers: regex, AST, network, string-literal, YARA
- Babel AST for JS/TS
- Known-malicious blocklist (50+ skills, 10+ authors, C2 infrastructure)
- `.firmisignore` support, `--ignore`, `--quiet`, `--fail-on` flags
- 219 tests passing across 19 test files
- Published on npm as `firmis-scanner`

### Sprint A Deliverables (2026-02-17)

- 3 new rule files: `tool-poisoning.yaml` (5 rules), `network-abuse.yaml` (5 rules), `file-system-abuse.yaml` (6 rules)
- Extended `agent-memory-poisoning.yaml` (+3 rules: Copilot, AGENTS.md/Codex, .aider/)
- Extended `credential-harvesting.yaml` (+4 rules: Azure CLI, AWS SSO, Vault tokens, container env)
- YARA-like pattern matching engine (`src/rules/matchers/yara-matcher.ts`) with text/hex/regex string types and condition evaluator
- `rules/malware-signatures.yaml` — 6 YARA rules for obfuscated payloads, reverse shells, credential stealers, package hijacking, coin miners, RAT/backdoor patterns
- Removed comment-line filter in regex matcher (was suppressing valid detections)
- All 3 previously empty threat categories now have active rules (tool-poisoning, network-abuse, file-system-abuse)

### Current Dependencies

```
@babel/parser, @babel/traverse, @babel/types — AST parsing
commander — CLI framework
fast-glob — file discovery
js-yaml — rule loading
chalk + ora — terminal UI
```

### Bugs Fixed (from 2026-02-16 and 2026-02-17 audits)

- 26 broken regex patterns (18 invalid PCRE flags + 8 double-escaped YAML)
- Confidence threshold killing valid single-pattern matches
- MCP config scanning gap + per-server dedup
- Platform path override (`firmis scan <path>` without --platform)
- FP explosion in documentation files (context multiplier 0.15x)
- sec-035 Vault token FP (540 hits from minified JS)
- Unsafe YAML loading in nanobot parser (code execution via !!js/function)
- Secret-detection exempt from doc multiplier (secrets in docs = real leaks)
- Cloud IMDS + WebSocket exfiltration rules added

### Strategic Decision: Supabase Removed

Supabase RLS/auth/storage scanning was infrastructure security, not agentic security. The standalone platform scanner, 5 rule files, CLI command, and all fixtures were removed. Generic secret-detection rules that catch `SUPABASE_SERVICE_ROLE_KEY` leaks remain.

---

## 3. Architecture Decisions (v5)

These decisions override ARCHITECTURE.md v2.0 and PRDv2.0.md where they conflict.

| Decision | v4 (docs/) | v5 (this document) | Rationale |
|---|---|---|---|
| **Secret detection** | Gitleaks subprocess (external binary) | Port Gitleaks regex patterns to pure TS | Zero-install requirement. Gitleaks rules are MIT — port ~230 patterns, not the binary. |
| **YARA malware detection** | `@litko/yara-x` WASM npm package | Port key YARA text/regex patterns to pure TS matchers | No public WASM npm package exists. YARA text+regex patterns trivially portable to JS RegExp. |
| **Vulnerability scanning** | OSV REST API | OSV REST API (unchanged) | Pure `fetch`, no deps, batch endpoint handles 1,000 packages/call. |
| **Active pentesting** | Not planned | promptfoo (TypeScript, MIT) as red-team engine + Cisco mcp-scanner as behavioral analyzer | Same language, same runtime, npm-native. Adds dynamic testing to static analysis. |
| **Runtime monitor** | Lasso MCP Gateway Python plugin | **Two-tier:** Free = TypeScript MCP proxy via `@modelcontextprotocol/sdk`. Paid = Lasso MCP Gateway + FirmisPlugin (Python) | Free tier stays zero-install TS. Paid tier leverages Lasso's battle-tested gateway + plugin API — don't reinvent the wheel. |
| **Policy language** | Invariant `.gr` (Python) | YAML runtime rules (adapted from `.gr` design) | Reuses existing rule engine. `.gr` is Python-only with Snyk acquisition risk. |
| **BOM format** | Not planned | CycloneDX 1.7 ML-BOM via `@cyclonedx/cyclonedx-library` | Emerging compliance requirement. Apache-2.0. No competitor does this for prosumers. |
| **Website scanner** | Not in CLI | **KILLED** — different market, different competitors, dilutes agentic security positioning | Not building. Website security scanning is a red ocean with no connection to our agentic security wedge. |
| **Supabase scanner** | Custom regex only | **REMOVED** (v1.2.0) — infrastructure security, not agentic | Generic secret-detection rules catch Supabase keys alongside AWS/GitHub/etc. Standalone scanner killed. |
| **PII detection** | Not planned | Presidio patterns (MIT) ported to TS regex | Credential redaction in MCP tool responses at runtime. |

### Design Principles

1. **Don't reinvent commodity detection** — Port patterns from MIT/Apache OSS tools (Gitleaks, YARA, Nuclei, Splinter, promptfoo). Build only the agent-specific context layer.
2. **Zero-install (free tier)** — Everything works via `npx firmis <command>`. No Python, no Docker, no WASM, no subprocess binaries required. Paid tier (runtime monitor) uses Lasso MCP Gateway (Python) — users who pay get enhanced capabilities through battle-tested infrastructure.
3. **Defense-in-depth** — Complement sandboxes (Docker, E2B), don't replace them.
4. **Static + Dynamic** — Scan finds structural weaknesses, pentest finds functional weaknesses. Both required for real coverage.
5. **Open-core** — MIT scanner CLI (trust/adoption), proprietary monitor/fix/cloud (revenue).
6. **Ship fast** — Simple implementations that work over complex abstractions.

---

## 4. Product Funnel

### Two-Ring ICP Model

**Outer Ring (Free Adoption):** Any developer running AI agents — curious, nervous, or proactive about security. Finds Firmis through content, SEO, community. Runs free scan. May never pay.

**Inner Ring (Paid Monetization):** Agent builders deploying solutions for business clients. Client asks "is this secure?" — builder needs proof. Converts to paid compliance report + monitoring.

```
Education content (blog, build-in-public, research)
    |
    v
npx firmis scan (free, no signup, 30 seconds)
    | -> Terminal: A-F grade, plain English findings
    | -> Education: "Here's what your MCP config exposes"
    |
    v
firmis report (free basic, email-gated)
    | -> Basic PDF: security grade + findings
    | -> Lead magnet: captures email for nurture sequence
    |
    v
Client asks "is this secure?"
    | -> Compliance report (paid): SOC2/AI Act/GDPR gap analysis
    | -> Branded, client-shareable PDF with AI fix prompts
    |
    v
firmis pentest (free basic: 10 probes, paid full: 50+ probes)
    | -> Active testing of MCP servers for tool poisoning, auth bypass
    | -> "We tried to extract credentials via your MCP server — and succeeded"
    |
    v
firmis monitor (paid, per deployment)
    | -> Continuous runtime protection
    | -> "Fire and forget" — deploy once, always protected
    |
    v
Revenue: Paid per deployment (pricing TBD post-build)
```

### Distribution Strategy

- **Content-led, build-in-public:** Education-first content. Original research. Share development journey.
- **SEO:** Target platform-specific searches ("is OpenClaw safe", "MCP security", "agentic security")
- **Community:** r/ClaudeAI, r/LocalLLaMA, OpenClaw community, Hacker News
- **Partnerships:** Agent harness vendors (complementary, not competitive)
- **CI/CD:** GitHub Action for automated scanning (M1+)

---

## 5. Pentest Agent Architecture

### Why promptfoo

| Criteria | promptfoo | garak (NVIDIA) | Cisco mcp-scanner | DeepTeam | ARTEMIS (Stanford) |
|---|---|---|---|---|---|
| Language | **TypeScript** | Python | Python | Python | Python + Rust |
| License | **MIT** | Apache 2.0 | Apache 2.0 | Apache 2.0 | Apache 2.0 |
| MCP-specific | **Yes (MCP provider)** | No (generic LLM) | Yes | No | No (network pentest) |
| Zero-install | **npx promptfoo** | pip install | pip install | pip install | Heavy infra |
| npm-native | **Yes** | No | No | No | No |
| Library import | **Yes (Node.js API)** | No | No | No | No |
| Lightweight | **Yes** | Moderate | Yes | Yes | No |

promptfoo is the only tool that is TypeScript-native, MIT-licensed, MCP-aware, and importable as an npm library. It is the clear choice for the primary integration.

Cisco mcp-scanner adds behavioral code analysis (detecting what a server actually does vs what it claims) via YARA + LLM-as-judge. This is a complementary optional integration — subprocess-wrapped, enhances but not required.

### Other Tools Evaluated (Deferred or Reference Only)

| Tool | License | Verdict | Reason |
|---|---|---|---|
| **garak** (NVIDIA) | Apache 2.0 | Defer to M5 | Python, LLM-behavior focused, not MCP-specific |
| **DeepTeam** (Confident AI) | Apache 2.0 | Defer to M5 | Python, agentic red-teaming, good for multi-turn |
| **PyRIT** (Microsoft) | MIT | Reference only | No clean CLI, library-only, hard to wrap |
| **ARTEMIS** (Stanford) | Apache 2.0 | Not suitable | Network pentest, heavy infra, wrong attack surface |
| **CAI** (Alias Robotics) | MIT | Not suitable | Exploitation-focused, needs Kali Linux |
| **PentAGI** (vxcontrol) | MIT | Not suitable | Docker-required, too heavy |
| **HackingBuddyGPT** (TU Wien) | MIT | Reference only | SSH-to-target, needs live VM |
| **Proximity** (Nova) | GPL-3.0 | Watch | MCP scanning, GPL copyleft concern |
| **Big Sleep** (Google P0) | Not open source | Methodology reference | Variant analysis concept is worth adopting |

### Pentest Engine Design

```
firmis pentest [path] [--target mcp|agent|all] [--depth basic|full]
    |
    +-- 1. Read scan results (or run scan first)
    |      Identify MCP servers, tool endpoints, agent configs
    |
    +-- 2. Generate attack configs
    |      For each MCP server: tool poisoning probes, auth bypass,
    |      parameter injection, PII extraction, BFLA/BOLA
    |
    +-- 3. Execute probes via promptfoo (in-process, TypeScript)
    |      +-- Tool poisoning: inject hidden instructions in tool descriptions
    |      +-- Credential extraction: probe for sensitive data leakage
    |      +-- Auth boundary: test cross-tool access violations
    |      +-- Prompt injection: multi-turn adversarial conversations
    |      +-- Parameter injection: SQL injection, path traversal via tool args
    |
    +-- 4. (Optional) Cisco mcp-scanner behavioral analysis
    |      If installed: subprocess call for YARA + LLM code analysis
    |      If not installed: skip with informational message
    |
    +-- 5. Merge findings into Firmis threat schema
    |      Source: 'pentest:promptfoo' | 'pentest:cisco-mcp-scan'
    |      Category: 'tool-poisoning' | 'auth-bypass' | 'injection'
    |
    +-- 6. Report
           Pentest findings alongside static scan findings
           "Static scan found 3 issues. Active testing found 2 more."
```

### Immune System Mapping

| Pentest Capability | Immune Equivalent | What It Catches That Static Cannot |
|---|---|---|
| Tool poisoning probes | Inoculation with weakened pathogen | Hidden instructions in tool descriptions that only activate at runtime |
| Auth boundary testing | Stress-testing tissue barriers | MCP servers that claim restricted access but actually allow unrestricted queries |
| Credential extraction | Checking for leaky membranes | Tool responses that include PII/secrets not visible in static config |
| Multi-turn injection | Testing adaptive immunity | Attacks that require multiple rounds to bypass guardrails |
| Parameter injection | Probing for entry points | SQL injection, path traversal through tool arguments that pass config validation |

### Tiering

| Tier | Scope | Gate |
|---|---|---|
| **Free** | Basic probes: tool poisoning detection, obvious auth issues, known injection patterns. ~10 probe types. | No gate |
| **Paid (pricing TBD)** | Full red-team: multi-turn attacks, adaptive evasion, custom probe generation, LLM-as-judge analysis, continuous scheduled pentesting. ~50+ probe types. | License key |

### Implementation Files

```
src/pentest/
  engine.ts             Orchestrator: load scan results, generate configs, run probes
  promptfoo-adapter.ts  Wraps promptfoo Node.js API for Firmis threat schema
  mcp-probes.ts         MCP-specific probe definitions (tool poisoning, auth, injection)
  cisco-adapter.ts      Optional subprocess wrapper for Cisco mcp-scanner
  report.ts             Pentest-specific findings formatter
src/cli/commands/
  pentest.ts            CLI command handler
```

---

## 6. Milestone Roadmap

### M0: Foundation Hardening (Weeks 1-4, Current Sprint)

**Goal:** Add commodity detection layers. Ship enhanced HTML report as lead magnet.

| # | Deliverable | OSS Foundation | License | Priority |
|---|---|---|---|---|
| M0.1 | **Secret detection engine** | Port ~230 Gitleaks TOML regex patterns + Shannon entropy | MIT | **SHIPPED** (60 rules) |
| M0.2 | **OSV vulnerability scanning** | `fetch` to `api.osv.dev/v1/querybatch` | CC-BY-4.0 | **SHIPPED** |
| M0.3 | **Enhanced HTML report** | Internal — AI fix prompts, severity chart, email CTA | — | **SHIPPED** |
| M0.4 | **YARA-X pattern matching** | Port YARA text+regex rules to TS matchers | BSD-3 | **SHIPPED** |

**M0.1 — Secret Detection:**
- Create `src/integrations/secrets.ts` — pure TS engine
- Parse Gitleaks `gitleaks.toml` at build time, translate each `[[rules]]` to Firmis `Rule` type
- Ship as `rules/secrets.yaml` with ~230 patterns (AWS, Azure, GitHub, GitLab, Google, Slack, Stripe, OpenAI, Anthropic, HuggingFace, 200+ providers)
- Shannon entropy post-filter: after regex match, compute entropy of captured group, reject below threshold
- `secretGroup` support: extract specific capture group
- `keywords` support: fast pre-filter before regex (skip files without keyword)
- Add `secret-detection` threat category
- Deduplicate against existing `cred-*` rules

**M0.2 — OSV Integration:**
- Create `src/integrations/osv.ts` — pure `fetch` client
- Parse: `package.json` (npm), `requirements.txt` (pip), `pyproject.toml` (Poetry)
- Batch query: POST to `https://api.osv.dev/v1/querybatch`, up to 1,000 packages/call
- Map: CVE ID, severity (CVSS), affected version, fixed version
- Agent context: "This vulnerable package is used by your CrewAI agent"
- Graceful 2s timeout + warning when offline
- Cache 24h in `~/.firmis/cache/osv/`

**M0.3 — Enhanced HTML Report:**
- Upgrade existing `src/reporters/html.ts`
- Sections: A-F gauge, executive summary, findings by severity/platform, AI fix prompt per finding
- Fix prompt templates per category: credential -> env var migration, malicious -> removal command, exfil -> block network call
- "Copy for Claude" button (clipboard copy)
- "Share this report" CTA -> email capture (waitlist API POST)
- Inline CSS, dark theme, single self-contained HTML file
- Email gate: report requires email to download (`firmis report --no-email` for CI)
- Compliance gap indicators: map findings to SOC2 CC6/CC7, AI Act Article 9/15, GDPR Article 32
- Two-tier report: Free (grade + findings), Paid (compliance mapping + client branding + AI fix prompts)

**M0.4 — YARA-X Pattern Matching:**
- Create `src/integrations/yara-ts.ts` — pure TS YARA-like engine
- Port patterns for: obfuscated base64 payloads, reverse shells, credential stealers, package.json hijacking (preinstall/postinstall scripts with encoded payloads)
- Condition evaluator: `any of`, `all of`, `N of ($group*)`
- Hex pattern support via Buffer comparison
- New rule file: `rules/malware-signatures.yaml`

---

### M1: Discovery + Agent BOM (Weeks 5-8)

**Goal:** Know what's installed before scanning it. `firmis discover` + `firmis bom`.

| # | Deliverable | OSS Foundation | Priority |
|---|---|---|---|
| M1.1 | **`firmis discover`** | Internal | P0 |
| M1.2 | **`firmis bom`** | `@cyclonedx/cyclonedx-library` (Apache-2.0) | P0 |
| M1.3 | **`firmis ci`** | Internal | P1 |

**M1.1 — Discovery:**
- Walk directory tree, auto-detect: Claude (`~/.claude/skills/`), MCP (`claude_desktop_config.json`, `.vscode/mcp.json`), OpenClaw (`~/.openclaw/skills/`), CrewAI (`crewai.yaml`), Cursor (`.cursor/`), Codex (`.codex/`), AutoGPT (`.autogpt/`), Nanobot (`nanobot.yaml`)
- Detect AI-related npm deps: `@anthropic-ai/*`, `@openai/*`, `langchain`, `crewai`
- Detect AI-related pip deps: `anthropic`, `openai`, `langchain`
- Detect models: `.gguf`, `.safetensors`, Ollama modelfiles
- Output: structured JSON inventory

**M1.2 — Agent BOM:**
- CycloneDX 1.7 ML-BOM JSON with `modelCard` for detected models
- Use `properties` namespace `firmis:agent:` for: permissions, risk-score, threat-count, confidence
- Enables rug pull detection: diff BOM against previous scan

**M1.3 — CI Pipeline:**
- `firmis ci` = discover -> bom -> scan -> report
- `--fail-on critical|high|medium` for CI/CD gating
- SARIF output for GitHub Code Scanning

---

### M2: Pentest Agent + Auto-Fix Engine (Weeks 9-14)

**Goal:** Ship `firmis pentest` (inoculation) and `firmis fix` (inflammatory response).

| # | Deliverable | OSS Foundation | Priority |
|---|---|---|---|
| M2.1 | **`firmis pentest` command** | promptfoo (MIT, TypeScript) | P0 |
| M2.2 | **Cisco mcp-scanner integration** (optional) | cisco-ai-defense/mcp-scanner (Apache-2.0) | P1 |
| M2.3 | **Tier 1 auto-fixes** (no confirmation) | Internal | P0 |
| M2.4 | **Tier 2 prompted fixes** (interactive) | Internal | P0 |
| M2.5 | **Backup + undo system** | Internal | P0 |
| M2.6 | **Enhanced `firmis report`** | Internal | P1 |
| M2.7 | **Native tool poisoning detection** | Independent implementation (Invariant research as reference) | **Partial** (5 YAML rules shipped, deeper semantic analysis remaining) |
| M2.8 | **Rug pull detection** | Internal (BOM diff from M1) | P1 |

**M2.1 — Pentest Command (promptfoo integration):**
- Add `promptfoo` as npm dependency (TypeScript, MIT)
- Import programmatically via Node.js API — no subprocess needed
- Read scan results to identify MCP servers and tool endpoints
- Generate promptfoo redteam YAML config targeting discovered servers
- Run probes: tool poisoning, credential extraction, auth boundary, parameter injection, multi-turn prompt injection
- Map promptfoo results to Firmis threat schema with source `pentest:promptfoo`
- Free tier: 10 basic probe types. Paid: 50+ probe types + adaptive evasion + LLM-as-judge

**M2.2 — Cisco mcp-scanner (optional enhancer):**
- Check if `mcp-scanner` Python package is installed
- If yes: subprocess call for YARA + LLM behavioral code analysis
- Adds: mismatch detection between tool description and actual code behavior
- If not installed: skip with informational message
- Findings merged with source `pentest:cisco-mcp-scan`

**M2.3 — Tier 1 Auto-Fixes:**
- Remove known-malicious skills -> quarantine to `~/.firmis/quarantine/`
- Redact exposed secrets -> replace with `$ENV_VAR`, add to `.env` template
- Tighten permissive file access -> restrict `*` globs
- Harden MCP permissions -> remove unnecessary tool grants
- Every fix: backup -> apply -> verify -> audit log

**M2.4 — Tier 2 Prompted Fixes:**
- Restrict shell access, downgrade over-privileged skills, disable unused MCP servers
- Interactive CLI: show finding -> show proposed fix -> confirm/skip
- `firmis fix --yes` for CI/CD

**M2.5 — Backup + Undo:**
- `~/.firmis/backups/<timestamp>/` with manifest
- `firmis fix --undo` restores from latest
- `firmis fix --dry-run` shows without applying

**M2.7 — Native Tool Poisoning Detection:**
- Implement tool description analysis natively in YAML rules
- Detect hidden markup tags, invisible Unicode characters, instruction-overriding language in MCP tool descriptions
- Check for cross-server description conflicts (server shadowing)
- Pure pattern matching on tool metadata — no external tools required

**M2.8 — Rug Pull Detection:**
- Cache tool descriptions in `.firmis/mcp-baseline/`
- On each scan, compare current descriptions against baseline
- Flag changes as potential rug pull: "Tool X's description changed since last scan"

---

### M3: Runtime Monitor (Weeks 15-20)

**Goal:** Ship `firmis monitor` — the adaptive immune patrol. Two-tier architecture: free TS proxy for basic monitoring, paid Lasso MCP Gateway plugin for enterprise-grade runtime protection.

| # | Deliverable | Foundation | Priority |
|---|---|---|---|
| M3.1 | **Free: MCP stdio proxy (TypeScript)** | `@modelcontextprotocol/sdk` (MIT) | P0 |
| M3.2 | **Runtime policy engine** | YAML rules adapted from Invariant `.gr` design | P0 |
| M3.3 | **Tool call logging + audit trail** | Internal | P0 |
| M3.4 | **Paid: Lasso MCP Gateway + FirmisPlugin** | Lasso (MIT, Python) + custom `GuardrailPlugin` | P0 |
| M3.5 | **Behavioral baseline + anomaly detection** | Internal | P1 |
| M3.6 | **PII detection in tool outputs** | Presidio regex patterns (MIT) ported to TS | P1 |
| M3.7 | **Stripe billing** | Stripe SDK | P0 |
| M3.8 | **Continuous scheduled pentesting** | promptfoo (from M2) | P1 |

**Two-Tier Architecture:**

```
=== FREE TIER (TypeScript, zero-install) ===

Claude Desktop / VS Code / Claude Code
    | (spawns via config)
    v
firmis monitor --wrap "npx @github/mcp-server"
    |
    +-- MCP Server (upstream) -- presents to AI client
    |     tools/list -> forward + cache
    |     tools/call -> evaluate policy -> forward or block
    |
    +-- Policy Engine (TypeScript, YAML rules)
    |     Known-malicious blocklist
    |     Credential detection in args/responses
    |     Basic sequence detection
    |     Rug pull detection (description change from baseline)
    |
    +-- Audit Logger -> ~/.firmis/audit.log
    |
    +-- MCP Client (downstream) -> spawns real server

Limitations: single-server wrapping, basic policies, local-only logging


=== PAID TIER (Lasso MCP Gateway + FirmisPlugin) ===

Claude Desktop / VS Code / Claude Code
    | (connects to Lasso gateway)
    v
Lasso MCP Gateway (Python, MIT)
    |
    +-- FirmisPlugin (Python GuardrailPlugin)
    |     Full Firmis policy engine (ported from TS YAML rules)
    |     Advanced sequence detection (multi-server correlation)
    |     PII redaction in tool responses (Presidio patterns)
    |     Real-time cloud threat enrichment (M4)
    |     Behavioral anomaly detection (call frequency, patterns)
    |
    +-- Multi-server routing (all MCP servers through one gateway)
    |
    +-- Cloud sync -> Firmis dashboard, Slack/email alerts
    |
    +-- Scheduled pentesting via promptfoo (weekly re-probing)

Advantages: battle-tested proxy, multi-server, cloud integration, no reinvention
```

**User setup:**
```bash
# Free: wrap a single server (pure TypeScript, npx)
firmis monitor --wrap "npx @github/mcp-server"

# Free: auto-install into MCP client configs
firmis monitor --install

# Paid: install Lasso gateway with Firmis plugin
firmis monitor --install-gateway
# -> pip install lasso-mcp-gateway firmis-lasso-plugin
# -> Configures Lasso with FirmisPlugin, routes all MCP servers through gateway
```

**Runtime Rules (YAML, adapted from Invariant .gr — used in both tiers):**
```yaml
rules:
  - id: rt-exfil-001
    name: Credential Exfiltration Sequence
    when:
      sequence:
        - tool: "read_file"
          resultContains: ["AKIA", "ghp_", "sk-", "-----BEGIN"]
        - tool: "fetch|http_request"
          argsNotIn:
            url: ["github.com", "api.openai.com"]
    then: block
    message: "Credential exfiltration: sensitive data read then sent externally"
```

**FirmisPlugin (Python, for paid tier):**
```python
# firmis-lasso-plugin/firmis_plugin.py
from lasso.guardrail_plugin import GuardrailPlugin

class FirmisPlugin(GuardrailPlugin):
    """Firmis guardrail plugin for Lasso MCP Gateway."""

    def evaluate_tool_call(self, tool_name, arguments, context):
        # Load YAML runtime rules (same rules as free TS tier)
        # Apply policy engine: blocklist, credential detection, sequence analysis
        # PII redaction in responses (Presidio patterns)
        # Cloud threat enrichment lookup
        pass

    def on_tool_response(self, tool_name, response, context):
        # PII scanning and redaction
        # Anomaly detection (response size, content type)
        pass
```

---

### M4: Cloud + Threat Intelligence (Weeks 21-28)

**Goal:** Ship the vaccination layer. Community-shared immune memory.

| # | Deliverable | Priority |
|---|---|---|
| M4.1 | **Anonymous telemetry pipeline** | P0 |
| M4.2 | **Cloud threat enrichment API** | P0 |
| M4.3 | **Real-time blocklist updates** | P1 |
| M4.4 | **Community threat database** | P1 |
| M4.5 | **Weekly security digest email** | P2 |

**Vaccination Model:**
User A encounters malicious skill X -> telemetry reports hash -> cloud adds to blocklist -> all users get updated blocklist on next scan. Target: < 1 hour from first detection to community protection.

**Telemetry (opt-in, privacy-preserving):**
- Hash all patterns (SHA256), never send code/paths/names
- Rotating installation ID (weekly)
- Aggregate counts only
- See PRIVACY.md for full policy

**Cloud Infrastructure:**
- Cloudflare Workers — API gateway, rate limiting
- Supabase (Postgres + pgvector) — threat signatures, user data
- ClickHouse — telemetry aggregation
- Cloudflare R2 — rule/signature storage

---

### M5: Detection Depth + Advanced Features (Ongoing)

| # | Deliverable | Priority |
|---|---|---|
| M5.1 | Python AST (tree-sitter) for CrewAI, MCP Python servers | P1 |
| M5.2 | Cross-file data flow tracking | P2 |
| M5.3 | Transitive dependency scanning | P2 |
| M5.4 | Typosquatting detection (Levenshtein distance) | P2 |
| M5.5 | Post-install script analysis for npm packages | P2 |
| M5.6 | Go/Rust MCP server support (tree-sitter) | P3 |
| M5.7 | ML behavioral classification | P3 |
| M5.8 | Blast radius scoring | P3 |
| M5.9 | Web dashboard | P3 |
| M5.10 | garak integration (NVIDIA, Apache-2.0) for LLM behavior probing | P3 |
| M5.11 | DeepTeam integration (Apache-2.0) for agentic red teaming | P3 |

---

## 7. Open-Core Boundary

### MIT Licensed (Free Forever)

| Component | Description |
|---|---|
| Scanner CLI | `scan`, `list`, `validate`, `discover`, `bom`, `ci` |
| Platform Analyzers | All 8 platforms |
| Rule Engine + Rules | 176+ core rules + secrets + YARA malware signatures |
| Integrations | Secrets engine, OSV client, YARA-TS matcher |
| Reporters | Terminal, JSON, SARIF, Basic PDF report (grade + findings) |
| Pentest (basic tier) | 10 probe types: tool poisoning detection, basic auth testing, known injection patterns |
| Programmatic API | `ScanEngine`, `RuleEngine` exports |

### Proprietary (Paid Tier — Pricing TBD)

| Component | Description |
|---|---|
| Compliance Report | Branded client-shareable PDF, compliance gap analysis (SOC2/AI Act/GDPR), AI fix prompts |
| Auto-Fix Engine | `firmis fix` — quarantine, rotation, hardening |
| Pentest (full tier) | 50+ probe types: multi-turn attacks, adaptive evasion, LLM-as-judge, custom probes |
| Runtime Monitor | `firmis monitor` — Free: TS MCP proxy. Paid: Lasso Gateway + FirmisPlugin |
| Per-Deployment Monitoring | Continuous runtime protection, priced per deployment/project |
| Continuous Pentesting | Scheduled weekly re-probing of MCP servers |
| Runtime Policy Rules | YAML runtime rules for sequence detection |
| Cloud Threat Intel | Real-time blocklist updates, threat enrichment API |
| Alerting | Slack/email alerts |
| Dashboard (M5+) | Web UI |

### Pricing Model

Per-deployment/per-project for monitoring and compliance reports. Specific pricing TBD — will be determined through experimentation post-build. Free tier has no limitations on scan frequency or basic reports.

---

## 8. Competitive Landscape

| Dimension | Firmis | SecureClaw (Adversa AI) | Snyk (post-Invariant) | Cisco mcp-scan | OpenClaw built-in | Lasso Gateway | promptfoo |
|---|---|---|---|---|---|---|---|
| **Target** | Agent builders (prosumer/SMB) | OpenClaw developers | Enterprise | Security teams | OpenClaw users | Enterprise | DevOps/QA |
| **Price** | Free + paid per deployment (TBD) | Free (OSS) | Enterprise pricing | Free | Free (built-in) | Enterprise | Free + paid |
| **Platforms** | **8 agent environments** | OpenClaw only | MCP + OpenClaw | MCP only | OpenClaw only | MCP only | Any LLM/MCP |
| **Static scan** | Yes (176+ rules + YARA) | 51 audit checks | Yes | Yes (YARA + LLM) | Audit + VirusTotal | No | No |
| **Active pentest** | Yes (promptfoo) | No | No | Partial (behavioral) | No | No | Yes (core) |
| **Runtime** | Yes (TS proxy + Lasso paid) | Behavioral rules (15) | Limited | No | No | Yes (Python) | No |
| **Auto-fix** | Yes | Hardening (5 modules) | No | No | No | No | No |
| **AI-BOM** | Yes (CycloneDX) | No | Emerging | No | No | No | No |
| **Compliance** | Yes (SOC2, AI Act, GDPR) | OWASP Agentic Top 10 | Enterprise only | No | No | No | No |
| **Client reports** | Yes (branded PDF) | No | Enterprise only | No | No | No | No |
| **Immune layers** | All 7 | 1-2 | 2 | 1 | 1 | 1 | 1 (inoculation) |

### Why We Win

**Primary moat: Multi-platform breadth.** Every competitor is single-platform: SecureClaw (OpenClaw-only), Cisco mcp-scan (MCP-only), OpenClaw built-in (OpenClaw-only), Lasso (MCP-only). Firmis is the only tool scanning the entire agent stack (8 platforms) in one command. This is the Wiz playbook: they won not by being deeper on AWS than AWS-native tools, but by covering AWS + Azure + GCP before anyone else covered two.

**Secondary moat: Unique capabilities nobody else has:**
- Compliance gap mapping (SOC2, AI Act, GDPR) — nobody else does this for prosumers
- Client-facing branded reports (B2D2B model) — nobody helps builders prove security to their clients
- Active pentesting (promptfoo) — nobody else combines static scanning + active probing
- Fire-and-forget all-in-one (scan + pentest + monitor + fix) — everyone else is a point solution

**Competitive positioning:**
- **vs SecureClaw:** OpenClaw-only, 51 checks. We have 176+ rules across 8 platforms + secret detection + pentesting + compliance. They harden OpenClaw. We secure the entire agent stack.
- **vs OpenClaw built-in:** Platform vendor doing basic audit + VirusTotal hash scanning. Prompt injection payloads evade VirusTotal (their own caveat). We do deep static analysis + active pentesting + runtime monitoring.
- **vs Snyk:** Enterprise pricing, enterprise sales cycles. We own agentic security for prosumers.
- **vs Cisco mcp-scan:** MCP-only, no remediation, no runtime, no BOM, no compliance.
- **vs Lasso:** Enterprise Python proxy requiring infrastructure. We're zero-config CLI.
- **vs promptfoo:** Red-teaming only. We integrate their engine as one layer of a full system.
- **Compliance for the rest of us:** SOC2/AI Act/GDPR tools are built for enterprises. We surface the same gaps for agent builders deploying for clients.

---

## 9. Tech Stack

### Scanner CLI (TypeScript/Node.js)

| Component | Technology | Purpose |
|---|---|---|
| Language | TypeScript 5.4+ | Type safety |
| Runtime | Node.js 20+ | Async I/O |
| CLI | Commander 12+ | Argument parsing |
| File discovery | fast-glob 3.3+ | Recursive scanning |
| AST | @babel/parser 7.24+ | JS/TS AST |
| Rules | js-yaml 4.1+ | YAML loading |
| Terminal | chalk 5+ / ora 8+ | Pretty output |
| OSV | Native fetch | Vulnerability DB |
| BOM | @cyclonedx/cyclonedx-library | CycloneDX 1.7 |
| Pentest | promptfoo (npm, MIT) | Red-team engine |
| Testing | Vitest 1.3+ | Unit + integration |

### Runtime Monitor

**Free Tier (TypeScript/Node.js):**

| Component | Technology | Purpose |
|---|---|---|
| MCP SDK | @modelcontextprotocol/sdk (MIT) | MCP stdio proxy |
| Policy engine | Internal YAML rules | Runtime evaluation |

**Paid Tier (Python — Lasso Gateway):**

| Component | Technology | Purpose |
|---|---|---|
| MCP Gateway | Lasso MCP Gateway (MIT, Python) | Battle-tested proxy + routing |
| Firmis Plugin | FirmisPlugin (GuardrailPlugin API) | Policy engine, PII redaction, cloud sync |
| PII detection | Presidio patterns (MIT) | Credential redaction in responses |

### Cloud (M4+)

| Component | Technology | Purpose |
|---|---|---|
| API Gateway | Cloudflare Workers | Rate limiting |
| Database | Supabase (Postgres) | Threat sigs, users |
| Analytics | ClickHouse | Telemetry |
| Storage | Cloudflare R2 | Rule storage |

---

## 10. Target Personas

### Two-Ring ICP Model

**Primary Persona: The Agent Builder**

Encompasses both rings — the same person at different stages of their journey.

**Outer Ring (Free Adoption):**
- Solo dev or small team, 22-40, builds with OpenClaw/Claude/Cursor/CrewAI/MCP
- No security background, installs skills without reading code
- Entry: `npx firmis scan` (CLI) via content/SEO/community
- Trigger: "341 malicious skills found on ClawHub" article, or general security awareness
- Message: "One command. 30 seconds. Know if your agents are secure."

**Inner Ring (Paid Monetization):**
- Same person, but now deploying agent solutions for a business client
- Client asks "how do you protect our data from your AI tools?" — no answer
- Entry: Compliance report need, triggered by client security questionnaire
- Trigger: Client asks for proof of security or compliance documentation
- Message: "Prove your agents are secure. Share the report with your client."
- Pays for: Compliance report (per-project), monitoring (per-deployment), full pentest

---

## 11. File Structure (Target)

```
firmis-scanner/
  src/
    cli/
      index.ts
      commands/
        scan.ts             # firmis scan
        list.ts             # firmis list
        validate.ts         # firmis validate
        discover.ts         # firmis discover (M1)
        bom.ts              # firmis bom (M1)
        ci.ts               # firmis ci (M1)
        pentest.ts          # firmis pentest (M2)
        fix.ts              # firmis fix (M2)
        report.ts           # firmis report (M2)
        monitor.ts          # firmis monitor (M3)
    scanner/
      engine.ts
      platforms/            # 8 analyzers (existing)
    rules/
      engine.ts
      patterns.ts
      confidence.ts
      loader.ts
    integrations/
      secrets.ts            # Gitleaks pattern port (M0)
      osv.ts                # OSV API client (M0)
      yara-ts.ts            # YARA pattern matcher (M0)
    pentest/                # (M2)
      engine.ts             # Orchestrator
      promptfoo-adapter.ts  # promptfoo Node.js API wrapper
      mcp-probes.ts         # MCP probe definitions
      cisco-adapter.ts      # Optional Cisco mcp-scanner subprocess
      report.ts             # Pentest findings formatter
    reporters/
      terminal.ts           # Existing
      json.ts               # Existing
      sarif.ts              # Existing
      html.ts               # Enhanced (M0)
    fixers/                 # (M2)
      secrets.ts
      quarantine.ts
      permissions.ts
      config.ts
      backup.ts
    monitor/                # (M3 - Free tier, TypeScript)
      mcp-proxy.ts          # MCP stdio proxy via @modelcontextprotocol/sdk
      policy-engine.ts      # YAML runtime rule evaluator
      audit-logger.ts       # Tool call logging
      anomaly-detector.ts   # Behavioral baseline (P1)
    cloud/                  # (M4)
      telemetry.ts
      enrichment.ts
      license.ts
    types/
      index.ts
  firmis-lasso-plugin/      # (M3 - Paid tier, Python)
    firmis_plugin.py          # GuardrailPlugin implementation
    policy_engine.py          # YAML rule evaluator (ported from TS)
    pii_detector.py           # Presidio patterns for PII redaction
    setup.py                  # pip installable package
    requirements.txt
  rules/
    credential-harvesting.yaml
    data-exfiltration.yaml
    privilege-escalation.yaml
    prompt-injection.yaml
    suspicious-behavior.yaml
    secret-detection.yaml       # 60 rules - Gitleaks-style patterns (SHIPPED)
    malware-signatures.yaml     # SHIPPED (M0.4) - YARA patterns
    tool-poisoning.yaml         # SHIPPED (Sprint A) - MCP tool desc analysis
    runtime/                    # NEW (M3)
      credential-exfil.yaml
      blocklist.yaml
      permission-boundary.yaml
  test/
  docs/
    UNIFIED-PLAN-v5.md          # THIS DOCUMENT
    ARCHITECTURE.md
    MARKETING.md
    PRIVACY.md
    FIRMISIGNORE.md
    SCANNER-AUDIT-2026-02-16.md
  package.json
```

---

## 12. Success Metrics

### Detection Quality

| Metric | Target |
|---|---|
| False positive rate | <2% |
| True positive rate (known-malicious) | >95% |
| Regex validation | 100% |
| Platform coverage | 8 platforms |
| Rule count (open source) | 176+ shipped, 250+ target (M2 depth + M5 advanced) |
| Pentest probe types (free) | 10 |
| Pentest probe types (paid) | 50+ |

### Business (12-month)

| Metric | Target |
|---|---|
| npm downloads | 5,000/month |
| GitHub stars | 1,000 |
| Emails captured | 5,000 |
| Paid deployments | Target: 200+ monitored deployments |
| Compliance reports generated | 500+ |

### Performance

| Metric | Target |
|---|---|
| CLI scan (50 components) | <15 seconds |
| OSV batch query | <2 seconds |
| Secret scan (1,000 files) | <5 seconds |
| Basic pentest (5 MCP servers) | <60 seconds |
| Runtime proxy latency/call | <10ms |

---

## 13. What We're NOT Building (and Why)

| Feature | Reason |
|---|---|
| Web dashboard (M0-M3) | No users yet. CLI-first. Dashboard is M5+ |
| ML behavioral analysis (M0-M3) | Needs data. Deterministic rules cover 95% |
| Hash-chain audit trail | Compliance. Needs enterprise customers |
| Kubernetes integration | Enterprise. Prosumers don't use K8s |
| Python runtime dependency (free tier) | Free tier stays zero-install TypeScript. Paid tier uses Python (Lasso Gateway + FirmisPlugin). Cisco mcp-scanner is optional. |
| Gitleaks/YARA binaries | Violates zero-install. Port patterns, not binaries |
| Full Nuclei engine | Go binary. Port file-category templates only |
| Semgrep rules directly | Restrictive license. Write equivalent rules independently |
| ARTEMIS/PentAGI/CAI | Network pentest tools, too heavy, wrong attack surface |
| Custom MCP gateway from scratch | Free tier composes MCP SDK Client+Server. Paid tier uses Lasso Gateway — don't reinvent battle-tested proxy infrastructure |
| Website Scanner | Different market (SecurityScorecard, Qualys, ImmuniWeb), different competitors, zero connection to agentic security wedge. Killed. |
| Standalone Supabase Scanner | Infrastructure security, not agentic. Removed in v1.2.0. Generic secret-detection stays. |
| Depth-only single-platform strategy | OpenClaw security space is crowded (SecureClaw, ClawShield, Cisco, VirusTotal, built-in audit). Multi-platform breadth is the moat, not depth on one platform. Adding new platforms is strategic. |
| Vanta-style compliance platform | We surface compliance gaps, not manage full compliance workflows. Compliance-adjacent, not compliance-primary. |

---

## 14. OSS Tools We Leverage

| Tool | License | What We Take | How |
|---|---|---|---|
| **Gitleaks** | MIT | ~230 secret regex patterns + entropy thresholds | Build-time TOML parse -> YAML rules |
| **OSV.dev** | CC-BY-4.0 | Vulnerability database | REST API fetch |
| **YARA-X** | BSD-3 | Text+regex malware patterns | Port to TS RegExp |
| **promptfoo** | MIT | Red-team engine for MCP/LLM testing | npm library import (TypeScript-native) |
| **Cisco mcp-scanner** | Apache-2.0 | Behavioral code analysis + YARA | Optional Python subprocess |
| **CycloneDX** | Apache-2.0 | ML-BOM format + TS library | npm dependency |
| **Presidio** | MIT | PII regex patterns | Port to TS |
| **MCP TypeScript SDK** | MIT | MCP client/server for proxy | npm dependency |
| **Lasso MCP Gateway** | MIT | Battle-tested MCP proxy + GuardrailPlugin API | Paid tier runtime gateway (Python) |
| **Invariant Guardrails** | Apache-2.0 | Policy rule design patterns | Reference only (not imported) |

---

## 15. Document Lineage

This document supersedes and unifies:

| Document | Status | Key Content Preserved |
|---|---|---|
| `docs/PRDv2.0.md` (labeled v4.0 inside) | **Superseded** | Funnel, competitive landscape, revenue model |
| `docs/ARCHITECTURE.md` v2.0 | **Needs update** to align with v5 | Data flow diagrams, ADRs |
| `docs/MARKETING.md` v2.0 | **Updated v3.0** — Agentic Security positioning, two-ring ICP, education-first content | Personas, messaging, SEO, 3-scanner strategy |
| `docs/PRIVACY.md` | **Still active** | Telemetry policy |
| `docs/FIRMISIGNORE.md` | **Still active** | .firmisignore docs |
| `docs/SCANNER-AUDIT-2026-02-16.md` | **Historical reference** | Bugs found/fixed, architectural gaps |
| `docs/plans/2026-02-12-supabase-scanner.md` | **Archived** | Supabase removed in v1.2.0 (not agentic security) |
| User prompt (v5 roadmap) | **Incorporated** | M0-M2 milestones, pure-TS philosophy |
| Positioning decisions (2026-02-17 session) | **Incorporated** | Agentic Security category, two-ring ICP, multi-platform breadth as moat, compliance urgency, education-first content, build-in-public distribution |

---

*Document Version: 5.2*
*Last Updated: 2026-02-17*
*Changes in 5.2: Updated to v1.3.0, M0 all shipped (secrets, OSV, HTML, YARA), Sprint A deliverables (tool-poisoning, network-abuse, file-system-abuse rules + YARA engine), 176+ rules across 15 files*
*Next Review: After M1 Discovery + BOM completion*
