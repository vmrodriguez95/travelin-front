import type { ComponentRegistryItem } from './types'

const modules = import.meta.glob('../../design-system/elements/e-*/index.ts', { eager: true })

export const elements: ComponentRegistryItem[] = Object.values(modules).map((mod: any) => ({
  meta: mod.meta,
  Demo: mod.Demo,
  config: mod.config
})).sort((a, b) => a.meta.name.localeCompare(b.meta.name))
