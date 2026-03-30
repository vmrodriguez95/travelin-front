import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

// Styles
import style from './e-input-file.style.scss?inline'

@customElement('e-input-file')
export class EInputFile extends LitElement {

  private _internals: ElementInternals

  @property({ type: String }) id = ''

  @property({ type: String }) name = ''

  @property({ type: String }) label = ''

  @property({ type: String }) value = ''

  @property({ type: String }) helpmsg = ''

  @property({ type: String }) extensions = ''

  @property({ type: String }) size = 1024 * 500 // 500kb

  @property({ type: Boolean }) required = false

  @property({ type: Boolean }) readonly = false

  @property({ type: Boolean }) multiple = false

  @query('input') _input!: HTMLInputElement

  static styles = css`${unsafeCSS(style)}`

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  render() {
    return html`
      <div class="e-input-file">
        ${when(this.label, () => html`
          <label class="e-input-file__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
          </label>
        `)}
        <div class="e-input-file__wrapper">
          <input
            id=${this.id}
            name=${this.name}
            class="e-input-file__field"
            type="file"
            ?readonly=${this.readonly}
            ?required=${this.required}
            value=${this.value}
            accept=${this.extensions}
            @change=${this._onChange}
          />
          <button class="e-input-file__fake-field" @click=${this._openFileBrowser}>
            <e-icon icon="attach-file" size="m"></e-icon> ${this.value}
          </button>
          ${when(this.value, () => html`
            <button class="e-input-file__clear" @click=${this._onClean}>
              <e-icon icon="close" size="s"></e-icon>
            </button>
          `)}
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-input-file__error">${this._internals.validationMessage}</p>
        `)}
        ${when(this.helpmsg, () => html`
          <p class="e-input-file__helpmsg">${this.helpmsg}</p>
        `)}
      </div>
    `
  }

  private _openFileBrowser() {
    this._input.click()
  }

  private _onChange(e: Event) {
    const target = e.target as HTMLInputElement
    this.value = target.value

    this._validate()
    this._internals.setFormValue(this.value)
  }

  private _onClean() {
    this.value = ''

    this._validate()
    this._internals.setFormValue(this.value)

    this.dispatchEvent(new Event('change'))
  }

  private _validate() {
    const validity = this._calculateValidity()
    
    if (validity.valid) {
      this._internals.setValidity({})
      return
    }

    this._internals.setValidity(
      validity.state,
      validity.message,
      this
    )
  }

  private _getDefaultValidy() {
    return { valid: true, message: "", state: {} as any }
  }

  private _getRequiredValidy() {
    return {
      valid: false,
      message: "Este campo es obligatorio",
      state: { valueMissing: true }
    }
  }

  private _calculateValidity() {
    if (this.required && !this.value) {
      return this._getRequiredValidy()
    }
    
    return this._getDefaultValidy() 
  }

  reportValidity() {
    this._validate()
    return this._internals.reportValidity()
  }

  checkValidity() {
    this._validate()
    return this._internals.checkValidity()
  }
}