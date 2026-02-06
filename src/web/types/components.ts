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

export interface ComponentAttribute {
  name: string
  attr: any
}

export interface ComponentProperty {
  name: string
  label: string
  type: string
  default: string | boolean | number
  options?: string[]
}