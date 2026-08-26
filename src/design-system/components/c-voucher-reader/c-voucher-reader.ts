import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Requests
import { SimpleGetClient } from '@ds/requests/index'

// Utils
import { extractPdfPages } from '@ds/components/c-voucher-reader/utils/pdf.utils'
import { renderPages } from '@ds/components/c-voucher-reader/utils/pdf-field.utils'
import { parseGenericPdf, sanitizeDraft } from '@ds/components/c-voucher-reader/utils/pdf-generic.utils'
import { PDF_MAX_SIZE } from '@ds/utils/variables'
import { detectProfileId, parseWithPdfProfile } from '@ds/components/c-voucher-reader/utils/pdf-profile.utils'
import { hotelDraftToFormFill, transportDraftToFormFill } from '@ds/components/c-voucher-reader/utils/voucher-form.utils'
import { getPassProfileId, pkpassToTransportDraft, readPassJson } from '@ds/components/c-voucher-reader/utils/pkpass.utils'
import { buildVoucherEndpoint } from '@ds/components/c-voucher-reader/utils/voucher-endpoint.utils'
import { FORM_FILL_EVENT, TAB_SELECT_EVENT, type FormFillEventDetail, type TabSelectEventDetail } from '@ds/utils/poi-channel.utils'

// Types
import type { CModal } from '@ds/components/c-modal/c-modal'
import type { PassJson, VendorProfile } from './types/pkpass.types'
import type { VoucherReaderStatus } from './types/c-voucher-reader.types'
import type { PdfProfile, PdfProfileManifestEntry } from './types/pdf-profile.types'
import type { HotelVoucherDraft, TransportVoucherDraft, VoucherDraft, VoucherErrorCode, VoucherErrors, VoucherExtension, VoucherPoiType, VoucherStatusMessages } from './types/voucher.types'

// Styles
import styles from './c-voucher-reader.style.scss?inline'

@customElement('c-voucher-reader')
export class CVoucherReader extends LitElement {

  @property({ type: String }) poiType: VoucherPoiType = 'poi_transport'

  @property({ type: String }) label = 'Sube tu voucher'

  // Template of the vendor-profile endpoint, with the three parts the reader
  // fills in per request: "/api/{id}/{poiType}/{extension}". {id} is `manifest`
  // on the first call and the vendor's organization afterwards, {poiType} is
  // the form being filled in, and {extension} the one of the uploaded file.
  // There is no default: the host owns the API layout and has to state it.
  @property({ type: String }) endpoint = ''

  @property({ type: String }) extensions = '.pdf,.pkpass'

  @property({ type: String }) channel = ''

  @property({ type: Object }) errorMessages!: VoucherErrors

  @property({ type: Object }) statusMessages!: VoucherStatusMessages

  @state() private _status: VoucherReaderStatus = 'idle'

  @state() private _errorCode: VoucherErrorCode = 'readError'

  // True once the text is out and we are matching it against a vendor profile.
  @state() private _processing = false

  @query('c-modal') private _modal!: CModal

  private _cancelled = false

  // The manifest is the same for every file, so it is fetched at most once.
  private _manifest: PdfProfileManifestEntry[] | null = null

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

  protected firstUpdated() {
    this._warnMissingEndpoint()
  }

  // Without an endpoint the reader still works, but every voucher falls back to
  // the generic parser and the user silently gets a worse read. That is a
  // misconfiguration of the host page, so it is reported as one.
  private _warnMissingEndpoint() {
    if (this.endpoint) return

    console.error('<c-voucher-reader>: missing required endpoint attribute. ' +
      'Set it to the vendor profile endpoint template, e.g. endpoint="/api/{id}/{poiType}/{extension}". ' +
      'Vouchers will be read by the generic parser until then.')
  }

  protected updated(changed: PropertyValues) {
    if (!changed.has('_status')) return

    if (this._status === 'reading') {
      this._modal?.showModal()
    } else if (changed.get('_status') === 'reading') {
      this._modal?.closeModal()
    }
  }

