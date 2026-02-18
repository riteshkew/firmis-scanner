<p align="center">
  <img src="https://firmislabs.com/logo.svg" width="80" alt="Firmis Logo">
</p>

<h1 align="center">Firmis Scanner</h1>

<p align="center">
  <strong>Open-source AI agent runtime security scanner</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/firmis-scanner"><img src="https://img.shields.io/npm/v/firmis-scanner.svg" alt="npm version"></a>
  <a href="https://github.com/riteshkew/firmis-scanner/actions"><img src="https://github.com/riteshkew/firmis-scanner/workflows/CI/badge.svg" alt="CI Status"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <a href="https://firmislabs.com"><img src="https://img.shields.io/badge/Firmis-Labs-violet" alt="Firmis Labs"></a>
</p>

<p align="center">
  Detect malicious behavior in Claude Skills, MCP Servers, OpenClaw Skills, Nanobot Agents, Supabase projects, and other AI agent frameworks before they compromise your system.
</p>

---

## The Problem

**7.1% of AI agent skills exhibit malicious behavior.** Our research found 341 malicious skills in a sample of 100 random installs, including:

- **Credential harvesting** (AWS keys, SSH keys, API tokens)
- **Data exfiltration** (sending files to external servers)
- **Prompt injection** (manipulating AI behavior)
- **Privilege escalation** (sudo, process injection)

Static analysis catches only ~30% of these threats. The rest manifest at runtime.

## Quick Start

```bash
# Install globally
npm install -g firmis-scanner

# Scan all detected AI platforms
firmis scan

# Scan specific platform
firmis scan --platform claude

# Output as JSON for CI/CD
firmis scan --json --output report.json

# Output as SARIF for GitHub Security
firmis scan --sarif --output results.sarif
```

## Supported Platforms

| Platform | Config Location | Support |
|----------|-----------------|---------|
| **Claude Code Skills** | `~/.claude/skills/` | Full |
| **MCP Servers** | `~/.config/mcp/`, `claude_desktop_config.json` | Full |
| **OpenAI Codex Plugins** | `~/.codex/plugins/` | Full |
| **Cursor Extensions** | `~/.cursor/extensions/` | Full |
| **CrewAI Agents** | Project `crew.yaml`, `agents.yaml` | Full |
| **AutoGPT Plugins** | `~/.autogpt/plugins/` | Full |
| **OpenClaw Skills** | `~/.openclaw/skills/`, workspace `skills/` | Full |
| **Nanobot Agents** | `nanobot.yaml`, `agents/*.md` | Full |
| **Supabase** | `supabase/migrations/`, `config.toml` | Full |

### Supabase Security

Firmis auto-detects Supabase projects and scans for:

- **Row Level Security**: Tables without RLS, missing policies, overly permissive `USING (true)` clauses
- **Storage Buckets**: Public buckets, buckets without access policies
- **API Keys**: `service_role` key in client code, `.env` files in git, hardcoded credentials
- **Auth Config**: Email confirmation disabled, OTP expiry too long, missing SMTP
- **Functions**: `SECURITY DEFINER` functions that bypass RLS

```bash
# Scan Supabase project
firmis scan --platform supabase

# Example output
  Firmis Scanner v1.1.0

  Detecting platforms...
  ✓ Supabase: 8 migrations found

  THREAT DETECTED
     Platform: Supabase
     Component: supabase-project
     Risk: CRITICAL
     Category: access-control

     Evidence:
       - Table 'profiles' has RLS disabled
       - Policy 'allow_all' uses USING (true)

     Location: supabase/migrations/001_profiles.sql:12
```

## Example Output

```
  Firmis Scanner v1.0.0

  Detecting platforms...
  ✓ Claude Skills: 47 skills found
  ✓ MCP Servers: 12 servers configured

  Scanning 59 total components...

  ⚠️  THREAT DETECTED
     Platform: Claude Skills
     Component: data-exporter-v2
     Risk: HIGH
     Category: credential-harvesting

     Evidence:
       - Reads ~/.aws/credentials
       - Sends to: api.suspicious-domain.com

     Location: skills/data-exporter-v2/index.js:47

  SCAN COMPLETE
    57 components passed
    2 threats detected (1 HIGH, 1 MEDIUM)
```

