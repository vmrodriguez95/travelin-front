export const config = {
  props: {
    heading: {
      name: 'heading',
      label: 'Título',
      type: 'text',
      default: 'Japón'
    },
    subheading: {
      name: 'subheading',
      label: 'Subtítulos',
      type: 'text',
      default: '28 de Octubre'
    },
    bg: {
      name: 'bg',
      label: 'Imagen de fondo (URL)',
      type: 'text',
      default: 'https://loremflickr.com/2000/800/japan'
    },
    url: {
      name: 'url',
      label: 'URL de retorno',
      type: 'text',
      default: '#'
    },
  }
}