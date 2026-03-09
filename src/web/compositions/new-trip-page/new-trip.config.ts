import type { FormSchema } from '@ds/components/c-form/c-form.types'

const jsonGlob = import.meta.glob('../../../forms/trip.json', { eager: true })

const tripForms = Object.values(jsonGlob)[0] as any

const formSchema = tripForms.default.find((formSchema: FormSchema) => formSchema.form.method === 'POST')

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