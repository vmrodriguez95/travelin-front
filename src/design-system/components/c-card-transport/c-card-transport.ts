import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { map } from 'lit/directives/map.js'

// Types
import type { PoiTransport, TransportSegment } from '@ds/types/pois'

// Utils
import { getTimeFrom } from '@ds/utils/date.utils'

// Styles
import styles from './c-card-transport.style.scss?inline'

@customElement('c-card-transport')
export class CCardTransport extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data!: PoiTransport

  @property({ type: String }) icon = ''

  @property({ type: Boolean, reflect: true }) active = false

  render() {
    const classes = classMap({
      'c-card-transport': true,
      'c-card-transport--active': this.active
    })

    return html`
      <div class=${classes} role="button" tabindex="0" @click=${this._onClick.bind(this)}>
        <div class="c-card-transport__head">
          <e-icon class="c-card-transport__icon" icon=${this.icon} size="xl"></e-icon>
        </div>
        <div class="c-card-transport__content">
          ${map(this.data.segments, (item: TransportSegment) => html`
            <p class="c-card-transport__segment">
              <span>${item.origin.code} ${getTimeFrom(item.origin.date)}</span> <span class="c-card-transport__duration">${item.duration}</span> <span>${item.destination.code} ${getTimeFrom(item.destination.date)}</span>
            </p>
          `)}
        </div>
      </div>
    `
  }

  private _onClick() {
    this.dispatchEvent(new CustomEvent('showme', {
      detail: this.data,
      bubbles: true,
      composed: true
    }))
  }
}