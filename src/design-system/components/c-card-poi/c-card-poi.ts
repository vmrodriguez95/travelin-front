import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

// Types
import type { Poi, PoiHotel, Reminder, Note } from '@ds/types/pois'

// Utils
import {
  getPoiChannel,
  isResumeViewType,
  POI_CLEAR_EVENT,
  POI_SELECT_EVENT,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'
import { scrollToPageEnd } from '@ds/utils/action.utils'

// Styles
import styles from './c-card-poi.style.scss?inline'

@customElement('c-card-poi')
export class CCardPoi extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data!: Poi | PoiHotel | Reminder | Note

  @property({ type: String }) icon = ''

  @property({ type: String }) type = ''

  @property({ type: String }) channel = ''

  @property({ type: Boolean, reflect: true }) active = false

  @state() removing = false

  @state() hasImage = false

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
      'c-card-poi': true,
      'c-card-poi--active': this.active,
      'c-card-poi--removing': this.removing
    })

    const headClasses = classMap({
      'c-card-poi__head': true,
      'c-card-poi__head--reminder': this.icon === 'reminder'
    })

    return html`
      <div class=${classes} role="button" tabindex="0" @click=${this._onClick} @keydown=${this._onKeydown}>
        <div class=${headClasses}>
          <slot name="img" @slotchange=${this.handleSlotChange}></slot>
          ${when(this.icon && !this.hasImage,
            () => html`<e-icon class="c-card-poi__icon" icon=${this.icon} size="xl"></e-icon>`
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
    if (!this._channelBus) return

    this._channelBus.dispatchEvent(new CustomEvent<PoiSelectEventDetail>(POI_SELECT_EVENT, {
      detail: {
        data: this.data,
        source: this,
        view: isResumeViewType(this.type) ? 'resume' : 'detail'
      }
    }))

    scrollToPageEnd()
  }

  private _removeFromDOM() {
    this.removing = true
    setTimeout(() => { this.remove() }, 501)
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
