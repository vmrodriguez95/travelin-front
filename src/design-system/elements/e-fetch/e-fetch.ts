import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Requests
import { SimpleJsonClient } from '@ds/requests/json-client'
import type { HttpMethod } from '@ds/requests/requests.types'
import { FetchSuccessEvent } from '@ds/requests/fetch-success.event'

// Utils
import { isSilentRequestError } from '@ds/utils/request.utils'
import {
  POI_CLEAR_EVENT,
  POI_SELECT_EVENT,
  type PoiChannelData,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

import styles from './e-fetch.style.scss?inline'

@customElement('e-fetch')
export class EFetch extends LitElement {

  @property({ type: String }) color = ''

  @property({ type: String }) action = ''

  @property({ type: String }) method: HttpMethod = 'GET'

  @property({ type: String, reflect: true }) type = 'button' // button | link | plain

  @property({ type: String }) size = ''

  @property({ type: String }) waitmsg = ''

  @property({ type: Number }) wait = 0

  @property({ type: Object }) body: Record<string, unknown> | null = null

  @property({ type: Object }) headers: Record<string, string> = {}

  // With a channel the request also carries the item last announced on it
  // (`idField`), so one shared modal can act on whichever POI opened it.
  @property({ type: String }) channel = ''

  @property({ type: String }) idField = 'idPoi'

  @state() _countdown = 0

  @state() private loading = false

  @state() private error: string | null = null

  private _selected: PoiChannelData | null = null

  private _client = new SimpleJsonClient()

  // The request in flight, aborted if the element leaves the DOM first.
  private _abort?: AbortController

  private _countdownTimer = 0

  private _channel = new ChannelController(this, () => this.channel, {
    [POI_SELECT_EVENT]: (detail) => this._onSelect(detail),
    [POI_CLEAR_EVENT]: () => { this._selected = null }
  })

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    this._resetCountdown()

    super.connectedCallback()
    this._activateCountdown()
  }

  disconnectedCallback(): void {
    this._abort?.abort()
    this._abort = undefined
    window.clearTimeout(this._countdownTimer)

    super.disconnectedCallback()
  }

  render() {
    return html`
      <div class="e-fetch">
        ${when(this._countdown > 0, () => html`
          <p class="e-fetch__countdown">${this.waitmsg} ${this._countdown / 1000} segundos</p>
        `, () => html`
          ${when(this.type === 'plain', () => html`
            <button @click=${this._handleClick} ?disabled=${this.loading} aria-busy=${this.loading} class="e-fetch__plain">
              <slot></slot>
            </button>
          `, () => when(this.type === 'link', () => html`
            <button @click=${this._handleClick} ?disabled=${this.loading} class="e-fetch__link">
              ${this.loading ? 'Cargando...' : html`<slot></slot>`}
            </button>
          `, () => html`
            <e-button @click=${this._handleClick} ?disabled=${this.loading} color=${this.color} size=${this.size}>
              ${this.loading ? 'Cargando...' : html`<slot></slot>`}
            </e-button>
          `))}

          ${this.error ? html`<p class="e-fetch__error">${this.error}</p>` : null}
        `)}
      </div>
    `
  }

  private _onSelect(detail: PoiSelectEventDetail) {
    this._selected = detail.data
  }

  private _buildBody(): Record<string, unknown> | null {
    if (!this._selected) return this.body

    return { ...(this.body ?? {}), [this.idField]: this._selected.id }
  }

  private async _handleClick() {
    if (!this.action || this.loading) return

    this.loading = true
    this.error = null

    this._abort = new AbortController()

    try {
      // The method attribute may arrive in lower case from the page.
      const method = this.method.toUpperCase() as HttpMethod
      const data = await this._client.send<unknown>(this.action, method, this._buildBody(), this.headers, this._abort.signal)

      this.dispatchEvent(new FetchSuccessEvent(data, this._selected?.id ?? null))

    } catch (err: unknown) {
      if (isSilentRequestError(err)) return

      this.error = (err as Error).message

      this.dispatchEvent(new CustomEvent('fetch-error', {
        detail: err,
        bubbles: true,
        composed: true
      }))
    } finally {
      this._abort = undefined
      this._resetCountdown()
      this._activateCountdown()
      this.loading = false
    }
  }

  private _resetCountdown() {
    this._countdown = this.wait
  }

  private _activateCountdown() {
    window.clearTimeout(this._countdownTimer)

    if (this._countdown > 0) {
      this._countdownTimer = window.setTimeout(() => {
        this._countdown -= 1000
        this._activateCountdown()
      }, 1000)
    }
  }
}
