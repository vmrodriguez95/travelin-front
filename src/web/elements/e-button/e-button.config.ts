export const config = {
  props: {
    size: {
      name: 'size',
      label: 'Tamaño',
      type: 'select',
      default: 'fit',
      options: ['fit', 'full']
    },
    disabled: {
      name: 'disabled',
      label: 'Deshabilitar botón',
      type: 'checkbox',
      default: false
    }
  },
  slots: {
    default: {
      name: 'default',
      label: 'Texto del botón',
      type: 'text',
      default: 'Click me'
    }
  }
}