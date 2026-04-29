import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'
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

// Utils
import {
  getPoiChannel,
  POI_CLEAR_EVENT,
  POI_SELECT_EVENT,
  type PoiClearEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

// Styles
import styles from './c-poi-detail.style.scss?inline'

@customElement('c-poi-detail')
export class CPoiDetail extends LitElement {

  @property({ type: Number }) gap = 0

  @property({ type: String }) channel = ''

  @property({ type: String }) close = 'Cerrar detalle'

  @state() _height = 0

  @state() _data: Poi | PoiHotel | PoiTransport | Reminder | Note | null = null

  @query('c-slider') slider!: CSlider

  @queryAsync('.c-poi-detail') _container!: Promise<HTMLElement>
  
  _channelBus: EventTarget | null = null

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    super.connectedCallback()

    this._activeCalcHeight()
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

    if (changedProperties.has('_data')) {
      this.slider?.reset()
    }
  }

  render() {
    const classes = classMap({
      'c-poi-detail': true,
      'c-poi-detail--active': this._data !== null
    })

    return html`
      <div class=${classes} style="height: ${this._data !== null ? this._height : 0}px">
        <div class="c-poi-detail__actions">
          <button class="c-poi-detail__close" type="button" @click=${this._onClose.bind(this)} aria-label=${this.close}>
            <e-icon icon="close" size="l"></e-icon>
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
        ${when(this._isTypeOf('flight'), () => this.printFlightSegments(this._data as PoiTransport))}

        ${'notes' in this._data ? html`
          <div>
            ${this._data.notes.length === 0 ? html`
              <div class="c-poi-detail__empty">
                <p class="c-poi-detail__text">Todavía no has añadido ninguna nota.</p>
              </div>
            ` : html`
              ${map(this._data?.notes, (note) => html`
                <div class="c-poi-detail__note">
                  <e-icon icon=${note.icon} size="xl"></e-icon>
                  <p class="c-poi-detail__text">${note.text}</p>
                </div>
              `)}
            `}
          </div>
        ` : ''}
      </c-slider>
    `
  }

  private _isTypeOf(type: string) {
    return this._data && this._data.type === 'poi_transport' && 'typeTransport' in this._data && this._data.typeTransport === type
  }

  private _getPassengerByName(passengers: TransportPerson[], name: string) {
    return passengers.find((passenger) => passenger.name === name)
  }

  private printFlightSegments(data: PoiTransport) {
    return map(data.passengers,
      (passenger: TransportPerson) => html`
        <div>
          ${map(data.segments, (segment: TransportSegment, index: number) => html`
            ${when(index !== 0, () => html`
              <div class="c-poi-detail__separator">Escala 2h 20m</div>
            `)}
            ${console.log(this._getPassengerByName(segment.passengers, passenger.name))}
            <e-ticket .data=${segment} .passenger=${this._getPassengerByName(segment.passengers, passenger.name)} type="flight"></e-ticket>
          `)}
        </div>
      `)
  }

  // private printFlightSegments(data: PoiTransport) {
  //   return map(data.segments,
  //     (segment: TransportSegment, index: number) => map(segment.passengers,
  //       (passenger: TransportPerson) => html`
  //         ${when(index !== 0, () => html`
  //           <div class="c-poi-detail__separator">Escala 2h 20m</div>
  //         `)}
  //         <e-ticket .data=${segment} .passenger=${passenger} type="flight"></e-ticket>
  //   `))
  // }

  private _onClose() {
    this._resetData()
    this._channelBus?.dispatchEvent(new CustomEvent<PoiClearEventDetail>(POI_CLEAR_EVENT, {
      detail: {
        source: this
      }
    }))
  }

  private _activeCalcHeight() {
    this._container.then((container: HTMLElement) => {
      this._calcHeight(container)
      this._calcHeightOnResize(container)
    })
  }

  private _setHeight(height: number) {
    this._height = height
  }

  private _calcHeight(container: HTMLElement) {
    // Altura de la ventana - altura de la cabecera
    const height = window.innerHeight - container.offsetTop - 40 - this.gap

    this._setHeight(height)
  }

  private _calcHeightOnResize(container: HTMLElement) {
    window.addEventListener('resize', () => {
      this._calcHeight(container)
    })
  }

  private _resetData() {
    this._data = null
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

    this._data = event.detail.view === 'detail' ? event.detail.data as Poi | PoiHotel | Reminder | Note : null
  }

  private _onSelectionClear = () => {
    this._data = null
  }
}
