# Firmis PRD v4.0 — Security for AI Agents
## Implementation Guide

**Product:** Firmis — Security Scanner & Runtime Monitor for AI Agents
**Owner:** Ritesh
**Date:** February 2026
**Stack:** TypeScript/Node.js CLI (scanner) + Python/Lasso Gateway (runtime) + Next.js Landing
**Target:** Prosumer / SMB / Vibe Coders building with AI agents
**Revenue Target:** 500 paying users x $19/mo = $9,500 MRR in 6 months
**Positioning:** "Vercel of agent security" — packages commodity tools for prosumers

---

## What's Changed from v3.0

| Area | v3.0 | v4.0 |
|------|------|------|
| Detection | All-custom regex rules | Integrate Gitleaks + OSV + YARA-X + custom platform analyzers |
| Runtime | Custom TS proxy from scratch | Lasso MCP Gateway plugin (Python) |
| Dashboard | Next.js web dashboard ($19/mo) | Deferred — CLI-first, no dashboard yet |
| Funnel | Scan (free) → Fix (free) → Monitor ($19/mo) | Scan (free) → Report (free, email-gated) → Fix+Monitor ($19/mo) |
| Target | Enterprise-adjacent | Prosumer / SMB / Vibe Coders |
| Pricing | $19/mo runtime only | $19/mo fix+monitor bundle |
| Blast radius | Custom scoring engine | Deferred |
| Audit trail | Hash-chain compliance | Deferred |
| Competitors | Generic "others" | Snyk (enterprise), mcp-scan (OSS), Lasso (enterprise) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIRMIS ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SCANNER CLI (TypeScript/Node.js, MIT, Free)              │   │
│  │                                                            │   │
│  │  Integration Layer (commodity detection)                   │   │
│  │  ├── Gitleaks (subprocess) → 800+ secret patterns          │   │
│  │  ├── OSV API (HTTP) → vulnerability database               │   │
│  │  └── YARA-X (@litko/yara-x) → malware signatures          │   │
│  │                    ↓                                        │   │
│  │  Custom Platform Analyzers (the moat)                      │   │
│  │  ├── OpenClaw → skill permissions, ClawHub blocklist       │   │
│  │  ├── MCP → config credentials, server topology             │   │
│  │  ├── Claude → SKILL.md analysis, command parsing           │   │
│  │  ├── CrewAI → agent definitions, Python source             │   │
│  │  ├── Cursor, Codex, AutoGPT, Nanobot, Supabase            │   │
│  │  └── 108 YAML rules, 14 threat categories                  │   │
│  │                    ↓                                        │   │
│  │  Correlation Engine → platform context + confidence tiers  │   │
│  │                    ↓                                        │   │
│  │  Reporters → Terminal / JSON / SARIF / HTML                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  RUNTIME MONITOR (Python/Lasso Plugin, $19/mo)            │   │
│  │                                                            │   │
│  │  Lasso MCP Gateway (Python, middleware pipeline)           │   │
│  │  ├── BasicPlugin (built-in)                                │   │
│  │  ├── FirmisPlugin (our code)                               │   │
│  │  │   ├── YARA signature matching                           │   │
│  │  │   ├── IOC blocklist checking                            │   │
│  │  │   ├── Invariant .gr policy rules                        │   │
│  │  │   └── Credential scan on tool responses                 │   │
│  │  └── Allow / Block / Alert decision                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  REPORT ENGINE (TypeScript, Free with email gate)         │   │
│  │                                                            │   │
│  │  HTML report with:                                         │   │
│  │  ├── Security grade (A-F)                                  │   │
│  │  ├── Platform-specific findings                            │   │
│  │  └── AI fix prompts (copy into Claude/Cursor to fix)      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Design Principles

1. **Don't reinvent commodity detection** — Use Gitleaks for secrets, OSV for CVEs, YARA-X for signatures. Build only what's unique.
2. **Build on existing gateways** — Lasso MCP Gateway for runtime, not a custom proxy.
3. **Defense-in-depth** — Complement sandboxes (Docker/E2B), don't replace them. Sandbox protects host, Firmis protects user's data.
4. **Immune system model** — Scanner is diagnostic, Monitor is always-on protection, Fix is the inflammatory response.
5. **Open-core** — MIT scanner CLI (trust/adoption), proprietary monitor/fix (revenue).

---

## Product Funnel

