import { randomUUID } from 'node:crypto'
import type { ComponentMetadata } from '../types/index.js'

export interface CycloneDXProperty {
  name: string
  value: string
}

export interface CycloneDXComponent {
  type: string
  name: string
  version?: string
  description?: string
  author?: string
  'bom-ref': string
  properties?: CycloneDXProperty[]
  purl?: string
}

export interface CycloneDXDependency {
  ref: string
  dependsOn?: string[]
}

export interface CycloneDXBom {
  bomFormat: 'CycloneDX'
  specVersion: '1.7'
  version: number
  serialNumber: string
  metadata: {
    timestamp: string
    tools: { components: Array<{ type: string; name: string; version: string }> }
    component?: CycloneDXComponent
  }
  components: CycloneDXComponent[]
  dependencies: CycloneDXDependency[]
}

interface BomInput {
  projectName: string
  projectVersion: string
  platforms: PlatformBomInput[]
  dependencies: DepBomInput[]
  models: ModelBomInput[]
}

interface PlatformBomInput {
  type: string
  name: string
  components: ComponentBomInput[]
}

interface ComponentBomInput {
  id: string
  name: string
  path: string
  type: string
  metadata: ComponentMetadata
}

interface DepBomInput {
  name: string
  version: string | null
  source: 'npm' | 'pip'
  category: string
}

interface ModelBomInput {
  name: string
  path: string
  format: string
  sizeMB: number | null
}

export function generateBom(input: BomInput): CycloneDXBom {
  const serialNumber = `urn:uuid:${randomUUID()}`
  const components: CycloneDXComponent[] = []
  const dependencies: CycloneDXDependency[] = []
  const rootRef = `firmis:root:${input.projectName}`

  const rootComponent: CycloneDXComponent = {
    type: 'application',
    name: input.projectName,
    version: input.projectVersion,
    'bom-ref': rootRef,
    properties: [
      { name: 'firmis:agent:type', value: 'agent-stack' },
    ],
  }

  const rootDeps: string[] = []

  // Add platform components
  for (const platform of input.platforms) {
    for (const comp of platform.components) {
      const bomRef = `firmis:${platform.type}:${comp.id}`
      const component = buildPlatformComponent(platform.type, comp, bomRef)
      components.push(component)
      rootDeps.push(bomRef)

      const compDeps = buildComponentDependencies(comp, bomRef)
      if (compDeps.length > 0) {
        dependencies.push({ ref: bomRef, dependsOn: compDeps })
      }
    }
  }

  // Add AI dependencies as library components
  for (const dep of input.dependencies) {
    const bomRef = buildDepRef(dep)
    const component = buildDependencyComponent(dep, bomRef)
    components.push(component)
    rootDeps.push(bomRef)
  }

  // Add model files as ML model components
  for (const model of input.models) {
    const bomRef = `firmis:model:${model.name}`
    const component = buildModelComponent(model, bomRef)
    components.push(component)
    rootDeps.push(bomRef)
  }

  dependencies.push({ ref: rootRef, dependsOn: rootDeps })

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.7',
    version: 1,
    serialNumber,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: {
        components: [{
          type: 'application',
          name: 'firmis-scanner',
          version: input.projectVersion,
        }],
      },
      component: rootComponent,
    },
    components,
    dependencies,
  }
}

function buildPlatformComponent(
  platformType: string,
  comp: ComponentBomInput,
  bomRef: string,
): CycloneDXComponent {
  const properties: CycloneDXProperty[] = [
    { name: 'firmis:agent:platform', value: platformType },
    { name: 'firmis:agent:component-type', value: comp.type },
    { name: 'firmis:agent:path', value: comp.path },
  ]

  if (comp.metadata.permissions) {
    for (const perm of comp.metadata.permissions) {
      properties.push({ name: 'firmis:agent:permission', value: perm })
    }
  }

  if (comp.metadata.entryPoints) {
    for (const ep of comp.metadata.entryPoints) {
      properties.push({ name: 'firmis:agent:entry-point', value: ep })
    }
  }

  return {
    type: mapComponentType(comp.type),
    name: comp.name,
    version: comp.metadata.version,
    description: comp.metadata.description,
    author: comp.metadata.author,
    'bom-ref': bomRef,
    properties,
  }
}

function buildDependencyComponent(
  dep: DepBomInput,
  bomRef: string,
): CycloneDXComponent {
  const properties: CycloneDXProperty[] = [
    { name: 'firmis:agent:dep-source', value: dep.source },
    { name: 'firmis:agent:dep-category', value: dep.category },
  ]

  return {
    type: 'library',
    name: dep.name,
    version: dep.version ?? undefined,
    'bom-ref': bomRef,
    purl: buildPurl(dep),
    properties,
  }
}

function buildModelComponent(
  model: ModelBomInput,
  bomRef: string,
): CycloneDXComponent {
  const properties: CycloneDXProperty[] = [
    { name: 'firmis:agent:model-format', value: model.format },
    { name: 'firmis:agent:model-path', value: model.path },
  ]

  if (model.sizeMB !== null) {
    properties.push({
      name: 'firmis:agent:model-size-mb',
      value: model.sizeMB.toFixed(1),
    })
  }

  return {
    type: 'machine-learning-model',
    name: model.name,
    'bom-ref': bomRef,
    properties,
  }
}

function buildComponentDependencies(
  comp: ComponentBomInput,
  _bomRef: string,
): string[] {
  const deps: string[] = []
  if (comp.metadata.dependencies) {
    for (const depName of comp.metadata.dependencies) {
      deps.push(`firmis:dep:npm:${depName}`)
    }
  }
  return deps
}

function buildDepRef(dep: DepBomInput): string {
  return `firmis:dep:${dep.source}:${dep.name}`
}

function buildPurl(dep: DepBomInput): string {
  const type = dep.source === 'npm' ? 'npm' : 'pypi'
  const version = dep.version ? `@${dep.version.replace(/^[\^~>=<]*/g, '')}` : ''
  return `pkg:${type}/${dep.name}${version}`
}

function mapComponentType(agentType: string): string {
  const typeMap: Record<string, string> = {
    skill: 'application',
    server: 'application',
    plugin: 'library',
    extension: 'library',
    agent: 'application',
  }
  return typeMap[agentType] ?? 'application'
}
