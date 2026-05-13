import { getFormBy } from '@web/utils/form.utils'

export const config = {
  props: {
    data: {
      name: 'data',
      label: 'Datos del formulario',
      type: 'text',
      default: getFormBy('poi_note', 'create')
    },
  }
}