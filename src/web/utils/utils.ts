import type { ComponentProperty, ComponentRegistryItem } from "@web/types/components"

export function prepareProps(component: ComponentRegistryItem) {
  return Object.entries(component.config.props || {}).map(([name, attr]) => ({ name, attr: (attr as ComponentProperty).default }))
}

export function getAttrs(component: ComponentRegistryItem) {
  const componentAttrs = prepareProps(component)

  return Object.fromEntries(componentAttrs.map((attr) => [attr.name, attr.attr]))
}

export function prettyHTML(html: string) {
  html = html.replace(/> </g, '>\n<') // ya tienes esto

  const lines = html.split('\n')
  let indent = 0
  const tab = '  '

  return lines
    .map((line) => {
      if (line.match(/^<\/.+>/)) indent -= 2

      const result = tab.repeat(indent < 0 ? 0 : indent) + line
      
      if (line.match(/^<[^/!][^>]*[^/]>/)) indent++

      return result
    })
    .join('\n')
}

export function getSimulatorRoute(currentRoute: string) {
  return currentRoute.replace(/compositions|components|elements/g, 'simulator')
}