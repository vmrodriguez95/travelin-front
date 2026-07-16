import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type { Poi, PoiHotel } from '@ds/types/pois'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import {
  POI_CLEAR_EVENT,
  POI_SELECT_EVENT,
  type GenericEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

// Styles
import styles from './c-poi-resume.style.scss?inline'

@customElement('c-poi-resume')
export class CPoiResume extends LitElement {

  @property({ type: String }) icon = ''

  @property({ type: String }) button = ''

  @property({ type: String }) channel = ''

  @property({ type: String }) close = ''

  @property({ type: String }) info = 'Mostrar la información completa sobre el punto de interés'

  @property({ type: Boolean }) static = false

  @state() _data: Poi | PoiHotel | null = null

  private _channel = new ChannelController(
    this,
    () => this.channel,
    {
      onSelect: (detail) => this._onSelectionChange(detail),
      onClear: () => this._onSelectionClear(),
    }
  )

  static styles = css`${unsafeCSS(styles)}`

  render() {
    if (!this._data) return ''
    const classes = classMap({
      'c-poi-resume': true,
      'c-poi-resume--static': this.static
    })

    return html`
      <div class=${classes}>
        <div class="c-poi-resume__wrapper">
          <div class="c-poi-resume__head">
            <img class="c-poi-resume__img" src=${this._data?.image} alt="Picture about ${this._data?.name}" width="64" height="64" loading="lazy" />
          </div>
          <div class="c-poi-resume__details">
            <div class="c-poi-resume__column">
              ${this.getAddress()}
            </div>
            <div class="c-poi-resume__column">
            ${when(this.button || this.icon, () => html`
              <e-button size="thin" @click=${this._showInfo} aria-label=${this.info}>
                ${when(this.icon, () => html`<e-icon class="c-poi-resume__icon" icon=${this.icon} size="m"></e-icon>`)}
                ${when(this.button, () => html`<span class="c-poi-resume__text-button">${this.button}</span>`)}
              </e-button>
            `)}
            </div>
          </div>
        </div>
        ${when(this.close, () => html`
          <button class="c-poi-resume__close" type="button" @click=${this._onClose} aria-label=${this.close}>
            <e-icon icon="close" size="m"></e-icon>
          </button>
        `)}
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

  private _showInfo() {
    if (!this._data) return

    this._channel.dispatch<PoiSelectEventDetail>(POI_SELECT_EVENT, {
      data: this._data,
      source: this,
      view: 'detail'
    })
  }

  private _onClose() {
    this._resetData()

    this._channel.dispatch<GenericEventDetail>(POI_CLEAR_EVENT, { source: this })
  }

  private _onSelectionChange(detail: PoiSelectEventDetail) {
    this._data = detail.view === 'resume' ? detail.data as Poi | PoiHotel : null
  }

  private _resetData() {
    this._data = null
  }

  private _onSelectionClear() {
    this._resetData()
  }
}
