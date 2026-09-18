export const config = {
  props: {
    type: {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      options: ['info', 'success', 'warning', 'error'],
      default: 'info'
    },
    timeout: {
      name: 'timeout',
      label: 'Segundos hasta cerrarse (0 = manual)',
      type: 'text',
      default: 0
    },
    channel: {
      name: 'channel',
      label: 'Canal que la dispara',
      type: 'text',
      default: ''
    },
    event: {
      name: 'event',
      label: 'Evento del canal que la muestra',
      type: 'text',
      default: 'poi-remove'
    }
  }
}
