import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import styles from './e-progress-bar.style.scss?inline'

@customElement('e-progress-bar')
export class EButton extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) label = ''

  @property({ type: Number }) value = 0

  @property({ type: Number }) total = 0

  render() {
    return html`
      <div class="e-progress-bar">
        <div class="e-progress-bar__head">
          <p class="e-progress-bar__text">${this.label}</p>
          <p class="e-progress-bar__text">${this.value}/${this.total}</p>
        </div>
        <div class="e-progress-bar__bar">
          <div class="e-progress-bar__progress" style="width: ${this.value / this.total * 100}%"></div>
        </div>
      </div>
    `
  }
}