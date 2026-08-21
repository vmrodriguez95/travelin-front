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
    endpoint: {
      name: 'endpoint',
      label: 'Endpoint de perfiles de proveedor (.pkpass)',
      type: 'text',
      default: '/api/poi_transport/pkpass'
    },
    endpointPdf: {
      name: 'endpointPdf',
      label: 'Endpoint de perfiles de proveedor (.pdf)',
      type: 'text',
      default: '/api/poi_transport/pdf'
    }
  },
  slots: {
    title: 'Título que explica el componente',
    description: 'Descripción de cómo funciona'
  }
}
