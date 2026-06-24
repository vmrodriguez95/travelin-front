export interface GlobeGeoFeature {
  type: string
  properties: {
    ADMIN: string
    ISO_A2: string
    [key: string]: unknown
  }
  geometry: object
}
