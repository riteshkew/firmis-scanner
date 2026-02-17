# Next Phase Plan: M0.4 Completion + FN Gap Closure

**Date:** 2026-02-17
**Version:** 1.0
**Current State:** v1.2.0 — 8 platforms, 144+ rules, 11 YAML files, 199 tests
**Prerequisite:** All hardening sprints complete, Supabase removed

---

## Phase Overview

The FN audit (2026-02-17) identified systemic gaps in the scanner's detection coverage. This plan weaves those gaps into the existing M0/M1 roadmap, prioritized by **false negative risk** (what attackers exploit, not what looks good in a marketing table).

### Priority Framework

| Priority | Criteria | Timeline |
|----------|----------|----------|
| **P0-FN** | Zero detection for a real attack vector | This sprint |
| **P0-M0** | Remaining M0 deliverable | This sprint |
| **P1-FN** | Thin coverage that creates exploitable blind spots | Next sprint |
| **P1-M1** | M1 roadmap items | Next sprint |
| **P2** | Defense-in-depth improvements | Backlog |

---

## Sprint A: FN Gap Closure + M0.4 (Est. 2-3 days)

### A1. Tool Poisoning Rules [P0-FN] — NEW FILE
**Why:** `tool-poisoning` category defined in type system but has ZERO rules. MCP tool description manipulation is the #1 agentic attack vector.

**File:** `rules/tool-poisoning.yaml`

Rules to create:
- `tp-001`: Hidden instructions in MCP tool descriptions (invisible Unicode, HTML comments, markdown injection)
- `tp-002`: Tool description containing prompt override language ("ignore previous", "system prompt", "admin mode")
- `tp-003`: Tool shadowing — tool registered with same name as a known trusted tool
- `tp-004`: MCP config modification via agent code (writing to `mcp.json`, `claude_desktop_config.json`) — move relevant patterns from mem-003
- `tp-005`: Suspicious tool parameter names (password, token, secret, credential in required params)

**Tests:** Must-catch fixture with malicious MCP tool descriptions.

### A2. Comment Filter Fix [P0-FN]
**Why:** `regex-matcher.ts:87` skips entire lines starting with `//`, `#`, `--`. This suppresses real detections when malicious code has a comment prefix.

**File:** `src/rules/matchers/regex-matcher.ts`

Fix: Only skip the line if the comment marker appears BEFORE the matched content on that line (not after). Or better: remove the comment filter entirely and let confidence thresholds handle it — a single comment-line match has low weight anyway.

### A3. Network-Abuse Rules [P1-FN] — NEW FILE
**Why:** `network-abuse` category defined but zero rules. Bind shells, raw sockets, covert channels are real attack vectors.

**File:** `rules/network-abuse.yaml`

Rules to create:
- `net-001`: Bind shell pattern (`socket.bind() + socket.listen()` on non-standard ports)
- `net-002`: Raw socket creation (`socket.AF_PACKET`, `SOCK_RAW`)
- `net-003`: SSH reverse tunnel (`ssh -R`, `ssh -D` for SOCKS proxy)
- `net-004`: Proxy chaining (`socks5://`, `--proxy`, `tor` references)
- `net-005`: DNS-over-HTTPS as covert channel (DoH endpoints in fetch calls)

### A4. File-System-Abuse Rules [P1-FN] — NEW FILE
**Why:** `file-system-abuse` category defined but zero rules. `/proc` enumeration, log wiping, symlink attacks are real.

**File:** `rules/file-system-abuse.yaml`

Rules to create:
- `fs-001`: `/proc/self/` enumeration (environ, fd, maps, cmdline)
- `fs-002`: System log access/manipulation (/var/log/auth.log, /var/log/syslog, truncate)
- `fs-003`: `/etc/passwd`, `/etc/shadow`, `/etc/sudoers` access
- `fs-004`: Symlink creation to sensitive paths
- `fs-005`: `/dev/mem`, `/dev/kmem` access (kernel memory)
- `fs-006`: World-writable file creation (`chmod 777`)

