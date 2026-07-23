import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

import styles from './e-progress-bar.style.scss?inline'

@customElement('e-progress-bar')
export class EProgressBar extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Number }) value = 0

  @property({ type: Number }) total = 0

  @property({ type: Boolean }) showValues = false

  @property({ type: Boolean }) showPercentage = false

  _percentage = 0

  connectedCallback(): void {
    super.connectedCallback()

    this._percentage = this.value / this.total * 100
  }


  render() {
    return html`
      <div class="e-progress-bar">
        ${when(this.showValues, () => html`
          <div class="e-progress-bar__values">
            <p class="e-progress-bar__text">${this.value}</p>
            <p class="e-progress-bar__text">${this.total}</p>
          </div>
        `)}
        <div class="e-progress-bar__wrapper">
          <div class="e-progress-bar__bar">
            <div class="e-progress-bar__progress" style="width: ${this._percentage}%;"></div>
          </div>
          ${when(this.showPercentage, () => html`
            <span class="e-progress-bar__text">${this._percentage}%</span>
          `)}
        </div>
      </div>
    `
  }
}