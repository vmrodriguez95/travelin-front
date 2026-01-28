export const config = {
  props: {
    label: { type: 'string', default: 'Button' },
    disabled: { type: 'boolean', default: false }
  },
  slots: {
    default: 'Contenido del botón'
  }
}