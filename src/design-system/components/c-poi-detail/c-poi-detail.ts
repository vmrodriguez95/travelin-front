import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { map } from 'lit/directives/map.js'

// Types
import type { CSlider } from '../c-slider/c-slider'
import type {
  Poi,
  PoiHotel,
  PoiTransport,
  Reminder,
  Note,
  TransportSegment,
  TransportPerson
} from '@ds/types/pois'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import {
  POI_CLEAR_EVENT,
  type GenericEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

// Mixins
import { Responsive } from '@ds/mixins/responsive'

// Styles
import styles from './c-poi-detail.style.scss?inline'
import { BREAKPOINTS } from '@ds/utils/variables'

@customElement('c-poi-detail')
export class CPoiDetail extends Responsive(LitElement) {

  @property({ type: Number }) gap = 0

  @property({ type: String }) channel = ''

  @property({ type: String }) close = 'Cerrar detalle'

  @state() _height = 0

  @state() _data: Poi | PoiHotel | PoiTransport | Reminder | Note | null = null

  @query('c-slider') slider!: CSlider

  @queryAsync('.c-poi-detail') _container!: Promise<HTMLElement>

  private _channel = new ChannelController(
    this,
    () => this.channel,
    {
      onSelect: (detail) => this._onSelectionChange(detail),
      onClear: () => this._onSelectionClear(),
    }
  )

  static styles = css`${unsafeCSS(styles)}`

  protected updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('_data')) {
      this.slider?.reset()
    }
  }

  render() {
    const classes = classMap({
      'c-poi-detail': true,
      'c-poi-detail--active': this._data !== null,
      'c-poi-detail--transport': this._isTransport()
    })

    return html`
      <div class=${classes}>
        <div class="c-poi-detail__actions">
          <button class="c-poi-detail__close" type="button" @click=${this._onClose.bind(this)} aria-label=${this.close}>
            <e-icon icon="close" size=${this.breakpoint === 'sm' ? 'm' : 'l'}></e-icon>
          </button>
        </div>
        <div class="c-poi-detail__content">
          ${this._printData()}
        </div>
      </div>
    `
  }

  private _printData() {
    if (!this._data) return ''
    
    return html`
      <c-slider>
        ${this._isTransport() ? this.printFlightSegments(this._data as PoiTransport) : ''}

        ${'notes' in this._data ? html`
          <div>
            ${this._data.notes.length === 0 ? html`
              <div class="c-poi-detail__empty">
                <p class="c-poi-detail__text">Todavía no has añadido ninguna nota.</p>
              </div>
            ` : html`
              ${map(this._data?.notes, (note) => html`
                <div class="c-poi-detail__note">
                  <e-icon icon=${note.icon} size=${this.breakpoint === 'sm' ? 'l' : 'xl'}></e-icon>
                  <p class="c-poi-detail__text">${note.text}</p>
                </div>
              `)}
            `}
          </div>
        ` : ''}
      </c-slider>
    `
  }

  private _isTransport() {
    return this._data?.type === 'poi_transport'
  }

  private _getPassengerByName(passengers: TransportPerson[], name: string) {
    return passengers.find((passenger) => passenger.name === name)
  }

  private printFlightSegments(data: PoiTransport) {
    return map(
      data.passengers,
      (passenger: TransportPerson) => map(
        data.segments,
        (segment: TransportSegment) => html`
          <div>  
            <e-ticket .data=${segment} .passenger=${this._getPassengerByName(segment.passengers, passenger.name)} type=${data.typeTransport}></e-ticket>
          </div>
        `)
      )
  }

  private _onClose() {
    this._resetData()
    this._channel.dispatch<GenericEventDetail>(POI_CLEAR_EVENT, { source: this })
  }

  private _resetData() {
    this._data = null
  }

  private _onSelectionChange(detail: PoiSelectEventDetail) {
    this._data = detail.view === 'detail' ? detail.data as Poi | PoiHotel | Reminder | Note : null
  }

  private _onSelectionClear() {
    this._data = null
  }
}
