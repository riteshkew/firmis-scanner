# Firmis Scanner — Alignment & Revised Plan

**Date:** 2026-02-17
**Version:** Post-review synthesis v1.0
**Reviewers:** Architect, Staff Security Engineer, Marketing Specialist, VP Product, Codebase Auditor
**Status:** PENDING FOUNDER APPROVAL

---

## 1. ARCHITECTURE DECISION RECORD

### ADR-001: Runtime Monitor Architecture

**Decision:** Drop free-tier runtime monitor. Lasso MCP Gateway (Python) for paid tier only. TypeScript for all free-tier commands.

**Context:** Original plan had two-tier runtime: free=TS MCP proxy, paid=Python/Lasso. All 4 reviewers flagged the dual-language policy engine as the #1 structural risk (regex parity, double maintenance, feature drift). Founder pushed back: "Proxy is not my core job. Security rules are."

**Resolution:** Remove the free-tier monitor entirely. The dual-engine concern disappears because:
- TS engine evaluates STATIC rules against FILE CONTENT (already built, `src/rules/engine.ts`)
- Python engine evaluates RUNTIME rules against LIVE MCP TOOL CALLS (new, FirmisPlugin)
- Different rule sets, different domains, no parity problem

**Rationale:**
- Founder focuses on security logic, not proxy plumbing
- Lasso maintained by others — reduces maintenance overhead
- Paid users are invested — Python install friction is acceptable
- Clean separation: free = diagnostics, paid = continuous protection

**Risks accepted:**
- Lasso vendor risk (288 stars, <1 year, startup project)
- All paid-tier MCP traffic flows through Lasso (critical path dependency)

**Mitigations required:**
- Design FirmisPlugin with abstraction layer (`gateway_adapter.py`) so Lasso can be swapped
- Pin exact Lasso version in requirements
- Commission third-party security review of Lasso before paid tier GA
- Document emergency disable procedure

---

### ADR-002: Pentest Tiering

**Decision:** One-off basic pentest (10-15 probes) is FREE. Scheduled continuous pentesting is PAID.

**Rationale (all 4 reviewers agreed):**
- Free pentest showing "attack succeeded" is the single strongest conversion trigger
- A developer who sees "your MCP server responded to prompt injection on probe 7 of 10" will ask "what would probes 8-50 find?"
- Scheduled + full-depth + vulnerability diff between runs = paid value
- promptfoo as optional dependency — does not bloat `npx firmis scan`

---

### ADR-003: HTML Report Access

**Decision:** HTML report is NOT email-gated. Terminal output + HTML report both fully accessible.

**Rationale (PM + Marketing):**
- "The report IS the marketing" — gating it kills virality
- Developer audiences route around email gates
- Terminal grade + plain-English summary must remain unconstrained
- The report drives "Scanned by Firmis" badge adoption

---

### ADR-004: Milestone Order

**Decision:** Ship M0 → M2 → M3 (not M0 → M1 → M3).

**Rationale (PM):**
- Pentest results are the conversion trigger, not the monitor
- Validate pentest-driven conversion before investing in Lasso integration
- M1 (discover/bom) is useful but not revenue-generating — can ship alongside M0 or M2

---

## 2. WHERE WE STAND NOW

### 2.1 What's Built (verified by codebase audit)

| Component | Status | Details |
|-----------|--------|---------|
| CLI framework | BUILT | 4 commands: scan, list, validate, supabase |
| Static scanner engine | BUILT | `ScanEngine` → discovery → platform scan → rule matching → grade |
| Rule engine | BUILT | 7 pattern types, 3-tier confidence model, context multipliers |
| 109 rules across 15 YAML files | BUILT | Credential, exfil, prompt injection, privesc, suspicious, malware, supply chain, known-malicious, Supabase (5 files), permission-overgrant, agent-memory |
| 9 platform analyzers | BUILT | MCP, OpenClaw, Claude, Supabase, CrewAI, Codex, Cursor, AutoGPT, Nanobot |
| Supabase deep scanner | BUILT | Static rules + semantic SQL analysis + SupaShield live DB wrapper |
| 4 reporters | BUILT | Terminal, JSON, SARIF, HTML |
| .firmisignore | BUILT | Rule-ID, file-pattern, combo ignore rules |
| Cloud module | SCAFFOLDED | `src/cloud/` exists but points to non-existent APIs (dead code) |
| 26 test files | PARTIAL | Unit tests solid for rules. Integration tests 4/5 skipped. No reporter tests. |

### 2.2 What's NOT Built