```
Awareness (blog, HN, Reddit, social)
    │
    ▼
npx firmis scan (free, no signup, 30 seconds)
    │ → Terminal output: security grade, plain English findings
    │ → Fear: "Your MCP config exposes AWS keys to all 5 servers"
    │
    ▼
firmis report (free, email required)
    │ → HTML report with AI-powered fix prompts
    │ → "Copy this into Claude to fix the issue"
    │ → Lead magnet: captures email for nurture sequence
    │
    ▼
firmis fix + firmis monitor ($19/mo)
    │ → Auto-remediation: rotate creds, remove malicious skills, harden configs
    │ → Continuous runtime protection via MCP gateway proxy
    │ → Slack/email alerts for new threats
    │
    ▼
Revenue: 500 subscribers x $19 = $9,500 MRR (Month 6 target)
```

### Conversion Targets

| Stage | Monthly Volume | Conversion |
|-------|---------------|------------|
| Website visitors | 10,000 | — |
| npx firmis scan | 3,000 | 30% of visitors |
| firmis report (email) | 1,200 | 40% of scanners |
| Paid subscribers | 60 new/month | 5% of emails |

---

## What's Built (as of Feb 2026)

### Scanner CLI — ~85% complete
- 9 platform analyzers: OpenClaw, MCP, Claude, CrewAI, Cursor, Codex, AutoGPT, Nanobot, Supabase
- 108 YAML rules across 10 rule files
- 14 threat categories
- Three-tier confidence model (suspicious / likely / confirmed)
- Context-aware matching (code vs docs vs config — prevents FP explosion)
- 4 reporters: terminal, JSON, SARIF, HTML
- 3 CLI commands: scan, list, validate
- Babel AST for JS/TS
- Supabase semantic SQL/RLS analysis
- .firmisignore support
- --ignore, --quiet, --fail-on CLI flags
- Security grade (A-F)
- Known-malicious skill blocklist (50+ skills, 10+ authors, C2 infrastructure)
- Platform path override
- MCP config credential scanning

### NOT Built
- Integration layer (Gitleaks, OSV, YARA-X) — commodity detection
- Report engine with AI fix prompts — lead magnet
- Fix engine — auto-remediation
- Runtime monitor — Lasso MCP Gateway plugin
- Python AST (tree-sitter) — CrewAI/Python coverage
- Cloud backend — telemetry, threat intelligence
- Dashboard — web UI for paid users
- Billing — Stripe integration

---

## Phase 1: Integration Layer (Week 1-2)

### Goal
Replace custom regex patterns for commodity detection (secrets, CVEs) with battle-tested tools. Keep custom rules for agent-specific patterns.

### 1.1: Gitleaks Integration
**Why:** Gitleaks has 800+ secret detection patterns maintained by the community. We have ~30.

**Approach:** Subprocess integration. Firmis calls `gitleaks detect --source <path> --report-format json` and merges results into our scan output.

**Tasks:**
1. Add Gitleaks as optional dependency (check if installed, prompt to install if not)
2. Create `src/integrations/gitleaks.ts` — spawn subprocess, parse JSON output
3. Map Gitleaks findings to Firmis threat schema (rule ID, severity, category, location)
4. Add platform context: "This AWS key in mcp.json means all 5 MCP servers can read it"
5. Deduplicate: if both Gitleaks and our rules find same secret, keep Gitleaks (better pattern)
6. Fallback: if Gitleaks not installed, use our built-in cred-* rules

**Files:**
- Create: `src/integrations/gitleaks.ts`
- Modify: `src/scanner/engine.ts` — call Gitleaks after platform scan
- Modify: `src/types/index.ts` — add integration source field to Threat

**Test criteria:**
- Gitleaks subprocess runs and returns JSON
- Findings correctly mapped to Firmis schema
- Platform context added (e.g., "in MCP config shared by 5 servers")
- Graceful fallback when Gitleaks not installed
- No duplicate findings between Gitleaks and built-in rules

### 1.2: OSV API Integration
**Why:** OSV (Open Source Vulnerabilities) database covers npm, PyPI, Go, Rust. We have zero dependency scanning.

**Approach:** HTTP API calls. Parse package.json / pyproject.toml / requirements.txt, query OSV API for known vulnerabilities.

