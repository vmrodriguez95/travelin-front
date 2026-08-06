import type { ReactiveController, ReactiveControllerHost } from 'lit'
import {
  getPoiChannel,
  POI_SELECT_EVENT,
  POI_CLEAR_EVENT,
  POI_HOVER_EVENT,
  POI_HOVER_CLEAR_EVENT,
  POI_REMOVE_EVENT,
  DAY_HOVER_EVENT,
  DAY_HOVER_CLEAR_EVENT,
  DAY_ACTIVE_EVENT,
  MENU_TOGGLE_EVENT,
  FORM_MODIFY_FIELDS_EVENT,
  FORM_FILL_EVENT,
  TAB_SELECT_EVENT,
  MODAL_OPEN_EVENT,
  type PoiSelectEventDetail,
  type GenericEventDetail,
  type PoiHoverEventDetail,
  type PoiRemoveEventDetail,
  type DayHoverEventDetail,
  type DayActiveEventDetail,
  type MenuToggleEventDetail,
  type FormModifyFieldsEventDetail,
  type FormFillEventDetail,
  type TabSelectEventDetail
} from '@ds/utils/poi-channel.utils'

export interface ChannelHandlers {
  onSelect?: (detail: PoiSelectEventDetail) => void
  onClear?: (detail: GenericEventDetail) => void
  onHover?: (detail: PoiHoverEventDetail) => void
  onHoverClear?: () => void
  onRemove?: (detail: PoiRemoveEventDetail) => void
  onDayHover?: (detail: DayHoverEventDetail) => void
  onDayHoverClear?: () => void
  onDayActive?: (detail: DayActiveEventDetail) => void
  onMenuToggle?: (detail: MenuToggleEventDetail) => void
  onModalOpen?: () => void
  onFormModifyFields?: (detail: FormModifyFieldsEventDetail) => void
  onFormFill?: (detail: FormFillEventDetail) => void
  onTabSelect?: (detail: TabSelectEventDetail) => void
}

export class ChannelController implements ReactiveController {
  private getChannel: () => string
  private handlers: ChannelHandlers

  private _bus: EventTarget | null = null
  private _currentChannel = ''
  private _boundHandlers = new Map<string, EventListener>()

  constructor(host: ReactiveControllerHost, getChannel: () => string, handlers: ChannelHandlers) {
    this.getChannel = getChannel
    this.handlers = handlers
    host.addController(this)
  }

  get bus(): EventTarget | null {
    return this._bus
  }

  hostConnected() {
    this._connect()
  }

  hostDisconnected() {
    this._disconnect()
  }

  hostUpdated() {
    const channel = this.getChannel()
    if (channel !== this._currentChannel) {
      this._disconnect()
      this._connect()
    }
  }

  dispatch<T>(eventName: string, detail?: T, options?: CustomEventInit): void {
    if (!this._bus) return
    this._bus.dispatchEvent(new CustomEvent<T>(eventName, { ...options, detail }))
  }

  private _connect() {
    const channel = this.getChannel()
    if (!channel) return

    this._bus = getPoiChannel(channel)
    this._currentChannel = channel

    const add = (eventName: string, handler: EventListener) => {
      this._boundHandlers.set(eventName, handler)
      this._bus!.addEventListener(eventName, handler)
    }

    const wrap = <T>(handler: (detail: T) => void) => (e: Event) => handler((e as CustomEvent<T>).detail)

    if (this.handlers.onSelect) add(POI_SELECT_EVENT, wrap(this.handlers.onSelect))
    if (this.handlers.onClear) add(POI_CLEAR_EVENT, wrap(this.handlers.onClear))
    if (this.handlers.onHover) add(POI_HOVER_EVENT, wrap(this.handlers.onHover))
    if (this.handlers.onHoverClear) add(POI_HOVER_CLEAR_EVENT, this.handlers.onHoverClear)
    if (this.handlers.onRemove) add(POI_REMOVE_EVENT, wrap(this.handlers.onRemove))
    if (this.handlers.onDayHover) add(DAY_HOVER_EVENT, wrap(this.handlers.onDayHover))
    if (this.handlers.onDayHoverClear) add(DAY_HOVER_CLEAR_EVENT, this.handlers.onDayHoverClear)
    if (this.handlers.onDayActive) add(DAY_ACTIVE_EVENT, wrap(this.handlers.onDayActive))
    if (this.handlers.onMenuToggle) add(MENU_TOGGLE_EVENT, wrap(this.handlers.onMenuToggle))
    if (this.handlers.onModalOpen) add(MODAL_OPEN_EVENT, wrap(this.handlers.onModalOpen))
    if (this.handlers.onFormModifyFields) add(FORM_MODIFY_FIELDS_EVENT, wrap(this.handlers.onFormModifyFields))
    if (this.handlers.onFormFill) add(FORM_FILL_EVENT, wrap(this.handlers.onFormFill))
    if (this.handlers.onTabSelect) add(TAB_SELECT_EVENT, wrap(this.handlers.onTabSelect))
  }

  private _disconnect() {
    if (!this._bus) return

    for (const [eventName, handler] of this._boundHandlers) {
      this._bus.removeEventListener(eventName, handler)
    }

    this._boundHandlers.clear()
    this._bus = null
    this._currentChannel = ''
  }
}