| Component | Status | Milestone |
|-----------|--------|-----------|
| Secret detection (230 Gitleaks patterns) | NOT STARTED | M0.1 |
| OSV vulnerability scanning | NOT STARTED | M0.2 |
| Enhanced HTML report (A-F gauge, fix prompts) | 40% done | M0.3 |
| YARA-X pattern matching | NOT STARTED | M0.4 |
| `firmis discover` command | 80% ready (infra exists) | M1.1 |
| `firmis bom` command | NOT STARTED | M1.2 |
| `firmis ci` command | NOT STARTED | M1.3 |
| `firmis pentest` command | NOT STARTED | M2.1 |
| Tool poisoning detection rules | NOT STARTED | M2.7 |
| Rug pull detection | NOT STARTED | M2.8 |
| Runtime monitor (Lasso + FirmisPlugin) | NOT STARTED | M3 |
| Cloud API + telemetry | SCAFFOLDED (dead code) | M4 |
| Website scanner | NOT STARTED | M5+ |

### 2.3 Verified Bugs & Issues

| # | Issue | File:Line | Severity |
|---|-------|-----------|----------|
| 1 | YAML deserialization without JSON_SCHEMA | `openclaw.ts:201` — `yaml.load(frontmatterContent)` with no schema | P0 SHIP-BLOCKER |
| 2 | Rule loader throws on any file failure | `loader.ts:30-36` — `throw new RuleError(...)` halts all loading | P0 SHIP-BLOCKER |
| 3 | Grade "A" regardless of scan coverage | `scan.ts:175` — `threatsFound === 0` returns "A" even if 0 files analyzable | P0 |
| 4 | HTML footer says v1.0.0 | `html.ts:453` — hardcoded wrong version | P1 |
| 5 | Terminal header says v1.1.0 (hardcoded) | `terminal.ts:26` — not read from package.json | P1 |
| 6 | Cloud modules hardcode v1.0.0 | `telemetry.ts:24`, `connector.ts:28` | P1 |
| 7 | `langchain`/`custom` map to ClaudeSkillsAnalyzer | `platforms/index.ts` — wrong analyzer | P1 |
| 8 | VS Code MCP config not detected | `.vscode/mcp.json` missing from MCPAnalyzer | P1 |
| 9 | PatternContext defined but never evaluated | `patterns.ts` — `minMatches`, `requiredPatterns` silently ignored | P2 (blocks M2) |
| 10 | Integration scan tests 4/5 skipped | `scan.test.ts` — passing test is vacuous | P2 |
| 11 | Platform scan errors silently swallowed | `engine.ts:67-82` — invisible false negatives | P2 |

---

## 3. ALL EXPERT RECOMMENDATIONS — CONSOLIDATED

### 3.1 P0 Ship-Blockers (fix before next release)

| # | Recommendation | Source | Fix |
|---|----------------|--------|-----|
| P0-1 | Fix YAML deserialization in OpenClaw | Security, Architect | Add `{ schema: yaml.JSON_SCHEMA }` to `openclaw.ts:201` |
| P0-2 | Rule loader: warn-and-continue | Codebase, Architect | Change `throw` to `console.warn` + `continue` in `loader.ts:32` |
| P0-3 | Grade caveats: track unanalyzable files | Security, Codebase | Add `filesNotAnalyzed: number` to `ScanSummary`. Cap grade at "B" when >20% unanalyzable. |
| P0-4 | Enable npm 2FA + publish from CI | Security | Enable 2FA on npm account. Publish from CI with provenance attestation. |

### 3.2 Pre-M0 Fixes (before starting M0 work)

| # | Recommendation | Source | Fix |
|---|----------------|--------|-----|
| PM0-1 | Expand `ThreatCategory` union type | Codebase | Add `'secret-detection'` to `scan.ts:11` and `createEmptySummary()` |
| PM0-2 | Create `src/version.ts` | Codebase | Single source for version string. Import in all 4 hardcoded locations. |
| PM0-3 | Fix `langchain`/`custom` platform mapping | Codebase | Remove from registry or create proper stubs |
| PM0-4 | Add `.vscode/mcp.json` to MCPAnalyzer | Codebase | One-line fix in `configPaths` array |
| PM0-5 | Add `runtimeRisksNotCovered` to ScanResult | Architect | New field so reporters surface "what static scan can't detect" |

### 3.3 M0: Foundation Hardening

| Task | Description | Complexity | Dep |
|------|-------------|------------|-----|
| M0.1 | Secret detection: port 230 Gitleaks patterns + Shannon entropy | L | None |
| M0.2 | OSV vulnerability scanning via batch API | M | None |
| M0.3 | Enhanced HTML report: A-F gauge, fix prompts, "Copy for Claude", dark theme | M | None |
| M0.4 | YARA-X pattern matching engine (TS) | L | None |

