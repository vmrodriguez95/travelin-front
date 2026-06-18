import type { ComponentRegistryItem } from '../types/components'

type RegistryModule = {
  meta: ComponentRegistryItem['meta']
  Demo: ComponentRegistryItem['Demo']
  config: ComponentRegistryItem['config']
}

export function createRegistry(
  modules: Record<string, unknown>,
  sortBy: 'name' | 'order'
): ComponentRegistryItem[] {
  const items = Object.values(modules).map((mod) => {
    const m = mod as RegistryModule
    return { meta: m.meta, Demo: m.Demo, config: m.config }
  })

  if (sortBy === 'order') {
    return items.sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0))
  }

  return items.sort((a, b) => a.meta.name.localeCompare(b.meta.name))
}
