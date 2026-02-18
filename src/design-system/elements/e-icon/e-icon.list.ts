const icons = import.meta.glob('./sources/*.svg', {
  eager: true,
  query: 'raw',
}) as Record<string, { default: string }>

export const EICON_LIST: Record<string, string> = Object.fromEntries(
  Object.entries(icons).map(([path, mod]): [string, string] => {
    const name = path.split('/').pop()?.replace('.svg', '') || ''
    return [name, mod.default]
  })
)
