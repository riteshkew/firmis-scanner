import { describe, it, expect } from 'vitest'
import { discoverCommand, type DiscoveryInventory } from '../../../src/cli/commands/discover.js'

describe('discoverCommand', () => {
  it('exports discoverCommand with correct name', () => {
    expect(discoverCommand.name()).toBe('discover')
  })

  it('has a non-empty description', () => {
    expect(discoverCommand.description()).toBeTruthy()
    expect(typeof discoverCommand.description()).toBe('string')
  })

  it('has expected options defined', () => {
    const opts = discoverCommand.options.map(o => o.long)
    expect(opts).toContain('--json')
    expect(opts).toContain('--platform')
    expect(opts).toContain('--output')
    expect(opts).toContain('--verbose')
    expect(opts).toContain('--show-deps')
    expect(opts).toContain('--show-models')
  })

  it('accepts optional path argument', () => {
    const args = discoverCommand.registeredArguments
    expect(args).toHaveLength(1)
    expect(args[0]?.required).toBe(false)
  })
})

describe('DiscoveryInventory type shape', () => {
  it('can construct a valid DiscoveryInventory object', () => {
    const inventory: DiscoveryInventory = {
      version: '1.3.0',
      timestamp: new Date().toISOString(),
      platforms: [],
      dependencies: [],
      models: [],
      summary: {
        platformCount: 0,
        componentCount: 0,
        dependencyCount: 0,
        modelCount: 0,
      },
    }

    expect(inventory.version).toBe('1.3.0')
    expect(inventory.platforms).toEqual([])
    expect(inventory.dependencies).toEqual([])
    expect(inventory.models).toEqual([])
    expect(inventory.summary.platformCount).toBe(0)
    expect(inventory.summary.componentCount).toBe(0)
    expect(inventory.summary.dependencyCount).toBe(0)
    expect(inventory.summary.modelCount).toBe(0)
  })

  it('DiscoveryInventory summary fields are all numbers', () => {
    const summary: DiscoveryInventory['summary'] = {
      platformCount: 2,
      componentCount: 5,
      dependencyCount: 3,
      modelCount: 1,
    }

    expect(typeof summary.platformCount).toBe('number')
    expect(typeof summary.componentCount).toBe('number')
    expect(typeof summary.dependencyCount).toBe('number')
    expect(typeof summary.modelCount).toBe('number')
  })
})
