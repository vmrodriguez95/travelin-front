export const config = {
  props: {
    apiKey: {
      name: 'apiKey',
      label: 'Google Maps API Key',
      type: 'text',
      default: ''
    },
    mapId: {
      name: 'mapId',
      label: 'Google Map ID',
      type: 'text',
      default: 'DEMO_MAP_ID'
    },
    latitude: {
      name: 'latitude',
      label: 'Latitud',
      type: 'text',
      default: ''
    },
    longitude: {
      name: 'longitude',
      label: 'Longitud',
      type: 'text',
      default: ''
    },
    markers: {
      name: 'markers',
      label: 'Markers (JSON)',
      type: 'text',
      default: '[]'
    }
  }
}