  // The user closed the modal: if a read is still in flight, abandon its result.
  private _onModalClose() {
    if (this._status !== 'reading') return

    this._cancelled = true
    this._status = 'idle'
  }

  private _statusMessage(): string {
    const key = this._processing ? 'processing' : 'reading'

    return this.statusMessages?.[key] ?? ''
  }

  private async _onFileChange(event: Event) {
    const input = event.target as HTMLInputElement & { value: FileList | null }
    const file = input.value?.[0]
    if (!file) return

    this._status = 'reading'
    this._cancelled = false
    this._processing = false

    try {
      const draft = await this._readFile(file)
      if (this._cancelled) return

      this._sendToForm(draft)
      this._status = 'success'
    } catch (error) {
      if (this._cancelled) return

      this._errorCode = this._resolveErrorCode(error)
      this._status = 'error'
    } finally {
      this._processing = false
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
      return this._readPkpass(file, extension)
    }

    if (extension === 'pdf') {
      return this._readPdf(file, extension)
    }

    throw new Error('invalidFile')
  }

  // Fills the endpoint template for one request. The id is the only part that
  // varies: `manifest` while recognising the vendor, the organization once it
  // is known.
  private _profileUrl(id: string, extension: VoucherExtension): string {
    return buildVoucherEndpoint(this.endpoint, { id, poiType: this.poiType, extension })
  }

  private async _readPkpass(file: File, extension: VoucherExtension): Promise<VoucherDraft> {
    const pass = await readPassJson(file)

    if (this.poiType === 'poi_hotel') {
      // TODO: Recopilar más información sobre los pkpass de los hoteles para implementarlos.
      throw new Error('invalidFile')

    //   return pkpassToHotelDraft(pass)
    }

    const profile = await this._fetchProfile(pass, extension)
    return pkpassToTransportDraft(pass, profile)
  }

  // Asks the backend for the vendor profile matching this pass's organization.
  // Any miss (no org, unknown vendor → 404, or a request error) falls back to generic parsing.
  private async _fetchProfile(pass: PassJson, extension: VoucherExtension): Promise<VendorProfile | null> {
    const id = getPassProfileId(pass)
    const url = id ? this._profileUrl(id, extension) : ''
    if (!url) return null

    try {
      const response = await this._client.get<{ data: VendorProfile | null }>(url)
      return response.data ?? null
    } catch {
      return null
    }
  }

  private async _readPdf(file: File, extension: VoucherExtension): Promise<VoucherDraft> {
    if (file.size > PDF_MAX_SIZE) {
      throw new Error('fileTooLarge')
    }

    const pages = await extractPdfPages(file)
    const text = renderPages(pages)

    // No text layer at all: the PDF is a scan, and there is nothing to read.
    if (!text) {
      throw new Error('emptyContent')
    }

    this._processing = true

    const profile = await this._fetchPdfProfile(text, extension)

    // A known vendor is read by its profile; anything else falls back to the
    // generic parser, which fills what it recognises and leaves the rest for
    // the user to correct.
    return sanitizeDraft(profile
      ? parseWithPdfProfile(pages, text, profile)
      : parseGenericPdf(pages, text, this.poiType))
  }

  // Recognises the vendor against the backend manifest, then asks for that
  // profile. The requested id always comes from the manifest, never from the
  // document, so a crafted PDF cannot steer which resource gets fetched.
  // Any miss (unknown vendor → 404, or a request error) falls back to generic.
  private async _fetchPdfProfile(text: string, extension: VoucherExtension): Promise<PdfProfile | null> {
    if (!this.endpoint) return null

    try {
      this._manifest ??= (await this._client.get<{ data: PdfProfileManifestEntry[] }>(this._profileUrl('manifest', extension))).data ?? []

      const id = detectProfileId(text, this._manifest)
      if (!id) return null

      const response = await this._client.get<{ data: PdfProfile | null }>(this._profileUrl(id, extension))
      return response.data ?? null
    } catch {
      return null
    }
  }
}
