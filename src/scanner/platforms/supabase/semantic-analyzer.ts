import { readFile } from 'node:fs/promises'
import type { Threat, SeverityLevel, ThreatCategory } from '../../../types/index.js'
import { ASTSqlParser, shouldUseAST } from './ast-sql-parser.js'
import type { ParsedPolicy } from './ast-sql-parser.js'
import { parseTables, parsePolicies, parseBuckets } from './sql-parser.js'
import { parseAuthConfig } from './config-parser.js'

interface TableInfo {
  name: string
  schema: string
  rlsEnabled: boolean
  policies: PolicyInfo[]
  sourceFile: string
  sourceLine: number
}

interface PolicyInfo {
  name: string
  permissive: boolean
  operation: string
}

interface BucketInfo {
  name: string
  public: boolean
  hasPolicies: boolean
  sourceFile: string
  sourceLine: number
}

interface FunctionInfo {
  name: string
  schema: string
  securityDefiner: boolean
  searchPathSet: boolean
  sourceFile: string
  sourceLine: number
}

interface ViewInfo {
  name: string
  schema: string
  securityDefiner: boolean
  securityInvoker: boolean
  sourceFile: string
  sourceLine: number
}

interface ExtensionInfo {
  name: string
  schema?: string
  sourceFile: string
  sourceLine: number
}

interface SupabaseProjectModel {
  tables: Map<string, TableInfo>
  buckets: Map<string, BucketInfo>
  functions: FunctionInfo[]
  views: ViewInfo[]
  extensions: ExtensionInfo[]
  policiesWithoutTables: ParsedPolicy[]
  hasSmtp: boolean
  configFile?: string
}

/**
 * Performs semantic analysis on Supabase projects to detect security issues
 * that require correlating data across multiple SQL statements.
 *
 * Enhanced with AST-based parsing for accurate detection.
 */
export class SupabaseSemanticAnalyzer {
  private astParser = new ASTSqlParser()

  /**
   * Analyze SQL migration files and config to build a project model,
   * then detect security issues based on the model.
   */
  async analyze(
    sqlFiles: string[],
    configFile?: string
  ): Promise<Threat[]> {
    const model = await this.buildModel(sqlFiles, configFile)
    return this.detectIssues(model)
  }

  private async buildModel(
    sqlFiles: string[],
    configFile?: string
  ): Promise<SupabaseProjectModel> {
    const model: SupabaseProjectModel = {
      tables: new Map(),
      buckets: new Map(),
      functions: [],
      views: [],
      extensions: [],
      policiesWithoutTables: [],
      hasSmtp: false,
      configFile,
    }

    // Parse all SQL files
    for (const filePath of sqlFiles) {
      try {
        const content = await readFile(filePath, 'utf-8')
        await this.parseSQL(content, filePath, model)
      } catch {
        continue
      }
    }

    // Parse config file
    if (configFile) {
      try {
        const content = await readFile(configFile, 'utf-8')
        const authConfig = parseAuthConfig(content, configFile)
        if (authConfig?.smtpConfigured) {
          model.hasSmtp = true
        }
      } catch {
        // Config file not readable
      }
    }

    return model
  }

  private async parseSQL(content: string, filePath: string, model: SupabaseProjectModel): Promise<void> {
    // Try AST parsing for complex SQL, fall back to regex for simple cases
    if (shouldUseAST(content)) {
      try {
        const parsed = await this.astParser.parseAll(content, filePath)

        // Process tables
        for (const table of parsed.tables) {
          const key = `${table.schema}.${table.name}`
          const existing = model.tables.get(key)

          if (existing) {
            if (table.rlsEnabled) {
              existing.rlsEnabled = true
            }
          } else {
            model.tables.set(key, {
              name: table.name,
              schema: table.schema,
              rlsEnabled: table.rlsEnabled,
              policies: [],
              sourceFile: table.sourceFile,
              sourceLine: table.sourceLine,
            })
          }
        }

        // Process RLS enablements from AST
        for (const [key, _line] of parsed.rlsEnablements) {
          const table = model.tables.get(key)
          if (table) {
            table.rlsEnabled = true
          }
        }

        // Process policies
        for (const policy of parsed.policies) {
          const key = `public.${policy.table}`
          const table = model.tables.get(key)
          if (table) {
            table.policies.push({
              name: policy.name,
              permissive: policy.permissive,
              operation: policy.operation,
            })
          } else {
            // Policy without corresponding table (might be error or table in different file)
            model.policiesWithoutTables.push(policy)
          }
        }

        // Process buckets
        for (const bucket of parsed.buckets) {
          model.buckets.set(bucket.name, {
            name: bucket.name,
            public: bucket.public,
            hasPolicies: false,
            sourceFile: bucket.sourceFile,
            sourceLine: bucket.sourceLine,
          })
        }

        // Process functions
        model.functions.push(...parsed.functions)

        // Process views
        model.views.push(...parsed.views)

        // Process extensions
        model.extensions.push(...parsed.extensions)

        // Check for storage.objects policies
        const storageObjectsPolicies = content.match(/CREATE\s+POLICY[^;]+ON\s+storage\.objects/gi)
        if (storageObjectsPolicies) {
          for (const bucket of model.buckets.values()) {
            bucket.hasPolicies = true
          }
        }

        return
      } catch {
        // Fall through to regex parsing
      }
    }

    // Regex-based parsing (fallback)
    this.parseWithRegex(content, filePath, model)
  }

