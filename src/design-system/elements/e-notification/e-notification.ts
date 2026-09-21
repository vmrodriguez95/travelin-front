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

  // Channel event that shows the toast. Defaults to the POI removal so the
  // existing delete flows keep working without naming it.
  @property({ type: String }) event = POI_REMOVE_EVENT

  @state() _loaded = false

  @state() _closing = false

  _channelBus: EventTarget | null = null

  // One timer per phase, so a re-render or a second channel event never
  // stacks a duplicate; all are cleared when the toast leaves the DOM.
  private _showTimer = 0

  private _closeTimer = 0

  private _autoCloseTimer = 0

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    super.connectedCallback()

    this._connectToChannel()
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    if (!this.channel) {
      this._showTimer = window.setTimeout(() => {
        this._loaded = true
      }, 100)
    }
  }

  // The auto-close countdown starts when the toast becomes visible, not on
  // every render: rendering must not schedule side effects.
  protected updated(changed: PropertyValues): void {
    if (!changed.has('_loaded')) return

    if (this._loaded) {
      this._scheduleAutoClose()
    } else {
      this._clearAutoClose()
    }
  }

  render() {
    const classes = classMap({
      'e-notification': true,
      'e-notification--show': this._loaded,
      'e-notification--closing': this._closing,
      [`e-notification--${this.type}`]: this.type
    })

    const styles = this.timeout > 0 ? { '--eNotificationTimeout': `${this.timeout}s` } : {}

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

  // A toast tied to a channel is reused every time its event fires, so it
  // only hides; a standalone one is shown once and leaves the DOM.
  private _close() {
    if (this._closing) return

    this._clearAutoClose()
    this._closing = true

    this._closeTimer = window.setTimeout(() => {
      if (this.channel) {
        this._loaded = false
        this._closing = false
      } else {
        this.remove()
      }
    }, 400)
  }

  private _scheduleAutoClose() {
    this._clearAutoClose()

    if (this.timeout <= 0) return

    this._autoCloseTimer = window.setTimeout(() => this._close(), this.timeout * 1000)
  }

  private _clearAutoClose() {
    window.clearTimeout(this._autoCloseTimer)
    this._autoCloseTimer = 0
  }

  private _clearTimers() {
    window.clearTimeout(this._showTimer)
    window.clearTimeout(this._closeTimer)
    this._clearAutoClose()
  }

  private _onChannelEvent = () => {
    this.type = 'success'
    this._loaded = true

    // When the toast was already visible `_loaded` does not change and
    // `updated` stays quiet, so the countdown is restarted from here.
    this._scheduleAutoClose()
  }

  disconnectedCallback(): void {
    this._clearTimers()
    this._disconnectFromChannel()
    super.disconnectedCallback()
  }

  private _connectToChannel() {
    if (!this.channel) return

    this._channelBus = getPoiChannel(this.channel)
    this._channelBus.addEventListener(this.event, this._onChannelEvent as EventListener)
  }

  private _disconnectFromChannel() {
    if (!this._channelBus) return
    this._channelBus.removeEventListener(this.event, this._onChannelEvent as EventListener)
    this._channelBus = null
  }
}
