# Firmis Unified Plan v5.0

**The Immune System for AI Agents**

**Date:** 2026-02-17
**Version:** 5.0 (supersedes PRDv2.0.md/v4.0, ARCHITECTURE.md v2.0)
**Status:** Master Plan — Source of Truth
**Stack:** TypeScript/Node.js CLI (scanner + monitor-free + pentest) + Lasso MCP Gateway/Python (monitor-paid) + API wrappers (web scanners) + Next.js Landing
**Target:** Prosumer / SMB / Vibe Coders building with AI agents

---

## 1. The Immune System Thesis

Firmis is an immune system for AI agents. Not a scanner. Not a firewall. Not a dashboard. An immune system — the only architecture that defends an open system against unbounded unknown threats without shutting it down.

### Why "Immune System" Is the Correct Architecture

AI agents are open by design. They must accept external tools, data, and instructions to be useful. This is identical to the biological challenge: an organism that seals itself off dies. An organism that accepts everything also dies. The immune system is evolution's answer to this paradox — and it's ours.

No single mechanism is sufficient. mcp-scan gives you innate pattern matching only. Lasso gives you adaptive patrol only. LlamaFirewall gives you a generic firewall only. Firmis is the only platform delivering all seven layers.

### Layer Mapping

| Immune Layer | Biological Function | Firmis Component | Command | Status |
|---|---|---|---|---|
| **Physical barriers** | Skin, mucous membranes | Docker sandboxes, E2B (not us) | — | We complement, don't replace |
| **Innate immunity** | Pattern recognition (PAMPs), phagocytes | Static scan — YAML rules + secret detection + YARA patterns | `firmis scan` | 90% built, M0 completes |
| **Immune surveillance** | Dendritic cells sampling tissues | Auto-detect all frameworks, tools, models | `firmis discover` | Partial, M1 formalizes |
| **Cellular registry** | MHC presentation — "what cells exist" | Agent Bill of Materials (CycloneDX) | `firmis bom` | Not built, M1 |
| **Inoculation / Stress test** | Vaccine challenge, immune stress test | Active pentesting — adversarial probing of MCP servers and agents | `firmis pentest` | Not built, M2 |
| **Inflammatory response** | Cytokines, neutrophil recruitment | Quarantine, credential rotation, config hardening | `firmis fix` | Not built, M2 |
| **Adaptive patrol** | T-cells, B-cells circulating | MCP stdio proxy, runtime policy enforcement | `firmis monitor` | Not built, M3 |
| **Medical record** | Patient history, treatment record | HTML report with AI fix prompts, scan history | `firmis report` | Partial, M0 enhances |
| **Immune memory** | Memory B/T cells — instant recall | Known-malicious blocklist, IOC database | Internal | Partial (50+ blocklist) |
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

## 2. What Exists Today (v1.2.0)

### Shipped

- 8 platform analyzers: OpenClaw, MCP, Claude, CrewAI, Cursor, Codex, AutoGPT, Nanobot
- 144+ YAML rules across 11 rule files, 16 threat categories
- 60 secret-detection rules (Gitleaks-style patterns)
- OSV vulnerability scanning via api.osv.dev batch API
- Three-tier confidence model (suspicious / likely / confirmed)
- Context-aware matching (code vs docs vs config) with documentation multiplier
- 4 reporters: terminal (A-F grade), JSON, SARIF, HTML (enhanced with AI fix prompts)
- 3 CLI commands: `scan`, `list`, `validate`
- Babel AST for JS/TS
- Known-malicious blocklist (50+ skills, 10+ authors, C2 infrastructure)
- `.firmisignore` support, `--ignore`, `--quiet`, `--fail-on` flags
- Published on npm as `firmis-scanner`

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
| **Website scanner** | Not in CLI | HTTP Observatory API (MPL-2.0) + Nuclei file templates (MIT) | Wraps OSS tools, adds Firmis UX. Open-source module, wrapped in API for web frontend. |
| **Supabase scanner** | Custom regex only | **Removed** — infrastructure security, not agentic. Generic secret-detection covers key leaks. |
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

