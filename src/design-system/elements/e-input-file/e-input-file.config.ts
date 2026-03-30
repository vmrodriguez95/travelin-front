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
      default: 'Hooooliiiii'
    },
    helpmsg: {
      name: 'helpmsg',
      label: 'Mensaje de ayuda o apoyo',
      type: 'text',
      default: 'Esto es un mensaje de apoyo'
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