import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

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
          <div class="e-ticket__column">
            <p class="e-ticket__code">${this.data.origin.code}</p>
            <p class="e-ticket__city">${this.data.origin.city}</p>
            <p class="e-ticket__name">${this.data.origin.name}</p>
            <p class="e-ticket__small">${this.data.origin.platform}</p>
          </div>
          <div class="e-ticket__column e-ticket__column--right">
            <p class="e-ticket__code">${this.data.destiny.code}</p>
            <p class="e-ticket__city">${this.data.destiny.city}</p>
            <p class="e-ticket__name">${this.data.destiny.name}</p>
            <p class="e-ticket__small">${this.data.destiny.platform}</p>
          </div>
          <div class="e-ticket__column">
            <span class="e-ticket__date">${this.data.origin.date}</span>
            <span class="e-ticket__duration">${this.data.duration}</span>
            <span class="e-ticket__date">${this.data.destiny.date}</span>
          </div>
        </div>
        <div class="e-ticket__footer">
          ${this.printPassenger()}
        </div>
      </div>
    `
  }

  private printPassenger() {
    if (this.passenger === null) return ''

    return html`
      <p class="e-ticket__text">${this.passenger.name}</p>
    `
  }
}
