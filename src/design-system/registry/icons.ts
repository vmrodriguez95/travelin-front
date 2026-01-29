const icons = import.meta.glob('../../common/assets/icons/*.svg', {
  eager: true,
  query: 'raw',
  import: 'default',
}) as Record<string, string>

export function getIcon(name: string) {
  return icons[`../../common/assets/icons/${name}.svg`] || ''
}