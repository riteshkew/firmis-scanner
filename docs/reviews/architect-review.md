# Architect Review: UNIFIED-PLAN-v5.md

**Reviewer:** Principal Architect Agent (Opus)
**Date:** 2026-02-17
**Document Under Review:** `docs/UNIFIED-PLAN-v5.md`
**Codebase Version:** v1.1.0 (commit 5fb99e2)
**Verdict:** Proceed with significant revisions. The vision is sound; the execution plan has structural problems that will cause pain at M2-M3 if not addressed now.

---

## 1. Architecture Risks

### 1.1 The Two-Language Runtime Monitor Is a Maintenance Nightmare

**Severity: CRITICAL**

The plan proposes a free-tier TypeScript MCP proxy and a paid-tier Python Lasso Gateway plugin. This means:

- The YAML runtime policy engine must be implemented **twice** (once in TypeScript, once in Python) and kept in sync forever.
- Every new runtime rule requires parallel implementation, parallel testing, and parallel debugging.
- The `policy_engine.py` "ported from TS" will inevitably drift from the TypeScript version. Bug-for-bug compatibility across two languages is an illusion.
- You now need Python CI/CD, Python packaging (setup.py/pyproject.toml), Python tests, and a Python developer on the team -- for a TypeScript-first product.

**The plan acknowledges this** by saying "same YAML rules as free TS tier" -- but YAML rules are data, and the *interpreters* of that data are code. Two interpreters in two languages will diverge.

**Recommendation:** Either (a) commit fully to TypeScript for both tiers, building the paid proxy as a more capable TS proxy with cloud sync, or (b) commit fully to Lasso/Python for the runtime tier and don't build a TS proxy at all. The worst outcome is building both. If Lasso's `GuardrailPlugin` API is mature enough to trust, use it exclusively and treat the paid tier as a Python sidecar. If it is not mature enough, build a single TS proxy for both tiers with paid features feature-flagged.

### 1.2 Rule Engine Is Not Designed for Runtime Sequence Detection

**Severity: HIGH**

The current rule engine (`src/rules/engine.ts`) matches **individual patterns against individual files**. It operates on content strings and ASTs. It has no concept of:

- **Temporal sequences** (tool A called, then tool B called)
- **Cross-event correlation** (data read from tool A's response appears in tool B's arguments)
- **Stateful evaluation** (maintaining a session context across multiple tool calls)

The plan's runtime YAML rules (Section 6, M3) use `sequence:` and `resultContains:` and `argsNotIn:` -- none of which exist in the current engine. This is not "adapting" the existing engine; this is a **completely new evaluation engine** that happens to use YAML as its configuration format. The plan underscopes this by framing it as "YAML rules adapted from Invariant `.gr` design."

Building a stateful sequence detection engine is a 3-4 week task by itself. It needs:
- A session context store
- Temporal ordering with configurable time windows
- Pattern binding (capture groups from one event used in conditions of the next)
- Efficient evaluation that does not degrade with many rules

**Recommendation:** Treat the runtime policy engine as a distinct module (`src/monitor/policy-engine.ts`) that shares the YAML loader but has its own evaluation logic. Do not pretend it is an extension of the static rule engine. Explicitly scope the M3 deliverable to include "build sequence evaluation engine" as a P0 task with its own time estimate.

### 1.3 Circular Dependency Risk in Proposed File Structure

**Severity: MEDIUM**

The proposed structure has:
- `src/pentest/engine.ts` depends on scan results from `src/scanner/engine.ts`
- `src/monitor/` depends on runtime rules under `rules/runtime/`
- `src/cli/commands/pentest.ts` imports from `src/pentest/`
- `src/cli/commands/monitor.ts` imports from `src/monitor/`

This is fine at the import level, but the **ScanResult type** becomes a shared contract across scanner, pentest, reporter, fixer, and monitor modules. Currently `ScanResult` is tightly coupled to the static analysis model (platforms, components, file-level threats). Pentest findings and runtime findings have fundamentally different shapes:

- Static: "This regex matched at file:line:col"
- Pentest: "This probe against this MCP endpoint produced this LLM response that was classified as a pass/fail"
- Runtime: "This sequence of tool calls over a 30-second window matched this policy"

