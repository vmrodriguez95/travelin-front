import type { FormSchema } from '@ds/components/c-form/c-form.types'

const jsonGlob = import.meta.glob('../../../forms/saves.json', { eager: true })
const formSchema = (Object.values(jsonGlob)[0] as { default: FormSchema[] }).default[0]

export const config = {
  props: {
    channel: {
      name: 'channel',
      label: 'Canal compartido con los triggers',
      type: 'text',
      default: 'demo-saves'
    },
    action: {
      name: 'action',
      label: 'Endpoint de guardado',
      type: 'text',
      default: '/api/saves.json'
    },
    heading: {
      name: 'heading',
      label: 'Título de la modal',
      type: 'text',
      default: 'Añadir a guardados'
    },
    submitLabel: {
      name: 'submitLabel',
      label: 'Etiqueta del botón de envío',
      type: 'text',
      default: 'Añadir POI'
    },
    close: {
      name: 'close',
      label: 'Etiqueta accesible del botón de cerrar',
      type: 'text',
      default: 'Cerrar'
    },
    data: {
      name: 'data',
      label: 'Schema del formulario',
      type: 'text',
      default: formSchema
    }
  }
}
