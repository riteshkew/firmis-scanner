import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'

export interface IgnoreRule {
  ruleId?: string
  filePattern?: string
}

export class FirmisIgnore {
  private rules: IgnoreRule[] = []

  constructor(rules: IgnoreRule[] = []) {
    this.rules = rules
  }

  static async load(basePath?: string): Promise<FirmisIgnore> {
    const rules: IgnoreRule[] = []

    // Check multiple locations (in priority order)
    const paths = [
      basePath ? join(basePath, '.firmisignore') : null,
      join(process.cwd(), '.firmisignore'),
      join(homedir(), '.firmis', '.firmisignore'),
    ].filter((p): p is string => p !== null)

    for (const filePath of paths) {
      try {
        const content = await readFile(filePath, 'utf-8')
        rules.push(...parseIgnoreFile(content))
      } catch {
        // File doesn't exist, skip
      }
    }

    return new FirmisIgnore(rules)
  }

  shouldIgnore(ruleId: string, filePath: string): boolean {
    for (const rule of this.rules) {
      // Rule ID + file pattern combo
      if (rule.ruleId && rule.filePattern) {
        if (ruleId === rule.ruleId && matchGlob(rule.filePattern, filePath)) {
          return true
        }
        continue
      }

      // Rule ID only
      if (rule.ruleId && !rule.filePattern) {
        if (ruleId === rule.ruleId) return true
        continue
      }

      // File pattern only
      if (rule.filePattern && !rule.ruleId) {
        if (matchGlob(rule.filePattern, filePath)) return true
      }
    }

    return false
  }

  get ruleCount(): number {
    return this.rules.length
  }
}

export function parseIgnoreFile(content: string): IgnoreRule[] {
  const rules: IgnoreRule[] = []

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) continue

    // Check for rule:pattern combo
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0 && !line.startsWith('*') && !line.startsWith('/')) {
      const ruleId = line.slice(0, colonIndex).trim()
      const filePattern = line.slice(colonIndex + 1).trim()
      if (ruleId && filePattern) {
        rules.push({ ruleId, filePattern })
        continue
      }
    }

    // Check if it looks like a file pattern (contains / or * or .)
    if (line.includes('/') || line.includes('*') || line.startsWith('.')) {
      rules.push({ filePattern: line })
    } else {
      // Treat as rule ID
      rules.push({ ruleId: line })
    }
  }

  return rules
}

export function matchGlob(pattern: string, filePath: string): boolean {
  // Process glob patterns in the right order
  let regexStr = pattern
    .replace(/\*\*\//g, '\x00GLOBSTAR_SLASH\x00')  // **/ placeholder
    .replace(/\/\*\*/g, '\x00SLASH_GLOBSTAR\x00')  // /** placeholder
    .replace(/\*\*/g, '\x00GLOBSTAR\x00')          // ** placeholder
    .replace(/\*/g, '\x00STAR\x00')                // * placeholder
    .replace(/\?/g, '\x00QUESTION\x00')            // ? placeholder
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')          // Escape regex special chars
    .replace(/\x00GLOBSTAR_SLASH\x00/g, '(.*/)?' ) // **/ = zero or more path segments
    .replace(/\x00SLASH_GLOBSTAR\x00/g, '(/.*)?')  // /** = zero or more path segments at end
    .replace(/\x00GLOBSTAR\x00/g, '.*')            // ** = anything
    .replace(/\x00STAR\x00/g, '[^/]*')             // * = anything except /
    .replace(/\x00QUESTION\x00/g, '[^/]')          // ? = single char except /

  // Handle different pattern types
  if (pattern.startsWith('/')) {
    // Absolute path - must match from start
    regexStr = '^' + regexStr + '$'
  } else if (pattern.startsWith('**/')) {
    // Pattern like **/docs/** - can match at any depth
    regexStr = '^' + regexStr
  } else if (pattern.includes('/') || pattern.startsWith('*')) {
    // Pattern like docs/** or *.md - match anywhere in path
    regexStr = '(^|/)' + regexStr
  } else {
    // Simple pattern like README.md - match anywhere in path
    regexStr = '(^|/)' + regexStr + '$'
  }

  try {
    const regex = new RegExp(regexStr)
    return regex.test(filePath)
  } catch {
    return false
  }
}
