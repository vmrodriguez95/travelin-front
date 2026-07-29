import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type { Place } from '@ds/types/pois'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import {
  FORM_MODIFY_FIELDS_EVENT,
  MODAL_OPEN_EVENT,
  POI_CLEAR_EVENT,
  type FormModifyFieldsEventDetail,
  type GenericEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

// Styles
import styles from './c-poi-resume-form.style.scss?inline'

@customElement('c-poi-resume-form')
export class CPoiResumeForm extends LitElement {

  @property({ type: String }) button = ''

  @property({ type: String }) channel = ''

  @property({ type: String }) close = ''

  @property({ type: String }) info = 'Mostrar la información completa sobre el punto de interés'

  @property({ type: Boolean }) static = false

  @state() _data: Place | null = null

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
      'c-poi-resume-form': true,
      'c-poi-resume-form--static': this.static
    })

    const name = this._data.name
    const photo = this._data.image

    return html`
      <div class=${classes}>
        <div class="c-poi-resume-form__wrapper">
          <div class="c-poi-resume-form__head">
            <img class="c-poi-resume-form__img" src=${photo} alt="Picture about ${name}" width="64" height="64" loading="lazy" />
          </div>
          <div class="c-poi-resume-form__details">
            <div class="c-poi-resume-form__column">
              <p class="c-poi-resume-form__text">${name}</p>
              ${map(this._data.address, (chunk: any, index: number) => when(index > 0, () => html`
                <p class="c-poi-resume-form__subtext">${chunk.longText}</p>
              `))}
            </div>
            <div class="c-poi-resume-form__column">
            ${when(this.button, () => html`
              <e-button size="thin" @click=${this._showInfo} aria-label=${this.info}>
                <span class="c-poi-resume-form__text-button">${this.button}</span>
              </e-button>
            `)}
            </div>
          </div>
        </div>
        ${when(this.close, () => html`
          <button class="c-poi-resume-form__close" type="button" @click=${this._onClose} aria-label=${this.close}>
            <e-icon icon="close" size="m"></e-icon>
          </button>
        `)}
      </div>
    `
  }

  private _showInfo() {
    if (!this._data) return

    this._channel.dispatch<FormModifyFieldsEventDetail>(FORM_MODIFY_FIELDS_EVENT, {
      fields: {
        location: this._data.location,
        name: this._data.name,
        coordinates: this._data.coordinates,
        address: `${this._data.name}, ${this._data.address}`,
        types: this._data.types,
        city: this._data.city,
        locality: this._data.locality,
        country: this._data.country,
        iso: this._data.iso,
        image: this._data.image,
      },
      source: this
    })

    this._channel.dispatch(MODAL_OPEN_EVENT)
  }

  private _onClose() {
    this._resetData()

    this._channel.dispatch<GenericEventDetail>(POI_CLEAR_EVENT, { source: this })
  }

  private _onSelectionChange(detail: PoiSelectEventDetail) {
    this._data = detail.data as Place
  }

  private _resetData() {
    this._data = null
  }

  private _onSelectionClear() {
    this._resetData()
  }
}
