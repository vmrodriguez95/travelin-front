import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import styles from './c-map.style.scss?inline'

@customElement('c-map')
export class CMap extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) latitude = ''

  @property({ type: String }) longitude = ''

  @property({ type: Boolean }) fullheight = false

  @state() height = 0

  @queryAsync('iframe') iframe!: Promise<HTMLIFrameElement>

  connectedCallback(): void {
    
    this.iframe.then((iframe: HTMLIFrameElement) => {
      this.calcHeight(iframe)
      this.calcHeightOnResize(iframe)
    })

    super.connectedCallback()
  }

  render() {
    const classes = classMap({
      'c-map': true,
      'c-map--full': this.fullheight
    })
    return html`
      <div class=${classes}>
        <iframe
          class="c-map__iframe"
          width="600"
          height=${this.height}
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=${this.latitude},${this.longitude}&z=10&output=embed">
        </iframe>
        <slot></slot>
      </div>
    `
  }

  setHeight(height: number) {
    this.height = height
  }

  calcHeight(iframe: HTMLIFrameElement) {
    // Altura de la ventana - altura de la cabecera
    let height = window.innerHeight - iframe.offsetTop - 40

    if (!this.fullheight) {
      height -= 288 // Altura del bloque resumen
    }

    this.setHeight(height)
  }

  calcHeightOnResize(iframe: HTMLIFrameElement) {
    window.addEventListener('resize', () => {
      this.calcHeight(iframe)
    })
  }
}