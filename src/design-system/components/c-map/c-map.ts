import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

import {
  getPoiChannel,
  POI_CLEAR_EVENT,
  POI_SELECT_EVENT,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

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

  @property({ type: String }) channel = ''

  @state() _height = 0

  @queryAsync('iframe') _iframe!: Promise<HTMLIFrameElement>

  _channelBus: EventTarget | null = null

  _defaultShowSearch = false

  connectedCallback(): void {
    super.connectedCallback()

    this._defaultShowSearch = this.showSearch
    this._activateFullHeight()
    this._connectToChannel()
  }

  disconnectedCallback() {
    this._disconnectFromChannel()

    super.disconnectedCallback()
  }

  protected updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('channel')) {
      this._disconnectFromChannel()
      this._connectToChannel()
    }
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

  private _connectToChannel() {
    if (!this.channel) return

    this._channelBus = getPoiChannel(this.channel)
    this._channelBus.addEventListener(POI_SELECT_EVENT, this._onSelectionChange as EventListener)
    this._channelBus.addEventListener(POI_CLEAR_EVENT, this._onSelectionClear)
  }

  private _disconnectFromChannel() {
    if (!this._channelBus) return

    this._channelBus.removeEventListener(POI_SELECT_EVENT, this._onSelectionChange as EventListener)
    this._channelBus.removeEventListener(POI_CLEAR_EVENT, this._onSelectionClear)
    this._channelBus = null
  }

  private _onSelectionChange = (ev: Event) => {
    const event = ev as CustomEvent<PoiSelectEventDetail>

    this.showSearch = event.detail.view === 'resume' ? false : this._defaultShowSearch
  }

  private _onSelectionClear = () => {
    this.showSearch = this._defaultShowSearch
  }
}