**Recommendation:** Introduce a `Finding` union type early (M0) that can represent static, pentest, and runtime findings. Do not force pentest and runtime results into the current `Threat` shape -- it will require ugly hacks (e.g., synthetic file paths and line numbers for findings that have no file context).

### 1.4 Milestone Ordering Dependency Issues

**Severity: MEDIUM**

- **M2.8 (Rug Pull Detection)** depends on M1.2 (BOM) for diffing. This is correctly ordered.
- **M2.1 (Pentest)** depends on scan results being structured in a way that identifies MCP server endpoints. Currently, the `MCPAnalyzer` discovers servers from config files but does not extract tool endpoints. The pentest engine needs to know *what tools each server exposes*, which requires actually connecting to the server (or parsing its source code). This is not addressed in M1 or M2 and is a hidden prerequisite.
- **M3.7 (Stripe billing)** is mixed in with the runtime monitor milestone. Billing is an entirely different concern (web dashboard, user accounts, license management). It should be a separate milestone or deferred to M4 when cloud infrastructure exists.

### 1.5 promptfoo Coupling Depth

**Severity: HIGH**

The plan says "import programmatically via Node.js API" -- but promptfoo's public API is designed primarily as a CLI tool. The `promptfoo` npm package exposes some programmatic interfaces, but:

- The `evaluate()` function expects config objects that mirror their YAML config format. This is an internal API that can and does change between minor versions.
- MCP provider support in promptfoo was added recently and is still evolving.
- The package pulls in significant transitive dependencies (LLM SDKs, evaluation harnesses, etc.), which conflicts with the "lightweight zero-install" philosophy. Running `npx firmis pentest` will now pull hundreds of MB of promptfoo + its dependencies.

**Recommendation:** Pin `promptfoo` to a specific version and wrap it behind an adapter interface (the plan already shows `promptfoo-adapter.ts`, which is correct). But also consider: can the basic 10 free-tier probes be implemented natively in TypeScript without promptfoo at all? Tool poisoning detection, basic auth testing, and known injection patterns do not require a full red-team framework. Reserve promptfoo for the paid tier's 50+ probes. This keeps the free tier truly lightweight.

---

## 2. Scope & Complexity Red Flags

### 2.1 M0 Is Underscoped

**Severity: HIGH**

M0.1 (Secret Detection) is described as "port ~230 Gitleaks patterns." This sounds mechanical, but:

- Gitleaks TOML format uses `entropy`, `secretGroup`, `keywords`, `allowlist`, and `path` filtering. You need to port the **evaluator**, not just the patterns.
- Shannon entropy calculation on capture groups requires careful implementation to avoid false positives on base64-encoded config values that are not secrets.
- The deduplication against existing `cred-*` rules (11 rules in `credential-harvesting.yaml`) requires careful analysis -- some existing rules will overlap with Gitleaks patterns. You need a conflict resolution strategy.

Realistic estimate: 2-3 weeks for M0.1 alone, not the implied "M0 fits in weeks 1-4 with three other deliverables."

### 2.2 M2 Is a Hidden Elephant

**Severity: CRITICAL**

M2 contains **eight** deliverables spanning pentest, auto-fix, backup/undo, tool poisoning detection, and rug pull detection across 6 weeks. Let me decompose what each actually requires:

| Deliverable | Actual Complexity | Realistic Estimate |
|---|---|---|
| M2.1 Pentest command | promptfoo integration + config generation + result mapping | 3 weeks |
| M2.2 Cisco mcp-scanner | Subprocess management + result parsing + optional dep handling | 1 week |
| M2.3 Tier 1 auto-fixes | File modification + quarantine system + env var injection | 2 weeks |
| M2.4 Tier 2 prompted fixes | Interactive CLI + confirmation flows + preview rendering | 1 week |
| M2.5 Backup + undo | Manifest system + restore logic + dry-run mode | 1 week |
| M2.6 Enhanced report | Pentest findings in HTML + merged static+dynamic results | 1 week |
| M2.7 Tool poisoning detection | Unicode analysis + cross-server comparison + YAML rules | 2 weeks |
| M2.8 Rug pull detection | Baseline caching + diff engine + change classification | 1 week |

