import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type { Place } from '@ds/types/pois.types'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import {
  FORM_MODIFY_FIELDS_EVENT,
  MODAL_OPEN_EVENT,
  POI_CLEAR_EVENT,
  type FormModifyFieldsEventDetail,
  type GenericEventDetail,
  type PoiSelectEventDetail,
  POI_SELECT_EVENT
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

  @property({ type: Object }) place: Place | null = null

  private _channel = new ChannelController(
    this,
    () => this.channel,
    {
      [POI_SELECT_EVENT]: (detail) => this._onSelectionChange(detail),
      [POI_CLEAR_EVENT]: () => this._onSelectionClear(),
    }
  )

  static styles = css`${unsafeCSS(styles)}`

  render() {
    if (!this.place) return ''
    const classes = classMap({
      'c-poi-resume-form': true,
      'c-poi-resume-form--static': this.static
    })

    const name = this.place.name
    const photo = this.place.image

    return html`
      <div class=${classes}>
        <div class="c-poi-resume-form__wrapper">
          <div class="c-poi-resume-form__head">
            <img class="c-poi-resume-form__img" src=${photo} alt="Picture about ${name}" width="64" height="64" loading="lazy" />
          </div>
          <div class="c-poi-resume-form__details">
            <div class="c-poi-resume-form__column">
              <p class="c-poi-resume-form__text">${name}</p>
              ${this._printAddress()}
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

  // A Google place brings its address as chunks; a POI already saved brings
  // it as one string. Both must read the same on screen.
  private _printAddress() {
    const address = this.place?.address as unknown

    if (Array.isArray(address)) {
      return map(address, (chunk: any, index: number) => when(index > 0, () => html`
        <p class="c-poi-resume-form__subtext">${chunk.longText}</p>
      `))
    }

    return when(address, () => html`
      <p class="c-poi-resume-form__subtext">${address}</p>
    `)
  }

  private _showInfo() {
    if (!this.place) return

    this._channel.dispatch<FormModifyFieldsEventDetail>(FORM_MODIFY_FIELDS_EVENT, {
      fields: {
        location: this.place.location,
        name: this.place.name,
        coordinates: this.place.coordinates,
        address: `${this.place.name}, ${this.place.address}`,
        types: this.place.types,
        city: this.place.city,
        locality: this.place.locality,
        country: this.place.country,
        iso: this.place.iso,
        image: this.place.image,
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
    this.place = detail.data as Place
  }

  private _resetData() {
    this.place = null
  }

  private _onSelectionClear() {
    this._resetData()
  }
}
