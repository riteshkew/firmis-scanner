import type {
  RulePattern,
  ASTPattern,
  APICallPattern,
  PatternMatch,
} from '../types/index.js'
import type { ParseResult } from '@babel/parser'
import traverse, { type NodePath } from '@babel/traverse'
import type * as t from '@babel/types'

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
        ast,
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
      return matchImport(pattern.pattern as string, content, ast, pattern.description, pattern.weight)

    case 'network':
      return matchNetwork(pattern.pattern as string, content, ast, pattern.description, pattern.weight)

    default:
      return []
  }
}

function matchRegex(
  pattern: string,
  content: string,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  try {
    // Handle inline flags like (?i) that JavaScript doesn't support
    let flags = 'gm'
    let cleanPattern = pattern
    const inlineFlagMatch = pattern.match(/^\(\?([gimsuy]+)\)/)
    if (inlineFlagMatch && inlineFlagMatch[1]) {
      const inlineFlags = inlineFlagMatch[1]
      cleanPattern = pattern.slice(inlineFlagMatch[0].length)
      for (const flag of inlineFlags) {
        if (!flags.includes(flag)) {
          flags += flag
        }
      }
    }

    const regex = new RegExp(cleanPattern, flags)
    const lines = content.split('\n')

    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      const { line, column } = getLineAndColumn(content, match.index)

      matches.push({
        patternType: 'regex',
        description,
        snippet: lines[line - 1]?.trim(),
        line,
        column,
        weight,
      })
    }
  } catch (error) {
    return []
  }

  return matches
}

function matchStringLiteral(
  pattern: string,
  content: string,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []
  const lines = content.split('\n')
  let index = 0

  while ((index = content.indexOf(pattern, index)) !== -1) {
    const { line, column } = getLineAndColumn(content, index)

    matches.push({
      patternType: 'string-literal',
      description,
      snippet: lines[line - 1]?.trim(),
      line,
      column,
      weight,
    })

    index += pattern.length
  }

  return matches
}

function matchFileAccess(
  pattern: string,
  content: string,
  _ast: ParseResult<t.File> | null,
  description: string,
  weight: number
): PatternMatch[] {
  const regexPattern = pattern
    .replace(/~/g, '(~|homedir\\(\\)|process\\.env\\.HOME)')
    .replace(/\//g, '[\\\\/]')
    .replace(/\*/g, '[^\\s\'"]*')
    .replace(/\./g, '\\.')

  return matchRegex(regexPattern, content, description, weight)
}

function matchAPICall(
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
            if (pattern.arguments) {
              const argsMatch = pattern.arguments.every((argPattern) => {
                const arg = path.node.arguments[argPattern.position]
                if (!arg) return false

                if (argPattern.type === 'any') return true

                if (argPattern.type === 'string' && arg.type === 'StringLiteral') {
                  return argPattern.value
                    ? arg.value.includes(argPattern.value)
                    : true
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

              if (!argsMatch) return
            }

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
  } catch (error) {
    return []
  }

  return matches
}

function matchAST(
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
  } catch (error) {
    return []
  }

  return matches
}

function matchImport(
  pattern: string,
  content: string,
  ast: ParseResult<t.File> | null,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  const regexPattern = `(import\\s+.*from\\s+['"]${pattern}['"]|require\\s*\\(['"]${pattern}['"]\\))`
  const regexMatches = matchRegex(regexPattern, content, description, weight)
  matches.push(...regexMatches)

  if (ast) {
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
    } catch (error) {
      return matches
    }
  }

  return matches
}

function matchNetwork(
  pattern: string,
  content: string,
  ast: ParseResult<t.File> | null,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  const networkAPIs = ['fetch', 'axios', 'http.request', 'https.request', 'XMLHttpRequest']

  for (const api of networkAPIs) {
    const [objectName, methodName] = api.split('.')

    if (methodName) {
      const apiPattern: APICallPattern = {
        object: objectName,
        method: methodName,
      }
      matches.push(...matchAPICall(apiPattern, ast || ({} as ParseResult<t.File>), description, weight))
    } else {
      const regexPattern = `\\b${api}\\s*\\(`
      matches.push(...matchRegex(regexPattern, content, description, weight))
    }
  }

  if (pattern) {
    const urlMatches = matchRegex(pattern, content, description, weight)
    matches.push(...urlMatches)
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

function getLineAndColumn(
  content: string,
  index: number
): { line: number; column: number } {
  const lines = content.slice(0, index).split('\n')
  const line = lines.length
  const lastLine = lines[lines.length - 1]
  const column = lastLine?.length ?? 0

  return { line, column }
}