That is 12 weeks of work scoped into 6 weeks. This is the milestone most likely to slip and cause cascading delays.

**Recommendation:** Split M2 into M2a (pentest, weeks 9-14) and M2b (auto-fix + tool poisoning + rug pull, weeks 15-18). Push M3 back accordingly. Shipping a working `firmis pentest` is a standalone marketing moment; do not dilute it by shipping it alongside auto-fix.

### 2.3 YARA-TS Engine (M0.4) Is Over-Engineered for This Stage

**Severity: MEDIUM**

The plan describes a YARA condition evaluator with `any of`, `all of`, `N of ($group*)`, and hex pattern support. This is effectively building a subset of a YARA interpreter in TypeScript. The existing rule engine already handles multi-pattern matching with weight-based confidence scoring.

The actual malware patterns the plan wants to catch (obfuscated base64, reverse shells, credential stealers, package.json hijacking) can all be expressed as the existing YAML rules with regex patterns. There is no evidence that YARA's condition language adds detection capability beyond what `confidenceThreshold` + pattern weights already provide.

**Recommendation:** Port the YARA *patterns* as standard YAML rules with regex type. Skip building a YARA condition evaluator. If a customer demands YARA compat, build it then. This saves 1-2 weeks.

### 2.4 Three Web Scanners in the Funnel Are a Distraction

**Severity: MEDIUM**

The plan describes three separate scanner funnels (AI Agent CLI, Supabase web scanner, Website web scanner). Each requires:
- A web frontend on firmislabs.com
- An API endpoint
- A distinct scanner module
- Landing page content and SEO work

Building and maintaining three acquisition funnels when you have zero paying customers is premature. The AI Agent Scanner is the unique value proposition. The Supabase scanner is partially built. The Website scanner (HTTP Observatory + Nuclei) is commodity -- dozens of free alternatives exist (SecurityHeaders.com, Mozilla Observatory itself, Qualys SSL Labs).

**Recommendation:** Ship the AI Agent CLI as the sole focus through M2. The Supabase scanner already exists in the CLI. Defer the Website scanner and web frontend wrapping until post-revenue. The blog arc is the marketing strategy; web scanners are a distraction from it.

---

## 3. Technical Gaps

### 3.1 No Error Recovery Strategy for External Dependencies

**Severity: HIGH**

The plan mentions "graceful 2s timeout + warning when offline" for OSV (M0.2) but has no equivalent strategy for:

- **promptfoo failures** (M2): What if promptfoo throws during a probe? Does the entire pentest fail? Are partial results reported?
- **IMAP/SMTP connection failures** (referenced in the immune system table but not in milestones): Not relevant to current plan, but the architecture decisions reference email modules.
- **Lasso Gateway crashes** (M3): If the Python gateway process dies, does the MCP client lose access to all servers?
- **CycloneDX library failures** (M1): What if CycloneDX cannot serialize a model card for an unusual format?

**Recommendation:** Define a universal degradation strategy: every integration point gets a try/catch boundary that (a) logs the failure, (b) marks the finding source as `degraded`, (c) continues with partial results. This pattern already exists in `ScanEngine.scanPlatform()` -- formalize it as a documented contract for all new modules.

### 3.2 YAML Rule Format Cannot Express Runtime Sequences

**Severity: HIGH (already covered in 1.2, elaborated here)**

The example runtime rule uses:

```yaml
when:
  sequence:
    - tool: "read_file"
      resultContains: ["AKIA", "ghp_", "sk-", "-----BEGIN"]
    - tool: "fetch|http_request"
      argsNotIn:
        url: ["github.com", "api.openai.com"]
```

This requires:
- A new YAML schema separate from the static rule schema
- A parser that understands `sequence`, `resultContains`, `argsNotIn`
- A runtime that buffers tool call/response pairs and evaluates sequences in sliding windows
- Handling of regex in tool names (`fetch|http_request`)
- Negative matching (`argsNotIn`)
- Configurable time windows (should the sequence match within 1 second? 1 minute? 1 session?)

None of this is defined. The current `RuleFile` interface (`{ rules: Rule[] }` where `Rule` has `patterns: RulePattern[]`) cannot express this. You need a parallel type system:

```typescript
interface RuntimeRule {
  id: string
  name: string
  when: {
    sequence: SequenceStep[]
    window?: number // seconds
  }
  then: 'block' | 'warn' | 'log'
  message: string
}

interface SequenceStep {
  tool: string // regex
  argsContains?: Record<string, string[]>
  argsNotIn?: Record<string, string[]>
  resultContains?: string[]
  resultNotContains?: string[]
}
```

**Recommendation:** Design and document the runtime rule schema in M1 (not M3). This allows rule authors to start thinking about runtime rules earlier and validates the design before the monitor is built.

### 3.3 The Existing Rule Engine Has Performance Concerns at Scale

**Severity: MEDIUM**

The current engine iterates all rules for every file:

```typescript
for (const rule of rules) {
  const ruleMatches = await this.matchRule(rule, content, filePath, ast)
}
```

With 108 rules, this is fine. With 350+ rules (M0 target including ~230 secret patterns), each file will be checked against 350+ regex patterns. For a project with 1,000 files (the M0 performance target), that is 350,000 regex evaluations.

The Gitleaks `keywords` optimization (fast pre-filter: skip files that do not contain a relevant keyword before running the expensive regex) is mentioned in M0.1 but there is no implementation plan for it in the rule engine. The current engine has no pre-filtering mechanism.

**Recommendation:** Before adding 230 secret patterns, implement a keyword pre-filter in the rule engine. Add an optional `keywords` field to the `Rule` type. In `matchRule()`, check if the content contains any keyword before running patterns. This is a small change with large performance impact.

### 3.4 No Data Flow Diagram for the Pentest Critical Path

The plan describes the pentest flow in pseudocode but omits:
- How does the pentest engine *connect* to a running MCP server to send probes?
- Does it spawn the server itself? Use an existing running instance?
- What LLM does promptfoo use to *send* the probes? The user's OpenAI key? A Firmis-provided key?
- How are probe results (LLM outputs) evaluated? Does promptfoo's assertion system handle this, or does Firmis provide custom graders?

These are not implementation details -- they are architectural decisions that affect cost (whose LLM key?), security (running untrusted MCP servers), and UX (does the user need to configure LLM access?).

**Recommendation:** Add a concrete data flow diagram for the pentest path showing: user config -> server discovery -> server spawning/connection -> probe generation -> LLM invocation -> response evaluation -> finding creation. Annotate each step with who provides the compute and credentials.

### 3.5 `ThreatCategory` Type Is Hardcoded and Will Break

The `ThreatCategory` type is a string union with 14 members. The plan adds new categories (`secret-detection` in M0, presumably `tool-poisoning` in M2, and runtime categories in M3). Each addition requires:
- Updating the TypeScript union type
- Updating `createEmptySummary()` to include the new category in `byCategory`
- Updating reporters that switch on categories
- Updating SARIF mappings

This is brittle. With 6 milestones each adding categories, this will be a recurring source of breakage.

**Recommendation:** Change `ThreatCategory` from a string union to a plain `string` type (or use a registry pattern). Keep the well-known categories as constants for type-safe access, but allow arbitrary category strings for extensibility. Update `byCategory` to use a `Map<string, number>` or dynamically-keyed `Record`.

---

## 4. Dependency & Vendor Risks

### 4.1 promptfoo (HIGH RISK)

- **API stability:** promptfoo's Node.js API is not documented as a stable public API. The `evaluate()` function and config types change between minor versions. Check their CHANGELOG.
- **Transitive dependency weight:** promptfoo depends on `@ai-sdk/*`, `openai`, `anthropic`, and other LLM SDKs. Adding it as a dependency will roughly triple the install size of `firmis-scanner`.
- **License compliance:** MIT, which is fine. But promptfoo's red-team plugins may have their own license terms for datasets.
- **Mitigation:** Pin exact version. Wrap behind adapter. Consider making it a peer dependency or optional dependency (`optionalDependencies` in package.json) so it is not installed by default for `npx firmis scan`.

### 4.2 Lasso MCP Gateway (HIGH RISK)