**Tasks:**
1. Create `src/integrations/osv.ts` — HTTP client for OSV API
2. Parse dependency files: package.json (npm), pyproject.toml (Python), requirements.txt (Python)
3. Query OSV API batch endpoint: `POST https://api.osv.dev/v1/querybatch`
4. Map OSV findings to Firmis threat schema
5. Add agent context: "This vulnerable package is used by your CrewAI agent"
6. Add to supply-chain category

**Files:**
- Create: `src/integrations/osv.ts`
- Modify: `src/scanner/engine.ts` — call OSV after platform scan
- Modify platform analyzers — include package.json/pyproject.toml in scanned files

**Test criteria:**
- OSV API returns results for known-vulnerable packages
- Findings correctly mapped with CVSS severity
- Works offline (graceful timeout with warning)
- Batch queries minimize API calls

### 1.3: YARA-X Integration
**Why:** YARA is the standard for malware signature matching. We can compile our known-malicious rules into YARA format for faster matching.

**Approach:** WASM integration via `@litko/yara-x` npm package. Compile YAML rules to YARA format at build time.

**Tasks:**
1. Add `@litko/yara-x` dependency
2. Create `src/integrations/yara.ts` — load YARA rules, scan files
3. Create `rules/yara/` directory with compiled .yar files for:
   - Known malicious skill signatures
   - Obfuscated code patterns (base64 eval, encoded strings)
   - Malware distribution patterns (curl|sh, password-protected zip)
4. YARA scan runs in parallel with rule engine
5. Map YARA matches to Firmis threat schema

**Files:**
- Create: `src/integrations/yara.ts`
- Create: `rules/yara/malicious-skills.yar`
- Create: `rules/yara/obfuscation.yar`
- Modify: `src/scanner/engine.ts` — run YARA in parallel

**Test criteria:**
- YARA-X WASM loads and compiles rules
- Known malicious skill pattern matches
- Scan time not significantly increased (parallel execution)
- Falls back gracefully if WASM fails to load

---

## Phase 2: Report Engine + Lead Magnet (Week 2-3)

### Goal
Ship `firmis report` — generates an HTML security report with AI-powered fix prompts. This is the email gate lead magnet.

### 2.1: HTML Report Generator
**Tasks:**
1. Create `src/reporters/html-report.ts` — standalone HTML file (single file, no external deps)
2. Report sections:
   - Security grade (A-F) with visual gauge
   - Executive summary (1 paragraph, plain English)
   - Findings grouped by severity, then by platform
   - Each finding includes: description, evidence snippet, location, remediation steps
   - AI fix prompt for each finding (see 2.2)
   - Platform coverage summary (which platforms scanned, which skipped)
3. Styled with inline CSS (dark theme matching firmislabs.com)
4. Collapsible finding details
5. "Powered by Firmis" footer with install link

**Files:**
- Create: `src/reporters/html-report.ts`
- Modify: `src/cli/commands/scan.ts` — add `--report` flag

### 2.2: AI Fix Prompts
**Tasks:**
1. For each finding, generate a prompt that can be pasted into Claude/Cursor to fix the issue
2. Template per threat category:
   - credential-harvesting: "Remove the exposed [KEY_TYPE] from [FILE]. Replace with environment variable reference..."
   - known-malicious: "Remove skill [SKILL_NAME] from your installation. Run: [REMOVAL_COMMAND]..."
   - data-exfiltration: "This code sends data to [ENDPOINT]. Remove the network call at [FILE:LINE]..."
3. Include file path, line number, and surrounding context in prompt
4. "Copy for Claude" button in HTML report

**Files:**
- Create: `src/reporters/fix-prompts.ts`
- Modify: `src/reporters/html-report.ts` — embed fix prompts

### 2.3: Email Gate
**Tasks:**
1. `firmis report` generates report but requires email to view/save
2. CLI flow: scan → show summary in terminal → "Enter email to get full HTML report" → POST to waitlist API → open report in browser
3. Waitlist API already exists at `https://firmis-waitlist.riteshkew1001.workers.dev/waitlist`
4. Report saved locally at `~/.firmis/reports/<timestamp>.html`
5. `firmis report --no-email` flag for CI/CD (outputs report without email gate)

**Files:**
- Create: `src/cli/commands/report.ts`
- Modify: `src/cli/index.ts` — add report command

---

## Phase 3: Fix Engine (Week 3-4)

### Goal
Ship `firmis fix` — auto-remediation that actually fixes the issues found by the scanner.

