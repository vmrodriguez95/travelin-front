import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import styles from './e-map.style.scss?inline'

@customElement('e-map')
export class EMap extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String, reflect: true }) latitude = ''

  @property({ type: String, reflect: true }) longitude = ''

  @state() height = 0

  connectedCallback(): void {
    this.calcHeight()
    this.calcHeightOnResize()
    super.connectedCallback()
  }

  render() {
    return html`
      <div class="e-map">
        <iframe
          class="e-map__iframe"
          width="600"
          height="${this.height}"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=${this.latitude},${this.longitude}&z=10&output=embed">
        </iframe>
      </div>
    `
  }

  setHeight(height: number) {
    this.height = height
  }

  calcHeight() {
    // Altura de la ventana - altura de la cabecera - altura del bloque resumen
    this.setHeight(window.innerHeight - 240 - 288)
  }

  calcHeightOnResize() {
    window.addEventListener('resize', () => {
      this.calcHeight()
    })
  }
}