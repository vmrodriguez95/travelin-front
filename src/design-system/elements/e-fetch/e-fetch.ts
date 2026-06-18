import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

import styles from './e-fetch.style.scss?inline'

@customElement('e-fetch')
export class EFetch extends LitElement {

  @property({ type: String }) color = ''

  @property({ type: String }) action = ''

  @property({ type: String }) method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET'

  @property({ type: String }) type = 'button' // button | link

  @property({ type: String }) waitmsg = ''

  @property({ type: Number }) wait = 0

  @property({ type: Object }) body: Record<string, unknown> | null = null

  @property({ type: Object }) headers: Record<string, string> = {}

  @state() _countdown = 0

  @state() private loading = false

  @state() private error: string | null = null

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    this._resetCountdown()

    super.connectedCallback()
    this._activateCountdown()
  }

  render() {
    return html`
      <div class="e-fetch">
        ${when(this._countdown > 0, () => html`
          <p class="e-fetch__countdown">${this.waitmsg} ${this._countdown / 1000} segundos</p>
        `, () => html`
          ${when(this.type === 'link', () => html`
            <button @click=${this._handleClick} ?disabled=${this.loading} class="e-fetch__link">
              ${this.loading ? 'Cargando...' : html`<slot></slot>`}
            </button>
          `, () => html`
            <e-button @click=${this._handleClick} ?disabled=${this.loading} color=${this.color}>
              ${this.loading ? 'Cargando...' : html`<slot></slot>`}
            </e-button>
          `)}

          ${this.error ? html`<p class="e-fetch__error">${this.error}</p>` : null}
        `)}
      </div>
    `
  }

  private async _handleClick() {
    if (!this.action || this.loading) return

    this.loading = true
    this.error = null

    try {
      const options: RequestInit = {
        method: this.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        }
      }

      if (this.body && this.method !== 'GET') {
        options.body = JSON.stringify(this.body)
      }

      const response = await fetch(this.action, options)

      if (!response.ok) {
        let message = `Error ${response.status}`

        try {
          const data = await response.json()
          message = data.message || message
        } catch (_) {}

        throw new Error(message)
      }

      const data = await response.json()

      this.dispatchEvent(new CustomEvent('fetch-success', {
        detail: data,
        bubbles: true,
        composed: true
      }))

    } catch (err: unknown) {
      this.error = (err as Error).message

      this.dispatchEvent(new CustomEvent('fetch-error', {
        detail: err,
        bubbles: true,
        composed: true
      }))
    } finally {
      this._resetCountdown()
      this._activateCountdown()
      this.loading = false
    }
  }

  private _resetCountdown() {
    this._countdown = this.wait
  }

  private _activateCountdown() {
    if (this._countdown > 0) {
      setTimeout(() => {
        this._countdown -= 1000
        this._activateCountdown()
      }, 1000)
    }
  }
}