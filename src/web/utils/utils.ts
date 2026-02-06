import type { ComponentProperty, ComponentRegistryItem } from "@web/types/components"

export function prepareProps(component: ComponentRegistryItem) {
  return Object.entries(component.config.props || {}).map(([name, attr]) => ({ name, attr: (attr as ComponentProperty).default }))
}

export function getAttrs(component: ComponentRegistryItem) {
  const componentAttrs = prepareProps(component)

  return Object.fromEntries(componentAttrs.map((attr) => [attr.name, attr.attr]))
}