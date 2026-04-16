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
    }
  }
}