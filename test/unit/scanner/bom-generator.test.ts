import { describe, it, expect } from 'vitest'
import { generateBom, type CycloneDXBom } from '../../../src/scanner/bom-generator.js'

describe('BOM Generator', () => {
  const baseBomInput = {
    projectName: 'test-project',
    projectVersion: '1.0.0',
    platforms: [],
    dependencies: [],
    models: [],
  }

  describe('generateBom', () => {
    it('generates valid CycloneDX 1.7 structure', () => {
      const bom = generateBom(baseBomInput)

      expect(bom.bomFormat).toBe('CycloneDX')
      expect(bom.specVersion).toBe('1.7')
      expect(bom.version).toBe(1)
      expect(bom.serialNumber).toMatch(/^urn:uuid:[0-9a-f-]+$/)
      expect(bom.metadata.timestamp).toBeDefined()
      expect(bom.metadata.tools.components).toHaveLength(1)
      expect(bom.metadata.tools.components[0].name).toBe('firmis-scanner')
    })

    it('includes root component in metadata', () => {
      const bom = generateBom(baseBomInput)

      expect(bom.metadata.component).toBeDefined()
      expect(bom.metadata.component!.name).toBe('test-project')
      expect(bom.metadata.component!.version).toBe('1.0.0')
      expect(bom.metadata.component!.type).toBe('application')
    })

    it('adds platform components', () => {
      const bom = generateBom({
        ...baseBomInput,
        platforms: [{
          type: 'mcp',
          name: 'MCP Servers',
          components: [{
            id: 'abc123',
            name: 'test-server',
            path: '/path/to/server',
            type: 'server',
            metadata: {
              version: '2.0.0',
              author: 'Test Author',
              description: 'A test server',
              permissions: ['env:API_KEY'],
              entryPoints: ['index.js'],
            },
          }],
        }],
      })

      const mcpComp = bom.components.find(c => c.name === 'test-server')
      expect(mcpComp).toBeDefined()
      expect(mcpComp!.type).toBe('application')
      expect(mcpComp!.version).toBe('2.0.0')
      expect(mcpComp!.author).toBe('Test Author')

      const props = mcpComp!.properties ?? []
      expect(props.find(p => p.name === 'firmis:agent:platform')?.value).toBe('mcp')
      expect(props.find(p => p.name === 'firmis:agent:component-type')?.value).toBe('server')
      expect(props.find(p => p.name === 'firmis:agent:permission')?.value).toBe('env:API_KEY')
      expect(props.find(p => p.name === 'firmis:agent:entry-point')?.value).toBe('index.js')
    })

    it('adds AI dependencies as library components', () => {
      const bom = generateBom({
        ...baseBomInput,
        dependencies: [
          { name: 'openai', version: '^4.0.0', source: 'npm', category: 'llm-sdk' },
          { name: 'langchain', version: '0.1.0', source: 'pip', category: 'agent-framework' },
        ],
      })

      const openai = bom.components.find(c => c.name === 'openai')
      expect(openai).toBeDefined()
      expect(openai!.type).toBe('library')
      expect(openai!.purl).toBe('pkg:npm/openai@4.0.0')

      const langchain = bom.components.find(c => c.name === 'langchain')
      expect(langchain).toBeDefined()
      expect(langchain!.purl).toBe('pkg:pypi/langchain@0.1.0')

      const langchainProps = langchain!.properties ?? []
      expect(langchainProps.find(p => p.name === 'firmis:agent:dep-source')?.value).toBe('pip')
      expect(langchainProps.find(p => p.name === 'firmis:agent:dep-category')?.value).toBe('agent-framework')
    })

    it('adds model files as ML model components', () => {
      const bom = generateBom({
        ...baseBomInput,
        models: [
          { name: 'model.gguf', path: '/models/model.gguf', format: 'GGUF', sizeMB: 4096.5 },
          { name: 'weights.safetensors', path: '/models/weights.safetensors', format: 'SafeTensors', sizeMB: null },
        ],
      })

      const gguf = bom.components.find(c => c.name === 'model.gguf')
      expect(gguf).toBeDefined()
      expect(gguf!.type).toBe('machine-learning-model')

      const ggufProps = gguf!.properties ?? []
      expect(ggufProps.find(p => p.name === 'firmis:agent:model-format')?.value).toBe('GGUF')
      expect(ggufProps.find(p => p.name === 'firmis:agent:model-size-mb')?.value).toBe('4096.5')

      const st = bom.components.find(c => c.name === 'weights.safetensors')
      expect(st).toBeDefined()
      const stProps = st!.properties ?? []
      expect(stProps.find(p => p.name === 'firmis:agent:model-size-mb')).toBeUndefined()
    })

    it('creates dependency graph with root node', () => {
      const bom = generateBom({
        ...baseBomInput,
        platforms: [{
          type: 'claude',
          name: 'Claude Skills',
          components: [{
            id: 'skill1',
            name: 'my-skill',
            path: '/skills/my-skill',
            type: 'skill',
            metadata: {},
          }],
        }],
        dependencies: [
          { name: 'openai', version: '4.0', source: 'npm', category: 'llm-sdk' },
        ],
      })

      const rootRef = `firmis:root:${baseBomInput.projectName}`
      const rootDep = bom.dependencies.find(d => d.ref === rootRef)
      expect(rootDep).toBeDefined()
      expect(rootDep!.dependsOn).toContain('firmis:claude:skill1')
      expect(rootDep!.dependsOn).toContain('firmis:dep:npm:openai')
    })

    it('maps component types correctly', () => {
      const types = ['skill', 'server', 'plugin', 'extension', 'agent']
      const expected = ['application', 'application', 'library', 'library', 'application']

      for (let i = 0; i < types.length; i++) {
        const bom = generateBom({
          ...baseBomInput,
          platforms: [{
            type: 'mcp',
            name: 'Test',
            components: [{
              id: `comp-${i}`,
              name: `test-${types[i]}`,
              path: '/test',
              type: types[i],
              metadata: {},
            }],
          }],
        })

        const comp = bom.components.find(c => c.name === `test-${types[i]}`)
        expect(comp!.type).toBe(expected[i])
      }
    })

    it('generates unique serial numbers', () => {
      const bom1 = generateBom(baseBomInput)
      const bom2 = generateBom(baseBomInput)

      expect(bom1.serialNumber).not.toBe(bom2.serialNumber)
    })
  })

  describe('CLI commands', () => {
    it('bom command exports correctly', async () => {
      const { bomCommand } = await import('../../../src/cli/commands/bom.js')
      expect(bomCommand.name()).toBe('bom')
      const opts = bomCommand.options.map((o: { long: string }) => o.long)
      expect(opts).toContain('--output')
      expect(opts).toContain('--platform')
    })

    it('ci command exports correctly', async () => {
      const { ciCommand } = await import('../../../src/cli/commands/ci.js')
      expect(ciCommand.name()).toBe('ci')
      const opts = ciCommand.options.map((o: { long: string }) => o.long)
      expect(opts).toContain('--fail-on')
      expect(opts).toContain('--format')
      expect(opts).toContain('--output')
      expect(opts).toContain('--bom-output')
      expect(opts).toContain('--quiet')
    })
  })
})
