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
      default: 'photo'
    },
    label: {
      name: 'label',
      label: 'Etiqueta',
      type: 'text',
      default: 'Foto de perfil'
    },
    src: {
      name: 'src',
      label: 'Imagen inicial',
      type: 'text',
      default: ''
    },
    helpmsg: {
      name: 'helpmsg',
      label: 'Mensaje de ayuda o apoyo',
      type: 'text',
      default: 'Máximo 2 MB'
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
