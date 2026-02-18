# Firmis Scanner - Architecture v2.0

**Version:** 2.0.0
**Last Updated:** 2026-02-16
**Status:** Production Architecture
**Target Market:** Prosumer/SMB developers using AI agents (OpenClaw, MCP, CrewAI, Claude Skills)

---

## Executive Summary

Firmis is a security platform for AI agents that follows a **"don't reinvent the wheel"** philosophy. We integrate commodity security tools (Gitleaks, OSV, YARA) and wrap them with AI agent platform awareness, then add proprietary runtime monitoring and threat intelligence on top.

**Architecture Principles:**

1. **Don't reinvent commodity detection** - integrate existing tools (Gitleaks, OSV, YARA)
2. **Build only what's unique** - agent platform analysis, topology mapping, remediation
3. **Build on top of existing gateways** - Lasso MCP Gateway for runtime
4. **Defense-in-depth** - complement (not replace) sandboxes like E2B/Docker
5. **Open-core** - MIT scanner CLI, proprietary cloud/monitor features

**The Moat:** Platform-specific analyzers for OpenClaw, MCP, Claude Skills, CrewAI, AutoGPT, Nanobot, Cursor, Codex, Supabase. We translate generic threat patterns into agent-specific context ("This AWS key is in your MCP config, which means all 5 MCP servers can access it").

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FIRMIS ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  SCANNER CLI (TypeScript/Node.js 20+, MIT License, Free)       │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                 │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Integration Layer (commoditize detection)              │  │    │
│  │  ├──────────────────────────────────────────────────────────┤  │    │
│  │  │  • Gitleaks (subprocess) ────→ 800+ secret patterns      │  │    │
│  │  │  • OSV API (HTTP) ────────────→ vulnerability database   │  │    │
│  │  │  • YARA-X (@litko/yara-x) ────→ malware signatures       │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  │                           ↓                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Custom Platform Analyzers (the moat)                    │  │    │
│  │  ├──────────────────────────────────────────────────────────┤  │    │
│  │  │  • OpenClaw ──→ skill permissions, config, ClawHub block │  │    │
│  │  │  • MCP ───────→ config creds, server topology, shadowing │  │    │
│  │  │  • Claude ────→ SKILL.md analysis, command parsing       │  │    │
│  │  │  • CrewAI ────→ agent definitions, task chains           │  │    │
│  │  │  • Cursor ────→ extension manifests, capabilities        │  │    │
│  │  │  • Codex ─────→ plugin config, permissions               │  │    │
│  │  │  • AutoGPT ───→ .env files, plugin manifests             │  │    │
│  │  │  • Nanobot ───→ skill config, tool definitions           │  │    │
│  │  │  • Supabase ──→ RLS policies, auth config, storage ACLs  │  │    │
│  │  │  • Discovery ─→ auto-detect installed frameworks         │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  │                           ↓                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Report Engine                                            │  │    │
│  │  ├──────────────────────────────────────────────────────────┤  │    │
│  │  │  • Terminal ──────→ fear UX with A-F grade                │  │    │
│  │  │  • JSON/SARIF ────→ CI/CD integration                     │  │    │
│  │  │  • HTML ──────────→ email-gated lead magnet + AI prompts │  │    │
│  │  │  • MITRE ATLAS ───→ taxonomy mapping                      │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  │                           ↓                                     │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Fix Engine                                               │  │    │
│  │  ├──────────────────────────────────────────────────────────┤  │    │
│  │  │  • Secret rotation ──→ move to env vars                   │  │    │
│  │  │  • Skill quarantine ─→ disable malicious skills           │  │    │
│  │  │  • Permission restrict → reduce capabilities              │  │    │
│  │  │  • Config hardening ─→ security best practices            │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  RUNTIME MONITOR (Python plugin for Lasso MCP Gateway, $19/mo)│    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                 │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Lasso MCP Gateway (handles MCP proxying, server lifecycle)│  │    │
│  │  └────────────────┬────────────────────────────────┬──────────┘  │    │
│  │                   ↓                                ↓              │    │
│  │  ┌────────────────────────────────┐  ┌─────────────────────────┐ │    │
│  │  │ Firmis Plugin (Python)         │  │ Invariant Guardrails    │ │    │
│  │  ├────────────────────────────────┤  │ (.gr policy rules)      │ │    │
│  │  │ • Known-malicious skill block  │  │ Apache 2.0 DSL          │ │    │
│  │  │ • Credential exfil detection   │←─┤ for policy enforcement  │ │    │
│  │  │ • Tool call policy enforcement │  └─────────────────────────┘ │    │
│  │  │ • Continuous re-scanning       │                              │    │
│  │  └────────────────────────────────┘                              │    │
│  │                   ↓                                               │    │
│  │  ┌──────────────────────────────────────────────────────────┐    │    │
│  │  │  Alert System (terminal, webhook, email)                 │    │    │
│  │  └──────────────────────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  SHARED THREAT INTELLIGENCE                                     │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  • YARA signatures (known-malicious.yar, credentials.yar)      │    │
│  │  • IOC database (skills, authors, C2 IPs, exfil endpoints)     │    │
│  │  • MITRE ATLAS technique mapping                               │    │
│  │  • Community reports (anonymous, opt-in telemetry)             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Integration Layer Design

Firmis doesn't reinvent detection. We integrate best-in-class tools and add agent-platform context.

### 2.1 Gitleaks Integration (Secrets Detection)

**What it does:** Detects 800+ secret patterns (API keys, tokens, credentials) in code.

**How it's invoked:**
```bash
gitleaks detect \
  --no-git \
  --source <file_path> \
  --report-format json \
  --report-path - \
  --exit-code 0
```

