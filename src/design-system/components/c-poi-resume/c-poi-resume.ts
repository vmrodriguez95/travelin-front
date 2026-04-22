import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'

// Types
import type { Poi, PoiHotel } from '@ds/types/pois'

// Utils
import {
  getPoiChannel,
  POI_CLEAR_EVENT,
  POI_SELECT_EVENT,
  type PoiClearEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

// Styles
import styles from './c-poi-resume.style.scss?inline'

@customElement('c-poi-resume')
export class CPoiResume extends LitElement {

  @property({ type: String }) channel = ''

  @state() _data: Poi | PoiHotel | null = null

  _channelBus: EventTarget | null = null

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback() {
    super.connectedCallback()

    this._connectToChannel()
  }

  disconnectedCallback() {
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
    if (!this._data) return ''

    return html`
      <div class="c-poi-resume">
        <div class="c-poi-resume__head">
          <img class="c-poi-resume__img" src=${this._data?.image} alt="Picture about ${this._data?.name}" width="64" height="64" loading="lazy" />
        </div>
        <div class="c-poi-resume__details">
          <div class="c-poi-resume__column">
            ${this.getAddress()}
          </div>
          <div class="c-poi-resume__column">
            <e-button size="thin" @click=${this._showInfo}>
              Info
            </e-button>
            <button class="c-poi-resume__close" @click=${this._onClose}>
              <e-icon icon="close" size="m"></e-icon>
            </button>
          </div>
        </div>
      </div>
    `
  }

  private getAddress() {
    if (!this._data) return ''

    const address = this._data.address.split(',')

    return map(address, (chunk: string, index: number) => html`
      <p class="${index === 0 ? 'c-poi-resume__text' : 'c-poi-resume__subtext'}">${chunk.trim()}</p>
    `)
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

  private _showInfo() {
    if (!this._data) return

    this._channelBus?.dispatchEvent(new CustomEvent<PoiSelectEventDetail>(POI_SELECT_EVENT, {
      detail: {
        data: this._data,
        source: this,
        view: 'detail'
      }
    }))
  }

  private _onClose() {
    this._resetData()
    this._channelBus?.dispatchEvent(new CustomEvent<PoiClearEventDetail>(POI_CLEAR_EVENT, {
      detail: {
        source: this
      }
    }))
  }

  private _onSelectionChange = (ev: Event) => {
    const event = ev as CustomEvent<PoiSelectEventDetail>

    this._data = event.detail.view === 'resume' ? event.detail.data as Poi | PoiHotel : null
  }

  private _resetData() {
    this._data = null
  }

  private _onSelectionClear = () => {
    this._resetData()
  }
}
