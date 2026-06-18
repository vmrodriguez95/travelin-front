import type { ComponentRegistryItem } from '../types/components'
import { createRegistry } from './utils'

const modules = import.meta.glob('../compositions/**/index.ts', { eager: true })

export const compositions: ComponentRegistryItem[] = createRegistry(modules, 'order')
