import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

import { LitertController } from '@ds/controllers/litert.controller'
import { extractPdfText } from '@ds/utils/pdf.utils'
import { pkpassToHotelDraft, pkpassToTransportDraft, readPassJson } from '@ds/utils/pkpass.utils'
import { buildVoucherPrompt, parseVoucherJson } from '@ds/utils/voucher-prompt.utils'
import type { VoucherDraft, VoucherPoiType } from '@ds/types/voucher.types'

import type { VoucherReaderStatus } from './c-voucher-reader.types'

// Styles
import styles from './c-voucher-reader.style.scss?inline'

const DEFAULT_MODEL = 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm'
const PDF_MAX_SIZE = 1024 * 1024 // 1 MB

@customElement('c-voucher-reader')
export class CVoucherReader extends LitElement {

  @property({ type: String }) poiType: VoucherPoiType = 'poi_transport'

  @property({ type: String }) label = 'Sube tu voucher'

  @property({ type: String }) model = DEFAULT_MODEL

  @state() private _status: VoucherReaderStatus = 'idle'

  @state() private _error = ''

  static styles = css`${unsafeCSS(styles)}`

  private _litert = new LitertController(this, () => this.model)

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
    return this.poiType === 'poi_hotel' ? pkpassToHotelDraft(pass) : pkpassToTransportDraft(pass)
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
