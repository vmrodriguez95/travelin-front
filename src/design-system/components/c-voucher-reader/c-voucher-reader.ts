import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

// Controllers
import { LitertController } from '@ds/controllers/litert.controller'
import { ChannelController } from '@ds/controllers/channel.controller'

// Requests
import { SimpleGetClient } from '@ds/requests/index'

// Utils
import { extractPdfText } from '@ds/components/c-voucher-reader/utils/pdf.utils'
import { DEFAULT_MODEL, DEFAULT_PROFILES_ENDPOINT, PDF_MAX_SIZE } from '@ds/utils/variables'
import { buildVoucherPrompt, parseVoucherJson } from '@ds/components/c-voucher-reader/utils/voucher-prompt.utils'
import { getPassProfileId, pkpassToTransportDraft, readPassJson } from '@ds/components/c-voucher-reader/utils/pkpass.utils'
import { hotelDraftToFormFill, transportDraftToFormFill } from '@ds/components/c-voucher-reader/utils/voucher-form.utils'
import {
  FORM_FILL_EVENT,
  TAB_SELECT_EVENT,
  type FormFillEventDetail,
  type TabSelectEventDetail
} from '@ds/utils/poi-channel.utils'

// Types
import type { CModal } from '@ds/components/c-modal/c-modal'
import type { PassJson, VendorProfile } from './types/pkpass.types'
import type { VoucherReaderStatus } from './types/c-voucher-reader.types'
import type { HotelVoucherDraft, TransportVoucherDraft, VoucherDraft, VoucherErrorCode, VoucherErrors, VoucherPoiType, VoucherStatusMessages } from './types/voucher.types'

// Styles
import styles from './c-voucher-reader.style.scss?inline'

@customElement('c-voucher-reader')
export class CVoucherReader extends LitElement {

  @property({ type: String }) poiType: VoucherPoiType = 'poi_transport'

  @property({ type: String }) label = 'Sube tu voucher'

  @property({ type: String }) model = DEFAULT_MODEL

  @property({ type: String }) endpoint = DEFAULT_PROFILES_ENDPOINT

  @property({ type: String }) extensions = '.pdf,.pkpass'

  @property({ type: String }) channel = ''

  @property({ type: Object }) errorMessages!: VoucherErrors

  @property({ type: Object }) statusMessages!: VoucherStatusMessages

  @state() private _status: VoucherReaderStatus = 'idle'

  @state() private _errorCode: VoucherErrorCode = 'readError'

  @query('c-modal') private _modal!: CModal

  private _cancelled = false

  private _litert = new LitertController(this, () => this.model)

  private _client = new SimpleGetClient({ baseUrl: window.origin })

  private _channel = new ChannelController(this, () => this.channel, {})

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <div class="c-voucher-reader">
        <slot name="title"></slot>
        <slot name="description"></slot>

        <e-input-file
          class="c-voucher-reader__input"
          .label=${this.label}
          extensions=${this.extensions}
          @change=${this._onFileChange}
        ></e-input-file>

        ${when(this._status === 'success', () => html`
          <slot name="success"></slot>
        `)}

        ${when(this._status === 'error', () => html`
          <p class="c-voucher-reader__status c-voucher-reader__status--error">${unsafeHTML(this.errorMessages?.[this._errorCode] ?? '')}</p>
        `)}

        <c-modal class="c-voucher-reader__modal" close="Cancelar lectura" @modal-close=${this._onModalClose}>
          <p slot="description">${this._statusMessage()}</p>
          <span class="u-spinner" aria-hidden="true"></span>
        </c-modal>
      </div>
    `
  }

  protected updated(changed: PropertyValues) {
    if (!changed.has('_status')) return

    if (this._status === 'reading') {
      this._modal?.showModal()
    } else if (changed.get('_status') === 'reading') {
      this._modal?.closeModal()
    }
  }

  // The user closed the modal: if a read is still in flight, cancel it (incl. the AI request).
  private _onModalClose() {
    if (this._status !== 'reading') return

    this._cancelled = true
    this._litert.cancel()
    this._status = 'idle'
  }

  private _statusMessage(): string {
    const key = this._litert.loading ? 'processing' : 'reading'

    return this.statusMessages?.[key] ?? ''
  }

  private async _onFileChange(event: Event) {
    const input = event.target as HTMLInputElement & { value: FileList | null }
    const file = input.value?.[0]
    if (!file) return

    this._status = 'reading'
    this._cancelled = false

    try {
      const draft = await this._readFile(file)
      if (this._cancelled) return

      this._sendToForm(draft)
      this._status = 'success'
    } catch (error) {
      if (this._cancelled) return

      this._errorCode = this._resolveErrorCode(error)
      this._status = 'error'
    }
  }

  // Maps a thrown error to a message code. Our own throws carry the code as the
  // message; anything else (corrupt file, WebGPU/AI failure) is a generic readError.
  private _resolveErrorCode(error: unknown): VoucherErrorCode {
    const code = error instanceof Error ? error.message : ''

    return this.errorMessages && code in this.errorMessages ? code as VoucherErrorCode : 'readError'
  }

  // Sends the parsed draft to the form on the shared channel and jumps to the manual tab.
  private _sendToForm(draft: VoucherDraft) {
    const data = draft.type === 'poi_hotel'
      ? hotelDraftToFormFill(draft as HotelVoucherDraft)
      : transportDraftToFormFill(draft as TransportVoucherDraft)

    this._channel.dispatch<FormFillEventDetail>(FORM_FILL_EVENT, { data, source: this })
    this._channel.dispatch<TabSelectEventDetail>(TAB_SELECT_EVENT, { index: 1, source: this })
  }

  private async _readFile(file: File): Promise<VoucherDraft> {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'pkpass') {
      return this._readPkpass(file)
    }

    if (extension === 'pdf') {
      return this._readPdf(file)
    }

    throw new Error('invalidFile')
  }

  private async _readPkpass(file: File): Promise<VoucherDraft> {
    const pass = await readPassJson(file)

    if (this.poiType === 'poi_hotel') {
      // TODO: Recopilar más información sobre los pkpass de los hoteles para implementarlos.
      throw new Error('invalidFile')

    //   return pkpassToHotelDraft(pass)
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
      const response = await this._client.get<{ data: VendorProfile | null }>(`${this.endpoint}/${id}`)
      return response.data ?? null
    } catch {
      return null
    }
  }

  private async _readPdf(file: File): Promise<VoucherDraft> {
    if (file.size > PDF_MAX_SIZE) {
      throw new Error('fileTooLarge')
    }

    const text = await extractPdfText(file)
    if (!text) {
      throw new Error('emptyContent')
    }

    const prompt = buildVoucherPrompt(this.poiType, text)
    const raw = await this._litert.generate(prompt)

    return parseVoucherJson(raw, this.poiType)
  }
}
