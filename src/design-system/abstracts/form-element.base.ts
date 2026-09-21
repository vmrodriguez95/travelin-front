import { LitElement } from 'lit'
import { property, state } from 'lit/decorators.js'
import type { FieldMessages } from '@ds/components/c-form/c-form.types'

export interface ValidityResult {
  valid: boolean
  message: string
  state: ValidityStateFlags
}

export abstract class FormElement extends LitElement {
  protected _internals: ElementInternals

  @property({ type: String }) id = ''

  @property({ type: String }) name = ''

  @property({ type: String }) label = ''

  @property({ type: String }) helpmsg = ''

  @property({ type: Boolean, reflect: true }) required = false

  @property({ type: Boolean }) readonly = false

  @property({ type: Object }) messages: FieldMessages = {}

  // Whether the user has reached the field yet: left it, picked something in
  // it, or tried to submit the form. Validity is always kept up to date on
  // ElementInternals so the form knows where it stands, but the message is
  // only printed once there is a reason to read it — a required field must
  // not open with an error before anyone has typed.
  @state() protected _touched = false

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  protected abstract _calculateValidity(): ValidityResult

  protected _getAnchorElement(): HTMLElement {
    return this
  }

  // What the template prints under the field.
  protected get _errorMessage(): string {
    return this._touched ? this._internals.validationMessage : ''
  }

  protected _getDefaultValidity(): ValidityResult {
    return { valid: true, message: '', state: {} }
  }

  protected _getRequiredValidity(): ValidityResult {
    return {
      valid: false,
      message: this.messages.required ?? 'Este campo es obligatorio',
      state: { valueMissing: true }
    }
  }

  protected _validate(): void {
    const validity = this._calculateValidity()
    const previousMessage = this._internals.validationMessage

    if (validity.valid) {
      this._internals.setValidity({})
    } else {
      this._internals.setValidity(validity.state, validity.message, this._getAnchorElement())
    }

    // The message lives on ElementInternals, which Lit does not observe. Without
    // this, a template printing it keeps showing a stale error after the field
    // has been corrected — including when it is corrected programmatically.
    if (this._internals.validationMessage !== previousMessage) {
      this.requestUpdate()
    }
  }

  // Marks the field as reached by the user and validates it, so from here on
  // its message is shown and kept current.
  protected _touch(): void {
    this._touched = true
    this._validate()
  }

  reportValidity(): boolean {
    this._touch()
    return this._internals.reportValidity()
  }

  checkValidity(): boolean {
    this._validate()
    return this._internals.checkValidity()
  }

  formResetCallback(): void {
    this._touched = false
  }
}
