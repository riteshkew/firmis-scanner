import { readFile, readdir } from 'fs/promises'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { load as yamlLoad } from 'js-yaml'
import type { Rule, RuleFile } from '../types/index.js'
import { RuleError } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BUILT_IN_RULES_DIR = resolve(__dirname, '../../rules')

export async function loadRules(customPath?: string): Promise<Rule[]> {
  const rulePath = customPath || BUILT_IN_RULES_DIR
  const rules: Rule[] = []

  try {
    const entries = await readdir(rulePath, { withFileTypes: true })
    const yamlFiles = entries
      .filter((entry) => entry.isFile() && /\.(yaml|yml)$/i.test(entry.name))
      .map((entry) => entry.name)

    for (const file of yamlFiles) {
      const filePath = join(rulePath, file)
      try {
        const fileRules = await loadRuleFile(filePath)
        rules.push(...fileRules)
      } catch (error) {
        throw new RuleError(
          `Failed to load rule file ${file}: ${error instanceof Error ? error.message : String(error)}`,
          'unknown'
        )
      }
    }

    return rules
  } catch (error) {
    if (customPath) {
      throw new RuleError(
        `Failed to read rules from ${rulePath}: ${error instanceof Error ? error.message : String(error)}`,
        'unknown'
      )
    }
    return []
  }
}

async function loadRuleFile(filePath: string): Promise<Rule[]> {
  const content = await readFile(filePath, 'utf-8')
  const parsed = yamlLoad(content) as RuleFile

  if (!parsed || !parsed.rules || !Array.isArray(parsed.rules)) {
    throw new RuleError(`Invalid rule file format: missing 'rules' array`, 'unknown')
  }

  return parsed.rules.map((rule, index) => validateRule(rule, filePath, index))
}

function validateRule(rule: Rule, filePath: string, index: number): Rule {
  const requiredFields = ['id', 'name', 'description', 'category', 'severity', 'patterns']

  for (const field of requiredFields) {
    if (!(field in rule)) {
      throw new RuleError(
        `Rule at index ${index} in ${filePath} is missing required field: ${field}`,
        rule.id || 'unknown'
      )
    }
  }

  if (!Array.isArray(rule.patterns) || rule.patterns.length === 0) {
    throw new RuleError(`Rule ${rule.id} must have at least one pattern`, rule.id)
  }

  for (const pattern of rule.patterns) {
    if (!pattern.type || !pattern.pattern || typeof pattern.weight !== 'number') {
      throw new RuleError(
        `Invalid pattern in rule ${rule.id}: must have type, pattern, and weight`,
        rule.id
      )
    }

    if (pattern.weight < 0 || pattern.weight > 100) {
      throw new RuleError(
        `Pattern weight in rule ${rule.id} must be between 0 and 100`,
        rule.id
      )
    }
  }

  return {
    ...rule,
    enabled: rule.enabled ?? true,
    confidenceThreshold: rule.confidenceThreshold ?? 50,
    version: rule.version || '1.0.0',
  }
}

export async function validateCustomRules(customPaths: string[]): Promise<{
  valid: string[]
  invalid: Array<{ path: string; error: string }>
}> {
  const valid: string[] = []
  const invalid: Array<{ path: string; error: string }> = []

  for (const path of customPaths) {
    try {
      await loadRules(path)
      valid.push(path)
    } catch (error) {
      invalid.push({
        path,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { valid, invalid }
}
