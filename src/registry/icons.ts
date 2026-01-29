const icons = import.meta.glob('../assets/icons/*.svg', {
  eager: true,
  query: 'raw',
  import: 'default',
}) as Record<string, string>

export function getIcon(name: string) {
  return icons[`../assets/icons/${name}.svg`] || ''
}