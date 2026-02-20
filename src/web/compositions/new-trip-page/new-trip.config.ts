import type { FormSchema } from '@web/types/form'

const jsonGlob = import.meta.glob('../../../forms/trip.json', { eager: true })

const formSchema = Object.values(jsonGlob)[0] as FormSchema

export const config = {
  props: {
    data: {
      name: 'data',
      label: 'Datos del formulario',
      type: 'text',
      default: JSON.stringify(formSchema)
    },
  }
}