export const config = {
  props: {
    modal: {
      name: 'modal',
      label: 'Identificador del modal',
      type: 'text',
      default: 'modal'
    },
    channel: {
      name: 'channel',
      label: 'Canal (abre la modal por evento en vez de clonar el template)',
      type: 'text',
      default: ''
    }
  }
}