**What Firmis adds:**
- **Platform context:** "This AWS key is in your MCP config at line 47, which means all 5 MCP servers can access it"
- **Blast radius:** "This credential is used by 3 OpenClaw skills with shell:* permission"
- **Plain English:** Translate Gitleaks' `aws-access-token` to "AWS credential that can access your cloud infrastructure"
- **Remediation:** "Move to environment variable `AWS_ACCESS_KEY_ID`, update MCP config to use `${AWS_ACCESS_KEY_ID}`"

**Fallback behavior:**
If Gitleaks is not installed, use built-in credential rules (`credential-harvesting.yaml` - 30 patterns vs Gitleaks' 800).

**Integration module:**
```typescript
// src/integrations/gitleaks.ts
export async function scanWithGitleaks(filePath: string): Promise<Finding[]> {
  try {
    const result = await execFile('gitleaks', [
      'detect', '--no-git', '--source', filePath,
      '--report-format', 'json', '--report-path', '-', '--exit-code', '0'
    ])
    return parseGitleaksOutput(result.stdout)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('Gitleaks not found, using built-in credential rules')
      return [] // Fall back to YAML rules
    }
    throw error
  }
}
```

---

### 2.2 OSV API Integration (Vulnerability Database)

**What it does:** Checks npm/PyPI/Go packages against Google's Open Source Vulnerabilities database.

**How it's invoked:**
```typescript
// POST to https://api.osv.dev/v1/query
{
  "package": { "name": "lodash", "ecosystem": "npm" },
  "version": "4.17.19"
}
```

**What Firmis adds:**
- **Dependency extraction:** Parse `package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`
- **Blast radius:** "This vulnerable package is used by MCP server `github-tools` which has `repo:write` permission"
- **Severity scoring:** Map OSV CVSS to Firmis severity (critical/high/medium/low)
- **Fix guidance:** "Update to lodash@4.17.21 or higher"

**Fallback behavior:**
If OSV API is unreachable, use built-in supply-chain rules (typosquat detection only).

**Integration module:**
```typescript
// src/integrations/osv.ts
export async function checkDependencies(
  packageFile: string
): Promise<Vulnerability[]> {
  const deps = parseDependencies(packageFile) // package.json, etc.

  const results = await Promise.all(
    deps.map(dep =>
      fetch('https://api.osv.dev/v1/query', {
        method: 'POST',
        body: JSON.stringify({
          package: { name: dep.name, ecosystem: dep.ecosystem },
          version: dep.version
        })
      }).then(r => r.json())
    )
  )

  return results.filter(r => r.vulns && r.vulns.length > 0)
}
```

---

### 2.3 YARA-X Integration (Malware Signatures)

**What it does:** Matches files against YARA malware signatures (compiled rules).

**How it's invoked:**
```typescript
import { Scanner, compile } from '@litko/yara-x'

const rules = compile(`
rule CredentialExfiltration {
  strings:
    $aws = /.aws[/\\]credentials/
    $http = /https?:\/\/[^\s]+/
  condition:
    all of them
}
`)

const scanner = new Scanner(rules)
const matches = scanner.scan(fileBuffer)
```

**What Firmis adds:**
- **YAML-to-YARA compilation:** Convert `known-malicious.yaml` to `.yar` format at scanner startup
- **Platform context:** "This pattern matches a known credential harvester targeting Claude Skills"
- **Remediation:** "Quarantine skill, remove from skills directory, report to ClawHub"

**Fallback behavior:**
YARA-X is bundled as WASM (no external dependency). If compilation fails, use existing YAML string-matching engine.

**Integration module:**
```typescript
// src/integrations/yara.ts
export async function scanWithYara(filePath: string): Promise<Finding[]> {
  const yaraRules = compileYamlToYara('./rules/known-malicious.yaml')
  const scanner = new Scanner(yaraRules)
  const fileBuffer = await fs.readFile(filePath)

  const matches = scanner.scan(fileBuffer)
  return matches.map(m => ({
    ruleId: m.rule,
    description: getRuleDescription(m.rule),
    remediation: getRemediationGuidance(m.rule)
  }))
}
```

---

## 3. Runtime Architecture (Lasso Plugin)

Firmis Runtime Monitor is a **Python plugin for Lasso MCP Gateway**. Lasso handles all MCP proxying, server lifecycle, and tool routing. Firmis adds security checks in the middleware pipeline.

### 3.1 Architecture Diagram

```
┌──────────────┐
│  AI Agent    │  (Claude Desktop, VSCode, etc.)
└──────┬───────┘
       │ MCP Protocol (JSON-RPC)
       ↓
┌─────────────────────────────────────────────────────────────────┐
│  Lasso MCP Gateway (Python)                                     │
│  https://github.com/modelcontextprotocol/lasso                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request Pipeline:                                              │
│    AI Request                                                   │
│         ↓                                                       │
│    ┌─────────────────────┐                                     │
│    │ BasicPlugin         │ ← Token masking, logging            │
│    └─────────┬───────────┘                                     │
│              ↓                                                  │
│    ┌─────────────────────┐                                     │
│    │ PresidioPlugin      │ ← PII detection                     │
│    └─────────┬───────────┘                                     │
│              ↓                                                  │
│    ┌─────────────────────┐                                     │
│    │ FirmisPlugin        │ ← AGENT SECURITY (we build this)    │
│    │ ├──────────────────┤│                                     │
│    │ │ 1. YARA scan     ││ Check tool call against signatures  │
│    │ │ 2. IOC check     ││ Check destination against IOC DB    │
│    │ │ 3. Policy eval   ││ Evaluate .gr policy rules           │
│    │ │ 4. Cred scan     ││ Check for credential exposure       │
│    │ │ 5. Alert         ││ Log + webhook + email on violations │
│    │ └──────────────────┘│                                     │
│    └─────────┬───────────┘                                     │
│              ↓                                                  │
│    Forward to MCP Server                                       │
│         ↓                                                       │
│    ┌────────────────────────────────────────┐                  │
│    │ MCP Server (filesystem, github, etc.)  │                  │
│    └────────────────┬───────────────────────┘                  │
│                     ↓                                           │
│    Response Pipeline (reverse order):                          │
│         MCP Response                                            │
│              ↓                                                  │
│         FirmisPlugin ← Check response for cred leakage         │
│              ↓                                                  │
│         PresidioPlugin                                          │
│              ↓                                                  │
│         BasicPlugin                                             │
│              ↓                                                  │
│    Return to AI Agent                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Firmis Plugin Implementation

**Installation:**
```bash
pip install firmis-monitor
lasso plugin add firmis-monitor
```

**Configuration:**
```yaml
# ~/.lasso/config.yaml
plugins:
  - name: firmis-monitor
    enabled: true
    config:
      yara_rules: ~/.firmis/known-malicious.yar
      ioc_database: ~/.firmis/ioc.json
      policy_files:
        - ~/.firmis/policies/default.gr
      alerts:
        - type: terminal
        - type: webhook
          url: https://api.firmislabs.com/alerts
```

**Python plugin code:**
```python
# firmis_monitor/plugin.py
from lasso.plugin import Plugin, ToolCall, ToolResponse

class FirmisPlugin(Plugin):
    def __init__(self, config):
        self.yara_scanner = YaraScanner(config['yara_rules'])
        self.ioc_db = IOCDatabase(config['ioc_database'])
        self.policy_engine = InvariantPolicyEngine(config['policy_files'])
        self.alerter = Alerter(config['alerts'])

    async def on_tool_call(self, call: ToolCall) -> ToolCall:
        # 1. YARA scan
        if self.yara_scanner.match(call.to_json()):
            await self.alerter.alert('YARA match', call)
            raise SecurityViolation('Known malicious pattern detected')

        # 2. IOC check
        if self.ioc_db.is_malicious(call.tool_name):
            await self.alerter.alert('IOC match', call)
            raise SecurityViolation(f'Blocked malicious tool: {call.tool_name}')

        # 3. Policy evaluation
        violations = self.policy_engine.evaluate(call)
        if violations:
            await self.alerter.alert('Policy violation', violations)
            raise SecurityViolation(violations[0]['message'])

        # 4. Credential scan
        if self.contains_credentials(call.arguments):
            await self.alerter.alert('Credential exposure', call)
            # Don't block, but warn

        return call  # Allow if all checks pass

    async def on_tool_response(self, response: ToolResponse) -> ToolResponse:
        # Check response for credential leakage
        if self.contains_credentials(response.content):
            await self.alerter.alert('Credential in response', response)
            # Redact or warn

        return response
```

---

### 3.3 Invariant Policy Language Examples

Firmis uses Invariant's `.gr` policy language (Apache 2.0 DSL) for runtime enforcement.

**Example 1: Credential Exfiltration Prevention**
```
# ~/.firmis/policies/credential-exfil.gr

rule "Prevent credential exfiltration" {
  when:
    (call1: ToolCall) -> (call2: ToolCall)
    call1.tool_name in ["read_file", "execute_shell"]
    call2.tool_name in ["send_http", "fetch"]
    any(pattern in call1.content for pattern in [
      "AKIA",           # AWS access key
      "ghp_",           # GitHub PAT
      "sk-",            # OpenAI key
      "-----BEGIN",     # Private keys
    ])
  then:
    raise SecurityViolation("Credential exfiltration detected: read from sensitive source, sent to external URL")
    block call2
}
```

**Example 2: Known Malicious Skill Blocking**
```
# ~/.firmis/policies/blocklist.gr

const KNOWN_MALICIOUS_SKILLS = [
  "crypto-miner-skill",
  "data-stealer-mcp",
  "backdoor-agent"
]

rule "Block known malicious skills" {
  when:
    (call: ToolCall)
    call.skill_name in KNOWN_MALICIOUS_SKILLS
  then:
    raise SecurityViolation(f"Blocked known malicious skill: {call.skill_name}")
    block call
}
```

**Example 3: Permission Boundary Violation**
```
# ~/.firmis/policies/permission-boundary.gr

rule "Prevent shell execution to suspicious domains" {
  when:
    (call: ToolCall)
    call.tool_name == "execute_shell"
    call.arguments.command matches "curl.*webhook\\.site"
    or call.arguments.command matches "wget.*pastebin\\.com"
  then:
    raise SecurityViolation("Suspicious shell command: sending data to known exfiltration domain")
    block call
}
```

**Example 4: Continuous Re-scanning**
```
# ~/.firmis/policies/continuous-scan.gr

rule "Re-scan on new skill install" {
  when:
    (event: FileSystemEvent)
    event.type == "created"
    event.path matches ".*\\.openclaw/skills/.*"
  then:
    trigger_scan(event.path)
    if scan_result.threats > 0:
      quarantine(event.path)
      alert("New skill is malicious: {event.path}")
}
```

---

## 4. Defense-in-Depth Model

Firmis **complements** sandboxes (OpenClaw Docker, E2B, etc.), not replaces them. Here's how different security layers interact:

| Attack Vector | Sandbox Prevents? | Firmis Scanner Prevents? | Firmis Monitor Prevents? | Best Practice |
|---|---|---|---|---|
| **Malicious skill install** | No (can't scan before run) | ✅ Yes (pre-install scan) | N/A | Scan before adding to skills dir |
| **Config secrets exposure** | No | ✅ Yes (credential detection) | ✅ Yes (blocks in payloads) | Move to env vars, scan config files |
| **Permission misconfiguration** | Enforces what's configured | ✅ Yes (detects misconfiguration) | ✅ Yes (policy enforcement) | Use least-privilege, scan configs |
| **Network exfiltration** | Partially (if network restricted) | ✅ Yes (pattern detection) | ✅ Yes (runtime blocking) | Combine sandbox + monitor |
| **Prompt injection** | No (executes as instructed) | ✅ Yes (skill description scan) | ✅ Yes (real-time detection) | Scan skill docs + monitor at runtime |
| **Container escape** | ✅ Yes (if properly configured) | No | No | Use hardened containers (gVisor) |
| **Known malicious patterns** | No (doesn't know patterns) | ✅ Yes (YARA signatures) | ✅ Yes (runtime blocking) | Keep signatures updated |
| **Typosquatting** | No | ✅ Yes (supply chain scan) | No | Scan dependencies at install |
| **Code injection** | Partially (if read-only FS) | ✅ Yes (AST analysis) | ✅ Yes (policy rules) | Sandbox + scanner + monitor |
| **Privilege escalation** | ✅ Yes (if properly configured) | ✅ Yes (pattern detection) | ✅ Yes (blocks sudo/setuid) | Defense-in-depth |

**Key Insight:** Sandboxes are **reactive** (contain damage after execution). Firmis is **proactive** (prevent malicious code from ever running).

---

## 5. Competitive Landscape

| Feature | Firmis | Snyk agent-scan | mcp-scan | Lasso Gateway | Docker MCP Gateway | LlamaFirewall | AgentGateway |
|---------|--------|-----------------|----------|---------------|-------------------|---------------|--------------|
| **Target Market** | Prosumer/SMB devs | Enterprise | Hobbyist | Developers | Developers | Enterprise | Enterprise |
| **Pricing** | Free CLI + $19/mo monitor | $99+/mo | Free | Free | Free | Custom | Custom |
| **Language** | TypeScript + Python | Go | Python | Python | Go | Python | Go |
| **Static Scanning** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Runtime Monitoring** | ✅ Yes (Lasso plugin) | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Remediation** | ✅ Auto-fix | Manual | Manual | N/A | N/A | N/A | N/A |
| **Platform Support** | 9 (Claude, MCP, OpenClaw, CrewAI, Cursor, Codex, AutoGPT, Nanobot, Supabase) | Generic | MCP only | MCP only | MCP only | Generic | Generic |
| **YARA Integration** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Gitleaks Integration** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **OSV Integration** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Policy Language** | Invariant .gr | Rego (OPA) | N/A | Python code | Go code | Python code | Go code |
| **Open Source** | MIT (scanner) | Partial | MIT | Apache 2.0 | MIT | No | No |
| **Self-Hosted** | ✅ Yes | Enterprise only | ✅ Yes | ✅ Yes | ✅ Yes | Enterprise | Enterprise |
| **Ease of Setup** | 1 command (`npx firmis scan`) | Complex (agent deployment) | 1 command | Moderate (config) | Moderate (Docker) | Complex | Complex |

**Firmis Unique Value:**
1. Only solution with **static + runtime** for AI agents
2. Only scanner integrating **Gitleaks + OSV + YARA** with agent platform awareness
3. Only tool with **auto-remediation** (secret rotation, skill quarantine)
4. Only open-source scanner covering **9 AI agent platforms**
5. Cheapest runtime monitor ($19/mo vs $99+ for alternatives)

---

## 6. Data Flow Diagrams

### 6.1 Scan Flow

```
┌─────────────┐
│ User runs:  │
│ firmis scan │
└──────┬──────┘
       │
       ↓
┌────────────────────────────────────────┐
│ 1. Platform Discovery                  │
│    Detect: Claude, MCP, OpenClaw, etc. │
└──────┬─────────────────────────────────┘
       │
       ↓
┌────────────────────────────────────────┐
│ 2. File Collection                     │
│    Gather: skills, configs, manifests  │
└──────┬─────────────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ↓              ↓              ↓              ↓
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐
│ 3a. Gitleaks│ │ 3b. OSV  │ │ 3c. YARA │ │ 3d. Custom AST │
│    (secrets)│ │ (vulns)  │ │(malware) │ │   (platform)   │
└──────┬──────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘
       │            │            │                │
       └────────────┴────────────┴────────────────┘
                       │
                       ↓
       ┌───────────────────────────────────┐
       │ 4. Correlation & Enrichment       │
       │    Add platform context           │
       │    Calculate blast radius         │
       │    Map to MITRE ATLAS             │
       └───────────┬───────────────────────┘
                   │
       ┌───────────┴───────────┬───────────────┬───────────────┐
       ↓                       ↓               ↓               ↓
┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────┐
│ 5a. Terminal│   │ 5b. JSON     │   │ 5c. HTML    │   │ 5d. SARIF│
│    (fear UX)│   │   (CI/CD)    │   │ (lead gen)  │   │  (GitHub)│
└─────────────┘   └──────────────┘   └─────────────┘   └──────────┘
```

### 6.2 Report Generation Flow

```
┌────────────────────┐
│ Findings Array     │
│ (from scan engine) │
└─────────┬──────────┘
          │
          ↓
┌───────────────────────────────────────────────┐
│ Severity Classification                       │
│ critical (90-100) → red, grade F              │
│ high (70-89) → orange, grade C-D              │
│ medium (40-69) → yellow, grade B              │
│ low (0-39) → blue, grade A                    │
└─────────┬─────────────────────────────────────┘
          │
          ↓
┌───────────────────────────────────────────────┐
│ Platform Grouping                             │
│ Group findings by:                            │
│   - Platform (Claude, MCP, etc.)              │
│   - Component (skill, server, config)         │
│   - Category (credential, exfil, prompt inj)  │
└─────────┬─────────────────────────────────────┘
          │
          ↓
┌───────────────────────────────────────────────┐
│ Remediation Generation                        │
│ For each finding:                             │
│   - Platform-specific fix                     │
│   - AI prompt for auto-remediation            │
│   - Manual steps if auto-fix unavailable      │
└─────────┬─────────────────────────────────────┘
          │
          ├────────────┬────────────┬─────────────┐
          ↓            ↓            ↓             ↓
    ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
    │ Terminal │ │  JSON   │ │   HTML   │ │   SARIF    │
    │ Reporter │ │Reporter │ │ Reporter │ │  Reporter  │
    └──────────┘ └─────────┘ └──────────┘ └────────────┘
```

### 6.3 Fix Flow

```
┌──────────────────┐
│ User runs:       │
│ firmis fix --all │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│ 1. Load findings from previous scan      │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│ 2. Categorize by fix type                │
│    - secret_rotation                     │
│    - skill_quarantine                    │
│    - permission_restriction              │
│    - config_hardening                    │
└────────┬─────────────────────────────────┘
         │
         ├─────────────┬─────────────┬──────────────┐
         ↓             ↓             ↓              ↓
┌───────────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐
│ 3a. Extract   │ │ 3b. Move│ │ 3c. Edit │ │ 3d. Disable  │
│     secrets   │ │ to .env │ │  configs │ │   malicious  │
│               │ │         │ │          │ │    skills    │
└───────┬───────┘ └────┬────┘ └────┬─────┘ └──────┬───────┘
        │              │           │               │
        └──────────────┴───────────┴───────────────┘
                       │
                       ↓
       ┌───────────────────────────────────┐
       │ 4. Update config files            │
       │    MCP config → use env vars      │
       │    OpenClaw config → remove perms │
       └───────────┬───────────────────────┘
                   │
                   ↓
       ┌───────────────────────────────────┐
       │ 5. Create .env file (if needed)   │
       │    Add secrets with secure names  │
       └───────────┬───────────────────────┘
                   │
                   ↓
       ┌───────────────────────────────────┐
       │ 6. Re-scan to verify fixes        │
       │    Ensure threats are resolved    │
       └───────────┬───────────────────────┘
                   │
                   ↓
       ┌───────────────────────────────────┐
       │ 7. Report results                 │
       │    "Fixed 5 threats, 2 remaining" │
       └───────────────────────────────────┘
```

### 6.4 Runtime Monitor Flow

```
┌──────────────┐
│ AI Agent     │
│ sends tool   │
│ call request │
└──────┬───────┘
       │ MCP JSON-RPC
       ↓
┌────────────────────────────────────────┐
│ Lasso MCP Gateway                      │
│  ↓                                     │
│ FirmisPlugin.on_tool_call()            │
└────────┬───────────────────────────────┘
         │
         ├──────────┬──────────┬──────────┬──────────┐
         ↓          ↓          ↓          ↓          ↓
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │ YARA   │ │  IOC   │ │ Policy │ │  Cred  │ │  Log   │
    │ scan   │ │ check  │ │  eval  │ │ scan   │ │ event  │
    └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
         │          │          │          │          │
         └──────────┴──────────┴──────────┴──────────┘
                       │
            ┌──────────┴──────────┐
            ↓                     ↓
    ┌──────────────┐      ┌──────────────┐
    │ BLOCK        │      │ ALLOW        │
    │ Raise error  │      │ Forward to   │
    │ Send alert   │      │ MCP server   │
    └──────────────┘      └──────┬───────┘
                                 │
                                 ↓
                    ┌────────────────────────┐
                    │ MCP Server executes    │
                    │ Returns response       │
                    └────────┬───────────────┘
                             │
                             ↓
                    ┌────────────────────────┐
                    │ FirmisPlugin           │
                    │   .on_tool_response()  │
                    │ Check for cred leakage │
                    └────────┬───────────────┘
                             │
                             ↓
                    ┌────────────────────────┐
                    │ Return to AI Agent     │
                    └────────────────────────┘
```

### 6.5 Telemetry Flow (Privacy-Preserving)

```
┌────────────────┐
│ Scanner finishes│
└────────┬───────┘
         │
         ↓
┌────────────────────────────────────────┐
│ 1. Opt-in check                        │
│    If --telemetry=false, stop          │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ 2. Anonymization                       │
│    - Hash file paths (SHA256)          │
│    - Remove code snippets              │
│    - Strip usernames/machine names     │
│    - Aggregate counts only             │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ 3. Minimal payload creation            │
│    {                                   │
│      eventId: uuid(),                  │
│      scannerVersion: "1.1.0",          │
│      platforms: ["claude", "mcp"],     │
│      threatCounts: {                   │
│        credential: 2,                  │
│        exfiltration: 1                 │
│      }                                 │
│    }                                   │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ 4. Send to telemetry endpoint          │
│    POST https://telemetry.firmis.cloud │
│    (non-blocking, timeout 2s)          │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ 5. Cloud aggregation                   │
│    Store in ClickHouse                 │
│    Aggregate daily                     │
│    Feed threat intelligence            │
└────────────────────────────────────────┘
```

---

## 7. Open-Core Boundaries

Clear separation between what's free (MIT) and what's proprietary.

### What's MIT License (Free Forever)

| Component | Path | Description |
|-----------|------|-------------|
| **Scanner CLI** | `src/cli/` | All CLI commands (`scan`, `list`, `validate`, `fix`) |
| **Platform Analyzers** | `src/scanner/platforms/` | Claude, MCP, OpenClaw, CrewAI, Cursor, Codex, AutoGPT, Nanobot, Supabase |
| **Rule Engine** | `src/rules/` | YAML rule loading, pattern matching, confidence scoring |
| **Basic Rules** | `rules/*.yaml` | 75+ core rules (credential, exfil, prompt injection, etc.) |
| **AST Analyzers** | `src/scanner/ast/` | JavaScript/TypeScript AST analysis |
| **Terminal Reporter** | `src/reporters/terminal.ts` | Fear UX with A-F grade |
| **JSON Reporter** | `src/reporters/json.ts` | Machine-readable output |
| **SARIF Reporter** | `src/reporters/sarif.ts` | GitHub Code Scanning integration |
| **Programmatic API** | `src/index.ts` | Library usage (`ScanEngine`, `RuleEngine`) |
| **Gitleaks Integration** | `src/integrations/gitleaks.ts` | Subprocess wrapper (Gitleaks itself is separate) |
| **OSV Integration** | `src/integrations/osv.ts` | API client for vulnerability database |
| **YARA Integration** | `src/integrations/yara.ts` | WASM wrapper for @litko/yara-x |

### What's Proprietary (Firmis Cloud / Monitor)

| Component | Pricing | Description |
|-----------|---------|-------------|
| **Runtime Monitor Plugin** | $19/mo | Python plugin for Lasso MCP Gateway |
| **Policy Engine** | Included in Monitor | Invariant .gr rule evaluation at runtime |
| **HTML Reporter** | Email-gated | Lead magnet with AI fix prompts, send report to email |
| **Cloud Threat Intel** | Pro $29/mo | Real-time threat feed, IOC database, ML behavioral analysis |
| **Dashboard** | Team $99/mo | Web UI for scan history, team management, compliance reports |
| **Community Threat DB** | Pro $29/mo | Crowd-sourced anonymous threat reports |
| **Advanced Rules** | Pro $29/mo | 500+ additional detection rules (vs 75 in open source) |
| **Continuous Scanning** | Monitor $19/mo | File system watching, auto-scan on new skill install |
| **API Access** | Pro $29/mo | REST API for programmatic scanning |
| **SSO/SAML** | Enterprise | Single sign-on for teams |
| **On-Prem Deployment** | Enterprise | Self-hosted scanner + monitor + dashboard |
| **Priority Support** | Team $99/mo | Email + Slack support with SLA |

### Why This Split Works

1. **Open source is fully functional** - No artificial limitations, 75+ rules, all platforms supported
2. **Cloud is additive** - Adds threat intel, runtime blocking, team features
3. **Clear value prop** - Free = "scan my laptop", Paid = "protect my team in production"
4. **Community network effect** - More users → better threat intel → higher paid conversion

---

## 8. Technology Stack

### Scanner CLI

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Language** | TypeScript | 5.4+ | Type safety, developer experience |
| **Runtime** | Node.js | 20+ | Async I/O, npm ecosystem |
| **CLI Framework** | Commander | 12.1+ | Argument parsing, subcommands |
| **File Scanning** | fast-glob | 3.3+ | Recursive file discovery |
| **AST Parsing** | @babel/parser | 7.24+ | JavaScript/TypeScript AST |
| **SQL Parsing** | pgsql-parser | 17.9+ | Supabase RLS policy analysis |
| **YAML** | js-yaml | 4.1+ | Rule file parsing |
| **Terminal UI** | chalk + ora | 5.3 + 8.0 | Colored output, spinners |
| **Gitleaks** | Subprocess | 8.18+ | Secret detection (external binary) |
| **OSV** | REST API | v1 | Vulnerability database (api.osv.dev) |
| **YARA** | @litko/yara-x | Latest | Malware signatures (Rust WASM) |
| **Testing** | Vitest | 1.3+ | Unit + integration tests |

### Runtime Monitor

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Language** | Python | 3.11+ | Lasso plugin compatibility |
| **Gateway** | Lasso MCP Gateway | Latest | MCP proxying, server lifecycle |
| **Policy Engine** | Invariant Guardrails | Latest | .gr DSL for policy rules |
| **YARA** | yara-python | 4.5+ | Malware signature matching |
| **Database** | SQLite | 3.40+ | Local IOC database |
| **Async** | asyncio | Built-in | Non-blocking I/O for plugins |

### Cloud Infrastructure (Future)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | Supabase (Postgres + pgvector) | Threat signatures, user data |
| **API Gateway** | Cloudflare Workers | Rate limiting, authentication |
| **Analytics** | ClickHouse | Telemetry aggregation |
| **ML Inference** | Replicate / Modal | Behavioral analysis models |
| **File Storage** | Cloudflare R2 | YARA rule storage |
| **Monitoring** | Sentry | Error tracking |

---

## 9. File Structure

```
firmis-scanner/
├── src/
│   ├── cli/
│   │   ├── index.ts                    # CLI entry point
│   │   └── commands/
│   │       ├── scan.ts                 # firmis scan
│   │       ├── list.ts                 # firmis list
│   │       ├── validate.ts             # firmis validate
│   │       ├── fix.ts                  # firmis fix
│   │       └── feedback.ts             # firmis feedback (cloud)
│   ├── scanner/
│   │   ├── engine.ts                   # Main scan orchestrator
│   │   ├── platforms/
│   │   │   ├── claude.ts               # Claude Skills analyzer
│   │   │   ├── mcp.ts                  # MCP Servers analyzer
│   │   │   ├── openclaw.ts             # OpenClaw analyzer
│   │   │   ├── crewai.ts               # CrewAI analyzer
│   │   │   ├── cursor.ts               # Cursor extensions analyzer
│   │   │   ├── codex.ts                # Codex plugins analyzer
│   │   │   ├── autogpt.ts              # AutoGPT analyzer
│   │   │   ├── nanobot.ts              # Nanobot analyzer
│   │   │   ├── supabase.ts             # Supabase analyzer
│   │   │   └── discovery.ts            # Auto-detect platforms
│   │   ├── ast/
│   │   │   ├── javascript.ts           # JS/TS AST analysis
│   │   │   ├── python.ts               # Python AST (tree-sitter)
│   │   │   └── sql.ts                  # SQL AST (Supabase RLS)
│   │   └── correlation.ts              # Cross-file analysis
│   ├── rules/
│   │   ├── engine.ts                   # Rule matching engine
│   │   ├── patterns.ts                 # Pattern matching (regex, AST, etc.)
│   │   ├── confidence.ts               # Confidence scoring
│   │   └── loader.ts                   # YAML rule loader
│   ├── integrations/
│   │   ├── gitleaks.ts                 # Gitleaks subprocess wrapper
│   │   ├── osv.ts                      # OSV API client
│   │   └── yara.ts                     # YARA-X WASM wrapper
│   ├── reporters/
│   │   ├── terminal.ts                 # Fear UX terminal reporter
│   │   ├── json.ts                     # JSON reporter
│   │   ├── sarif.ts                    # SARIF reporter (GitHub)
│   │   ├── html.ts                     # HTML reporter (email-gated, proprietary)
│   │   └── mitre.ts                    # MITRE ATLAS mapping
│   ├── fixers/
│   │   ├── secrets.ts                  # Secret rotation
│   │   ├── quarantine.ts               # Skill quarantine
│   │   ├── permissions.ts              # Permission restriction
│   │   └── config.ts                   # Config hardening
│   ├── cloud/                          # (Future) Cloud integration
│   │   ├── connector.ts                # API client
│   │   ├── enrichment.ts               # Threat enrichment
│   │   ├── telemetry.ts                # Anonymous telemetry
│   │   └── license.ts                  # License validation
│   └── types/
│       ├── index.ts                    # Core types
│       ├── platform.ts                 # Platform-specific types
│       ├── rule.ts                     # Rule definition types
│       └── finding.ts                  # Scan result types
├── rules/                              # YAML rule files (open source)
│   ├── credential-harvesting.yaml
│   ├── data-exfiltration.yaml
│   ├── privilege-escalation.yaml
│   ├── prompt-injection.yaml
│   ├── suspicious-behavior.yaml
│   ├── supabase-rls.yaml
│   ├── supabase-auth.yaml
│   ├── supabase-keys.yaml
│   ├── supabase-storage.yaml
│   └── supabase-advanced.yaml
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/                       # Test skills/configs
├── docs/
│   ├── ARCHITECTURE.md                 # This document
│   ├── SCANNER-AUDIT-2026-02-16.md     # Security audit report
│   ├── API.md                          # Programmatic API docs
│   └── PLATFORMS.md                    # Platform-specific docs
├── firmis-monitor/                     # (Separate repo) Python plugin
│   ├── firmis_monitor/
│   │   ├── plugin.py                   # Lasso plugin implementation
│   │   ├── yara_scanner.py             # YARA matching
│   │   ├── ioc_database.py             # IOC lookup
│   │   ├── policy_engine.py            # Invariant .gr evaluator
│   │   └── alerter.py                  # Alert dispatcher
│   └── setup.py
├── package.json
├── tsconfig.json
└── README.md
```

---

## 10. Known Gaps & Roadmap

Based on the 2026-02-16 security audit, here are critical gaps and implementation priorities.

### P0: Critical (Must Fix Before v2.0 Release)

| Gap | Impact | Fix | ETA |
|-----|--------|-----|-----|
| **MCP config scanning missing** | Credentials in config files completely invisible | Add `mcp.json` itself as scannable file, create config-level credential rules | Sprint 1 |
| **Silent regex failures** | 18 prompt injection rules were broken for months | Log regex compilation failures, add `firmis validate` command | Sprint 1 |
| **False positive explosion** | 2,705 threats in Claude Skills (1,239 in documentation) | Context-aware matching (code vs docs vs comments), weight docs 0.3x | Sprint 1 |
| **Path argument ignored** | Can't scan arbitrary project directories | Make CLI `path` override platform auto-detection | Sprint 1 |
| **CrewAI detection broken** | Hardcoded to `process.cwd()` | Use provided path, support explicit platform override | Sprint 1 |

### P1: High (Next Sprint)

| Gap | Impact | Fix | ETA |
|-----|--------|-----|-----|
| **Python AST missing** | CrewAI, MCP Python servers get zero AST analysis | Add tree-sitter-python for credential/exfil detection | Sprint 2 |
| **path.join() not detected** | `path.join(os.homedir(), '.aws/credentials')` bypasses rules | Detect multi-argument path construction patterns | Sprint 2 |
| **Confidence model too strict** | Single-pattern matches rejected despite being valid | Three-tier model (suspicious/likely/confirmed) | Sprint 2 |
| **Supply chain gap** | No dependency scanning | Integrate OSV for package.json/pyproject.toml | Sprint 2 |

### P2: Medium (This Quarter)

| Gap | Impact | Fix | ETA |
|-----|--------|-----|-----|
| **Cross-file analysis missing** | Can't detect "read creds in A, exfil in B" | Data flow tracking across files | Sprint 3 |
| **CrewAI task analysis missing** | Natural language task descriptions not scanned | Add prompt injection rules for task fields | Sprint 3 |
| **No audit trail** | Scan results are mutable JSON, no integrity verification | Add signed output, checksum verification | Sprint 3 |
| **Go/Rust MCP servers** | Only JS/TS/Python AST support | Add tree-sitter parsers for Go/Rust | Q2 2026 |

### Feature Roadmap (Beyond v2.0)

**Q2 2026: Cloud Integration**
- [ ] Threat enrichment API (`/v1/threats/enrich`)
- [ ] Anonymous telemetry collection
- [ ] Real-time threat feed
- [ ] Community threat database
- [ ] HTML report email gateway (lead gen)

**Q3 2026: Runtime Monitor**
- [ ] Lasso plugin implementation
- [ ] YARA runtime scanning
- [ ] Invariant policy engine integration
- [ ] Continuous re-scanning on file changes
- [ ] Alert system (webhook, email, Slack)

**Q4 2026: ML Behavioral Analysis**
- [ ] Feature extraction (API usage, data flows, permissions)
- [ ] Behavioral classification model
- [ ] Similarity search (vector embeddings)
- [ ] Obfuscation detection

**2027: Enterprise Features**
- [ ] Team dashboard (web UI)
- [ ] Compliance reports (SOC2, ISO27001)
- [ ] SSO/SAML integration
- [ ] On-premises deployment option
- [ ] Custom rule development service

---

## 11. Success Metrics

### Open Source Health (6-month targets)

| Metric | Target | Measurement |
|--------|--------|-------------|
| GitHub stars | 500 | github.com/riteshkew/firmis-scanner |
| npm downloads | 1,000/month | npmjs.com/package/firmis-scanner |
| Contributors | 10 | Unique PR authors |
| Custom rules contributed | 25 | Community YAML rule PRs |
| Documentation completeness | 90% | All platforms documented |

### Detection Quality

| Metric | Target | Measurement |
|--------|--------|-------------|
| False positive rate | <2% | Manual review of scan results |
| True positive rate | >95% | Detection of known-malicious fixtures |
| Regex validation | 100% | All rules compile correctly |
| Platform coverage | 9 platforms | Claude, MCP, OpenClaw, CrewAI, Cursor, Codex, AutoGPT, Nanobot, Supabase |
| Rule count (open source) | 100+ | YAML rule files |

### Business Metrics (12-month targets)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Free tier signups | 5,000 | Email captures |
| Monitor subscriptions ($19/mo) | 100 | Stripe/Lemon Squeezy |
| Pro subscriptions ($29/mo) | 50 | Cloud API usage |
| Team subscriptions ($99/mo) | 10 | Multi-seat accounts |
| MRR | $5,000 | Monthly recurring revenue |

---

## 12. Security & Privacy

### Data Protection

| Concern | Mitigation |
|---------|-----------|
| **Secrets in telemetry** | Hash all patterns, never send code snippets or file paths |
| **User privacy** | Anonymous installation ID (rotates weekly), no IP logging |
| **API key theft** | Short expiry (90 days free, configurable paid), usage alerts |
| **YARA rule theft** | Signatures stored as hashes, actual patterns encrypted |
| **Supply chain attack** | Signed releases, SBOM, dependency scanning |

### Threat Model

| Threat | Impact | Mitigation |
|--------|--------|-----------|
| **Malicious rule submission** | Community contributes backdoored rules | Manual review before merge, code signing |
| **Scanner itself is malicious** | Users install compromised scanner | npm package signing, reproducible builds, audit logs |
| **False sense of security** | Users rely on scanner, miss threats | Clear disclaimers, grade-based UX (not pass/fail) |
| **Competitive scraping** | Competitors steal threat intel | Rate limits, behavioral detection, legal ToS |
| **Data breach of cloud** | Threat DB leaked | Encryption at rest, access logging, regular audits |

---

## 13. Appendix: Architecture Decision Records

### ADR-001: Why Integrate Gitleaks vs Build Our Own?

**Decision:** Integrate Gitleaks as subprocess instead of reimplementing secret detection.

**Rationale:**
- Gitleaks has 800+ patterns vs our 30
- Actively maintained by Gitleaks team
- Battle-tested across 100K+ repos
- We add value with platform context, not pattern matching

**Trade-offs:**
- External dependency (but graceful fallback to built-in rules)
- Subprocess overhead (~200ms per scan)

### ADR-002: Why TypeScript for Scanner CLI?

**Decision:** Use TypeScript/Node.js instead of Go/Rust.

**Rationale:**
- AI agent platforms are mostly JS/TS (MCP, OpenClaw, Claude Skills)
- Easier to parse package.json, skill configs
- @babel/parser for AST analysis already in JS ecosystem
- Faster iteration speed for platform-specific analyzers

**Trade-offs:**
- Slower than Go/Rust (acceptable for 1-2 second scans)
- Larger binary size (npx handles distribution)

### ADR-003: Why Python for Runtime Monitor?

**Decision:** Use Python plugin for Lasso instead of separate gateway.

**Rationale:**
- Lasso already solves MCP proxying, server lifecycle
- Don't reinvent the wheel - focus on security logic
- Python ecosystem has yara-python, tree-sitter bindings
- Easier integration with Invariant Guardrails (also Python)

**Trade-offs:**
- Depends on Lasso (but Lasso is Apache 2.0 and actively maintained)
- Python perf slower than Go (acceptable for plugin architecture)

### ADR-004: Why Open-Core vs Pure SaaS?

**Decision:** MIT scanner + proprietary cloud/monitor.

**Rationale:**
- Developer trust requires open source
- GitHub stars/npm downloads drive adoption
- Community contributions improve detection
- Cloud/monitor monetizes production usage

**Trade-offs:**
- Competitors can fork (mitigated by network effect moat)
- Harder to monetize hobbyists (acceptable, target SMBs)

### ADR-005: Why Invariant .gr vs Custom Policy Language?

**Decision:** Use Invariant's .gr DSL instead of building our own.

**Rationale:**
- Apache 2.0 license - can modify/extend
- Proven syntax for data flow rules
- Saves 2-3 months of language design
- Community familiarity (Invariant adoption growing)

**Trade-offs:**
- Dependency on Invariant project
- Less control over language evolution

---

## 14. Contact & Contribution

**Project:** https://github.com/riteshkew/firmis-scanner
**Website:** https://firmislabs.com
**Documentation:** https://docs.firmislabs.com
**Security Issues:** security@firmislabs.com (responsible disclosure)

**Contributing:**
1. Fork the repo
2. Create feature branch (`git checkout -b feature/new-rule`)
3. Add tests (`npm test`)
4. Submit PR with clear description
5. Sign CLA (Contributor License Agreement)

**License:** MIT (scanner), proprietary (cloud/monitor)

---

*Document Version: 2.0.0*
*Last Updated: 2026-02-16*
*Next Review: 2026-03-16*