```
Awareness (blog, HN, Reddit, Product Hunt, SEO)
    |
    +-- firmislabs.com/ai-scanner       -> Vibe Coder Vince
    +-- firmislabs.com/website-scanner  -> SMB Founder Sara
    |
    v
npx firmis scan (free, no signup, 30 seconds)
    | -> Terminal: A-F grade, plain English findings
    | -> Fear: "Your MCP config exposes AWS keys to all 5 servers"
    |
    v
firmis report (free, email-gated)
    | -> HTML report with AI fix prompts
    | -> "Copy this into Claude to fix the issue"
    | -> Lead magnet: captures email for nurture sequence
    |
    v
firmis pentest (free tier: basic probes, paid: full red-team)
    | -> Active testing of MCP servers for tool poisoning, auth bypass
    | -> "We tried to extract credentials via your GitHub MCP server - and succeeded"
    |
    v
firmis fix + firmis monitor (Paid tier — pricing TBD)
    | -> Auto-remediation + continuous runtime protection
    | -> Slack/email alerts for new threats
    |
    v
Revenue: Paid subscribers (pricing TBD post-build)
```

### Scanner Acquisition Funnels

Each scanner targets a different persona, captures a different SEO keyword cluster, and feeds the same email list / paid funnel.

| Scanner | Target | Format | OSS Foundation | Firmis Value-Add |
|---|---|---|---|---|
| **AI Agent Scanner** | Vince (vibe coder) | CLI: `npx firmis scan` | Custom 144+ rules, 8 analyzers | Platform context, fear UX, A-F grade |
| **Website Scanner** | Sara (SMB founder) | Web: firmislabs.com/website-scanner | HTTP Observatory API (MPL-2.0), Nuclei (MIT) | Unified A-F score, plain English, fear UX |

Both share: same email list (tagged by source), same nurture sequence, same paid tier (pricing TBD).

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
| M0.1 | **Secret detection engine** | Port ~230 Gitleaks TOML regex patterns + Shannon entropy | MIT | P0 |
| M0.2 | **OSV vulnerability scanning** | `fetch` to `api.osv.dev/v1/querybatch` | CC-BY-4.0 | P0 |
| M0.3 | **Enhanced HTML report** | Internal — AI fix prompts, severity chart, email CTA | — | P0 |
| M0.4 | **YARA-X pattern matching** | Port YARA text+regex rules to TS matchers | BSD-3 | P1 |

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
| M2.7 | **Native tool poisoning detection** | Independent implementation (Invariant research as reference) | P0 |
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
| Rule Engine + Rules | 144+ core rules + secrets + malware signatures |
| Integrations | Secrets engine, OSV client, YARA-TS matcher |
| Reporters | Terminal, JSON, SARIF |
| Pentest (basic tier) | 10 probe types: tool poisoning detection, basic auth testing, known injection patterns |
| Programmatic API | `ScanEngine`, `RuleEngine` exports |
| Website Scanner module | HTTP Observatory + Nuclei patterns, wrappable in API |

### Proprietary (Paid Tier — Pricing TBD)

| Component | Description |
|---|---|
| HTML Report | Email-gated, AI fix prompts, "share report" CTA |
| Auto-Fix Engine | `firmis fix` — quarantine, rotation, hardening |
| Pentest (full tier) | 50+ probe types: multi-turn attacks, adaptive evasion, LLM-as-judge, custom probes |
| Runtime Monitor | `firmis monitor` — Free: TS MCP proxy. Paid: Lasso Gateway + FirmisPlugin |
| Continuous Pentesting | Scheduled weekly re-probing of MCP servers |
| Runtime Policy Rules | YAML runtime rules for sequence detection |
| Cloud Threat Intel | Real-time blocklist updates, threat enrichment API |
| Alerting | Slack/email alerts |
| Dashboard (M5+) | Web UI |

### Scanner API Wrappers

The Website scanner is an open-source TS module wrapped in an API endpoint for firmislabs.com:

```
firmislabs.com/api/scan/website    -> HTTP Observatory API + Nuclei patterns
firmislabs.com/api/scan/agent      -> ScanEngine (full CLI scan)
```

API wrappers are proprietary (email gate, analytics, rate limiting). Underlying scanner modules remain MIT.

---

## 8. Competitive Landscape

