export const config = {
  props: {
    poiType: {
      name: 'poiType',
      label: 'Tipo de POI a generar',
      type: 'select',
      options: ['poi_transport', 'poi_hotel'],
      default: 'poi_transport'
    },
    label: {
      name: 'label',
      label: 'Etiqueta del campo de archivo',
      type: 'text',
      default: 'Sube tu voucher'
    },
    model: {
      name: 'model',
      label: 'URL del modelo LiteRT-LM (para PDF)',
      type: 'text',
      default: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm'
    }
  },
  slots: {
    title: 'Título que explica el componente',
    description: 'Descripción de cómo funciona'
  }
}
