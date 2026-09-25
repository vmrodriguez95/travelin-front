export const config = {
  props: {
    icon: {
      name: 'icon',
      label: 'Icono cuando el campo está vacío',
      type: 'text',
      default: 'bookmark'
    },
    activeIcon: {
      name: 'activeIcon',
      label: 'Icono cuando el campo tiene contenido',
      type: 'text',
      default: 'bookmark-filled'
    },
    field: {
      name: 'field',
      label: 'Campo del elemento a comprobar',
      type: 'text',
      default: 'collections'
    },
    size: {
      name: 'size',
      label: 'Tamaño',
      type: 'select',
      options: ['s', 'm', 'l', 'xl'],
      default: 'l'
    },
    data: {
      name: 'data',
      label: 'Elemento (JSON). Vacío si está dentro de una tarjeta',
      type: 'text',
      default: JSON.stringify({ id: 'demo', location: 'demo', collections: ['col-wishlist'] })
    }
  }
}
