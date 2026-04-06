import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

// Styles
import style from './e-input-time.style.scss?inline'

@customElement('e-input-time')
export class EInputTime extends LitElement {

  private _internals: ElementInternals

  @property({ type: String }) id = ''

  @property({ type: String }) name = ''

  @property({ type: String }) label = ''

  @property({ type: String }) value = ''

  @property({ type: String }) helpmsg = ''

  @property({ type: String }) min = '00:00'

  @property({ type: String }) max = '23:59'

  @property({ type: Boolean }) required = false

  @property({ type: Boolean }) readonly = false

  @query('input') _input!: HTMLInputElement

  static styles = css`${unsafeCSS(style)}`

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  render() {
    return html`
      <div class="e-input-time">
        ${when(this.label, () => html`
          <label class="e-input-time__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
          </label>
        `)}
        <div class="e-input-time__wrapper">
          <input
            id=${this.id}
            name=${this.name}
            class="e-input-time__field"
            type="time"
            min=${this.min}
            max=${this.max}
            ?readonly=${this.readonly}
            ?required=${this.required}
            value=${this.value}
            @change=${this._onChange}
          />
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-input-time__error">${this._internals.validationMessage}</p>
        `)}
        ${when(this.helpmsg, () => html`
          <p class="e-input-time__helpmsg">${this.helpmsg}</p>
        `)}
      </div>
    `
  }

  private _onChange(e: Event) {
    const target = e.target as HTMLInputElement
    this.value = target.value

    this._validate()
    this._internals.setFormValue(this.value)
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
    // required
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