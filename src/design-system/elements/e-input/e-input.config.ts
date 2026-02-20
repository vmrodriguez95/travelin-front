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
    type: {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      default: 'text',
      options: ['text', 'password', 'email', 'number', "hidden"]
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