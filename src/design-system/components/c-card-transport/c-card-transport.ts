import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { map } from 'lit/directives/map.js'

// Types
import type { PoiTransport, TransportSegment } from '@ds/types/pois'

// Utils
import { getTimeFrom } from '@ds/utils/date.utils'
import {
  getPoiChannel,
  POI_CLEAR_EVENT,
  POI_SELECT_EVENT,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

// Styles
import styles from './c-card-transport.style.scss?inline'

@customElement('c-card-transport')
export class CCardTransport extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data!: PoiTransport

  @property({ type: String }) icon = ''

  @property({ type: String }) channel = ''

  @property({ type: Boolean, reflect: true }) active = false

  _channelBus: EventTarget | null = null
  _isSelectedData = false

  connectedCallback() {
    super.connectedCallback()

    this._listenModalSuccessEvent()
    this._connectToChannel()
  }

  disconnectedCallback() {
    document.removeEventListener('fetch-success', this._onFetchSuccess as EventListener)
    this._disconnectFromChannel()

    super.disconnectedCallback()
  }

  protected updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('channel')) {
      this._disconnectFromChannel()
      this._connectToChannel()
    }
  }

  render() {
    const classes = classMap({
      'c-card-transport': true,
      'c-card-transport--active': this.active
    })

    return html`
      <div class=${classes} role="button" tabindex="0" @click=${this._onClick} @keydown=${this._onKeydown}>
        <div class="c-card-transport__head">
          <e-icon class="c-card-transport__icon" icon=${this.icon} size="xl"></e-icon>
        </div>
        <div class="c-card-transport__content">
          ${map(this.data.segments, (item: TransportSegment) => html`
            <p class="c-card-transport__segment">
              <span>${item.origin.code} ${getTimeFrom(item.origin.date)}</span> <span class="c-card-transport__duration">${item.duration}</span> <span>${item.destiny.code} ${getTimeFrom(item.destiny.date)}</span>
            </p>
          `)}
        </div>
        <div class="c-card-transport__end">
          <slot name="action"></slot>
        </div>
      </div>
    `
  }

  private _onKeydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      this._onClick()
    }
  }

  private _onClick = () => {
    if (!this._channelBus) return

    this._channelBus.dispatchEvent(new CustomEvent<PoiSelectEventDetail>(POI_SELECT_EVENT, {
      detail: {
        data: this.data,
        source: this,
        view: 'detail'
      }
    }))
  }

  private _removeFromDOM() {
    this.remove()
  }

  private _onFetchSuccess = (ev: Event) => {
    const event = ev as CustomEvent

    if (event.detail.data.id === this.data.id) {
      if (this._isSelectedData) {
        this._channelBus?.dispatchEvent(new CustomEvent(POI_CLEAR_EVENT))
      }

      this._removeFromDOM()
    }
  }

  private _listenModalSuccessEvent() {
    document.addEventListener('fetch-success', this._onFetchSuccess as EventListener)
  }

  private _connectToChannel() {
    if (!this.channel) return

    this._channelBus = getPoiChannel(this.channel)
    this._channelBus.addEventListener(POI_SELECT_EVENT, this._onSelectionChange as EventListener)
    this._channelBus.addEventListener(POI_CLEAR_EVENT, this._onSelectionClear as EventListener)
  }

  private _disconnectFromChannel() {
    if (!this._channelBus) return

    this._channelBus.removeEventListener(POI_SELECT_EVENT, this._onSelectionChange as EventListener)
    this._channelBus.removeEventListener(POI_CLEAR_EVENT, this._onSelectionClear as EventListener)
    this._channelBus = null
  }

  private _onSelectionChange = (ev: Event) => {
    const event = ev as CustomEvent<PoiSelectEventDetail>

    this._isSelectedData = event.detail.data.id === this.data.id
    this.active = this._isSelectedData
  }

  private _onSelectionClear = () => {
    this._isSelectedData = false
    this.active = false
  }
}
