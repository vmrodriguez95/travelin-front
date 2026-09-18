// A page-wide announcement that a record changed somewhere (a modal saved
// it, a card removed part of it). Every element holding a copy of that record
// merges the changes, so the screen stays current without asking the server.
export const DATA_UPDATE_EVENT = 'data-update'

export interface DataUpdateEventDetail {
  id: string
  changes: Record<string, unknown>
  source?: EventTarget | null
}

export function dispatchDataUpdate(detail: DataUpdateEventDetail) {
  document.dispatchEvent(new CustomEvent<DataUpdateEventDetail>(DATA_UPDATE_EVENT, { detail }))
}