| Dimension | Firmis | Snyk (post-Invariant) | mcp-scan (Cisco) | Lasso Gateway | promptfoo | LlamaFirewall |
|---|---|---|---|---|---|---|
| **Target** | Prosumer/SMB | Enterprise | Security teams | Enterprise | DevOps/QA | Enterprise |
| **Price** | Free + Paid (TBD) | Enterprise pricing | Free | Enterprise | Free + paid | Free |
| **Platforms** | 9 agent platforms | MCP + OpenClaw | MCP only | MCP only | Any LLM/MCP | Generic LLM |
| **Static scan** | Yes (144+ rules) | Yes | Yes (YARA + LLM) | No | No | No |
| **Active pentest** | Yes (promptfoo) | No | Partial (behavioral) | No | Yes (core) | No |
| **Runtime** | Yes (TS proxy + Lasso paid) | Limited | No | Yes (Python) | No | Yes |
| **Auto-fix** | Yes | No | No | No | No | No |
| **AI-BOM** | Yes (CycloneDX) | Emerging | No | No | No | No |
| **Immune layers** | All 7 | 2 | 1 | 1 | 1 (inoculation) | 1 |

### Why We Win

- **vs Snyk:** Prosumer-priced, 8 platforms vs 2, auto-fix + pentest, zero-config. They went upmarket post-Invariant (enterprise floor pricing).
- **vs Cisco mcp-scan:** MCP-only, no remediation, no runtime, no BOM. We optionally wrap their tool for enhanced analysis.
- **vs Lasso:** Enterprise Python proxy. Our free tier is zero-config TypeScript. Our paid tier leverages Lasso as infrastructure — we add the security intelligence layer.
- **vs promptfoo:** Red-teaming only, no static scanning, no fix, no monitor. We integrate their engine as one layer of a full immune system.
- **vs DIY:** 144+ rules + 230 secret patterns + 50+ blocklist + 8 analyzers + active pentesting encode years of security expertise.

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

### Web Scanner API

| Component | Technology | Purpose |
|---|---|---|
| Website | HTTP Observatory API (MPL-2.0) | Headers grading |
| Website | Nuclei file templates (MIT) | Pattern matching |

### Cloud (M4+)

| Component | Technology | Purpose |
|---|---|---|
| API Gateway | Cloudflare Workers | Rate limiting |
| Database | Supabase (Postgres) | Threat sigs, users |
| Analytics | ClickHouse | Telemetry |
| Storage | Cloudflare R2 | Rule storage |

---

## 10. Target Personas

### Vibe Coder Vince
- Solo dev, 22-35, builds with OpenClaw/Claude/Cursor
- No security background, installs skills without reading code
- **Entry:** `npx firmis scan` (CLI)
- **Trigger:** "341 malicious skills found on ClawHub" article
- **Message:** "One command. 30 seconds. Know if you're safe."

### SMB Founder Sara
- Running 5-15 person startup, uses AI agents for productivity
- Client asked "how do you protect our data from your AI tools?" — no answer
- **Entry:** firmislabs.com/website-scanner (web)
- **Message:** "Security that works while you sleep."

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
      website/
        observatory.ts      # HTTP Observatory API
        nuclei-patterns.ts  # Nuclei file templates
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
    malware-signatures.yaml     # NEW (M0) - YARA patterns
    tool-poisoning.yaml         # NEW (M2) - MCP tool desc analysis
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
| Rule count (open source) | 144+ shipped, 250+ target (M0 YARA + M2 tool poisoning) |
| Pentest probe types (free) | 10 |
| Pentest probe types (paid) | 50+ |

### Business (12-month)

| Metric | Target |
|---|---|
| npm downloads | 5,000/month |
| GitHub stars | 1,000 |
| Emails captured | 5,000 |
| Paid subscribers | 200+ |
| MRR | Pricing TBD post-build |

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
| **HTTP Observatory** | MPL-2.0 | Security headers grading API | REST API call |
| **Nuclei Templates** | MIT | File-category vuln patterns | YAML parse + port |
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
| `docs/MARKETING.md` v2.0 | **Still active** | Personas, messaging, SEO, 3-scanner strategy |
| `docs/PRIVACY.md` | **Still active** | Telemetry policy |
| `docs/FIRMISIGNORE.md` | **Still active** | .firmisignore docs |
| `docs/SCANNER-AUDIT-2026-02-16.md` | **Historical reference** | Bugs found/fixed, architectural gaps |
| `docs/plans/2026-02-12-supabase-scanner.md` | **Archived** | Supabase removed in v1.2.0 (not agentic security) |
| User prompt (v5 roadmap) | **Incorporated** | M0-M2 milestones, pure-TS philosophy |

---

*Document Version: 5.1*
*Last Updated: 2026-02-17*
*Changes in 5.1: Removed Supabase platform (not agentic security), updated state to v1.2.0, incorporated FN audit findings*
*Next Review: After M0 YARA completion*
