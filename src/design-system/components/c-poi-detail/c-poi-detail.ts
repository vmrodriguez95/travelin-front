import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'
import { map } from 'lit/directives/map.js'

// Types
import type { Poi, PoiHotel, Reminder, Note } from '@ds/types/pois'
import type { CCardPoi } from '../c-card-poi/c-card-poi'
import type { CCardTransport } from '../c-card-transport/c-card-transport'

// Styles
import styles from './c-poi-detail.style.scss?inline'

@customElement('c-poi-detail')
export class CPoiDetail extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @state() data: Poi | PoiHotel | Reminder | Note | null = null

  _cardList!: NodeList

  connectedCallback(): void {
    this._cardList = document.querySelectorAll('c-card-poi, c-card-transport')

    this._listenCardClick()

    super.connectedCallback()
  }

  render() {
    const classes = classMap({
      'c-poi-detail': true,
      'c-poi-detail--active': this.data !== null
    })

    return html`
      <div class=${classes}>
        <div class="c-poi-detail__actions">
          <button class="c-poi-detail__close" @click=${this._onClose.bind(this)}>
            <e-icon icon="close" size="l"></e-icon>
          </button>
        </div>
        <div class="c-poi-detail__content">
          ${when(this.data, () => map(this.data?.notes, (note) => html`
            ${console.log(note)}
            <div class="c-poi-detail__note">
              <e-icon icon=${note.icon} size="xl"></e-icon>
              <p class="c-poi-detail__text">${note.text}</p>
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
        this.data = customevent.detail
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
    this.data = null
  }
}