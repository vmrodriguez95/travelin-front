import type { Note, Poi, PoiHotel, PoiTransport, Reminder } from '@ds/types/pois'

export const POI_SELECT_EVENT = 'poi-select'
export const POI_CLEAR_EVENT = 'poi-clear'
export const POI_HOVER_EVENT = 'poi-hover'
export const POI_HOVER_CLEAR_EVENT = 'poi-hover-clear'
export const POI_REMOVE_EVENT = 'poi-remove'
export const DAY_HOVER_EVENT = 'day-hover'
export const DAY_HOVER_CLEAR_EVENT = 'day-hover-clear'
export const DAY_ACTIVE_EVENT = 'day-active'

export type PoiChannelData = Poi | PoiHotel | PoiTransport | Reminder | Note

export type PoiChannelView = 'resume' | 'detail'

export interface PoiSelectEventDetail {
  data: PoiChannelData
  source?: EventTarget | null
  view: PoiChannelView
}

export interface PoiClearEventDetail {
  source?: EventTarget | null
}

export interface PoiHoverEventDetail {
  data: PoiChannelData
  source?: EventTarget | null
}

export interface PoiRemoveEventDetail {
  data: PoiChannelData
  source?: EventTarget | null
}

export interface DayHoverEventDetail {
  day: number
  source?: EventTarget | null
}

export interface DayActiveEventDetail {
  value: string
  source?: EventTarget | null
}

const channels = new Map<string, EventTarget>()

export function getPoiChannel(channel: string): EventTarget {
  if (!channels.has(channel)) {
    channels.set(channel, new EventTarget())
  }

  return channels.get(channel)!
}

export function isResumeViewType(type: string | null) {
  return type === 'poi' || type === 'poi_hotel'
}
