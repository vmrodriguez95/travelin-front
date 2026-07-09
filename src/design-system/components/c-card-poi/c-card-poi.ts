import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

// Types
import type { Poi, PoiHotel, Reminder, Note } from '@ds/types/pois'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import {
  isResumeViewType,
  POI_CLEAR_EVENT,
  POI_HOVER_CLEAR_EVENT,
  POI_HOVER_EVENT,
  POI_REMOVE_EVENT,
  POI_SELECT_EVENT,
  type PoiHoverEventDetail,
  type PoiRemoveEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'
import { scrollIntoNearestVerticalContainer, scrollToPageEnd } from '@ds/utils/action.utils'

// Mixins
import { Responsive } from '@ds/mixins/responsive'

// Styles
import styles from './c-card-poi.style.scss?inline'

@customElement('c-card-poi')
export class CCardPoi extends Responsive(LitElement) {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data!: Poi | PoiHotel | Reminder | Note

  @property({ type: String }) icon = ''

  @property({ type: String }) type = ''

  @property({ type: String }) channel = ''

  @property({ type: Boolean, reflect: true }) active = false

  @query('.c-card-poi') _card!: HTMLElement

  @state() removing = false

  @state() hasImage = false

  _isSelectedData = false

  private _channel = new ChannelController(
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
      'c-card-poi': true,
      'c-card-poi--active': this.active,
      'c-card-poi--removing': this.removing
    })

    const headClasses = classMap({
      'c-card-poi__head': true,
      'c-card-poi__head--reminder': this.icon === 'reminder'
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
        <div class=${headClasses}>
          <slot name="img" @slotchange=${this.handleSlotChange}></slot>
          ${when(this.icon && !this.hasImage,
            () => html`<e-icon class="c-card-poi__icon" icon=${this.icon} size=${this.breakpoint === 'sm' ? 'l' : 'xl'}></e-icon>`
          )}
        </div>
        <div class="c-card-poi__content">
          <slot name="title"></slot>
          <slot name="description"></slot>
        </div>
        <div class="c-card-poi__end">
          <slot name="date"></slot>

          <div class="c-card-poi__actions">
            <slot name="action"></slot>
          </div>
        </div>
      </div>
    `
  }

  private handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement

    this.hasImage = slot.assignedElements().length > 0
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
      view: isResumeViewType(this.type) ? 'resume' : 'detail'
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

  private _removeFromDOM() {
    this.removing = true
    setTimeout(() => { this.remove() }, 501)
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
