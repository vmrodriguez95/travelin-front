import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

import styles from './c-map.style.scss?inline'

@customElement('c-map')
export class CMap extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) latitude = ''

  @property({ type: String }) longitude = ''

  @property({ type: String }) api = ''

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
    return html`
      <div class="c-map">
        <iframe
          class="c-map__iframe"
          width="600"
          height=${this.height}
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=${this.latitude},${this.longitude}&z=10&output=embed">
        </iframe>
        ${when(this.api, () => html`
          <e-input-search
            class="c-map__search"
            id="map-search"
            api=${this.api}
            name="map-search"
          ></e-input-search>
        `)}
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