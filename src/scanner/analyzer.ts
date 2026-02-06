import { readFile, stat } from 'node:fs/promises'
import { parse, type ParseResult } from '@babel/parser'
import type * as t from '@babel/types'
import { ParseError } from '../types/index.js'

/** Maximum file size to analyze (10MB) - prevents memory exhaustion */
const MAX_FILE_SIZE = 10 * 1024 * 1024

export interface FileAnalysis {
  filePath: string
  content: string
  ast: ParseResult<t.File> | null
  parseError?: string
}

export class FileAnalyzer {
  private readonly supportedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    try {
      // Check file size before reading to prevent memory exhaustion
      const stats = await stat(filePath)
      if (stats.size > MAX_FILE_SIZE) {
        throw new ParseError(
          `File too large (${Math.round(stats.size / 1024 / 1024)}MB > 10MB limit)`,
          filePath
        )
      }

      const content = await readFile(filePath, 'utf-8')
      const ast = this.parseFile(filePath, content)

      return {
        filePath,
        content,
        ast,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new ParseError(`Failed to read file ${filePath}: ${message}`, filePath)
    }
  }

  private parseFile(filePath: string, content: string): ParseResult<t.File> | null {
    const ext = this.getExtension(filePath)

    if (!this.supportedExtensions.has(ext)) {
      return null
    }

    try {
      const isTypeScript = ext === '.ts' || ext === '.tsx'
      const isJSX = ext === '.tsx' || ext === '.jsx'

      return parse(content, {
        sourceType: 'module',
        plugins: [
          ...(isTypeScript ? ['typescript' as const] : []),
          ...(isJSX ? ['jsx' as const] : []),
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'optionalChaining',
          'nullishCoalescingOperator',
        ],
        errorRecovery: true,
      })
    } catch (error) {
      return null
    }
  }

  private getExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.')
    return lastDot === -1 ? '' : filePath.slice(lastDot)
  }

  async analyzeFiles(filePaths: string[]): Promise<FileAnalysis[]> {
    const results: FileAnalysis[] = []

    for (const filePath of filePaths) {
      try {
        const analysis = await this.analyzeFile(filePath)
        results.push(analysis)
      } catch (error) {
        results.push({
          filePath,
          content: '',
          ast: null,
          parseError: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return results
  }

  async analyzeFilesParallel(
    filePaths: string[],
    concurrency: number = 4
  ): Promise<FileAnalysis[]> {
    const results: FileAnalysis[] = []
    const chunks: string[][] = []

    for (let i = 0; i < filePaths.length; i += concurrency) {
      chunks.push(filePaths.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (filePath) => {
          try {
            return await this.analyzeFile(filePath)
          } catch (error) {
            return {
              filePath,
              content: '',
              ast: null,
              parseError: error instanceof Error ? error.message : String(error),
            }
          }
        })
      )

      results.push(...chunkResults)
    }

    return results
  }
}
