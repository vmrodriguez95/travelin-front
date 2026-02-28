import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import styles from './e-button.style.scss?inline'

@customElement('e-button')
export class EButton extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String, reflect: true }) type = 'button' // 'button' | 'submit'

  @property({ type: String, reflect: true }) size = 'fit' // 'fit' | 'full'

  @property({ type: Boolean }) disabled = false

  render() {
    const classes = classMap({
      'e-button': true,
      'e-button--full': this.size === 'full'
    })

    return html`
      <button class=${classes} ?disabled=${this.disabled}>
        <slot />
      </button>
    `
  }
}