import type { Note, Poi, PoiHotel, PoiTransport, Reminder, Place } from '@ds/types/pois.types'

export const POI_SELECT_EVENT = 'poi-select'
export const POI_CLEAR_EVENT = 'poi-clear'
export const POI_HOVER_EVENT = 'poi-hover'
export const POI_HOVER_CLEAR_EVENT = 'poi-hover-clear'
export const POI_REMOVE_EVENT = 'poi-remove'
export const POI_MOVE_EVENT = 'poi-move'
export const DAY_HOVER_EVENT = 'day-hover'
export const DAY_HOVER_CLEAR_EVENT = 'day-hover-clear'
export const DAY_ACTIVE_EVENT = 'day-active'
export const MENU_TOGGLE_EVENT = 'menu-toggle'
export const MODAL_OPEN_EVENT = 'modal-open'
export const FORM_MODIFY_FIELDS_EVENT = 'form-modify-fields'
export const FORM_FILL_EVENT = 'form-fill'
export const FORM_SUBMIT_SUCCESS_EVENT = 'form-submit-success'
export const TAB_SELECT_EVENT = 'tab-select'

export type PoiChannelData = Poi | PoiHotel | PoiTransport | Reminder | Note | Place

export type PoiChannelView = 'resume' | 'detail'

export interface GenericEventDetail {
  source?: EventTarget | null
}

export interface PoiSelectEventDetail {
  data: PoiChannelData
  source?: EventTarget | null
  view: PoiChannelView
}

export interface PoiHoverEventDetail {
  data: PoiChannelData
  source?: EventTarget | null
}

export interface PoiRemoveEventDetail {
  data: PoiChannelData
  source?: EventTarget | null
}

// The POI leaves this list because it now lives in another itinerary.
export interface PoiMoveEventDetail {
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

export interface MenuToggleEventDetail {
  hidden: boolean
  source?: EventTarget | null
}

export interface FormModifyFieldsEventDetail {
  fields: Record<string, any>
  source?: EventTarget | null
}

export interface FormFillEventDetail {
  data: Record<string, any>
  source?: EventTarget | null
}

export interface FormSubmitSuccessEventDetail {
  data: unknown
  source?: EventTarget | null
}

export interface TabSelectEventDetail {
  index: number
  source?: EventTarget | null
}

// Every event the channel carries, with the detail it travels with. A new
// event is added here and in the constants above; the controller that wires
// handlers reads this map and needs no change.
export interface ChannelEventMap {
  [POI_SELECT_EVENT]: PoiSelectEventDetail
  [POI_CLEAR_EVENT]: GenericEventDetail
  [POI_HOVER_EVENT]: PoiHoverEventDetail
  [POI_HOVER_CLEAR_EVENT]: GenericEventDetail
  [POI_REMOVE_EVENT]: PoiRemoveEventDetail
  [POI_MOVE_EVENT]: PoiMoveEventDetail
  [DAY_HOVER_EVENT]: DayHoverEventDetail
  [DAY_HOVER_CLEAR_EVENT]: GenericEventDetail
  [DAY_ACTIVE_EVENT]: DayActiveEventDetail
  [MENU_TOGGLE_EVENT]: MenuToggleEventDetail
  [MODAL_OPEN_EVENT]: GenericEventDetail
  [FORM_MODIFY_FIELDS_EVENT]: FormModifyFieldsEventDetail
  [FORM_FILL_EVENT]: FormFillEventDetail
  [FORM_SUBMIT_SUCCESS_EVENT]: FormSubmitSuccessEventDetail
  [TAB_SELECT_EVENT]: TabSelectEventDetail
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
