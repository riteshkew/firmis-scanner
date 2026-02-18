# Supabase Security Scanner - Implementation Plan

> **For Claude:** Use subagent-driven-development to implement this plan task-by-task.

**Goal:** Add Supabase security scanning to Firmis Scanner (RLS, storage, keys, auth, functions)

**Architecture:** New `SupabaseAnalyzer` platform following existing `BasePlatformAnalyzer` pattern. SQL parsing via regex (no external deps). 15 new YAML rules across 4 files.

**Tech Stack:** TypeScript, fast-glob (existing), js-yaml (existing), no new dependencies

**Scope:** Detection only. Fix generation deferred to v1.2.

---

## Task 1: Add Supabase Types

**Files:**
- Modify: `src/types/config.ts` - Add 'supabase' to PlatformType
- Modify: `src/types/scan.ts` - Add new threat categories + update createEmptySummary
- Create: `src/types/supabase.ts` - Supabase-specific types
- Modify: `src/types/index.ts` - Export supabase types

### 1.1 Update PlatformType in config.ts
```typescript
export type PlatformType =
  | 'claude'
  | 'mcp'
  | 'codex'
  | 'cursor'
  | 'crewai'
  | 'autogpt'
  | 'openclaw'
  | 'nanobot'
  | 'langchain'
  | 'supabase'  // ADD THIS
  | 'custom'
```

### 1.2 Update ThreatCategory in scan.ts
```typescript
export type ThreatCategory =
  | 'credential-harvesting'
  | 'data-exfiltration'
  | 'prompt-injection'
  | 'privilege-escalation'
  | 'suspicious-behavior'
  | 'network-abuse'
  | 'file-system-abuse'
  | 'access-control'      // ADD THIS
  | 'insecure-config'     // ADD THIS
```

Also update `createEmptySummary()` byCategory object:
```typescript
byCategory: {
  'credential-harvesting': 0,
  'data-exfiltration': 0,
  'prompt-injection': 0,
  'privilege-escalation': 0,
  'suspicious-behavior': 0,
  'network-abuse': 0,
  'file-system-abuse': 0,
  'access-control': 0,      // ADD THIS
  'insecure-config': 0,     // ADD THIS
},
```

### 1.3 Create src/types/supabase.ts
```typescript
/**
 * Supabase-specific types for security scanning
 */

export interface SupabaseTable {
  name: string
  schema: string
  rlsEnabled: boolean
  policies: SupabasePolicy[]
  sourceFile: string
  sourceLine: number
}

export interface SupabasePolicy {
  name: string
  table: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  using?: string
  withCheck?: string
  sourceFile: string
  sourceLine: number
}

export interface SupabaseBucket {
  name: string
  public: boolean
  sourceFile: string
  sourceLine: number
}

export interface SupabaseAuthConfig {
  enableSignup: boolean
  enableConfirmations: boolean
  otpExpiry: number
  smtpConfigured: boolean
  sourceFile: string
}

export interface SupabaseProject {
  tables: SupabaseTable[]
  policies: SupabasePolicy[]
  buckets: SupabaseBucket[]
  authConfig?: SupabaseAuthConfig
  migrations: string[]
  configPath?: string
}
```

### 1.4 Update src/types/index.ts
Add export:
```typescript
export * from './supabase.js'
```

**Commit:** `feat(types): add supabase platform and security categories`

---

## Task 2: Create SupabaseAnalyzer Platform

**Files:**
- Create: `src/scanner/platforms/supabase/sql-parser.ts`
- Create: `src/scanner/platforms/supabase/config-parser.ts`
- Create: `src/scanner/platforms/supabase/index.ts`
- Modify: `src/scanner/platforms/index.ts` - Register analyzer

