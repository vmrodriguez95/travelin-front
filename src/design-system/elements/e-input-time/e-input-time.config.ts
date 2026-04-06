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
      default: 'campo-texto'
    },
    label: {
      name: 'label',
      label: 'Etiqueta',
      type: 'text',
      default: 'Campo de texto'
    },
    value: {
      name: 'value',
      label: 'Valor',
      type: 'text',
      default: ''
    },
    helpmsg: {
      name: 'helpmsg',
      label: 'Mensaje de ayuda o apoyo',
      type: 'text',
      default: 'Esto es un mensaje de apoyo'
    },
    min: {
      name: 'min',
      label: 'Mínimo',
      type: 'text',
      default: '00:00'
    },
    max: {
      name: 'max',
      label: 'Máximo',
      type: 'text',
      default: '23:59'
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