  private parseWithRegex(content: string, filePath: string, model: SupabaseProjectModel): void {
    // Parse tables
    const tables = parseTables(content, filePath)
    for (const table of tables) {
      const key = `${table.schema}.${table.name}`
      const existing = model.tables.get(key)

      if (existing) {
        if (table.rlsEnabled) {
          existing.rlsEnabled = true
        }
      } else {
        model.tables.set(key, {
          name: table.name,
          schema: table.schema,
          rlsEnabled: table.rlsEnabled,
          policies: [],
          sourceFile: table.sourceFile,
          sourceLine: table.sourceLine,
        })
      }
    }

    // Check for ALTER TABLE ... ENABLE ROW LEVEL SECURITY
    const rlsEnablePattern = /ALTER\s+TABLE\s+(?:(\w+)\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi
    let rlsMatch
    while ((rlsMatch = rlsEnablePattern.exec(content)) !== null) {
      const schema = rlsMatch[1] ?? 'public'
      const tableName = rlsMatch[2] ?? ''
      const key = `${schema}.${tableName}`
      const table = model.tables.get(key)
      if (table) {
        table.rlsEnabled = true
      }
    }

    // Parse policies and associate with tables
    const policies = parsePolicies(content, filePath)
    for (const policy of policies) {
      const key = `public.${policy.table}`
      const table = model.tables.get(key)
      if (table) {
        // Check if policy is permissive (default) or restrictive
        const policyRegex = new RegExp(
          `CREATE\\s+POLICY\\s+["']?${policy.name}["']?[^;]*AS\\s+(PERMISSIVE|RESTRICTIVE)`,
          'i'
        )
        const permMatch = content.match(policyRegex)
        const permissive = !permMatch || permMatch[1]?.toUpperCase() !== 'RESTRICTIVE'

        table.policies.push({
          name: policy.name,
          permissive,
          operation: policy.operation,
        })
      }
    }

    // Parse buckets
    const buckets = parseBuckets(content, filePath)
    for (const bucket of buckets) {
      model.buckets.set(bucket.name, {
        name: bucket.name,
        public: bucket.public,
        hasPolicies: false,
        sourceFile: bucket.sourceFile,
        sourceLine: bucket.sourceLine,
      })
    }

    // Check for storage.objects policies
    const storageObjectsPolicies = content.match(/CREATE\s+POLICY[^;]+ON\s+storage\.objects/gi)
    if (storageObjectsPolicies) {
      for (const bucket of model.buckets.values()) {
        bucket.hasPolicies = true
      }
    }

    // Parse SECURITY DEFINER functions
    const funcPattern = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:(\w+)\.)?(\w+)[^;]*(SECURITY\s+DEFINER)[^;]*(SET\s+search_path)?/gi
    let funcMatch
    while ((funcMatch = funcPattern.exec(content)) !== null) {
      const line = content.substring(0, funcMatch.index).split('\n').length
      model.functions.push({
        name: funcMatch[2] ?? 'unknown',
        schema: funcMatch[1] ?? 'public',
        securityDefiner: !!funcMatch[3],
        searchPathSet: !!funcMatch[4],
        sourceFile: filePath,
        sourceLine: line,
      })
    }

    // Parse SECURITY DEFINER views
    const viewPattern = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:(\w+)\.)?(\w+)[^;]*(security_definer\s*=\s*true|SECURITY\s+DEFINER)/gi
    let viewMatch
    while ((viewMatch = viewPattern.exec(content)) !== null) {
      const line = content.substring(0, viewMatch.index).split('\n').length
      model.views.push({
        name: viewMatch[2] ?? 'unknown',
        schema: viewMatch[1] ?? 'public',
        securityDefiner: true,
        securityInvoker: false,
        sourceFile: filePath,
        sourceLine: line,
      })
    }

