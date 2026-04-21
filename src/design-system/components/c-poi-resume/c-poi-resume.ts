import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

// Types
import type { CMap } from '../c-map/c-map'
import type { Poi, PoiHotel } from '@ds/types/pois'
import type { CCardPoi } from '../c-card-poi/c-card-poi'
import type { CPoiDetail } from '../c-poi-detail/c-poi-detail'

// Styles
import styles from './c-poi-resume.style.scss?inline'

@customElement('c-poi-resume')
export class CPoiResume extends LitElement {

  @property({ type: String }) mainHeading = ''

  @property({ type: String }) secondaryHeading = ''

  @state() _data: Poi | PoiHotel | null = null

  _map!: CMap

  _poiDetail!: CPoiDetail
  
  _fullCardList!: NodeList

  _cardListForEvents!: NodeList
  
  static styles = css`${unsafeCSS(styles)}`

  firstUpdated() {
    this._map = document.querySelector('c-map') as CMap
    this._poiDetail = document.querySelector('c-poi-detail') as CPoiDetail
    this._fullCardList = document.querySelectorAll('c-card-poi, c-card-transport')
    this._cardListForEvents = document.querySelectorAll('c-card-poi[type="poi"], c-card-poi[type="poi_hotel"]')

    this._listenCardClick()
  }

  updated() {
    this._map.showSearch = this._data ? false : true
  }

  render() {
    if (!this._data) return ''

    return html`
      <div class="c-poi-resume">
        <p class="c-poi-resume__name">${this._data?.name}</p>
        <div class="c-poi-resume__head">
          <img class="c-poi-resume__img" src=${this._data?.image} alt="Picture about ${this._data?.name}" width="64" height="64" loading="lazy" />
        </div>
        <div class="c-poi-resume__details">
          <div class="c-poi-resume__column">
            <p class="c-poi-resume__title">${this.mainHeading}</p>
            ${this.getAddress()}
          </div>
          <div class="c-poi-resume__column">
            <p class="c-poi-resume__title">${this.secondaryHeading}</p>
            <p class="c-poi-resume__text">${this._data?.coordinates[1]}<sup class="c-poi-resume__sup">∘</sup>N, ${this._data?.coordinates[0]}<sup class="c-poi-resume__sup">∘</sup>W</p>
          </div>
          <div class="c-poi-resume__column">
            <button class="c-poi-resume__close" @click=${this._onClose}>
              <e-icon icon="close" size="m"></e-icon>
            </button>
            <button class="c-poi-resume__info" @click=${this._showInfo}>
              <e-icon icon="info" size="m"></e-icon>
            </button>
          </div>
        </div>
      </div>
    `
  }

  private getAddress() {
    if (!this._data) return ''

    const address = this._data.address.split(',')

    address.shift()

    return html`<p class="c-poi-resume__text">${address.join(', ')}</p>`
  }

  private _listenCardClick() {
    this._cardListForEvents.forEach((card) => {
      card.addEventListener('showme', (ev) => {
        this._poiDetail.resetData()
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
      const cardTarget = card as CCardPoi
      cardTarget.active = false
    })
  }

  private _showInfo() {
    this.dispatchEvent(new CustomEvent('showinfo', { detail: this._data }))
    this._data = null
  }

  private _onClose() {
    this._resetCards()
    this._data = null
  }
}