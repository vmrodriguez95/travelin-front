export interface ComponentMeta {
  name: string
  tag: string
  description: string
}

export interface ComponentRegistryItem {
  meta: ComponentMeta
  Demo: any
  config: any
}