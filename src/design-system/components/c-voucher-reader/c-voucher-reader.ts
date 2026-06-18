import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// Types
import type { VoucherTransportData } from './c-voucher-reader.parser'

// Parser
import {
  parseTransportVoucherPdf,
  VOUCHER_READER_DATA_EVENT
} from './c-voucher-reader.parser'

// Styles
import styles from './c-voucher-reader.style.scss?inline'

type VoucherReaderType = 'travel' | 'hotel' | 'activity'

@customElement('c-voucher-reader')
export class CVoucherReader extends LitElement {

  @property({ type: String }) type: VoucherReaderType = 'travel'

  @property({ attribute: false }) data: VoucherTransportData | null = null

  jszipLib!: any

  pdfjsLib!: any

  private _ready: Promise<void> = Promise.resolve()

  static styles = css`${unsafeCSS(styles)}`

  async firstUpdated(): Promise<void> {
    this._ready = (async () => {
      await this._importJSZip()
      await this._importPdfJs()
    })()

    await this._ready
  }

  render() {
    return html`
      <div class="c-voucher-reader">
        <input type="file" accept=".pkpass,.pdf,application/pdf,application/vnd.apple.pkpass" id="voucher-reader-input" class="c-voucher-reader__input" @change=${this._handleFileChange} />
        ${this.data ? html`
          <pre class="c-voucher-reader__output">${JSON.stringify(this.data, null, 2)}</pre>
        ` : ''}
      </div>
    `
  }

  private async _importJSZip() {
    const { default: JSZip } = await import('JSZip')

    this.jszipLib = JSZip
  }

  private async _importPdfJs() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

    this.pdfjsLib = pdfjsLib
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.mjs',
      import.meta.url
    ).toString()
  }

  private async _handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement

    await this._ready

    if (!input.files || input.files.length === 0) {
      return
    }

    const file = input.files[0]
    const fileName = file.name.toLowerCase()

    try {
      if (fileName.endsWith('.pkpass')) {
        await this._readPKPassFile(file)
      } else if (fileName.endsWith('.pdf')) {
        await this._readPDFFile(file)
      } else {
        console.warn('Unsupported file type')
      }
    } finally {
      input.value = ''
    }
  }
  
  private async _readPKPassFile(file: File) {
    try {
      const buffer = await file.arrayBuffer()
      const zip = await this.jszipLib.loadAsync(buffer)

      const pkpassFile = zip.file('pass.json')


      if(!pkpassFile) {
        throw new Error('pass.json not found in PKPass file')
      }

      const pkpassContent = await pkpassFile.async('string')
      const pkpassData = JSON.parse(pkpassContent)

      console.log('PKPass data:', pkpassData)

    } catch (error) {
      console.error('Error reading PKPass file:', error)
    }
  }

  private async _readPDFFile(file: File) {
    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      const pdfDocument = await this.pdfjsLib.getDocument({ data: buffer }).promise
      const pageTexts: Array<string> = []

      for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
        const page = await pdfDocument.getPage(pageIndex)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')

        pageTexts.push(pageText)
      }

      const parsedData = parseTransportVoucherPdf(pageTexts)

      this.data = parsedData
      this.dispatchEvent(new CustomEvent<VoucherTransportData>(VOUCHER_READER_DATA_EVENT, {
        detail: parsedData,
        bubbles: true,
        composed: true
      }))
    } catch (error) {
      console.error('Error reading PDF file:', error)
    }
  }
}
