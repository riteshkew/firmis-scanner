import { describe, it, expect, beforeEach } from 'vitest'
import { RuleEngine } from '../../../src/rules/engine.js'

describe('Permission Over-Grant Rules', () => {
  let engine: RuleEngine

  // Use realistic paths — SKILL.md must have /SKILL.md suffix
  // so context detection treats it as code_execution, not documentation
  const skillPath = 'skills/my-skill/SKILL.md'

  beforeEach(async () => {
    engine = new RuleEngine()
    await engine.load()
  })

  describe('rules load correctly', () => {
    it('loads permission-overgrant category rules', () => {
      const rules = engine.getRules({ category: 'permission-overgrant' })
      expect(rules.length).toBeGreaterThanOrEqual(3)
      expect(rules.every((r) => r.category === 'permission-overgrant')).toBe(true)
    })

    it('permission rules are scoped to openclaw platform', () => {
      const rules = engine.getRules({ category: 'permission-overgrant' })
      for (const rule of rules) {
        expect(rule.platforms).toContain('openclaw')
      }
    })
  })

  describe('perm-001: Wildcard Permission', () => {
    it('detects shell:* wildcard permission', async () => {
      const content = `# My Skill\npermissions:\n  - shell:*\n  - network:read\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const permThreat = threats.find((t) => t.ruleId === 'perm-001')

      expect(permThreat).toBeDefined()
      expect(permThreat?.severity).toBe('high')
      expect(permThreat?.category).toBe('permission-overgrant')
    })

    it('detects filesystem:* wildcard permission', async () => {
      const content = `# Helper\npermissions:\n  - filesystem:*\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const permThreat = threats.find((t) => t.ruleId === 'perm-001')

      expect(permThreat).toBeDefined()
    })

    it('detects network:* wildcard permission', async () => {
      const content = `# Net Skill\npermissions:\n  - network:*\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const permThreat = threats.find((t) => t.ruleId === 'perm-001')

      expect(permThreat).toBeDefined()
    })

    it('does not flag specific permissions', async () => {
      const content = `# Safe Skill\npermissions:\n  - shell:read\n  - filesystem:home\n  - network:https\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const wildcardThreats = threats.filter((t) => t.ruleId === 'perm-001')

      expect(wildcardThreats).toHaveLength(0)
    })
  })

  describe('perm-002: Maximum Blast Radius', () => {
    it('detects shell + network + filesystem combo', async () => {
      const content = `# Dangerous Skill\npermissions:\n  - shell:execute\n  - network:all\n  - filesystem:write\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const blastThreat = threats.find((t) => t.ruleId === 'perm-002')

      expect(blastThreat).toBeDefined()
      expect(blastThreat?.severity).toBe('critical')
      expect(blastThreat?.category).toBe('permission-overgrant')
    })

    it('does not flag single permission type', async () => {
      const content = `# Simple Skill\npermissions:\n  - shell:read\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const blastThreats = threats.filter((t) => t.ruleId === 'perm-002')

      // Single permission should not meet confidence threshold for blast radius
      expect(blastThreats).toHaveLength(0)
    })
  })

  describe('perm-003: Dangerous Tool Declarations', () => {
    it('detects shell tool in tool declarations', async () => {
      const content = `# My Skill\ntools:\n  - shell\n  - browser\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const toolThreat = threats.find((t) => t.ruleId === 'perm-003')

      expect(toolThreat).toBeDefined()
      expect(toolThreat?.severity).toBe('medium')
    })

    it('detects exec tool in declarations', async () => {
      const content = `# Exec Skill\ntools:\n  - exec\n  - read_file\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const toolThreat = threats.find((t) => t.ruleId === 'perm-003')

      expect(toolThreat).toBeDefined()
    })

    it('does not flag safe tools', async () => {
      const content = `# Safe Skill\ntools:\n  - browser\n  - search\n  - calculator\n`

      const threats = await engine.analyze(content, skillPath, null, 'openclaw')
      const toolThreats = threats.filter((t) => t.ruleId === 'perm-003')

      expect(toolThreats).toHaveLength(0)
    })
  })

  describe('platform scoping', () => {
    it('permission rules do not trigger on non-openclaw platforms', async () => {
      const content = `permissions:\n  - shell:*\n  - filesystem:*\n  - network:*\ntools:\n  - shell\n`

      const threats = await engine.analyze(content, 'config.json', null, 'claude')
      const permThreats = threats.filter((t) => t.category === 'permission-overgrant')

      expect(permThreats).toHaveLength(0)
    })
  })
})
