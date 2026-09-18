export interface Collection {
  id: string
  name: string
  icon?: string
}

// What the server answers after saving a POI into its collections.
export interface SavesResponse {
  data: {
    idPoi: string
    collections: Array<Collection>
  }
}
