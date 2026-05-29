import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'

// Utils
import {
  getPoiChannel,
  POI_CLEAR_EVENT,
  POI_HOVER_CLEAR_EVENT,
  POI_HOVER_EVENT,
  POI_REMOVE_EVENT,
  POI_SELECT_EVENT,
  type PoiHoverEventDetail,
  type PoiRemoveEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

import styles from './e-notification.style.scss?inline'

@customElement('e-notification')
export class ENotification extends LitElement {

  @property({ type: String }) type = 'info' // 'success' | 'warning' | 'error' | info

  @property({ type: Number }) timeout = 0

  @property({ type: String }) channel = ''

  @state() _loaded = false

  @state() _closing = false

  _channelBus: EventTarget | null = null

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    super.connectedCallback()

    this._connectToChannel()
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    if (!this.channel) {
      setTimeout(() => {
        this._loaded = true
      }, 100)
    }
  }

  render() {
    const classes = classMap({
      'e-notification': true,
      'e-notification--show': this._loaded,
      'e-notification--closing': this._closing,
      [`e-notification--${this.type}`]: this.type
    })

    const styles = {}
    if (this.timeout > 0) {
      Object.defineProperty(styles, '--eNotificationTimeout', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: `${this.timeout}s`
      })

      if (!this.channel) {
        setTimeout(() => this._close(), this.timeout * 1000)
      }
    }

    return html`
      <div class=${classes}>
        <button class="e-notification__close" type="button" @click=${this._close}>
          <e-icon icon="close" size="s"></e-icon>
        </button>
        <e-icon icon=${this._getIcon()} size="l"></e-icon> <slot></slot>
        ${when(this.timeout && this._loaded && !this._closing, () => html`<span class="e-notification__timeout" style=${styleMap(styles)}></span>`) }
      </div>
    `
  }

  private _getIcon() {
    switch (this.type) {
      case 'success':
        return 'check-circle'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'info'
    }
  }

  private _close() {
    this._closing = true
    setTimeout(() => this.remove(), 400)
  }

  private _onPoiRemoved = () => {
    this.type = 'success'
    this._loaded = true

    setTimeout(() => this._close(), this.timeout * 1000)
  }

  private _connectToChannel() {
    if (!this.channel) return

    this._channelBus = getPoiChannel(this.channel)
    this._channelBus.addEventListener(POI_REMOVE_EVENT, this._onPoiRemoved as EventListener)
  }
}
