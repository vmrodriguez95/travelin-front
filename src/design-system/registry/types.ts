export interface ComponentMeta {
  name: string
  tag: string
  icon: string
  description: string
}

export interface ComponentRegistryItem {
  meta: ComponentMeta
  Demo: any
  config: any
}