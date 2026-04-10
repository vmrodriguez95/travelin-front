import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import styles from './c-card-transport.style.scss?inline'

@customElement('c-card-transport')
export class CCardTransport extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data = ''

  @property({ type: String }) icon = ''

  connectedCallback(): void {
    super.connectedCallback()

    console.log(this.data)
  }

  render() {
    return html`
      <button class="c-card-transport">
        <p class="c-card-transport__head">
          <e-icon class="c-card-transport__icon" icon=${this.icon} size="xl"></e-icon>
        </p>
        <p class="c-card-transport__content">
          
        </p>
      </button>
    `
  }
}