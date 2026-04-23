import { LitElement, html, css, unsafeCSS, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import styles from './e-button.style.scss?inline'

@customElement('e-button')
export class EButton extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String, reflect: true }) type = 'button' // 'button' | 'submit'

  @property({ type: String, reflect: true }) size = 'fit' // 'fit' | 'thin' | 'full'

  @property({ type: String, attribute: 'aria-label' }) ariaLabel = ''

  @property({ type: Boolean }) disabled = false

  render() {
    const classes = classMap({
      'e-button': true,
      [`e-button--${this.size}`]: this.size
    })

    return html`
      <button class=${classes} ?disabled=${this.disabled} type=${this.type} aria-label=${this.ariaLabel || nothing}>
        <slot />
      </button>
    `
  }
}