### 3.4 M1: Discovery + Agent BOM (can ship alongside M0 or M2)

| Task | Description | Complexity | Dep |
|------|-------------|------------|-----|
| M1.1 | `firmis discover` CLI command (~60-line wrapper, infra 80% ready) | S | None |
| M1.2 | `firmis bom` — CycloneDX 1.7 ML-BOM generation | M | M1.1 |
| M1.3 | `firmis ci` — orchestration command (discover → bom → scan → report) | S | M1.1 |

### 3.5 M2: Pentest + Detection Enhancements (REVENUE VALIDATION)

| Task | Description | Complexity | Tier |
|------|-------------|------------|------|
| M2.1 | `firmis pentest` — promptfoo adapter + MCP probe definitions | XL | Free (10 probes) + Paid (full) |
| M2.2 | Cisco mcp-scanner integration (optional) | M | Free |
| M2.3 | Tier 1 auto-fixes (quarantine, secret redaction) | L | Free |
| M2.7 | Tool poisoning detection (Unicode, HTML tags, cross-server) | M | Free |
| M2.8 | Rug pull detection (baseline caching + description diff) | M | Free |

**PM recommendation:** Ship M2 before M3. Validate that pentest results drive paid conversion before investing in Lasso integration.

### 3.6 M3: Runtime Monitor — PAID TIER (Lasso + FirmisPlugin)

| Task | Description | Complexity |
|------|-------------|------------|
| M3.1 | FirmisPlugin for Lasso MCP Gateway | XL |
| M3.2 | Runtime policy engine (sequence detection, cross-tool correlation) | L |
| M3.3 | Tool call audit logging | S |
| M3.4 | PII detection in tool responses (Presidio patterns in Python) | M |
| M3.5 | Behavioral baseline + anomaly detection | XL |
| M3.6 | Scheduled continuous pentesting (promptfoo from Python) | M |
| M3.7 | Stripe billing + license key validation | L |
| M3.8 | Cloud sync (findings → Firmis dashboard) | M |
| M3.9 | `firmis monitor --install-gateway` (TS CLI orchestrates Python install) | M |

**Architect requirement:** Design `ToolCallEvent` / `gateway_adapter.py` abstraction BEFORE writing any FirmisPlugin code.

**Security requirement:** Commission Lasso security review before GA.

### 3.7 M4: Cloud + Threat Intelligence

| Task | Description | Status |
|------|-------------|--------|
| M4.1 | Deploy Cloudflare Worker for telemetry | Scaffolded |
| M4.2 | Cloud threat enrichment API | Scaffolded |
| M4.3 | Real-time blocklist updates | NOT STARTED |
| M4.4 | Community threat database | NOT STARTED |
| M4.5 | Weekly security digest | NOT STARTED |

---

## 4. REFACTORING REQUIRED

### Before M0

| File | Issue | Fix |
|------|-------|-----|
| `src/rules/patterns.ts` (450 lines) | Over 300-line limit | Split: `regex-matcher.ts`, `ast-matcher.ts`, `network-matcher.ts` |
| `src/reporters/html.ts` (495 lines) | Over 300-line limit | Split: `html-styles.ts`, `html-sections.ts`, `html.ts` |
| `src/rules/patterns.ts:203` `matchAPICall()` | 85 lines (>50 limit) | Split: `matchMemberCall()` + `matchIdentifierCall()` + `matchArguments()` |
| `src/cli/commands/validate.ts:13` `action()` | 95 lines (>50 limit) | Split: `validateBuiltIn()` + `validateCustomPaths()` + `validateRegexes()` |
| `src/scanner/engine.ts:149` `scanComponent()` | 75 lines (>50 limit) | Extract: `runSemanticAnalysis()` + `applyIgnoreFilters()` |

### Before M2

| Item | Fix |
|------|-----|
| Implement `PatternContext` evaluation | `minMatches`, `requiredPatterns` needed for tool-poisoning rules |
| Centralize `formatPlatformName()` | 3 duplicate copies across reporters |
| Centralize severity formatting | 3 duplicate implementations across reporters |

### Before M3

| Item | Fix |
|------|-----|
| Design `StatefulRuleEngine` as separate class | Cannot bolt runtime sequence detection onto per-file engine |
| Add `'tool-poisoning'` to ThreatCategory | Along with `'secret-detection'` in pre-M0 |

---

## 5. TESTING STRATEGY

### Immediate (pre-M0)

