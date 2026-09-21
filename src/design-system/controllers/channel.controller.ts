import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { getPoiChannel } from '@ds/utils/poi-channel.utils'
import type { ChannelHandlers } from './channel.controller.types'

export type { ChannelHandlers } from './channel.controller.types'

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

  // Each handler is wrapped once and listens under its own event name, so the
  // events the channel supports are decided by the map, not by this class.
  private _connect() {
    const channel = this.getChannel()
    if (!channel) return

    const bus = getPoiChannel(channel)

    this._bus = bus
    this._currentChannel = channel

    Object.entries(this.handlers).forEach(([eventName, handler]) => {
      if (!handler) return

      const listener = (event: Event) => handler((event as CustomEvent).detail)

      this._boundHandlers.set(eventName, listener)
      bus.addEventListener(eventName, listener)
    })
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