## CLI Reference

### `firmis scan [path]`

Scan for security threats.

```bash
Options:
  -p, --platform <name>   Scan specific platform (claude|mcp|codex|cursor|crewai|autogpt|openclaw|nanobot|supabase)
  -a, --all               Scan all detected platforms (default)
  -j, --json              Output as JSON
  --sarif                 Output as SARIF (GitHub Security)
  --html                  Output as HTML report
  -s, --severity <level>  Minimum severity to report (low|medium|high|critical)
  -o, --output <file>     Write report to file
  -v, --verbose           Verbose output
  --concurrency <n>       Number of parallel workers (default: 4)
```

### `firmis list`

List detected AI platforms.

```bash
Options:
  -j, --json              Output as JSON
```

### `firmis validate <rules...>`

Validate custom rule files.

```bash
Options:
  --strict                Enable strict validation
```

## Threat Categories

| Category | Severity | Description |
|----------|----------|-------------|
| **credential-harvesting** | HIGH-CRITICAL | Access to AWS, SSH, GCP, or other credentials |
| **data-exfiltration** | HIGH | Sending data to external servers |
| **prompt-injection** | MEDIUM-HIGH | Attempting to manipulate AI behavior |
| **privilege-escalation** | HIGH-CRITICAL | sudo, setuid, kernel modules |
| **suspicious-behavior** | LOW-MEDIUM | Obfuscation, anti-debugging, persistence |
| **access-control** | HIGH-CRITICAL | RLS misconfigurations, missing policies |
| **insecure-config** | MEDIUM-HIGH | Auth settings, OTP expiry, SMTP config |

## CI/CD Integration

### GitHub Actions

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Firmis Scanner
        run: npm install -g firmis-scanner

      - name: Run Security Scan
        run: firmis scan --sarif --output results.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

firmis scan --severity high
if [ $? -ne 0 ]; then
  echo "Security threats detected. Commit blocked."
  exit 1
fi
```

## Custom Rules

Create custom YAML rules for organization-specific threats:

```yaml
# my-rules/internal-api.yaml
rules:
  - id: internal-001
    name: Internal API Key Exposure
    description: Detects hardcoded internal API keys
    category: credential-harvesting
    severity: critical
    version: "1.0.0"
    enabled: true
    confidenceThreshold: 90

    patterns:
      - type: regex
        pattern: "INTERNAL_[A-Z]+_KEY"
        weight: 100
        description: Internal API key pattern

    remediation: |
      Use environment variables or a secrets manager.
```

Run with custom rules:

```bash
firmis scan --config firmis.config.yaml
```

```yaml
# firmis.config.yaml
customRules:
  - ./my-rules/
severity: medium
```

## Programmatic API

```typescript
import { ScanEngine, RuleEngine } from 'firmis-scanner'

const ruleEngine = new RuleEngine()
await ruleEngine.load()

const scanEngine = new ScanEngine(ruleEngine)
const result = await scanEngine.scan('./my-skills', {
  platforms: ['claude'],
  severity: 'medium',
})

console.log(`Found ${result.summary.threatsFound} threats`)
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Clone the repository
git clone https://github.com/riteshkew/firmis-scanner.git
cd firmis-scanner

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run locally
npm run firmis -- scan
```

## Performance

| Metric | Target | Actual |
|--------|--------|--------|
| 50 skills scan | < 30s | ~15s |
| Memory usage | < 256MB | ~120MB |
| False positive rate | < 5% | ~3% |

## Security

Found a security vulnerability? Please report it privately to security@firmislabs.com.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built by <a href="https://firmislabs.com">Firmis Labs</a> · Security veterans protecting Fortune 500 enterprises since 2018
</p>
