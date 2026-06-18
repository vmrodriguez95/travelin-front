import type { ComponentRegistryItem } from '../types/components'
import { createRegistry } from './utils'

const modules = import.meta.glob('../../design-system/components/c-*/index.ts', { eager: true })

export const components: ComponentRegistryItem[] = createRegistry(modules, 'name')
