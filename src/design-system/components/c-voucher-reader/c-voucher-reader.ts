import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

// Controllers
import { LitertController } from '@ds/controllers/litert.controller'

// Requests
import { SimpleGetClient } from '@ds/requests/index'

// Utils
import { extractPdfText } from '@ds/utils/pdf.utils'
import { buildVoucherPrompt, parseVoucherJson } from '@ds/utils/voucher-prompt.utils'
import { DEFAULT_MODEL, DEFAULT_PROFILES_ENDPOINT, PDF_MAX_SIZE } from '@ds/utils/variables'
import { getPassProfileId, pkpassToHotelDraft, pkpassToTransportDraft, readPassJson } from '@ds/utils/pkpass.utils'

// Types
import type { VoucherReaderStatus } from './c-voucher-reader.types'
import type { PassJson, VendorProfile } from '@ds/types/pkpass.types'
import type { VoucherDraft, VoucherPoiType } from '@ds/types/voucher.types'

// Styles
import styles from './c-voucher-reader.style.scss?inline'

@customElement('c-voucher-reader')
export class CVoucherReader extends LitElement {

  @property({ type: String }) poiType: VoucherPoiType = 'poi_transport'

  @property({ type: String }) label = 'Sube tu voucher'

  @property({ type: String }) model = DEFAULT_MODEL

  @property({ type: String }) endpoint = DEFAULT_PROFILES_ENDPOINT

  @state() private _status: VoucherReaderStatus = 'idle'

  @state() private _error = ''

  static styles = css`${unsafeCSS(styles)}`

  private _litert = new LitertController(this, () => this.model)

  private _client = new SimpleGetClient({ baseUrl: window.origin })

  render() {
    return html`
      <div class="c-voucher-reader">
        <slot name="title"></slot>
        <slot name="description"></slot>

        <e-input-file
          class="c-voucher-reader__input"
          .label=${this.label}
          extensions=".pdf,.pkpass"
          @change=${this._onFileChange}
        ></e-input-file>

        ${when(this._status === 'reading', () => html`
          <p class="c-voucher-reader__status">${this._statusMessage()}</p>
        `)}
        ${when(this._status === 'success', () => html`
          <p class="c-voucher-reader__status c-voucher-reader__status--success">
            Voucher leído. Revisa la consola para ver el JSON generado.
          </p>
        `)}
        ${when(this._status === 'error', () => html`
          <p class="c-voucher-reader__status c-voucher-reader__status--error">${this._error}</p>
        `)}
      </div>
    `
  }

  private _statusMessage(): string {
    return this._litert.loading ? 'Procesando con IA (puede tardar la primera vez)…' : 'Leyendo el archivo…'
  }

  private async _onFileChange(event: Event) {
    const input = event.target as HTMLElement & { value: FileList | null }
    const file = input.value?.[0]
    if (!file) return

    this._status = 'reading'
    this._error = ''

    try {
      const draft = await this._readFile(file)
      console.log(`[c-voucher-reader] ${this.poiType} draft`, draft)
      this._status = 'success'
    } catch (error) {
      this._error = error instanceof Error ? error.message : 'No se pudo leer el voucher'
      this._status = 'error'
    }
  }

  private async _readFile(file: File): Promise<VoucherDraft> {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'pkpass') {
      return this._readPkpass(file)
    }

    if (extension === 'pdf') {
      return this._readPdf(file)
    }

    throw new Error('Formato no soportado. Sube un archivo .pdf o .pkpass')
  }

  private async _readPkpass(file: File): Promise<VoucherDraft> {
    const pass = await readPassJson(file)

    console.log('Pass JSON:', pass)

    if (this.poiType === 'poi_hotel') {
      return pkpassToHotelDraft(pass)
    }

    const profile = await this._fetchProfile(pass)
    return pkpassToTransportDraft(pass, profile)
  }

  // Asks the backend for the vendor profile matching this pass's organization.
  // Any miss (no org, unknown vendor → 404, or a request error) falls back to generic parsing.
  private async _fetchProfile(pass: PassJson): Promise<VendorProfile | null> {
    const id = getPassProfileId(pass)
    if (!id || !this.endpoint) return null

    try {
      const url = new URL(`${this.endpoint}/${id}.json`, window.origin).toString()
      const response = await this._client.request<{ data: VendorProfile | null }>(url, 'GET')
      return response.data ?? null
    } catch {
      return null
    }
  }

  private async _readPdf(file: File): Promise<VoucherDraft> {
    if (file.size > PDF_MAX_SIZE) {
      throw new Error('El PDF supera el tamaño máximo de 1 MB')
    }

    const text = await extractPdfText(file)
    if (!text) {
      throw new Error('No se pudo extraer texto del PDF')
    }

    const prompt = buildVoucherPrompt(this.poiType, text)
    const raw = await this._litert.generate(prompt)

    return parseVoucherJson(raw, this.poiType)
  }
}
