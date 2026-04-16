import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'
import { map } from 'lit/directives/map.js'

// Types
import type { Poi, PoiHotel, Reminder, Note } from '@ds/types/pois'
import type { CCardPoi } from '../c-card-poi/c-card-poi'
import type { CCardTransport } from '../c-card-transport/c-card-transport'

// Styles
import styles from './c-slider.style.scss?inline'

@customElement('c-slider')
export class CSlider extends LitElement {

  @state() _data: Poi | PoiHotel | Reminder | Note | null = null
  
  @state() _height = 0

  @queryAsync('.c-slider') _container!: Promise<HTMLElement>

  _cardList!: NodeList
  
  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    this._cardList = document.querySelectorAll('c-card-poi, c-card-transport')

    this._activeCalcHeight()
    this._listenCardClick()

    super.connectedCallback()
  }

  render() {
    const classes = classMap({
      'c-slider': true,
      'c-slider--active': this._data !== null
    })

    return html`
      <div class=${classes} style="height: ${this._data !== null ? this._height : 0}px">
        <div class="c-slider__actions">
          <button class="c-slider__close" @click=${this._onClose.bind(this)}>
            <e-icon icon="close" size="l"></e-icon>
          </button>
        </div>
        <div class="c-slider__content">
          ${when(this._data, () => map(this._data?.notes, (note) => html`
            <div class="c-slider__note">
              <e-icon icon=${note.icon} size="xl"></e-icon>
              <p class="c-slider__text">${note.text}</p>
            </div>
          `))}
        </div>
      </div>
    `
  }

  private _listenCardClick() {
    this._cardList.forEach((card) => {
      card.addEventListener('showme', (ev) => {
        const target = ev.target as CCardPoi | CCardTransport

        if (target.active) return

        this._resetCards()

        target.active = true

        const customevent = ev as CustomEvent
        this._data = customevent.detail
      })
    })
  }

  private _resetCards() {
    this._cardList.forEach((card) => {
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
    const height = window.innerHeight - container.offsetTop - 40

    this._setHeight(height)
  }

  private _calcHeightOnResize(container: HTMLElement) {
    window.addEventListener('resize', () => {
      this._calcHeight(container)
    })
  }
}