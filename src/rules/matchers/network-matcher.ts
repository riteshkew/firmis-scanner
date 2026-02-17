import type { APICallPattern, PatternMatch } from '../../types/index.js'
import type { ParseResult } from '@babel/parser'
import type * as t from '@babel/types'
import { matchRegex } from './regex-matcher.js'
import { matchAPICall } from './ast-matcher.js'

const NETWORK_APIS = ['fetch', 'axios', 'http.request', 'https.request', 'XMLHttpRequest']

export function matchNetwork(
  pattern: string,
  content: string,
  ast: ParseResult<t.File> | null,
  description: string,
  weight: number
): PatternMatch[] {
  const matches: PatternMatch[] = []

  for (const api of NETWORK_APIS) {
    const [objectName, methodName] = api.split('.')

    if (methodName) {
      const apiPattern: APICallPattern = {
        object: objectName,
        method: methodName,
      }
      matches.push(
        ...matchAPICall(apiPattern, ast || ({} as ParseResult<t.File>), description, weight)
      )
    } else {
      const regexPattern = `\\b${api}\\s*\\(`
      matches.push(...matchRegex(regexPattern, content, description, weight))
    }
  }

  if (pattern) {
    matches.push(...matchRegex(pattern, content, description, weight))
  }

  return matches
}