- **Maturity:** Lasso is relatively new. The `GuardrailPlugin` API may not be stable. There are no published guarantees about backward compatibility.
- **Maintenance burden:** If Lasso changes their plugin API, the `firmis-lasso-plugin` Python package breaks for all paid users.
- **Deployment complexity:** Users must install Python, pip, lasso-mcp-gateway, and firmis-lasso-plugin. This is 4 steps versus the free tier's `npx` one-step. The conversion funnel from free to paid will be hurt by this friction.
- **Mitigation:** Build a thin adapter layer that insulates against Lasso API changes. Consider Docker-based deployment to hide the Python dependency behind a single `docker run` command.

### 4.3 @cyclonedx/cyclonedx-library (MEDIUM RISK)

- **Maturity:** The TypeScript library is maintained by the CycloneDX core team. Apache-2.0.
- **ML-BOM 1.7 support:** CycloneDX ML-BOM is an evolving specification. The TS library may not support all ML-BOM fields. Verify `modelCard` support before committing to M1.2.
- **Size:** Adds a non-trivial dependency. Check if it is tree-shakeable.

### 4.4 OSV Batch API (LOW RISK)

- **Rate limits:** The OSV API does not require authentication. Rate limits are generous (1,000 packages per batch call). The 24-hour cache strategy is appropriate.
- **Reliability:** OSV is backed by Google. Downtime is rare. The 2s timeout with graceful degradation is correct.
- **Risk:** The batch API format may change. The `v1/querybatch` endpoint is documented but not versioned. Pin to the current behavior and add a response schema validator.

### 4.5 Cisco mcp-scanner (LOW RISK)

- **Marked as optional:** This is the correct approach. Subprocess-wrapped, presence-detected, failure-tolerated.
- **Risk:** Python dependency. But since it is optional and the plan gracefully degrades, this is acceptable.

---

## 5. What Is Missing From the Plan

### 5.1 Security of the Tool Itself

**Severity: CRITICAL OMISSION**

Firmis is a security scanner that reads arbitrary user code, parses YAML files, executes regexes from YAML-defined patterns, and (in M2) connects to MCP servers and sends adversarial probes. The plan says nothing about:

- **YAML deserialization attacks:** The codebase already uses `JSON_SCHEMA` for YAML loading (good), but custom rule files from users are loaded through the same path. A malicious custom rule file could contain patterns designed to ReDoS the scanner.
- **ReDoS on user-provided regexes:** Custom rules or even the 230 Gitleaks-ported patterns could contain catastrophic backtracking regexes. There is no regex timeout mechanism. Node.js will hang.
- **MCP server trust during pentest:** `firmis pentest` will spawn or connect to MCP servers that might be malicious. If a malicious server returns crafted responses, does the pentest engine handle them safely? Is there a sandbox?
- **Supply chain of Firmis itself:** What prevents a compromised dependency of firmis-scanner from accessing the user's file system during a scan? The scanner runs with full user privileges.

**Recommendation:** Add a "Security of Firmis" section to the plan:
1. Implement regex timeout (use `re2` or a regex execution timeout wrapper) for all pattern matching. This is especially critical before adding 230 Gitleaks patterns.
2. Validate custom rule patterns at load time for catastrophic backtracking (the `validateRegexPattern()` function exists but only checks compilation, not complexity).
3. Document the threat model for `firmis pentest` -- what privileges does it need, what can go wrong.
4. Run `npm audit` in CI and pin all transitive dependencies.

### 5.2 Testing Strategy Across Milestones

**Severity: HIGH OMISSION**

The plan mentions "Vitest 1.3+" but says nothing about:

- **Test coverage targets per milestone.** The current test suite has unit tests for rules/patterns/engine and integration tests for scans. What are the targets for M0-M5?
- **Integration test strategy for promptfoo.** How do you test the pentest engine without actual LLM calls? Mock promptfoo's evaluate function? Use recorded fixtures? This needs to be decided before M2 starts.
- **Runtime monitor testing.** How do you test the MCP proxy? Spawn test MCP servers? This is non-trivial.
- **Regression testing for rule engine changes.** Adding 230 secret patterns and 50+ YARA patterns to the same engine that runs the existing 108 rules requires careful regression testing. Do existing tests still pass? Are new false positives introduced?

