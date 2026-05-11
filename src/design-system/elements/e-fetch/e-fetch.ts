import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import styles from './e-fetch.style.scss?inline'

@customElement('e-fetch')
export class EFetch extends LitElement {

  @property({ type: String }) color = ''

  @property({ type: String }) action = ''

  @property({ type: String }) method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET'

  @property({ type: Object }) body: any = null

  @property({ type: Object }) headers: Record<string, string> = {}

  @property({ type: String }) text = 'Enviar'

  @state() private loading = false

  @state() private error: string | null = null

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <e-button @click=${this._handleClick} ?disabled=${this.loading} color=${this.color}>
        ${this.loading ? 'Cargando...' : html`<slot></slot>`}
      </e-button>

      ${this.error
        ? html`<p style="color:red;">${this.error}</p>`
        : null}
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

    } catch (err: any) {
      this.error = err.message

      this.dispatchEvent(new CustomEvent('fetch-error', {
        detail: err,
        bubbles: true,
        composed: true
      }))
    } finally {
      this.loading = false
    }
  }
}