### A5. Agent Memory Poisoning Gaps [P1-FN]
**Why:** Missing coverage for newer agent memory files.

**File:** `rules/agent-memory-poisoning.yaml` (extend existing)

New patterns to add:
- `mem-005`: `.github/copilot-instructions.md` write (Copilot persistent injection)
- `mem-006`: `AGENTS.md` write (OpenAI Codex/Agents memory)
- `mem-007`: `.aider/` directory manipulation (Aider AI agent)

### A6. Credential Harvesting Gaps [P1-FN]
**Why:** Azure CLI creds, AWS SSO tokens, vault token files completely absent.

**File:** `rules/credential-harvesting.yaml` (extend existing)

New patterns to add:
- `cred-012`: Azure CLI credentials (`~/.azure/accessTokens.json`, `~/.azure/credentials`)
- `cred-013`: AWS SSO cache (`~/.aws/sso/cache/*.json`)
- `cred-014`: Vault token file (`~/.vault-token`, `/root/.vault-token`)
- `cred-015`: `/proc/1/environ` reading (container credential theft)

### A7. M0.4 — YARA-X Pattern Matching [P0-M0]
**Why:** Last unshipped M0 deliverable.

**Files:**
- `src/rules/matchers/yara-matcher.ts` — Pure TS YARA-like engine
- `rules/malware-signatures.yaml` — Ported YARA patterns

Patterns to port:
- Obfuscated base64 payloads (multi-layer encoding)
- Reverse shell byte patterns
- Credential stealer signatures
- package.json hijacking (preinstall/postinstall with encoded payloads)
- Coin miner signatures
- Known RAT/backdoor patterns

Condition evaluator: `any of`, `all of`, `N of ($group*)`

---

## Sprint B: Engine Hardening + Supply Chain (Est. 2-3 days)

### B1. Supply Chain Expansion [P1-FN]
**Why:** Current coverage: ~9 NPM + ~4 Python packages out of 5000+ known malicious.

**Approach:** Don't maintain a static list. Instead:
1. Port the npm malicious package database from `socket.dev` open data (thousands of entries)
2. Add behavioral signals: `postinstall` scripts with `eval`, `base64`, or network calls
3. Add `pip install --extra-index-url` detection (dependency confusion vector)
4. Flag missing lockfiles (`package-lock.json`, `yarn.lock` absent when `package.json` exists)
5. Flag `*` or `latest` version ranges

**Files:**
- `rules/supply-chain.yaml` (expand significantly)
- Possibly `rules/supply-chain-packages.yaml` for the large package list

### B2. Python Credential Path Expansion [P1-FN]
**Why:** `os.path.expanduser('~')`, `pathlib.Path.home()`, `os.environ.get('HOME')` all bypass the file-access normalizer.

**File:** `src/rules/matchers/regex-matcher.ts`

In `matchFileAccess()`, extend the `~` expansion to include:
```
os\.path\.expanduser\(['"]\~['"]\)
pathlib\.Path\.home\(\)
os\.environ\.get\(['"](HOME|USERPROFILE)['"]\)
os\.getenv\(['"](HOME|USERPROFILE)['"]\)
```

### B3. Prompt Injection Hardening [P2]
**Why:** All 10 rules are English-only ASCII. Homoglyphs and multilingual injection are blind spots.

**File:** `rules/prompt-injection.yaml` (extend)

- Add common non-English override phrases (Spanish, French, German, Chinese)
- Add homoglyph detection for key instruction words (Cyrillic I, Cherokee letters)
- Add JSON/XML structured injection (`{"role": "system", "content": "..."}`)

### B4. Confidence Threshold Audit [P2]
**Why:** Some thresholds are set too high, creating FN on single-pattern matches.

Review and potentially lower:
- `cred-005` (85 -> 75): Browser credential access
- `sus-010` (90 -> 80): Reverse shell detection
- `privesc-002` (90 -> 80): Process injection

---

## Sprint C: M1 Foundation (Est. 3-5 days)