### 3.1: Safe Auto-Fixes
**Tasks:**
1. `firmis fix` reads latest scan results and applies safe remediations
2. Categories of safe fixes (no confirmation needed):
   - **Credential rotation:** Replace exposed keys with env var references
   - **Config hardening:** Set restrictive defaults for unconfigured options
   - **Known-malicious removal:** Remove/quarantine skills on the blocklist
3. Backup all modified files before changes: `~/.firmis/backups/<timestamp>/`
4. `firmis fix --undo` restores from latest backup
5. `firmis fix --dry-run` shows what would change

**Files:**
- Create: `src/cli/commands/fix.ts`
- Create: `src/fixers/credentials.ts`
- Create: `src/fixers/config.ts`
- Create: `src/fixers/skills.ts`
- Create: `src/fixers/backup.ts`

### 3.2: Prompted Fixes
**Tasks:**
1. Fixes that require user confirmation:
   - Restrict shell access for skills that don't need it
   - Downgrade permissions for over-privileged skills
   - Disable unused MCP servers
   - Remove suspicious (but not confirmed malicious) skills
2. Interactive CLI prompt: show finding → show proposed fix → confirm/skip
3. `firmis fix --yes` skips confirmation (for CI/CD)

**Test criteria:**
- Auto-fix removes planted secret and replaces with `$ENV_VAR`
- Quarantine moves flagged skill to `~/.firmis/quarantine/`
- `--undo` correctly restores original files
- `--dry-run` shows changes without applying
- No fix breaks agent's ability to start (health check post-fix)

---

## Phase 4: Runtime Monitor (Week 5-8)

### Goal
Ship `firmis monitor` — continuous runtime protection via Lasso MCP Gateway plugin. This is the $19/mo paid tier.

### 4.1: Lasso Plugin Development
**Why Lasso:** Python plugin pipeline, extensible middleware, target audience match. See ARCHITECTURE.md for comparison with AgentGateway, Docker MCP Gateway, and Invariant Gateway.

**Tasks:**
1. Create `firmis-lasso-plugin/` Python package
2. Implement FirmisPlugin class extending Lasso's plugin interface
3. Plugin pipeline: Request → BasicPlugin → FirmisPlugin → MCP Server → Response
4. FirmisPlugin inspects both requests and responses

**Plugin capabilities:**
- YARA signature matching on tool call content
- IOC blocklist checking (C2 IPs, exfil domains)
- Credential detection in tool responses
- Invariant .gr policy rule evaluation

**Files:**
- Create: `firmis-lasso-plugin/` directory
- Create: `firmis-lasso-plugin/firmis_plugin.py`
- Create: `firmis-lasso-plugin/policies/` (Invariant .gr rules)
- Create: `firmis-lasso-plugin/setup.py`

### 4.2: Invariant Policy Rules
**Tasks:**
1. Write .gr policy rules for common agent security scenarios:
   - Credential exfiltration: tool reads credentials then sends HTTP request
   - Known-malicious infrastructure: tool calls C2 servers
   - Permission boundary: tool accesses files outside allowed paths
   - Data flow: sensitive data appears in outbound calls
2. Policy files in `firmis-lasso-plugin/policies/`

**Example .gr rules:**
```
raise "Credential exfiltration" if:
    (call: ToolCall) -> (call2: ToolCall)
    call is tool:read_file
    "credentials" in call.result
    call2 is tool:http_request
    call2.arguments["url"] not in APPROVED_ENDPOINTS

raise "Known malicious infrastructure" if:
    (call: ToolCall)
    call is tool:http_request
    call.arguments["url"] matches MALICIOUS_DOMAINS
```

### 4.3: CLI Integration
**Tasks:**
1. `firmis monitor` starts Lasso Gateway with Firmis plugin
2. Configures MCP clients to route through gateway
3. Real-time terminal output for blocked/alerted calls
4. License key validation (paid tier)
5. `firmis monitor --config <path>` for custom policy rules

**Files:**
- Create: `src/cli/commands/monitor.ts`
- Modify: `src/cli/index.ts` — add monitor command

### 4.4: Alerting
**Tasks:**
1. Terminal alerts in real-time
2. Slack webhook integration
3. Email alerts (via Resend)
4. Deduplication: same alert doesn't fire repeatedly
5. Configuration in `firmis.config.yaml`

---

## Phase 5: Detection Depth (Ongoing)

### 5.1: Python AST (tree-sitter)
- CrewAI and MCP Python servers need AST-level analysis
- tree-sitter-python for import analysis, function calls, data flow
- Regex patterns cover ~80% today; AST gives remaining 20%