- Convert 4 skipped integration tests to fixture-based tests
- Add golden path test: safe project scores A (`test/fixtures/openclaw-safe/`)
- Add false-positive regression test (`test/fixtures/documentation-fp/` → 0 threats)
- Add must-catch test: known malicious skill detected (`test/fixtures/openclaw-malicious/`)

### Per-Milestone Test Requirements

| Milestone | Tests Required |
|-----------|---------------|
| M0.1 | 10 real secrets → all detected. 10 fake secrets → 0 FP. Precision >98%, Recall >95%. |
| M0.3 | HTML structure tests. No XSS in threat snippets. |
| M2.1 | Vulnerable MCP fixture → 3+ findings. Clean MCP fixture → 0 critical. |
| M2.7 | Unicode poisoning fixture → detected. Hidden HTML tags → detected. |
| M3 | Unit test: `RuntimePolicyEngine` blocks credential exfil sequence. Allows normal usage. |

### CI Pipeline (from codebase audit)

```yaml
# .github/workflows/security-regression.yml
jobs:
  regression:
    steps:
      - npm ci && npm run typecheck && npm run lint && npm run build
      - npx vitest run test/unit/
      - node dist/cli/index.js validate --built-in
      - npx vitest run test/integration/golden-paths.test.ts
      - npx vitest run test/integration/must-catch.test.ts
      - npx vitest run test/integration/false-positives.test.ts
      - npx vitest run test/integration/supabase-scan.test.ts
```

---

## 6. MARKETING ALIGNMENT

### Claims to Tone Down (Security Engineer)

| Current Claim | Revised Claim |
|---------------|---------------|
| "All 7 immune layers" | "2 immune layers today, 7 by [date]" with roadmap |
| "350+ rules" | "109 rules (230+ secret detection patterns planned)" |
| "84.2% tool poisoning success rate" | Remove or attribute to source research |
| "7.1% of agent skills are malicious" | Do not cite until blog + methodology published |
| "24/7 monitoring blocks threats" | Remove until M3 ships |
| "<2% false positive rate" | Remove — audit showed FP issues |

### Messaging Framework (Marketing)

| Tier | Elevator Pitch |
|------|---------------|
| Free | "Run one command to see your AI agent security grade before you ship." |
| Paid | "Stay protected after you ship, with real-time monitoring and scheduled red-teaming." |

### Key Marketing Actions

1. "Scanned by Firmis" badge — FREE, not gated. Volume play for awareness.
2. HTML report bridges static → runtime gap: "This scan checked your configuration. It cannot detect runtime credential exfiltration. That is what Firmis Monitor catches."
3. One-off pentest is the conversion trigger: show scary results, gate depth + scheduling.
4. Publish original research before HN launch (credibility requirement).
5. 15 hrs/week minimum marketing effort.

---

## 7. RISK REGISTER

| # | Risk | Likelihood | Impact | Owner | Mitigation |
|---|------|-----------|--------|-------|------------|
| R1 | Lasso abandoned/acquired/breaking API change | Medium | High | Founder | Abstraction layer (`gateway_adapter.py`), pin exact version, design swap path |
| R2 | Lasso has unaudited security vulnerability | Medium | Critical | Security | Commission third-party review before GA. Run in isolated subprocess. |
| R3 | Free scan gives "A" grade creating false confidence | High | High | Engineering | Add `runtimeRisksNotCovered` + `filesNotAnalyzed` to scan output |
| R4 | npm supply chain attack on firmis-scanner | Low | Critical | Founder | 2FA, CI publishing with provenance, sign git tags |
| R5 | 230 Gitleaks patterns increase scan time unacceptably | Medium | Medium | Engineering | Keyword pre-filter before full regex evaluation |
| R6 | Scheduled pentest damages production systems | Medium | High | Engineering | Default to dry-run mode. Require explicit scope definition. |
| R7 | Paid probe definitions reverse-engineered from npm package | Medium | Low | Engineering | Ship paid probes in separate pip package, not public npm |
| R8 | License key validation bypassed (client-side) | High | Medium | Engineering | Validate via cloud API with 24h cache, not local check |
| R9 | Lasso restart creates monitoring gap | Medium | Medium | Engineering | Define restart behavior, ensure gap is bounded + auditable |
| R10 | promptfoo dependency pulls heavy transitive deps | Low | Medium | Engineering | Make promptfoo optional dep, install on demand for `firmis pentest` |

---

## 8. FREE vs PAID BOUNDARY (FINAL)

