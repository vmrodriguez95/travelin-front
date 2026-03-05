import type { ComponentRegistryItem } from '../types/components'

const modules = import.meta.glob('../compositions/**/index.ts', { eager: true })

export const simulator: ComponentRegistryItem[] = Object.values(modules).map((mod: any) => ({
  meta: mod.meta,
  Demo: mod.Demo,
  config: mod.config
})).sort((a, b) => a.meta.order - b.meta.order)
