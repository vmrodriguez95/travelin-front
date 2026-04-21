import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'
import { map } from 'lit/directives/map.js'

// Types
import type { CSlider } from '../c-slider/c-slider'
import type { CCardPoi } from '../c-card-poi/c-card-poi'
import type { Poi, PoiHotel, Reminder, Note } from '@ds/types/pois'
import type { CCardTransport } from '../c-card-transport/c-card-transport'

// Styles
import styles from './c-poi-detail.style.scss?inline'

@customElement('c-poi-detail')
export class CPoiDetail extends LitElement {

  @property({ type: Number }) gap = 0

  @state() _height = 0

  @state() _data: Poi | PoiHotel | Reminder | Note | null = null

  @query('c-slider') slider!: CSlider

  @queryAsync('.c-poi-detail') _container!: Promise<HTMLElement>

  _fullCardList!: NodeList

  _cardListForEvents!: NodeList
  
  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    this._activeCalcHeight()

    super.connectedCallback()
  }
  
  protected shouldUpdate(_changedProperties: PropertyValues) {
    if (_changedProperties.has('_data')) {
      this.slider?.reset()
    }
    
    return true
  }
  

  firstUpdated() {
    this._fullCardList = document.querySelectorAll('c-card-poi, c-card-transport')
    this._cardListForEvents = document.querySelectorAll('c-card-poi:not([type="poi"], [type="poi_hotel"]), c-card-transport')

    this._listenResume()
    this._listenCards()
  }

  render() {
    const classes = classMap({
      'c-poi-detail': true,
      'c-poi-detail--active': this._data !== null
    })

    return html`
      <div class=${classes} style="height: ${this._data !== null ? this._height : 0}px">
        <div class="c-poi-detail__actions">
          <button class="c-poi-detail__close" @click=${this._onClose.bind(this)}>
            <e-icon icon="close" size="l"></e-icon>
          </button>
        </div>
        <div class="c-poi-detail__content">
          ${this._printData()}
        </div>
      </div>
    `
  }

  private _printMap() {
      if (!this._data || !('coordinates' in this._data)) return ''

      return html`
        <c-map longitude=${this._data?.coordinates[0]} latitude=${this._data?.coordinates[1]} fullheight="auto"></c-map>
      `
  }

  private _printData() {
    if (!this._data) return ''
    
    return html`
      <c-slider>
        ${when('coordinates' in this._data, () => html`
          <div>${this._printMap()}</div>
        `)}
        ${when(this._data.notes, () => html`
          <div>
            ${when(this._data?.notes.length === 0, () => html`
              <div class="c-poi-detail__empty">
                <p class="c-poi-detail__text">Todavía no has añadido ninguna nota.</p>
              </div>
            `, () => html`
              ${map(this._data?.notes, (note) => html`
                <div class="c-poi-detail__note">
                  <e-icon icon=${note.icon} size="xl"></e-icon>
                  <p class="c-poi-detail__text">${note.text}</p>
                </div>
              `)}
            `)}
          </div>
        `)}
      </c-slider>
    `
  }

  private _listenResume() {
    const resume = document.querySelector('c-poi-resume')

    if (!resume) return

    resume.addEventListener('showinfo', (ev) => {
      const customevent = ev as CustomEvent
      this._data = customevent.detail
    })
  }

  private _listenCards() {
    this._cardListForEvents.forEach((card) => {
      card.addEventListener('showme', (ev) => {
        const target = ev.target as CCardPoi
        if (target.active) return

        this._resetCards()

        target.active = true

        const customevent = ev as CustomEvent
        this._data = customevent.detail
      })
    })
  }

  private _resetCards() {
    this._fullCardList.forEach((card) => {
      const cardTarget = card as CCardPoi | CCardTransport
      cardTarget.active = false
    })
  }

  private _onClose() {
    this._resetCards()
    this._data = null
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

  resetData() {
    this._data = null
  }
}