```
FREE TIER (TypeScript, npm, zero-install via npx)
├── firmis scan           Static security scanning, A-F grade
├── firmis discover       Find all agents/MCP servers
├── firmis bom            Agent bill of materials (CycloneDX)
├── firmis pentest        One-off red-team (10-15 probes, promptfoo)
├── firmis validate       Rule file validation
├── firmis list           List detected platforms
├── firmis ci             CI/CD orchestration (discover → bom → scan)
├── HTML report           Full report, no email gate
└── "Scanned by Firmis"  Badge for READMEs (free, volume play)

PAID TIER (Python/Lasso, license-gated, pricing TBD)
├── firmis monitor        Real-time MCP proxy (Lasso + FirmisPlugin)
│   ├── Policy enforcement (blocklist, credential, sequence)
│   ├── PII redaction in tool responses
│   ├── Behavioral anomaly detection
│   ├── Audit logging
│   └── Cloud sync + alerts (Slack, email)
├── firmis pentest (full) 50+ probes, scheduled weekly/monthly
│   ├── Vulnerability diff between runs
│   └── Regression alerts
└── Cloud dashboard       Findings history, team view
```

---

## 9. EXECUTION ORDER

```
PHASE 1: P0 Fixes (1-2 days)
  → Fix YAML deserialization (openclaw.ts:201)
  → Rule loader warn-and-continue (loader.ts:32)
  → Grade caveats (scan coverage tracking)
  → npm 2FA + CI publishing

PHASE 2: Pre-M0 Cleanup (2-3 days)
  → Create src/version.ts (fix 4 hardcoded versions)
  → Expand ThreatCategory union type
  → Fix platform registry (langchain/custom)
  → Add .vscode/mcp.json to MCPAnalyzer
  → Add runtimeRisksNotCovered to ScanResult
  → Refactor over-length files (patterns.ts, html.ts)
  → Un-skip integration tests, add golden paths

PHASE 3: M0 — Foundation Hardening (6 weeks)
  → M0.1 Secret detection (230 patterns + entropy)
  → M0.2 OSV vulnerability scanning
  → M0.3 Enhanced HTML report
  → M0.4 YARA-X pattern matching
  + M1.1 firmis discover (small, ship alongside)

PHASE 4: M2 — Pentest + Detection (6 weeks)
  → M2.1 firmis pentest (free: 10 probes)
  → M2.7 Tool poisoning detection rules
  → M2.8 Rug pull detection
  → M2.3 Auto-fixes (quarantine, redaction)
  + M1.2/M1.3 firmis bom + ci (ship alongside)
  ** VALIDATE: Do pentest results drive paid interest? **

PHASE 5: M3 — Paid Runtime Monitor (8 weeks)
  → Design gateway_adapter.py abstraction first
  → Commission Lasso security review
  → M3.1 FirmisPlugin for Lasso
  → M3.2 Runtime policy engine
  → M3.7 Stripe billing + license
  → M3.9 firmis monitor --install-gateway
  → M3.3-M3.6 PII, anomaly, audit, cloud sync

PHASE 6: M4 — Cloud (4 weeks)
  → Deploy Cloudflare Workers
  → License key validation API
  → Telemetry + enrichment
  → Community threat database
```

---

## 10. PACKAGE STRUCTURE (FINAL)

```
firmis-scanner (npm, MIT, TypeScript)
  ├── All free-tier commands
  ├── Static rule engine (src/rules/engine.ts)
  ├── 109+ YAML rules (rules/*.yaml)
  ├── promptfoo as optionalDependency
  └── License key validation stub

firmis-lasso-plugin (pip, proprietary, Python)
  ├── interfaces/
  │   ├── gateway_adapter.py     # Stable internal contract
  │   ├── tool_call_event.py     # Pure data types
  │   └── policy_result.py       # Block/warn/log decisions
  ├── adapters/
  │   └── lasso_adapter.py       # Only file that imports Lasso
  ├── core/
  │   ├── policy_engine.py       # Runtime YAML rule evaluation
  │   ├── pii_detector.py        # Presidio patterns
  │   └── blocklist.py           # IOC lookup
  └── firmis_plugin.py           # Thin Lasso shim (~80 lines)

firmis-cloud-api (internal, Cloudflare Workers)
  ├── License key issuance + validation
  ├── Telemetry aggregation
  ├── Threat enrichment
  └── Scheduled pentest coordination
```

**Rule:** Nothing in `core/` imports from Lasso. If Lasso changes API, only rewrite `firmis_plugin.py` + `lasso_adapter.py` (~80 lines).

---

*This document synthesizes findings from 5 expert reviews conducted on 2026-02-17. All recommendations are subject to founder approval.*
