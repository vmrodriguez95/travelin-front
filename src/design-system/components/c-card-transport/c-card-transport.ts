import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { map } from 'lit/directives/map.js'

// Types
import type { PoiTransport, TransportSegment } from '@ds/types/pois'

// Controllers
import { PoiChannelController } from '@ds/controllers/poi-channel.controller'

// Utils
import { printTime } from '@ds/utils/date.utils'
import { scrollIntoNearestVerticalContainer, scrollToPageEnd } from '@ds/utils/action.utils'
import {
  POI_CLEAR_EVENT,
  POI_HOVER_CLEAR_EVENT,
  POI_HOVER_EVENT,
  POI_REMOVE_EVENT,
  POI_SELECT_EVENT,
  type PoiHoverEventDetail,
  type PoiRemoveEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

// Mixins
import { Responsive } from '@ds/mixins/responsive'

// Styles
import styles from './c-card-transport.style.scss?inline'

@customElement('c-card-transport')
export class CCardTransport extends Responsive(LitElement) {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data!: PoiTransport

  @property({ type: String }) icon = ''

  @property({ type: String }) channel = ''

  @property({ type: Boolean, reflect: true }) active = false

  @query('.c-card-transport') _card!: HTMLElement

  _isSelectedData = false

  private _channel = new PoiChannelController(
    this,
    () => this.channel,
    {
      onSelect: (detail) => this._onSelectionChange(detail),
      onClear: () => this._onSelectionClear(),
    }
  )

  connectedCallback() {
    super.connectedCallback()

    this._listenModalSuccessEvent()
  }

  disconnectedCallback() {
    document.removeEventListener('fetch-success', this._onFetchSuccess as EventListener)

    super.disconnectedCallback()
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
          <e-icon class="c-card-transport__icon" icon=${this.icon} size=${this.breakpoint === 'sm' ? 'l' : 'xl'}></e-icon>
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
    this._channel.dispatch<PoiSelectEventDetail>(POI_SELECT_EVENT, {
      data: this.data,
      source: this,
      view: 'detail'
    })

    scrollToPageEnd()
  }

  private _onHoverStart = () => {
    this._channel.dispatch<PoiHoverEventDetail>(POI_HOVER_EVENT, {
      data: this.data,
      source: this
    })
  }

  private _onHoverEnd = () => {
    this._channel.dispatch(POI_HOVER_CLEAR_EVENT, { source: this })
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
      this._channel.dispatch<PoiRemoveEventDetail>(POI_REMOVE_EVENT, {
        data: this.data,
        source: this
      })

      if (this._isSelectedData) {
        this._channel.dispatch(POI_CLEAR_EVENT)
      }

      this._removeFromDOM()
    }
  }

  private _listenModalSuccessEvent() {
    document.addEventListener('fetch-success', this._onFetchSuccess as EventListener)
  }

  private async _focusSelectedCard() {
    await this.updateComplete

    scrollIntoNearestVerticalContainer(this)
    this._card?.focus({ preventScroll: true })
  }

  private _onSelectionChange(detail: PoiSelectEventDetail) {
    this._isSelectedData = detail.data.id === this.data.id
    this.active = this._isSelectedData

    if (this._isSelectedData && detail.source !== this) {
      this._focusSelectedCard()
    }
  }

  private _onSelectionClear() {
    this._isSelectedData = false
    this.active = false
  }
}
