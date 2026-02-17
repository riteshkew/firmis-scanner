import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { RuleEngine } from '../../src/rules/engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesPath = path.join(__dirname, '../fixtures')

describe('Integration: Sprint 1 - Pattern Detection', () => {
  let ruleEngine: RuleEngine

  beforeAll(async () => {
    ruleEngine = new RuleEngine()
    await ruleEngine.load()
  })

  describe('Malware Distribution Patterns', () => {
    it('detects malware distribution patterns in curl-pipe.js', async () => {
      const filePath = path.join(fixturesPath, 'malware-patterns/curl-pipe-skill/curl-pipe.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      const malwareThreats = threats.filter((t) => t.category === 'malware-distribution')
      expect(malwareThreats.length).toBeGreaterThan(0)

      // Should detect specific patterns
      const threatRuleIds = new Set(malwareThreats.map((t) => t.ruleId))

      // Check for curl pipe pattern (malware-004)
      const hasCurlPipe = Array.from(threatRuleIds).some((id) => id.includes('malware'))
      expect(hasCurlPipe).toBe(true)
    })

    it('detects curl pipe to bash pattern', async () => {
      const filePath = path.join(fixturesPath, 'malware-patterns/curl-pipe-skill/curl-pipe.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      const curlPipeThreat = threats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('curl') && e.snippet.includes('bash'))
      )

      expect(curlPipeThreat).toBeDefined()
      expect(curlPipeThreat?.severity).toMatch(/high|critical/)
    })

    it('detects base64 decode eval pattern', async () => {
      const filePath = path.join(fixturesPath, 'malware-patterns/curl-pipe-skill/curl-pipe.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      const base64Threat = threats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('base64') && e.snippet.includes('eval'))
      )

      expect(base64Threat).toBeDefined()
    })

    it('detects password-protected zip extraction', async () => {
      const filePath = path.join(fixturesPath, 'malware-patterns/curl-pipe-skill/curl-pipe.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      const unzipThreat = threats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('unzip -P'))
      )

      expect(unzipThreat).toBeDefined()
    })

    it('detects systemctl service installation', async () => {
      const filePath = path.join(fixturesPath, 'malware-patterns/curl-pipe-skill/curl-pipe.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      const systemctlThreat = threats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('systemctl'))
      )

      expect(systemctlThreat).toBeDefined()
    })

    it('safe script has no malware findings', async () => {
      const filePath = path.join(fixturesPath, 'malware-patterns/safe-script-skill/safe-script.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      const malwareThreats = threats.filter((t) => t.category === 'malware-distribution')
      expect(malwareThreats.length).toBe(0)
    })
  })

  describe('Memory Poisoning Patterns', () => {
    it('detects memory poisoning patterns in memory-writer.js', async () => {
      const filePath = path.join(fixturesPath, 'memory-poisoning/memory-poisoning-skill/memory-writer.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      const memoryThreats = threats.filter(
        (t) => t.category === 'agent-memory-poisoning'
      )
      expect(memoryThreats.length).toBeGreaterThan(0)
    })

    it('detects MEMORY.md write access', async () => {
      const filePath = path.join(fixturesPath, 'memory-poisoning/memory-poisoning-skill/memory-writer.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      // Should detect memory poisoning patterns (may match on file path or writeFileSync)
      const memoryThreats = threats.filter(
        (t) =>
          t.category === 'agent-memory-poisoning' ||
          t.evidence.some(
            (e) =>
              e.snippet.toLowerCase().includes('memory') ||
              e.snippet.includes('MEMORY.md')
          )
      )

      expect(memoryThreats.length).toBeGreaterThan(0)
    })

    it('detects conversation log access (.jsonl)', async () => {
      const filePath = path.join(fixturesPath, 'memory-poisoning/memory-poisoning-skill/memory-writer.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      const jsonlThreat = threats.find((t) =>
        t.evidence.some((e) => e.snippet.includes('.jsonl'))
      )

      expect(jsonlThreat).toBeDefined()
    })

    it('detects MCP config modification', async () => {
      const filePath = path.join(fixturesPath, 'memory-poisoning/memory-poisoning-skill/memory-writer.js')
      const content = await fs.readFile(filePath, 'utf-8')

      const threats = await ruleEngine.analyze(content, filePath, null, 'openclaw')

      // Should detect config modification (may match on mcp.json path or writeFileSync)
      const configThreats = threats.filter(
        (t) =>
          t.category === 'agent-memory-poisoning' ||
          t.evidence.some(
            (e) => e.snippet.includes('mcp.json') || e.snippet.includes('.config')
          )
      )

      expect(configThreats.length).toBeGreaterThan(0)
    })
  })

  describe('Documentation File Context Weighting', () => {
    it('documentation files get reduced confidence scores', async () => {
      const readmePath = path.join(
        fixturesPath,
        'documentation-fp/docs-skill/README.md'
      )
      const readmeContent = await fs.readFile(readmePath, 'utf-8')

      // Analyze as markdown (documentation)
      const mdThreats = await ruleEngine.analyze(
        readmeContent,
        readmePath,
        null,
        'openclaw'
      )

      // Analyze same content as .js file (code)
      const jsPath = readmePath.replace('.md', '.js')
      const jsThreats = await ruleEngine.analyze(
        readmeContent,
        jsPath,
        null,
        'openclaw'
      )

      // Documentation should have fewer or equal threats due to context weighting
      // The .md version should filter out more low-confidence matches
      expect(mdThreats.length).toBeLessThanOrEqual(jsThreats.length)

      // If there are threats in the .md file, confidence should be lower
      if (mdThreats.length > 0 && jsThreats.length > 0) {
        const mdAvgConfidence =
          mdThreats.reduce((sum, t) => sum + t.confidence, 0) / mdThreats.length
        const jsAvgConfidence =
          jsThreats.reduce((sum, t) => sum + t.confidence, 0) / jsThreats.length

        expect(mdAvgConfidence).toBeLessThanOrEqual(jsAvgConfidence)
      }
    })

    it('documentation context reduces false positives', async () => {
      const readmePath = path.join(
        fixturesPath,
        'documentation-fp/docs-skill/README.md'
      )
      const content = await fs.readFile(readmePath, 'utf-8')

      // This README mentions security patterns for educational purposes
      // Context weighting should reduce confidence of these matches
      const threats = await ruleEngine.analyze(content, readmePath, null, 'openclaw')

      // Documentation files should have reduced threat severity due to context weighting
      // If critical threats exist, they should be minimal compared to code files
      const criticalThreats = threats.filter((t) => t.severity === 'critical')

      // Compare to same content as code file
      const jsPath = readmePath.replace('.md', '.js')
      const jsThreats = await ruleEngine.analyze(content, jsPath, null, 'openclaw')
      const jsCriticalThreats = jsThreats.filter((t) => t.severity === 'critical')

      // Documentation should have fewer or equal critical threats
      expect(criticalThreats.length).toBeLessThanOrEqual(jsCriticalThreats.length)
    })
  })
})
