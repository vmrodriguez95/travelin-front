export const config = {
  props: {
    id: {
      name: 'id',
      label: 'Identificador',
      type: 'text',
      default: 'component'
    },
    name: {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      default: 'calendar'
    },
    label: {
      name: 'label',
      label: 'Etiqueta',
      type: 'text',
      default: 'Calendario'
    },
    start: {
      name: 'start',
      label: 'Fecha de inicio',
      type: 'text',
      default: ''
    },
    end: {
      name: 'end',
      label: 'Fecha de fin',
      type: 'text',
      default: ''
    },
    min: {
      name: 'min',
      label: 'Fecha minima',
      type: 'text',
      default: ''
    },
    max: {
      name: 'max',
      label: 'Fecha maxima',
      type: 'text',
      default: ''
    },
    readonly: {
      name: 'readonly',
      label: 'Solo lectura',
      type: 'checkbox',
      default: false
    },
    required: {
      name: 'required',
      label: 'Requerido',
      type: 'checkbox',
      default: false
    }
  }
}