    // Parse extensions
    const extPattern = /CREATE\s+EXTENSION(?:\s+IF\s+NOT\s+EXISTS)?\s+["']?(\w+)["']?(?:[^;]*SCHEMA\s+(\w+))?/gi
    let extMatch
    while ((extMatch = extPattern.exec(content)) !== null) {
      const line = content.substring(0, extMatch.index).split('\n').length
      model.extensions.push({
        name: extMatch[1] ?? 'unknown',
        schema: extMatch[2],
        sourceFile: filePath,
        sourceLine: line,
      })
    }
  }

  private detectIssues(model: SupabaseProjectModel): Threat[] {
    const threats: Threat[] = []
    let threatId = 0

    // ============================================
    // RLS Rules
    // ============================================

    // Detect tables without RLS (supa-rls-001)
    for (const table of model.tables.values()) {
      if (this.isSystemTable(table.name)) continue

      if (!table.rlsEnabled) {
        threats.push(this.createThreat({
          id: `semantic-rls-001-${++threatId}`,
          ruleId: 'supa-rls-001',
          category: 'access-control',
          severity: 'critical',
          message: `Table '${table.schema}.${table.name}' does not have Row Level Security enabled`,
          file: table.sourceFile,
          line: table.sourceLine,
          snippet: `CREATE TABLE ${table.name}`,
          remediation: `Enable Row Level Security on the table:\nALTER TABLE ${table.schema}.${table.name} ENABLE ROW LEVEL SECURITY;`,
        }))
      }
    }

    // Detect RLS without policies (supa-rls-002)
    for (const table of model.tables.values()) {
      if (this.isSystemTable(table.name)) continue

      if (table.rlsEnabled && table.policies.length === 0) {
        threats.push(this.createThreat({
          id: `semantic-rls-002-${++threatId}`,
          ruleId: 'supa-rls-002',
          category: 'access-control',
          severity: 'critical',
          message: `Table '${table.schema}.${table.name}' has RLS enabled but no policies defined`,
          file: table.sourceFile,
          line: table.sourceLine,
          snippet: `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY`,
          remediation: `Create policies for the table:\nCREATE POLICY "policy_name" ON ${table.schema}.${table.name}\nFOR SELECT USING (auth.uid() = user_id);`,
        }))
      }
    }

    // Detect multiple permissive policies (supa-rls-007) - Splinter rule
    // Threshold: 5+ permissive policies is suspicious
    // (4 is common: public read, owner read, owner insert, owner update)
    for (const table of model.tables.values()) {
      if (this.isSystemTable(table.name)) continue

      const permissivePolicies = table.policies.filter(p => p.permissive)
      if (permissivePolicies.length > 4) {
        threats.push(this.createThreat({
          id: `semantic-rls-007-${++threatId}`,
          ruleId: 'supa-rls-007',
          category: 'access-control',
          severity: 'medium',
          message: `Table '${table.schema}.${table.name}' has ${permissivePolicies.length} permissive policies - may unintentionally widen access`,
          file: table.sourceFile,
          line: table.sourceLine,
          snippet: `Policies: ${permissivePolicies.map(p => p.name).join(', ')}`,
          remediation: `Multiple PERMISSIVE policies are OR'd together. Consider using RESTRICTIVE policies:\nCREATE POLICY "restrict" ON ${table.name} AS RESTRICTIVE FOR ALL USING (condition);`,
        }))
      }
    }

    // ============================================
    // Storage Rules
    // ============================================

    // Detect buckets without policies (supa-storage-002)
    for (const bucket of model.buckets.values()) {
      if (!bucket.public && !bucket.hasPolicies) {
        threats.push(this.createThreat({
          id: `semantic-storage-002-${++threatId}`,
          ruleId: 'supa-storage-002',
          category: 'access-control',
          severity: 'medium',
          message: `Storage bucket '${bucket.name}' has no access policies defined`,
          file: bucket.sourceFile,
          line: bucket.sourceLine,
          snippet: `INSERT INTO storage.buckets ... '${bucket.name}'`,
          remediation: `Create storage policies:\nCREATE POLICY "read_policy" ON storage.objects FOR SELECT\nUSING (bucket_id = '${bucket.name}' AND auth.uid() IS NOT NULL);`,
        }))
      }
    }

    // ============================================
    // Function Rules (Splinter-based)
    // ============================================

    // Detect SECURITY DEFINER functions without search_path (supa-func-002)
    for (const func of model.functions) {
      if (func.securityDefiner && !func.searchPathSet) {
        threats.push(this.createThreat({
          id: `semantic-func-002-${++threatId}`,
          ruleId: 'supa-func-002',
          category: 'privilege-escalation',
          severity: 'high',
          message: `Function '${func.schema}.${func.name}' uses SECURITY DEFINER without fixed search_path`,
          file: func.sourceFile,
          line: func.sourceLine,
          snippet: `CREATE FUNCTION ${func.name} ... SECURITY DEFINER`,
          remediation: `Add SET search_path to prevent injection:\nCREATE FUNCTION ${func.name}() ... SECURITY DEFINER SET search_path = public, pg_temp AS ...`,
        }))
      }
    }

    // ============================================
    // View Rules (Splinter-based)
    // ============================================

    // Detect SECURITY DEFINER views (supa-view-001)
    for (const view of model.views) {
      if (view.securityDefiner && !view.securityInvoker) {
        threats.push(this.createThreat({
          id: `semantic-view-001-${++threatId}`,
          ruleId: 'supa-view-001',
          category: 'privilege-escalation',
          severity: 'high',
          message: `View '${view.schema}.${view.name}' uses SECURITY DEFINER, bypassing RLS`,
          file: view.sourceFile,
          line: view.sourceLine,
          snippet: `CREATE VIEW ${view.name} WITH (security_definer = true)`,
          remediation: `Use security_invoker instead:\nCREATE VIEW ${view.name} WITH (security_invoker = true) AS ...`,
        }))
      }
    }

    // ============================================
    // Extension Rules (Splinter-based)
    // ============================================

    // Detect extensions in public schema (supa-ext-001)
    for (const ext of model.extensions) {
      if (!ext.schema || ext.schema === 'public') {
        threats.push(this.createThreat({
          id: `semantic-ext-001-${++threatId}`,
          ruleId: 'supa-ext-001',
          category: 'insecure-config',
          severity: 'medium',
          message: `Extension '${ext.name}' installed in public schema may be exposed via API`,
          file: ext.sourceFile,
          line: ext.sourceLine,
          snippet: `CREATE EXTENSION ${ext.name}`,
          remediation: `Install extensions in a dedicated schema:\nCREATE EXTENSION "${ext.name}" SCHEMA extensions;`,
        }))
      }
    }

    // ============================================
    // Config Rules
    // ============================================

    // Detect missing SMTP (supa-auth-003)
    if (model.configFile && !model.hasSmtp) {
      threats.push(this.createThreat({
        id: `semantic-auth-003-${++threatId}`,
        ruleId: 'supa-auth-003',
        category: 'insecure-config',
        severity: 'low',
        message: 'No custom SMTP configured - using Supabase default limits email sending',
        file: model.configFile,
        line: 1,
        snippet: '[auth]',
        remediation: `Configure custom SMTP:\n[auth.smtp]\nhost = "smtp.sendgrid.net"\nport = 587`,
      }))
    }

    return threats
  }

  private isSystemTable(name: string): boolean {
    const systemTables = [
      'schema_migrations',
      'buckets',
      'objects',
      'migrations',
      '_migrations',
    ]
    const sqlKeywords = [
      'create', 'table', 'alter', 'drop', 'insert', 'update', 'delete',
      'select', 'from', 'where', 'and', 'or', 'not', 'null', 'if', 'exists',
    ]
    const lowerName = name.toLowerCase()
    return systemTables.includes(lowerName) || sqlKeywords.includes(lowerName)
  }

  private createThreat(params: {
    id: string
    ruleId: string
    category: ThreatCategory
    severity: SeverityLevel
    message: string
    file: string
    line: number
    snippet: string
    remediation: string
  }): Threat {
    return {
      id: params.id,
      ruleId: params.ruleId,
      category: params.category,
      severity: params.severity,
      message: params.message,
      evidence: [{
        type: 'pattern',
        description: params.message,
        snippet: params.snippet,
        line: params.line,
      }],
      location: {
        file: params.file,
        line: params.line,
        column: 0,
      },
      confidence: 95,
      confidenceTier: 'confirmed',
      remediation: params.remediation,
    }
  }
}
