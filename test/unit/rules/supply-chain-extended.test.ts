import { describe, it, expect, beforeEach } from 'vitest'
import { RuleEngine } from '../../../src/rules/engine.js'

describe('Supply Chain Extended Rules', () => {
  let engine: RuleEngine

  beforeEach(async () => {
    engine = new RuleEngine()
    await engine.load()
  })

  describe('supply-006: Known Malicious NPM (Extended)', () => {
    it('should detect crossenv (typosquat of cross-env)', async () => {
      const content = JSON.stringify({
        dependencies: { crossenv: '^7.0.0' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'supply-006')
      expect(threat).toBeDefined()
      expect(threat?.severity).toBe('critical')
    })

    it('should detect flatmap-stream', async () => {
      const content = JSON.stringify({
        dependencies: { 'flatmap-stream': '^0.1.1' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-006')).toBeDefined()
    })

    it('should detect eslint-scope hijacked package', async () => {
      const content = JSON.stringify({
        dependencies: { 'eslint-scope': '^3.7.2' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-006')).toBeDefined()
    })

    it('should detect coa hijacked package', async () => {
      const content = JSON.stringify({
        dependencies: { coa: '^2.0.3' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-006')).toBeDefined()
    })

    it('should detect mongose typosquat', async () => {
      const content = JSON.stringify({
        dependencies: { mongose: '^5.0.0' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-006')).toBeDefined()
    })

    it('should detect loadash typosquat', async () => {
      const content = JSON.stringify({
        dependencies: { loadash: '^4.17.0' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-006')).toBeDefined()
    })

    it('should NOT trigger on legitimate cross-env', async () => {
      const content = JSON.stringify({
        devDependencies: { 'cross-env': '^7.0.3' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'supply-006')
      expect(threat).toBeUndefined()
    })
  })

  describe('supply-007: Known Malicious Python (Extended)', () => {
    it('should detect python3-dateutil typosquat', async () => {
      const content = 'python3-dateutil==2.8.2'
      const threats = await engine.analyze(content, 'requirements.txt', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-007')).toBeDefined()
    })

    it('should detect numppy typosquat', async () => {
      const content = 'numppy==1.24.0'
      const threats = await engine.analyze(content, 'requirements.txt', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-007')).toBeDefined()
    })

    it('should detect colorma typosquat', async () => {
      const content = 'colorma==0.4.6'
      const threats = await engine.analyze(content, 'requirements.txt', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-007')).toBeDefined()
    })

    it('should detect pycrpto typosquat', async () => {
      const content = 'pycrpto==2.6.1'
      const threats = await engine.analyze(content, 'requirements.txt', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-007')).toBeDefined()
    })

    it('should detect urllib4 typosquat', async () => {
      const content = 'urllib4==2.0.0'
      const threats = await engine.analyze(content, 'requirements.txt', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-007')).toBeDefined()
    })

    it('should NOT trigger on legitimate numpy', async () => {
      const content = 'numpy==1.24.0\ncolorama==0.4.6\npython-dateutil==2.8.2'
      const threats = await engine.analyze(content, 'requirements.txt', null, 'claude')
      const threat007 = threats.find((t) => t.ruleId === 'supply-007')
      expect(threat007).toBeUndefined()
    })

    it('should NOT trigger on legitimate urllib3', async () => {
      const content = 'urllib3==2.0.0'
      const threats = await engine.analyze(content, 'requirements.txt', null, 'claude')
      const threat007 = threats.find((t) => t.ruleId === 'supply-007')
      expect(threat007).toBeUndefined()
    })
  })

  describe('supply-008: Typosquatting Heuristics', () => {
    it('should detect lodash typosquat (l0dash)', async () => {
      const content = JSON.stringify({
        dependencies: { l0dash: '^4.17.0' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-008')).toBeDefined()
    })

    it('should detect axios typosquat (axois)', async () => {
      const content = JSON.stringify({
        dependencies: { axois: '^1.4.0' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-008')).toBeDefined()
    })

    it('should detect moment typosquat (momnet)', async () => {
      const content = JSON.stringify({
        dependencies: { momnet: '^2.29.0' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-008')).toBeDefined()
    })

    it('should detect webpack typosquat (webpak)', async () => {
      const content = JSON.stringify({
        devDependencies: { webpak: '^5.0.0' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-008')).toBeDefined()
    })

    it('should detect django typosquat (djnago)', async () => {
      const content = JSON.stringify({
        dependencies: { djnago: '^4.2.0' },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      expect(threats.find((t) => t.ruleId === 'supply-008')).toBeDefined()
    })

    it('should NOT trigger on legitimate lodash', async () => {
      const content = JSON.stringify({
        dependencies: {
          lodash: '^4.17.21',
          axios: '^1.4.0',
          moment: '^2.29.4',
          chalk: '^5.3.0',
          webpack: '^5.89.0',
        },
      })
      const threats = await engine.analyze(content, 'package.json', null, 'claude')
      const threat008 = threats.find((t) => t.ruleId === 'supply-008')
      expect(threat008).toBeUndefined()
    })

    it('should NOT trigger on legitimate flask and django', async () => {
      const content = 'flask==3.0.0\ndjango==4.2.8\nrequests==2.31.0'
      const threats = await engine.analyze(content, 'requirements.txt', null, 'claude')
      const threat008 = threats.find((t) => t.ruleId === 'supply-008')
      expect(threat008).toBeUndefined()
    })
  })
})
