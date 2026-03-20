import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import styles from './c-card-fly.style.scss?inline'

@customElement('c-card-fly')
export class CCardFly extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <button class="c-card-fly">
        <p class="c-card-fly__head">
          <e-icon class="c-card-fly__icon" icon="fly" size="xl"></e-icon>
        </p>
        <p class="c-card-fly__content">
          <slot name="title"></slot>
          <slot name="description"></slot>
        </p>
      </button>
    `
  }
}