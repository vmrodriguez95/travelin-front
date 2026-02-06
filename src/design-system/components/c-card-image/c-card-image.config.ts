export const config = {
  props: {
    image: {
      name: 'image',
      label: 'Imagen de fondo (URL)',
      type: 'text',
      default: 'https://loremflickr.com/800/600/japan'
    },
    name: {
      name: 'name',
      label: 'Nombre del viaje',
      type: 'text',
      default: 'Japón'
    },
    start: {
      name: 'start',
      label: 'Fecha de inicio',
      type: 'text',
      default: '28-10-2025'
    },
    end: {
      name: 'end',
      label: 'Fecha de fin',
      type: 'text',
      default: '12-11-2025'
    }
  }
}