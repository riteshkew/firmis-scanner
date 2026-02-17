import type { RulePattern, ASTPattern, APICallPattern, YaraPattern, PatternMatch } from '../../types/index.js'
import type { ParseResult } from '@babel/parser'
import type * as t from '@babel/types'
import {
  matchRegex,
  matchStringLiteral,
  matchFileAccess,
} from './regex-matcher.js'
import { matchAPICall, matchAST, matchImport } from './ast-matcher.js'
import { matchNetwork } from './network-matcher.js'
import { matchYara } from './yara-matcher.js'

export { detectMatchContext, validateRegexPattern, matchRegex, matchStringLiteral, matchFileAccess, getLineAndColumn } from './regex-matcher.js'
export { matchAPICall, matchAST, matchImport } from './ast-matcher.js'
export { matchNetwork } from './network-matcher.js'
export { matchYara, validateYaraPattern } from './yara-matcher.js'

export async function matchPattern(
  pattern: RulePattern,
  content: string,
  ast: ParseResult<t.File> | null
): Promise<PatternMatch[]> {
  switch (pattern.type) {
    case 'regex':
      return matchRegex(pattern.pattern as string, content, pattern.description, pattern.weight)

    case 'string-literal':
      return matchStringLiteral(
        pattern.pattern as string,
        content,
        pattern.description,
        pattern.weight
      )

    case 'file-access':
      return matchFileAccess(
        pattern.pattern as string,
        content,
        pattern.description,
        pattern.weight
      )

    case 'api-call':
      if (!ast) return []
      return matchAPICall(
        pattern.pattern as APICallPattern,
        ast,
        pattern.description,
        pattern.weight
      )

    case 'ast':
      if (!ast) return []
      return matchAST(pattern.pattern as ASTPattern, ast, pattern.description, pattern.weight)

    case 'import':
      return matchImport(
        pattern.pattern as string,
        content,
        ast,
        pattern.description,
        pattern.weight
      )

    case 'network':
      return matchNetwork(
        pattern.pattern as string,
        content,
        ast,
        pattern.description,
        pattern.weight
      )

    case 'yara':
      return matchYara(
        pattern.pattern as YaraPattern,
        content,
        pattern.description,
        pattern.weight
      )

    default:
      return []
  }
}
