export const config = {
  props: {
    label: {
      name: 'label',
      label: 'Texto',
      type: 'text',
      default: 'Días planificados'
    },
    value: {
      name: 'value',
      label: 'Valor del progreso',
      type: 'number',
      default: 4
    },
    total: {
      name: 'value',
      label: 'Valor total del progreso',
      type: 'number',
      default: 16
    }
  }
}