### 2.1 Create sql-parser.ts
```typescript
import type { SupabaseTable, SupabasePolicy, SupabaseBucket } from '../../../types/index.js'

const CREATE_TABLE_REGEX = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)/gi
const ENABLE_RLS_REGEX = /ALTER\s+TABLE\s+(?:(\w+)\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi
const CREATE_POLICY_REGEX = /CREATE\s+POLICY\s+"?([^"]+)"?\s+ON\s+(?:(\w+)\.)?(\w+)\s+(?:AS\s+\w+\s+)?(?:FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL))?\s*(?:TO\s+\w+\s+)?(?:USING\s*\(([^)]+(?:\([^)]*\)[^)]*)*)\))?(?:\s*WITH\s+CHECK\s*\(([^)]+(?:\([^)]*\)[^)]*)*)\))?/gi
const INSERT_BUCKET_REGEX = /INSERT\s+INTO\s+storage\.buckets[^;]*VALUES\s*\([^,]+,\s*'([^']+)'[^,]*,\s*(true|false)/gi
const SECURITY_DEFINER_REGEX = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:(\w+)\.)?(\w+)[^;]*SECURITY\s+DEFINER/gi

export function parseTables(content: string, filePath: string): SupabaseTable[] {
  const tables: SupabaseTable[] = []
  const rlsEnabled = new Set<string>()

  let match
  while ((match = ENABLE_RLS_REGEX.exec(content)) !== null) {
    const schema = match[1] || 'public'
    const table = match[2]
    rlsEnabled.add(`${schema}.${table}`)
  }

  CREATE_TABLE_REGEX.lastIndex = 0
  while ((match = CREATE_TABLE_REGEX.exec(content)) !== null) {
    const schema = match[1] || 'public'
    const name = match[2]
    const line = content.substring(0, match.index).split('\n').length

    tables.push({
      name,
      schema,
      rlsEnabled: rlsEnabled.has(`${schema}.${name}`),
      policies: [],
      sourceFile: filePath,
      sourceLine: line,
    })
  }

  return tables
}

export function parsePolicies(content: string, filePath: string): SupabasePolicy[] {
  const policies: SupabasePolicy[] = []

  let match
  while ((match = CREATE_POLICY_REGEX.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length

    policies.push({
      name: match[1],
      table: match[3],
      operation: (match[4] as SupabasePolicy['operation']) || 'ALL',
      using: match[5]?.trim(),
      withCheck: match[6]?.trim(),
      sourceFile: filePath,
      sourceLine: line,
    })
  }

  return policies
}

export function parseBuckets(content: string, filePath: string): SupabaseBucket[] {
  const buckets: SupabaseBucket[] = []

  let match
  while ((match = INSERT_BUCKET_REGEX.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length

    buckets.push({
      name: match[1],
      public: match[2] === 'true',
      sourceFile: filePath,
      sourceLine: line,
    })
  }

  return buckets
}

export function findSecurityDefinerFunctions(content: string, filePath: string): Array<{name: string, line: number}> {
  const functions: Array<{name: string, line: number}> = []

  let match
  while ((match = SECURITY_DEFINER_REGEX.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length
    functions.push({ name: match[2], line })
  }

  return functions
}
```

### 2.2 Create config-parser.ts
```typescript
import type { SupabaseAuthConfig } from '../../../types/index.js'

export function parseAuthConfig(content: string, filePath: string): SupabaseAuthConfig | null {
  try {
    const lines = content.split('\n')
    let inAuthSection = false
    let inSmtpSection = false

    const config: SupabaseAuthConfig = {
      enableSignup: true,
      enableConfirmations: true,
      otpExpiry: 3600,
      smtpConfigured: false,
      sourceFile: filePath,
    }

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed === '[auth]') {
        inAuthSection = true
        inSmtpSection = false
        continue
      }

      if (trimmed === '[auth.smtp]') {
        inSmtpSection = true
        continue
      }

      if (trimmed.startsWith('[') && trimmed !== '[auth]' && trimmed !== '[auth.smtp]') {
        inAuthSection = false
        inSmtpSection = false
        continue
      }

      if (inAuthSection && !inSmtpSection) {
        if (trimmed.startsWith('enable_signup')) {
          config.enableSignup = trimmed.includes('true')
        }
        if (trimmed.startsWith('enable_confirmations')) {
          config.enableConfirmations = trimmed.includes('true')
        }
        if (trimmed.startsWith('otp_exp')) {
          const match = trimmed.match(/otp_exp\s*=\s*(\d+)/)
          if (match) config.otpExpiry = parseInt(match[1], 10)
        }
      }

      if (inSmtpSection) {
        if (trimmed.startsWith('host') && trimmed.includes('=')) {
          const value = trimmed.split('=')[1]?.trim().replace(/"/g, '')
          if (value && value.length > 0) {
            config.smtpConfigured = true
          }
        }
      }
    }

    return config
  } catch {
    return null
  }
}
```

