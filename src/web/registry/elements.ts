import type { ComponentRegistryItem } from '../types/components'
import { createRegistry } from './utils'

const modules = import.meta.glob('../../design-system/elements/e-*/index.ts', { eager: true })

export const elements: ComponentRegistryItem[] = createRegistry(modules, 'name')
