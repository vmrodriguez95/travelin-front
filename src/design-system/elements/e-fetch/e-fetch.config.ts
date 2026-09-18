export const config = {
  props: {
    action: {
      name: 'action',
      label: 'Action URL',
      type: 'text',
    },
    method: {
      name: 'method',
      label: 'HTTP Method',
      type: 'select',
      options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    type: {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      options: ['button', 'link', 'plain'],
      default: 'button'
    },
    channel: {
      name: 'channel',
      label: 'Canal',
      type: 'text',
    },
    idField: {
      name: 'idField',
      label: 'Campo del id seleccionado',
      type: 'text',
      default: 'idPoi'
    }
  }
}
