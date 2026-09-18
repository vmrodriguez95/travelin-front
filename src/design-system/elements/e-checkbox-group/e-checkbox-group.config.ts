export const config = {
  props: {
    id: {
      name: 'id',
      label: 'Identificador',
      type: 'text',
      default: 'collections'
    },
    name: {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      default: 'collections'
    },
    label: {
      name: 'label',
      label: 'Etiqueta',
      type: 'text',
      default: 'Tus colecciones'
    },
    helpmsg: {
      name: 'helpmsg',
      label: 'Mensaje de ayuda o apoyo',
      type: 'text',
      default: 'Elige una o varias colecciones'
    },
    options: {
      name: 'options',
      label: 'Opciones (JSON)',
      type: 'text',
      default: JSON.stringify([
        { label: 'Restaurantes', value: 'restaurants', icon: 'restaurant' },
        { label: 'Tailandia', value: 'thailand', icon: 'temple-buddhist' },
        { label: 'Vietnam', value: 'vietnam', icon: 'temple-buddhist' },
        { label: 'Quiero ir', value: 'wishlist', icon: 'location' }
      ])
    },
    value: {
      name: 'value',
      label: 'Valores seleccionados (JSON)',
      type: 'text',
      default: JSON.stringify(['wishlist'])
    },
    canAdd: {
      name: 'canAdd',
      label: 'Permitir añadir opciones',
      type: 'checkbox',
      default: true
    },
    addLabel: {
      name: 'addLabel',
      label: 'Etiqueta del botón de añadir',
      type: 'text',
      default: 'Añadir colección'
    },
    nameLabel: {
      name: 'nameLabel',
      label: 'Etiqueta del nombre de la nueva opción',
      type: 'text',
      default: 'Nombre'
    },
    namePlaceholder: {
      name: 'namePlaceholder',
      label: 'Placeholder del nombre',
      type: 'text',
      default: 'Nombre de la colección'
    }
  }
}
