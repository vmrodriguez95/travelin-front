import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { live } from 'lit/directives/live.js'

// Styles
import style from './e-textarea.style.scss?inline'

@customElement('e-textarea')
export class ETextarea extends LitElement {

  private _internals: ElementInternals

  @property({ type: String }) id = ''

  @property({ type: String }) name = ''

  @property({ type: String }) label = ''

  @property({ type: String }) value = ''

  @property({ type: String }) helpmsg = ''

  @property({ type: Boolean }) required = false

  @property({ type: Boolean }) readonly = false

  @query('textarea') _input!: HTMLInputElement

  static styles = css`${unsafeCSS(style)}`

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  render() {
    return html`
      <div class="e-textarea">
        ${when(this.label, () => html`
          <label class="e-textarea__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
          </label>
        `)}
        <div class="e-textarea__wrapper">
          <textarea
            id=${this.id}
            name=${this.name}
            class="e-textarea__field"
            ?readonly=${this.readonly}
            ?required=${this.required}
            .value=${live(this.value)}
            @input=${this._onInput}
            @blur=${this._onBlur}
          ></textarea>
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-textarea__error">${this._internals.validationMessage}</p>
        `)}
        ${when(this.helpmsg, () => html`
          <p class="e-textarea__helpmsg">${this.helpmsg}</p>
        `)}
      </div>
    `
  }

  private _onInput(e: Event) {
    const target = e.target as HTMLInputElement
    this.value = target.value

    this._validate()
    this._internals.setFormValue(this.value)
  }

  private _onBlur() {
    this._validate()
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
      this._input
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