**Recommendation:** Add a test strategy section to each milestone. Minimum: (a) unit tests for new modules, (b) integration tests for new commands, (c) regression tests confirming existing behavior unchanged, (d) performance benchmarks for the rule engine at 350+ rules.

### 5.3 Migration Path for Existing v1.1.0 Users

**Severity: MEDIUM OMISSION**

The scanner is published on npm. Users currently run `npx firmis scan`. As new milestones ship:

- M0 adds `secret-detection` and `malware-signatures` categories. Existing CI pipelines using `--fail-on high` will suddenly see new findings and start failing. Is this a breaking change? How is it communicated?
- M0 adds 230+ new rules. The scan output will be dramatically different. Users who have tuned `.firmisignore` may need to re-tune.
- M1 adds new commands (`discover`, `bom`, `ci`). No breaking change, but the `--fail-on` behavior from `firmis ci` needs to be documented against `firmis scan`.
- M2 changes the `ScanResult` type if pentest findings are merged. This breaks programmatic API consumers.

**Recommendation:** Adopt semver properly. M0 (new detection capabilities, possible new findings) should be v1.2.0. M1 (new commands, no breaking changes) should be v1.3.0. M2 (if `ScanResult` changes) should be v2.0.0. Document migration guides per minor/major version.

### 5.4 Observability and Debugging for End Users

When `firmis scan` produces unexpected results (false positives or missed findings), users need ways to debug:

- Which rules matched?
- What was the confidence score breakdown?
- Why was a specific finding reported (or not)?

Currently `--verbose` provides some output, but there is no `--explain` mode that shows the rule evaluation trace for a specific file or finding. As the rule set grows to 350+, this becomes essential for adoption.

**Recommendation:** Add a `--explain` flag or `firmis explain <finding-id>` command that shows: rule matched, patterns that fired, confidence calculation, context multiplier applied, threshold comparison.

### 5.5 Rate Limiting and Cost Control for Pentest

The plan's pentest feature uses LLM API calls (through promptfoo). For the paid tier with 50+ probe types against multiple MCP servers, this could generate hundreds of LLM calls per pentest run. At $0.01-$0.03 per call, a full pentest could cost $1-$10 in LLM costs.

Who pays for this? If the user provides their own API key, it needs clear UX warnings about cost. If Firmis provides the key (SaaS model), it needs rate limiting per user.

**Recommendation:** Add cost estimation to `firmis pentest --estimate` before running. Show "This pentest will make approximately N LLM calls, estimated cost $X with your configured provider."

---

## 6. Recommendations

### Top 5 Changes to Make Before Implementation

**1. Kill the dual-language runtime monitor.** Choose one: TypeScript for both tiers (recommended) or Python-only via Lasso. Do not build and maintain two policy engines. This single decision saves 4-6 weeks of M3 implementation and years of maintenance.

**2. Split M2 into two milestones.** M2a: Pentest (weeks 9-14). M2b: Auto-fix + tool poisoning + rug pull (weeks 15-18). M3 becomes weeks 19-24. The current M2 is 12 weeks of work compressed into 6.

**3. Make promptfoo an optional dependency.** Implement the 10 basic free-tier probes natively in TypeScript (tool poisoning detection is pattern matching on tool descriptions; auth boundary testing is connecting to servers and checking access -- neither needs a full red-team framework). Reserve promptfoo for the paid tier's advanced probes. This keeps `npx firmis scan` lightweight and fast.

**4. Add regex safety before adding 230 patterns.** Before M0.1, implement either: (a) a regex complexity validator that rejects patterns with catastrophic backtracking potential, or (b) a regex execution timeout (via worker threads or `re2`). Without this, a single bad Gitleaks pattern port can hang the scanner indefinitely.

**5. Design the `Finding` union type now.** Before M0 starts, refactor `Threat` into a discriminated union that can represent static findings, secret findings, vulnerability findings, pentest findings, and runtime findings. Each variant carries its own context (file location for static, endpoint + probe for pentest, tool call sequence for runtime). This prevents technical debt from accumulating across M0-M3.

### What to Cut