### C1. `firmis discover` Command [P0-M1]
Formalize the existing auto-detection into a dedicated command with structured JSON output.

### C2. `firmis bom` — Agent BOM [P0-M1]
CycloneDX 1.7 ML-BOM with agent-specific properties.

### C3. `firmis ci` — CI Pipeline [P1-M1]
Combined discover -> bom -> scan -> report pipeline.

---

## FN Audit Gap → Sprint Mapping

| Audit ID | Description | Sprint | Task |
|----------|-------------|--------|------|
| FN-CRIT-1 | Doc multiplier suppresses secrets | **DONE** (H4) | Shipped in hardening v2 |
| FN-CRIT-2 | Tool poisoning zero rules | **A1** | New YAML file |
| FN-CRIT-3 | Cloud IMDS not covered | **DONE** (H5) | exfil-011/012 shipped |
| FN-CRIT-4 | Python expanduser bypass | **B2** | Regex matcher expansion |
| FN-HIGH-1 | Comment filter suppresses detections | **A2** | Regex matcher fix |
| FN-HIGH-2 | Supply chain ~9/5000+ packages | **B1** | Package list expansion |
| FN-HIGH-3 | Python subprocess+cred correlation | **P2** | Deferred (needs cross-file) |
| FN-HIGH-4 | Bind shell missing | **A3** | net-001 |
| FN-HIGH-5 | WebSocket exfil zero-detection | **DONE** (H5) | exfil-012 shipped |
| FN-MED-1 | pip --extra-index-url | **B1** | Supply chain expansion |
| FN-MED-2 | Azure CLI creds absent | **A6** | cred-012 |
| FN-MED-3 | Homoglyph injection | **B3** | Prompt injection hardening |
| FN-MED-4 | Multilingual injection | **B3** | Prompt injection hardening |
| FN-MED-5 | GitHub Actions injection | **P2** | Deferred (CI/CD is not core agentic) |

### Empty Category Resolution

| Category | Current Rules | Sprint | Plan |
|----------|--------------|--------|------|
| `tool-poisoning` | 0 | **A1** | 5 new rules |
| `network-abuse` | 0 | **A3** | 5 new rules |
| `file-system-abuse` | 0 | **A4** | 6 new rules |

---

## Deferred Items (Not This Phase)

| Item | Reason for Deferral |
|------|-------------------|
| Python AST (tree-sitter) | M5 scope — significant dependency, limited ROI for current user base |
| Cross-file data flow | M5 scope — architectural complexity, needs taint tracking engine |
| Cursor FP (scanning all VS Code extensions) | Needs trusted-publisher allowlist — product decision required |
| Claude FP (scanning installed skill libraries) | Needs trusted-source allowlist — product decision required |
| Windows platform paths | No Windows users in target persona yet |
| Hash-based malware detection | Needs threat intel feed (M4 scope) |
| Transitive dependency scanning | Needs full lockfile parser (M5 scope) |
| Signed scan results | Enterprise feature (M4+ scope) |

---

## Success Criteria

### Sprint A Complete When:
- [ ] `rules/tool-poisoning.yaml` ships with 5+ rules, tests pass
- [ ] `rules/network-abuse.yaml` ships with 5+ rules, tests pass
- [ ] `rules/file-system-abuse.yaml` ships with 6+ rules, tests pass
- [ ] Comment filter fixed (no false suppression)
- [ ] Agent memory rules expanded (3 new patterns)
- [ ] Credential rules expanded (4 new patterns)
- [ ] All 3 empty threat categories now have active rules
- [ ] M0.4 YARA matcher functional with malware-signatures.yaml
- [ ] 15-fixture matrix still passes

### Sprint B Complete When:
- [ ] Supply chain covers 100+ known-malicious packages
- [ ] Python credential path expansion in regex matcher
- [ ] Multilingual prompt injection (4 languages)
- [ ] Real-world auto-detect scan shows improved detection with no FP regression

---

*Next review: After Sprint A completion*