### 2.3 Create supabase/index.ts
```typescript
import { readFile } from 'node:fs/promises'
import fg from 'fast-glob'
import type {
  DiscoveredComponent,
  ComponentMetadata,
  DetectedPlatform,
} from '../../../types/index.js'
import { BasePlatformAnalyzer } from '../base.js'

export class SupabaseAnalyzer extends BasePlatformAnalyzer {
  readonly platformType = 'supabase' as const
  readonly name = 'Supabase'

  private readonly migrationPatterns = [
    'supabase/migrations/**/*.sql',
    'migrations/**/*.sql',
  ]

  private readonly configPatterns = [
    'supabase/config.toml',
    '.supabase/config.toml',
  ]

  private readonly envPatterns = ['.env', '.env.local', '.env.development']

  async detect(): Promise<DetectedPlatform[]> {
    const detected: DetectedPlatform[] = []

    if (await this.fileExists('supabase')) {
      const migrations = await fg(this.migrationPatterns, {
        cwd: process.cwd(),
        absolute: true
      })

      detected.push({
        type: this.platformType,
        name: this.name,
        basePath: process.cwd(),
        componentCount: migrations.length,
      })
      return detected
    }

    for (const envFile of this.envPatterns) {
      if (await this.fileExists(envFile)) {
        try {
          const content = await readFile(envFile, 'utf-8')
          if (content.includes('SUPABASE_URL') || content.includes('SUPABASE_ANON_KEY')) {
            detected.push({
              type: this.platformType,
              name: this.name,
              basePath: process.cwd(),
              componentCount: 1,
            })
            return detected
          }
        } catch {
          continue
        }
      }
    }

    return detected
  }

  async discover(basePath: string): Promise<DiscoveredComponent[]> {
    const components: DiscoveredComponent[] = []

    const migrations = await fg(this.migrationPatterns, {
      cwd: basePath,
      absolute: true,
    })

    const configFiles = await fg(this.configPatterns, {
      cwd: basePath,
      absolute: true,
    })

    if (migrations.length > 0 || configFiles.length > 0) {
      components.push({
        id: await this.generateId('supabase-project', basePath),
        name: 'supabase-project',
        path: basePath,
        type: 'plugin',
        configPath: configFiles[0],
      })
    }

    return components
  }

  async analyze(component: DiscoveredComponent): Promise<string[]> {
    const files: string[] = []

    const migrations = await fg(this.migrationPatterns, {
      cwd: component.path,
      absolute: true,
    })
    files.push(...migrations)

    const configs = await fg(this.configPatterns, {
      cwd: component.path,
      absolute: true,
    })
    files.push(...configs)

    const envFiles = await fg(this.envPatterns, {
      cwd: component.path,
      absolute: true,
    })
    files.push(...envFiles)

    const sourceFiles = await fg([
      'src/**/*.{ts,tsx,js,jsx}',
      'app/**/*.{ts,tsx,js,jsx}',
      'lib/**/*.{ts,tsx,js,jsx}',
    ], {
      cwd: component.path,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    })
    files.push(...sourceFiles)

    return files
  }

  async getMetadata(component: DiscoveredComponent): Promise<ComponentMetadata> {
    const migrations = await fg(this.migrationPatterns, {
      cwd: component.path,
      absolute: true,
    })

    return {
      description: `Supabase project with ${migrations.length} migrations`,
    }
  }
}

export { parseTables, parsePolicies, parseBuckets } from './sql-parser.js'
export { parseAuthConfig } from './config-parser.js'
```

### 2.4 Update platforms/index.ts
Add import:
```typescript
import { SupabaseAnalyzer } from './supabase/index.js'
```

Add to PLATFORM_ANALYZERS:
```typescript
supabase: SupabaseAnalyzer,
```

Add export:
```typescript
export { SupabaseAnalyzer } from './supabase/index.js'
```

**Commit:** `feat(supabase): add SupabaseAnalyzer platform`

---

## Task 3: Create RLS Rules (6 rules)

**File:** `rules/supabase-rls.yaml`

See `/Users/riteshkewlani/.claude/projects/-Users-riteshkewlani-github-Projects-ai-team/memory/supabase-scanner-context.md` for full YAML content.

**Commit:** `feat(rules): add supabase RLS rules`

---

## Task 4: Create Storage & Key Rules (5 rules)

**Files:**
- `rules/supabase-storage.yaml`
- `rules/supabase-keys.yaml`

**Commit:** `feat(rules): add supabase storage and key rules`

---

## Task 5: Create Auth Rules (4 rules)

**File:** `rules/supabase-auth.yaml`

**Commit:** `feat(rules): add supabase auth rules`

---

## Task 6: Update README and Package

### README Addition
Add under "## Supported Platforms":
```markdown
### Supabase Security

Firmis detects Supabase projects and scans for:

- **Row Level Security**: Tables without RLS, missing policies, permissive policies
- **Storage Buckets**: Public buckets, missing policies
- **API Keys**: Service role exposure, .env in git, hardcoded credentials
- **Auth Config**: Email confirmation, OTP expiry, SMTP setup
- **Functions**: SECURITY DEFINER without auth checks
```

### Package.json
Bump version: `"version": "1.1.0"`

**Commit:** `docs: add supabase to README, bump to 1.1.0`

---

## Task 7: Write Tests

Create `test/unit/scanner/supabase.test.ts` with tests for:
- SQL parser table extraction
- SQL parser policy extraction
- Config parser auth settings
- SupabaseAnalyzer detection

**Commit:** `test: add supabase scanner tests`

---

## Task 8: Update Landing Page & Release

1. Add Supabase to platform list on firmislabs.com
2. Run `npm publish`
3. Create GitHub release
4. Tweet announcement

**Commit:** N/A (deployment)

---

## Milestones

| Milestone | Tasks | Target |
|-----------|-------|--------|
| **M1: Core** | 1, 2 | Day 1-2 |
| **M2: Rules** | 3, 4, 5 | Day 3-4 |
| **M3: Polish** | 6, 7 | Day 5 |
| **M4: Release** | 8, publish | Day 6 |

---

## Agent Assignments

| Task | Agent | Notes |
|------|-------|-------|
| 1-2 | implementer-agent | Core TypeScript |
| 3-5 | implementer-agent | YAML rules |
| 6-7 | QA-agent | Docs + tests |
| 8 | implementer-agent | Landing page |
