import type { ComponentRegistryItem } from '../types/components'
import { createRegistry } from './utils'

const modules = import.meta.glob('../foundations/**/index.ts', { eager: true })

export const foundations: ComponentRegistryItem[] = createRegistry(modules, 'order')
