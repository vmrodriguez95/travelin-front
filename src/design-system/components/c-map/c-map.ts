import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

import styles from './c-map.style.scss?inline'

@customElement('c-map')
export class CMap extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) latitude = ''

  @property({ type: String }) longitude = ''

  @property({ type: String }) api = ''

  @property({ type: String }) fullheight = 'full'

  @property({ type: Number }) gap = 0

  @property({ type: Boolean }) showSearch = false

  @state() _height = 0

  @queryAsync('iframe') _iframe!: Promise<HTMLIFrameElement>

  connectedCallback(): void {
    this._activateFullHeight()

    super.connectedCallback()
  }

  render() {
    const classes = classMap({
      'c-map': true,
      'c-map--height-auto': this.fullheight === 'auto'
    })

    return html`
      <div class=${classes}>
        <iframe
          class="c-map__iframe"
          width="600"
          height=${this._height}
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=${this.latitude},${this.longitude}&z=10&output=embed">
        </iframe>
        ${when(this.showSearch && this.api, () => html`
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

  private _setHeight(height: number) {
    this._height = height
  }

  private  _calcHeight(iframe: HTMLIFrameElement) {
    // Altura de la ventana - altura de la cabecera
    let height = window.innerHeight - iframe.offsetTop - 40 - this.gap

    this._setHeight(height)
  }

  private _calcHeightOnResize(iframe: HTMLIFrameElement) {
    window.addEventListener('resize', () => {
      this._calcHeight(iframe)
    })
  }

  private _activateFullHeight() {
    if (this.fullheight === 'full') {
      this._iframe.then((iframe: HTMLIFrameElement) => {
        this._calcHeight(iframe)
        this._calcHeightOnResize(iframe)
      })
    }
  }
}