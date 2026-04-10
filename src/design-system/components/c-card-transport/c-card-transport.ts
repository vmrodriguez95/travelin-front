import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'

// Types
import type { PoiTransport, TransportSegment } from '@ds/types/pois'

// Styles
import styles from './c-card-transport.style.scss?inline'
import { getTimeFrom } from '@ds/utils/date.utils'

@customElement('c-card-transport')
export class CCardTransport extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data!: PoiTransport

  @property({ type: String }) icon = ''

  render() {
    return html`
      <div class="c-card-transport" role="button" tabindex="0">
        <div class="c-card-transport__head">
          <e-icon class="c-card-transport__icon" icon=${this.icon} size="xl"></e-icon>
        </div>
        <div class="c-card-transport__content">
          ${map(this.data.segments, (item: TransportSegment) => html`
            <p class="c-card-transport__segment">
              ${item.origin.code} ${getTimeFrom(item.origin.date)} <span class="c-card-transport__duration">${item.duration}</span> ${item.destination.code} ${getTimeFrom(item.destination.date)}
            </p>
          `)}
          <p class="c-card-transport__ref">REF: ${this.data.booking.reference}</p>
        </div>
      </div>
    `
  }
}