- **Website scanner (HTTP Observatory + Nuclei).** Commodity. Dozens of free alternatives. Zero differentiation. Cut entirely until post-revenue.
- **YARA condition evaluator (M0.4).** Port the patterns as standard YAML rules. Cut the custom evaluator.
- **Cisco mcp-scanner integration (M2.2).** Optional and subprocess-based. Defer to M5. Focus M2 on the promptfoo integration.
- **Stripe billing in M3 (M3.7).** Move to M4 when cloud infrastructure exists. Billing without a web dashboard is awkward.

### What to Add

- **Regex safety layer (before M0).** Worker-thread-based timeout for regex execution. Critical for security and reliability.
- **Keyword pre-filter in rule engine (M0, before secret patterns).** Performance optimization needed to handle 350+ rules without degradation.
- **`--explain` mode (M0 or M1).** Essential for debugging false positives as rule count grows.
- **Runtime rule schema design (M1, not M3).** Design the sequence detection YAML format early to validate the approach.
- **Pentest data flow diagram (before M2).** Who provides the LLM key? Who spawns the MCP server? What is the cost model?
- **Security of Firmis section (M0).** ReDoS protection, supply chain integrity, pentest sandbox model.

### What to Reorder

| Current Order | Proposed Order | Rationale |
|---|---|---|
| M0: Foundation (4 weeks) | M0: Foundation + regex safety + keyword pre-filter (5 weeks) | Cannot safely add 230 patterns without safety |
| M1: Discovery + BOM (4 weeks) | M1: Discovery + BOM + runtime rule schema design (4 weeks) | Validates M3 design early |
| M2: Pentest + Fix (6 weeks) | M2a: Pentest only (5 weeks) | Standalone marketing moment |
| -- | M2b: Auto-fix + tool poisoning + rug pull (4 weeks) | Separate milestone, clear scope |
| M3: Runtime Monitor (6 weeks) | M3: Runtime Monitor TS-only (5 weeks) | Single language, simpler architecture |
| M4: Cloud (8 weeks) | M4: Cloud + Billing (8 weeks) | Billing moves here from M3 |

---

## Appendix A: Codebase Health Assessment

The existing v1.1.0 codebase is in reasonable shape:

**Strengths:**
- Clean type system with proper separation (`types/`, `rules/`, `scanner/`, `reporters/`)
- Abstract base class for platform analyzers with good extensibility
- YAML rule format is well-designed for static analysis
- Context-aware confidence multipliers reduce documentation FPs
- Error types are well-structured (`FirmisError` hierarchy)
- Test coverage includes unit, integration, and fixture-based tests

**Concerns:**
- `PlatformRegistry` uses a static `Map` singleton, which makes testing harder and prevents parallel test execution
- `ScanEngine` constructor hard-codes `SupabaseSemanticAnalyzer` instead of using the platform registry
- `FileAnalyzer.analyzeFilesParallel()` uses chunked sequential execution, not a proper work pool
- `readYAML()` uses `JSON_SCHEMA` which is safe but overly restrictive -- legitimate YAML features like anchors are rejected
- The `cloud/` module already exists with full type definitions but no tests -- this is speculative code that should not have been written yet

**Debt to Address Before M0:**
- Remove or test the `cloud/` module (it exports types and code that are untested and unreferenced)
- Fix the `PlatformRegistry` singleton to accept injected config for testing
- Add a `vitest.config.ts` if one does not exist, with proper test isolation

---

## Appendix B: Risk Matrix

| Risk | Likelihood | Impact | Mitigation Priority |
|---|---|---|---|
| M2 scope overrun (12 weeks in 6) | Very High | High | Split milestone immediately |
| Dual-language policy engine divergence | High | Critical | Choose one language |
| promptfoo API instability | Medium | High | Pin version, adapter pattern |
| ReDoS from ported patterns | Medium | High | Add regex safety before M0.1 |
| Rule engine perf degradation at 350+ rules | Medium | Medium | Keyword pre-filter |
| Lasso GuardrailPlugin API change | Medium | Medium | Thin adapter, version pin |
| CycloneDX ML-BOM field support gaps | Low | Medium | Verify before M1.2 |
| OSV API format change | Low | Low | Response schema validation |

---

*Review complete. This document should be revisited after M0 planning is finalized and before M2 planning begins.*