### 5.2: Cross-File Data Flow
- Track data from credential read → variable → network call across files
- Requires call graph analysis
- High effort, incremental improvement over single-file matching

### 5.3: Supply Chain Depth
- Check transitive dependencies (not just direct)
- Typosquatting detection using Levenshtein distance
- Post-install script analysis for npm packages

---

## Competitive Landscape

### Direct Competitors

| Dimension | Firmis | Snyk (agent-scan) | mcp-scan (Cisco) | Lasso Gateway |
|-----------|--------|-------------------|-------------------|---------------|
| Target | Prosumer / SMB | Enterprise | Security researchers | Enterprise |
| Price | Free + $19/mo | $25/user/mo (min 5) | Free (OSS) | Enterprise pricing |
| Time to value | 30 seconds | Days | 30 seconds | Weeks |
| Platforms | 9 | MCP + OpenClaw | MCP only | MCP only |
| Auto-fix | Yes | No | No | No |
| Runtime | Yes (Lasso plugin) | Yes (Snyk Studio) | No | Yes (proxy) |
| Report + AI prompts | Yes | No | No | No |
| Setup | Zero-config CLI | SSO + org + RBAC | CLI | Infrastructure |

### Why We Win
- **vs Snyk:** 85% cheaper, 9 platforms vs 2, auto-fix, zero-config. They're pulling upmarket post-Invariant acquisition.
- **vs mcp-scan:** MCP-only, no remediation, no runtime, no report.
- **vs Lasso:** Enterprise MCP proxy requiring infra changes. We use Lasso as our foundation but wrap it in a prosumer UX.
- **vs DIY:** 108 rules + known-malicious blocklist + 9 platform analyzers encode years of security expertise.

### Market Validation
- Snyk acquired Invariant Labs within 1 year (June 2025) — proves market
- HackerOne reports 540% surge in prompt injection attacks (2025)
- 180,000+ GitHub stars for OpenClaw — massive adoption, minimal security
- Koi Security found 341 malicious skills on ClawHub (Feb 2026)

---

## Open-Core Boundary

### MIT Licensed (Free)
- Scanner CLI (`npx firmis scan`)
- All 108+ YAML detection rules
- 9 platform analyzers
- Terminal, JSON, SARIF reporters
- .firmisignore, --ignore, --quiet, --fail-on
- Security grade (A-F)
- `firmis validate` (rule validation)
- `firmis list` (list platforms/rules)

### Proprietary ($19/mo)
- HTML report with AI fix prompts (`firmis report`)
- Auto-remediation engine (`firmis fix`)
- Runtime monitor (`firmis monitor`)
- Lasso MCP Gateway plugin
- Slack/email alerts
- Cloud threat intelligence feed
- Priority rule updates

---

## Tech Stack

### Scanner (TypeScript/Node.js)
| Component | Technology | Why |
|-----------|-----------|-----|
| CLI framework | commander.js | Standard, zero-config |
| AST parsing | @babel/parser | JS/TS coverage |
| File discovery | fast-glob | Fast, battle-tested |
| Rule format | YAML (js-yaml) | Human-readable, git-diffable |
| Terminal output | chalk + ora | Pretty, standard |
| Secret detection | Gitleaks (subprocess) | 800+ patterns, community maintained |
| CVE detection | OSV API (HTTP) | Free, comprehensive, Google-backed |
| Malware signatures | @litko/yara-x (WASM) | Industry standard, fast |
| SQL parsing | pgsql-parser | Supabase semantic analysis |

### Runtime Monitor (Python)
| Component | Technology | Why |
|-----------|-----------|-----|
| Gateway | Lasso MCP Gateway | Plugin pipeline, extensible |
| Policy rules | Invariant Guardrails (.gr) | Apache 2.0, proven DSL |
| YARA | yara-python | Native YARA integration |
| Plugin framework | Lasso plugin API | Middleware pipeline |

### Landing Page (Next.js)
| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | Next.js 16 (static export) | Fast, Cloudflare Pages |
| Styling | Tailwind CSS | Speed |
| Components | shadcn/ui | Consistent, accessible |
| Hosting | Cloudflare Pages | Free, fast, global |
| Waitlist API | Cloudflare Worker + KV | Serverless, free tier |

---

## Implementation Priority

