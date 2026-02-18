import { describe, it, expect, beforeEach } from 'vitest'
import { RuleEngine } from '../../../src/rules/engine.js'

describe('Python Credential Detection', () => {
  let engine: RuleEngine

  beforeEach(async () => {
    engine = new RuleEngine()
    await engine.load()
  })

  describe('Normalizer expansion: Python home dir idioms trigger existing cred rules', () => {
    it('should detect Path.home()/.aws/credentials via cred-001', async () => {
      // Continuous path in a tool description or config
      const content = 'This tool reads Path.home()/.aws/credentials for authentication'
      const threats = await engine.analyze(content, 'tool.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-001')
      expect(threat).toBeDefined()
      expect(threat?.category).toBe('credential-harvesting')
    })

    it('should detect expanduser("~")/.ssh/id_rsa via cred-002', async () => {
      const content = '# reads expanduser("~")/.ssh/id_rsa to get SSH key'
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-002')
      expect(threat).toBeDefined()
      expect(threat?.severity).toBe('critical')
    })

    it('should detect os.environ["HOME"]/.kube/config via cred-010', async () => {
      const content = 'target_path = os.environ["HOME"]/.kube/config'
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-010')
      expect(threat).toBeDefined()
    })

    it('should detect os.environ.get("HOME")/.docker/config.json via cred-009', async () => {
      const content = 'docker_creds = os.environ.get("HOME")/.docker/config.json'
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-009')
      expect(threat).toBeDefined()
    })

    it('should detect Path.home()/.npmrc via cred-008', async () => {
      const content = 'Extracts tokens from Path.home()/.npmrc on the host'
      const threats = await engine.analyze(content, 'tool.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-008')
      expect(threat).toBeDefined()
    })

    it('should detect expanduser("~")/.git-credentials via cred-007', async () => {
      const content = '# Steals expanduser("~")/.git-credentials from user home'
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-007')
      expect(threat).toBeDefined()
    })

    it('should NOT match Python home idioms for non-credential paths', async () => {
      const content = 'Path.home()/.config/myapp/settings.json is our config path'
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const credThreats = threats.filter(
        (t) => t.category === 'credential-harvesting' && t.ruleId?.startsWith('cred-0')
      )
      // Should not trigger any credential file access rules
      // (cred-003 has .config/gcloud but not .config/myapp)
      const badHits = credThreats.filter(
        (t) => t.evidence?.some((e) => e.snippet?.includes('myapp'))
      )
      expect(badHits).toHaveLength(0)
    })
  })

  describe('cred-016: Python Pathlib Credential Access', () => {
    it('should detect Path.home() / .aws path construction', async () => {
      const content = `
creds_path = Path.home() / '.aws' / 'credentials'
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-016')
      expect(threat).toBeDefined()
    })

    it('should detect expanduser + credential path', async () => {
      const content = `
ssh_dir = expanduser('~') + '/.ssh/id_rsa'
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-016')
      expect(threat).toBeDefined()
    })

    it('should detect os.environ HOME + credential path', async () => {
      const content = `
home = os.environ['HOME'] + '/.kube/config'
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-016')
      expect(threat).toBeDefined()
    })

    it('should NOT trigger on Path.home() / myapp', async () => {
      const content = `
app_dir = Path.home() / 'myapp' / 'config.json'
log_dir = Path.home() / 'logs'
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-016')
      expect(threat).toBeUndefined()
    })
  })

  describe('cred-017: Python Open Credential File', () => {
    it('should detect open() of AWS credentials', async () => {
      const content = `
with open(f"{home}/.aws/credentials") as f:
    creds = f.read()
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-017')
      expect(threat).toBeDefined()
    })

    it('should detect open() of SSH key', async () => {
      const content = `
key = open(path + '/.ssh/id_rsa').read()
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-017')
      expect(threat).toBeDefined()
    })

    it('should detect open() of vault token', async () => {
      const content = `
token = open('/root/.vault-token').read()
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-017')
      expect(threat).toBeDefined()
    })

    it('should NOT trigger on open() of regular files', async () => {
      const content = `
with open('data.csv') as f:
    data = f.read()
config = open('settings.json').read()
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-017')
      expect(threat).toBeUndefined()
    })
  })

  describe('cred-018: Python Subprocess Credential Theft', () => {
    it('should detect subprocess calling macOS security command', async () => {
      const content = `
import subprocess
result = subprocess.run(["security", "find-generic-password", "-s", "login"], capture_output=True)
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-018')
      expect(threat).toBeDefined()
      expect(threat?.severity).toBe('critical')
    })

    it('should detect subprocess reading /proc/1/environ', async () => {
      const content = `
import subprocess
env_data = subprocess.check_output(["cat", "/proc/1/environ"])
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-018')
      expect(threat).toBeDefined()
    })

    it('should NOT trigger on normal subprocess usage', async () => {
      const content = `
import subprocess
subprocess.run(["pip", "install", "requests"])
subprocess.call(["python", "script.py"])
`
      const threats = await engine.analyze(content, 'agent.py', null, 'claude')
      const threat = threats.find((t) => t.ruleId === 'cred-018')
      expect(threat).toBeUndefined()
    })
  })
})
