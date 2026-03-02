import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { live } from 'lit/directives/live.js'
import { classMap } from 'lit/directives/class-map.js'

// Styles
import style from './e-input.style.scss?inline'

@customElement('e-input')
export class EInput extends LitElement {

  private _internals: ElementInternals

  @property({ type: String }) id = ''

  @property({ type: String }) name = ''

  @property({ type: String }) label = ''

  @property({ type: String }) type = ''

  @property({ type: String }) autocomplete = 'off'

  @property({ type: String, reflect: true }) value!: string | number

  @property({ type: String }) helpmsg = ''

  @property({ type: Number }) minlength = 0

  @property({ type: Number }) maxlength = 255

  @property({ type: Boolean, reflect: true }) required = false

  @property({ type: Boolean }) readonly = false

  static styles = css`${unsafeCSS(style)}`

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('required')) {
      this._internals.setFormValue(this.value.toString() || null)
      this._validate()
    }
  }

  render() {
    const inputClasses = classMap({
      'e-input': true,
      'e-input--hidden': this.type === 'hidden'
    })

    return html`
      <div class=${inputClasses}>
        ${when(this.label, () => html`
          <label class="e-input__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
          </label>
        `)}
        <div class="e-input__wrapper">
          <input
            id=${this.id}
            name=${this.name}
            class="e-input__field"
            type=${this.type}
            autocomplete=${this.autocomplete}
            ?readonly=${this.readonly}
            ?required=${this.required}
            .minlength=${this.minlength}
            .maxlength=${this.maxlength}
            .value=${live(this.value)}
            @input=${this._onInput}
            @blur=${this._onBlur}
          />
          ${when(this.value, () => html`
            <button class="e-input__clear" @click=${this._onClean}>
              <e-icon icon="close" size="s"></e-icon>
            </button>
          `)}
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-input__error">${this._internals.validationMessage}</p>
        `)}
        ${when(this.helpmsg, () => html`
          <p class="e-input__helpmsg">${this.helpmsg}</p>
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

  private _onClean() {
    this.value = ''

    this._validate()
    this._internals.setFormValue(this.value)

    this.dispatchEvent(new Event('input'))
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

  private _getMinLengthValidy() {
    return {
      valid: false,
      message: `Debe tener mínimo ${this.minlength} caracteres`,
      state: { tooShort: true }
    }
  }

  private _getMaxLengthValidy() {
    return {
      valid: false,
      message: `No puede tener más de ${this.maxlength} caracteres`,
      state: { tooLong: true }
    }
  }

  private _calculateValidity() {
    // required
    if (this.required && !this.value) {
      return this._getRequiredValidy()
    }
    
    if (this.minlength && Number.isInteger(this.value) && (this.value as number) < this.minlength) {
      return this._getMinLengthValidy()
    }
    
    if (this.maxlength && Number.isInteger(this.value) && (this.value as number) > this.maxlength) {
      return this._getMaxLengthValidy()
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