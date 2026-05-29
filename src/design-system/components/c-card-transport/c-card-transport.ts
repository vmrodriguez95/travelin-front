import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { map } from 'lit/directives/map.js'

// Types
import type { PoiTransport, TransportSegment } from '@ds/types/pois'

// Utils
import { printTime } from '@ds/utils/date.utils'
import { scrollIntoNearestVerticalContainer, scrollToPageEnd } from '@ds/utils/action.utils'
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

// Styles
import styles from './c-card-transport.style.scss?inline'

@customElement('c-card-transport')
export class CCardTransport extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data!: PoiTransport

  @property({ type: String }) icon = ''

  @property({ type: String }) channel = ''

  @property({ type: Boolean, reflect: true }) active = false

  @query('.c-card-transport') _card!: HTMLElement

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
      <div
        class=${classes}
        role="button"
        tabindex="0"
        @click=${this._onClick}
        @keydown=${this._onKeydown}
        @mouseenter=${this._onHoverStart}
        @mouseleave=${this._onHoverEnd}
        @focus=${this._onHoverStart}
        @blur=${this._onHoverEnd}
      >
        <div class="c-card-transport__head">
          <e-icon class="c-card-transport__icon" icon=${this.icon} size="xl"></e-icon>
        </div>
        <div class="c-card-transport__content">
          <div class="c-card-transport__segments">
            ${map(this.data.segments, (item: TransportSegment) => html`
              <p class="c-card-transport__segment">
                <span>${this._getCity(item.origin.address)} ${printTime(item.origin.date)}</span> <span class="c-card-transport__duration">${item.duration}</span> <span>${this._getCity(item.destiny.address)} ${printTime(item.destiny.date)}</span>
              </p>
            `)}
          </div>
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

    scrollToPageEnd()
  }

  private _onHoverStart = () => {
    if (!this._channelBus) return

    this._channelBus.dispatchEvent(new CustomEvent<PoiHoverEventDetail>(POI_HOVER_EVENT, {
      detail: {
        data: this.data,
        source: this
      }
    }))
  }

  private _onHoverEnd = () => {
    if (!this._channelBus) return

    this._channelBus.dispatchEvent(new CustomEvent(POI_HOVER_CLEAR_EVENT, {
      detail: {
        source: this
      }
    }))
  }

  private _getCity(address: string) {
    return address.split(', ')[0]
  }

  private _removeFromDOM() {
    this.remove()
  }

  private _onFetchSuccess = (ev: Event) => {
    const event = ev as CustomEvent

    if (event.detail.data.id === this.data.id) {
      this._channelBus?.dispatchEvent(new CustomEvent<PoiRemoveEventDetail>(POI_REMOVE_EVENT, {
        detail: {
          data: this.data,
          source: this
        }
      }))

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

  private async _focusSelectedCard() {
    await this.updateComplete

    scrollIntoNearestVerticalContainer(this)
    this._card?.focus({ preventScroll: true })
  }

  private _onSelectionChange = (ev: Event) => {
    const event = ev as CustomEvent<PoiSelectEventDetail>

    this._isSelectedData = event.detail.data.id === this.data.id
    this.active = this._isSelectedData

    if (this._isSelectedData && event.detail.source !== this) {
      this._focusSelectedCard()
    }
  }

  private _onSelectionClear = () => {
    this._isSelectedData = false
    this.active = false
  }
}
