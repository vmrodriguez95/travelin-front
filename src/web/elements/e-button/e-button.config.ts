export const config = {
  props: {
    size: {
      label: 'Tamaño',
      type: 'select',
      default: 'fit',
      options: ['fit', 'full']
    },
    disabled: {
      label: 'Deshabilitado',
      type: 'boolean',
      default: false
    }
  },
  slots: {
    default: 'Click me'
  }
}