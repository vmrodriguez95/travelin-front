import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

// Types
import type { TransportPerson, TransportSegment } from '@ds/types/pois'

import styles from './e-ticket.style.scss?inline'

@customElement('e-ticket')
export class ETicket extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) type = 'flight'

  @property({ type: Object }) data: TransportSegment | null = null

  @property({ type: Object }) passenger: TransportPerson | null = null

  render() {
    if (this.data === null) return ''

    return html`
      <div class="e-ticket">
        <div class="e-ticket__head">
          <p class="e-ticket__code">
            <e-icon icon=${this.type} size="l"></e-icon> ${this.data.transportNumber}
          </p>
          ${this.data.class ? html`<p class="e-ticket__class">${this.data.class}</p>` : ''}
        </div>
        <div class="e-ticket__passenger">
          <p class="e-ticket__text">Passenger</p>
          <p class="e-ticket__name">${this.passenger?.name}</p>
        </div>
        <div class="e-ticket__row">
          <div class="e-ticket__column">
            ${this._printDateWithFormat(this.data.origin.date)}
            <p class="e-ticket__text">${this.data.origin.name}</p>
          </div>
          <div class="e-ticket__column e-ticket__column--center">
            <e-icon icon="arrow-right" size="l"></e-icon>
            <p class="e-ticket__small">${this.data.duration}</p>
          </div>
          <div class="e-ticket__column e-ticket__column--right">
            ${this._printDateWithFormat(this.data.destiny.date)}
            <p class="e-ticket__text">${this.data.destiny.name}</p>
          </div>
        </div>
        <div class="e-ticket__separator"></div>
        <div class="e-ticket__row">
          <div class="e-ticket__column">
            <div class="e-ticket__box">
              <p class="e-ticket__text">Terminal</p>
              <p class="e-ticket__big">${this.data.origin.platform ? this.data.origin.platform : '---'}</p>
            </div>
          </div>
          <div class="e-ticket__column">
            <div class="e-ticket__box">
              <p class="e-ticket__text">Gate</p>
              <p class="e-ticket__big">${this.data.origin.gate ? this.data.origin.gate : '---'}</p>
            </div>
          </div>
          <div class="e-ticket__column">
            <div class="e-ticket__box">
              <p class="e-ticket__text">Seat</p>
              <p class="e-ticket__big">${this.passenger && this.passenger.seat ? this.passenger.seat : '---'}</p>
            </div>
          </div>
        </div>
        ${when(this.data.qr, () => html`
          <div class="e-ticket__qr"></div>
          <div class="e-ticket__actions">
              <e-button color="secondary" ariaLabel="Share Pass">
                <e-icon icon="share" size="m"></e-icon> Share Pass
              </e-button>
              <e-button ariaLabel="Add to wallet">
                <e-icon icon="add-circle" size="m"></e-icon> Add to wallet
              </e-button>
          </div>
        `)}
      </div>
    `
  }

  private _printDateWithFormat(stringDate: string = '') {
    if (stringDate === '') return '--:--'

    const date = new Date(stringDate)

    return html`
      <p class="e-ticket__big">${date.getHours()}:${date.getMinutes()}</p>
      <p class="e-ticket__text">${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}</p>
    `
  }
}
