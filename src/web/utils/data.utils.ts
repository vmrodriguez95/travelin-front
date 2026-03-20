const jsonGlob = import.meta.glob('./../../data/**.json', { eager: true })

const dataCollections = Object.values(jsonGlob)[0] as any

export function getAllData() {
  return dataCollections.default
}