import type { FormSchema } from '@web/types/form'

const jsonGlob = import.meta.glob('../../../forms/trip.json', { eager: true })

const formSchema = Object.values(jsonGlob)[0] as FormSchema

export const config = {
  props: {
    action: {
      name: 'action',
      label: 'Action del formulario',
      type: 'text',
      default: '/'
    },
    method: {
      name: 'method',
      label: 'Método para el formulario',
      type: 'text',
      default: 'POST'
    },
    data: {
      name: 'data',
      label: 'Datos del formulario',
      type: 'text',
      default: JSON.stringify(formSchema)
    }
  }
}