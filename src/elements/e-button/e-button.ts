import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import styles from './e-button.style.scss?inline'

@customElement('e-button')
export class EButton extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) label = 'Button'
  @property({ type: Boolean }) disabled = false

  render() {
    return html`
      <button ?disabled=${this.disabled}>${this.label}</button>
    `
  }
}