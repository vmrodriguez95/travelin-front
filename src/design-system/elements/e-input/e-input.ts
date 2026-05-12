import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { live } from 'lit/directives/live.js'
import { classMap } from 'lit/directives/class-map.js'

// Styles
import style from './e-input.style.scss?inline'

@customElement('e-input')
export class EInput extends LitElement {

  @property({ type: String }) id = ''

  @property({ type: String }) name = ''

  @property({ type: String }) label = ''

  @property({ type: String }) type = ''

  @property({ type: String }) autocomplete = 'off'

  @property({ type: String, reflect: true }) value!: string | number

  @property({ type: String }) compareValue = ''

  @property({ type: String }) helpmsg = ''

  @property({ type: Object }) a11y: any = {}

  @property({ type: Number }) minlength = 0

  @property({ type: Number }) maxlength = 255

  @property({ type: Boolean, reflect: true }) required = false

  @property({ type: Boolean }) readonly = false

  @query('input') _input!: HTMLInputElement

  _isPasswordField = false

  private _internals: ElementInternals

  static styles = css`${unsafeCSS(style)}`

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  connectedCallback(): void {
    super.connectedCallback()

    this._isPasswordField = this.type === 'password'
  }

  protected updated(changed: Map<string, unknown>) {
    const currentValue = this._getCurrentValue()

    if (changed.has('value') || changed.has('required')) {
      this._internals.setFormValue(currentValue || null)
      this._validate()
      return
    }

    if (changed.has('compareValue')) {
      this._internals.setFormValue(currentValue || null)

      if (currentValue) {
        this._validate()
      }
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
          ${when(this._isPasswordField, () => html`
            <button class="e-input__show-password" type="button" @click=${this._onShowPassword} aria-label=${this.type === 'password' ? this.a11y.showPassword : this.a11y.hidePassword}>
              <e-icon icon="${this.type === 'password' ? 'eye' : 'eye-off'}" size="m"></e-icon>
            </button>
          `)}
          ${when(this.value, () => html`
            <button class="e-input__clear" type="button" @click=${this._onClean} aria-label=${this.a11y.clear}>
              <e-icon icon="close" size="m"></e-icon>
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
    this._internals.setFormValue(this._getCurrentValue())
  }

  private _onBlur() {
    this._validate()
  }

  private _onClean() {
    this.value = ''

    this._validate()
    this._internals.setFormValue(this._getCurrentValue())

    this.dispatchEvent(new Event('input'))
  }

  private _onShowPassword() {
    this.type = this.type === 'password' ? 'text' : 'password'
  }

  private _getCurrentValue() {
    if (this._input) {
      return this._input.value || ''
    }

    return this.value?.toString() || ''
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

  private _getPasswordMismatchValidity() {
    return {
      valid: false,
      message: 'Las contraseñas no coinciden',
      state: { customError: true }
    }
  }

  private _getPasswordStrengthValidity() {
    return {
      valid: false,
      message: 'Debe incluir mayúscula, minúscula, número y uno de estos símbolos: .@$€/#-_?¿!¡&',
      state: { customError: true }
    }
  }

  private _getEmailValidity() {
    return {
      valid: false,
      message: 'Debe introducir un email válido',
      state: { typeMismatch: true }
    }
  }

  private _isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  private _isSecurePassword(value: string) {
    const hasUppercase = /[A-Z]/.test(value)
    const hasLowercase = /[a-z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSymbol = /[.@$€/#\-_?¿!¡&]/.test(value)

    return hasUppercase && hasLowercase && hasNumber && hasSymbol
  }

  private _calculateValidity() {
    const currentValue = this._getCurrentValue()

    // required
    if (this.required && !currentValue) {
      return this._getRequiredValidy()
    }
    
    if (this.minlength && currentValue.length < this.minlength) {
      return this._getMinLengthValidy()
    }
    
    if (this.maxlength && currentValue.length > this.maxlength) {
      return this._getMaxLengthValidy()
    }

    if (this.type === 'email' && currentValue && !this._isValidEmail(currentValue)) {
      return this._getEmailValidity()
    }

    if (this._isPasswordField && currentValue && !this._isSecurePassword(currentValue)) {
      return this._getPasswordStrengthValidity()
    }

    if (this._isPasswordField && this.compareValue && currentValue !== this.compareValue) {
      return this._getPasswordMismatchValidity()
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
