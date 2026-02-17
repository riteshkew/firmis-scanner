import type { ASTPattern, APICallPattern, PatternMatch } from '../../types/index.js'
import type { ParseResult } from '@babel/parser'
import traverse, { type NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { matchRegex } from './regex-matcher.js'

export function matchAPICall(
  pattern: APICallPattern,
  ast: ParseResult<t.File>,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  try {
    traverse(ast, {
      CallExpression(path: NodePath<t.CallExpression>) {
        const callee = path.node.callee

        if (callee.type === 'MemberExpression') {
          const objectNode = callee.object
          const propertyNode = callee.property

          const objectMatches =
            !pattern.object ||
            (objectNode.type === 'Identifier' && objectNode.name === pattern.object)

          const methodMatches =
            (propertyNode.type === 'Identifier' && propertyNode.name === pattern.method) ||
            (callee.computed === false &&
              'name' in propertyNode &&
              propertyNode.name === pattern.method)

          if (objectMatches && methodMatches) {
            if (!checkArgumentsMatch(pattern, path.node.arguments)) return

            matches.push({
              patternType: 'api-call',
              description,
              line: path.node.loc?.start.line || 0,
              column: path.node.loc?.start.column || 0,
              endLine: path.node.loc?.end.line,
              endColumn: path.node.loc?.end.column,
              weight,
            })
          }
        } else if (callee.type === 'Identifier' && callee.name === pattern.method) {
          matches.push({
            patternType: 'api-call',
            description,
            line: path.node.loc?.start.line || 0,
            column: path.node.loc?.start.column || 0,
            endLine: path.node.loc?.end.line,
            endColumn: path.node.loc?.end.column,
            weight,
          })
        }
      },
    })
  } catch {
    return []
  }

  return matches
}

function checkArgumentsMatch(
  pattern: APICallPattern,
  args: t.CallExpression['arguments']
): boolean {
  if (!pattern.arguments) return true

  return pattern.arguments.every(argPattern => {
    const arg = args[argPattern.position]
    if (!arg) return false
    if (argPattern.type === 'any') return true

    if (argPattern.type === 'string' && arg.type === 'StringLiteral') {
      return argPattern.value ? arg.value.includes(argPattern.value) : true
    }

    if (argPattern.type === 'regex' && arg.type === 'StringLiteral') {
      try {
        const regex = new RegExp(argPattern.value || '')
        return regex.test(arg.value)
      } catch {
        return false
      }
    }

    return false
  })
}

export function matchAST(
  pattern: ASTPattern,
  ast: ParseResult<t.File>,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  try {
    traverse(ast, {
      enter(path: NodePath) {
        if (path.node.type === pattern.nodeType) {
          if (matchNodeProperties(path.node, pattern.properties)) {
            matches.push({
              patternType: 'ast',
              description,
              line: path.node.loc?.start.line || 0,
              column: path.node.loc?.start.column || 0,
              endLine: path.node.loc?.end.line,
              endColumn: path.node.loc?.end.column,
              weight,
            })
          }
        }
      },
    })
  } catch {
    return []
  }

  return matches
}

export function matchImport(
  pattern: string,
  content: string,
  ast: ParseResult<t.File> | null,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  const regexPattern = `(import\\s+.*from\\s+['"]${pattern}['"]|require\\s*\\(['"]${pattern}['"]\\))`
  matches.push(...matchRegex(regexPattern, content, description, weight))

  if (ast) {
    matches.push(...matchImportAST(pattern, ast, description, weight))
  }

  return matches
}

function matchImportAST(
  pattern: string,
  ast: ParseResult<t.File>,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  try {
    traverse(ast, {
      ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
        if (path.node.source.value.includes(pattern)) {
          matches.push({
            patternType: 'import',
            description,
            line: path.node.loc?.start.line || 0,
            column: path.node.loc?.start.column || 0,
            endLine: path.node.loc?.end.line,
            endColumn: path.node.loc?.end.column,
            weight,
          })
        }
      },
      CallExpression(path: NodePath<t.CallExpression>) {
        const callee = path.node.callee
        if (
          callee.type === 'Identifier' &&
          callee.name === 'require' &&
          path.node.arguments.length > 0
        ) {
          const arg = path.node.arguments[0]
          if (arg && arg.type === 'StringLiteral' && arg.value.includes(pattern)) {
            matches.push({
              patternType: 'import',
              description,
              line: path.node.loc?.start.line || 0,
              column: path.node.loc?.start.column || 0,
              endLine: path.node.loc?.end.line,
              endColumn: path.node.loc?.end.column,
              weight,
            })
          }
        }
      },
    })
  } catch {
    return matches
  }

  return matches
}

function matchNodeProperties(
  node: t.Node,
  properties?: Record<string, unknown>
): boolean {
  if (!properties) return true

  for (const [key, value] of Object.entries(properties)) {
    const nodeValue = (node as unknown as Record<string, unknown>)[key]

    if (typeof value === 'object' && value !== null) {
      if (typeof nodeValue !== 'object' || nodeValue === null) {
        return false
      }
      if (!matchNodeProperties(nodeValue as t.Node, value as Record<string, unknown>)) {
        return false
      }
    } else if (nodeValue !== value) {
      return false
    }
  }

  return true
}