### Sprint 1: Integration Layer (2 weeks)
1. Gitleaks integration (secrets)
2. OSV API integration (CVEs)
3. YARA-X integration (malware signatures)
4. Deduplicate findings across all sources

### Sprint 2: Report + Lead Magnet (1 week)
1. HTML report generator
2. AI fix prompt templates
3. Email gate flow
4. `firmis report` CLI command

### Sprint 3: Fix Engine (2 weeks)
1. Backup system
2. Credential rotation fixes
3. Malicious skill quarantine
4. Config hardening fixes
5. Interactive prompted fixes

### Sprint 4: Runtime Monitor (3 weeks)
1. Lasso plugin scaffolding
2. YARA + IOC scanning in plugin
3. Invariant .gr policy rules
4. `firmis monitor` CLI command
5. License key validation
6. Alerting (terminal + Slack + email)

### Sprint 5: Detection Depth (ongoing)
1. Python tree-sitter AST
2. Cross-file data flow analysis
3. Supply chain depth (transitive deps)

---

## Testing Strategy

### Scanner Tests
```bash
# Build
npm run build

# Unit tests
npm test

# Integration: scan test fixtures
node dist/cli/index.js scan /tmp/crewai-test-project --platform crewai --json
# Expected: 4 threats (cred-001, cred-004, mal-infra-001)

# Integration: scan MCP config
node dist/cli/index.js scan --platform mcp --json
# Expected: credential findings in mcp.json

# Integration: validate all rules compile
node dist/cli/index.js validate
# Expected: all rules pass

# False positive check: scan Claude skills docs
node dist/cli/index.js scan --platform claude --json | jq '.summary.threatsFound'
# Expected: < 50 (not 2705)
```

### Runtime Tests
```bash
# Plugin loads in Lasso
cd firmis-lasso-plugin && python -m pytest

# Policy rules parse
python -c "from invariant import Policy; Policy.from_file('policies/default.gr')"

# End-to-end: start monitor, make tool call, verify interception
firmis monitor --test
```

### Performance Benchmarks
- CLI scan: < 15 seconds for 50 skills
- Gitleaks subprocess: < 5 seconds
- OSV API: < 2 seconds (batch query)
- YARA-X scan: < 1 second
- Runtime monitor latency: < 10ms per tool call

---

## Launch Plan

### Phase 1: Open-Source Scanner (Now)
- [x] 108 rules, 9 platforms, A-F grading
- [x] npm package published
- [ ] Gitleaks + OSV + YARA-X integration
- [ ] GitHub README with example output
- [ ] HN post: "We scanned 4,812 ClawHub skills — here's what we found"

### Phase 2: Report Lead Magnet (Month 1)
- [ ] `firmis report` with AI fix prompts
- [ ] Email capture flow
- [ ] Landing page updated with report preview
- [ ] Blog: "What We Found Scanning 4,812 Agent Skills"

### Phase 3: Paid Tier (Month 2-3)
- [ ] `firmis fix` auto-remediation
- [ ] `firmis monitor` via Lasso plugin
- [ ] Stripe billing ($19/mo)
- [ ] Slack/email alerts
- [ ] Product Hunt launch

### Content for Launch
- [ ] HN post: "Show HN: Security scanner for AI agents" (leads with data)
- [ ] Reddit r/LocalLLaMA, r/ClaudeAI: "I built a free scanner for AI agent security"
- [ ] Twitter thread: "I scanned my AI agent setup and found [shocking thing]"
- [ ] Blog series: 5-part "Immune System" narrative arc

---

## What We're NOT Building (and Why)

| Feature | Reason |
|---------|--------|
| Web dashboard | No users yet. CLI-first. Dashboard is Month 4+ |
| Mobile app | Not needed. CLI + web report covers use cases |
| Custom proxy from scratch | Lasso exists. Build on it, don't reinvent |
| ML behavioral analysis | Needs data. Deterministic rules first |
| Hash-chain audit trail | Compliance feature. Needs enterprise customers first |
| Blast radius scoring | Complex. Deferred to Phase 5+ |
| Kubernetes integration | Enterprise feature. Prosumers don't use K8s |
| LLM reasoning layer | Phase 5+. Deterministic rules cover 95% |

---

## Code Standards

- TypeScript strict mode. No `any` types.
- Max 50 lines per function, max 300 lines per file
- Functional programming preferred
- Explicit return types for exports
- Tests first (TDD: red → green → refactor)
- Error messages in plain English for non-technical users
