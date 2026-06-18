import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'
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

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  protected abstract _calculateValidity(): ValidityResult

  protected _getAnchorElement(): HTMLElement {
    return this
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

    if (validity.valid) {
      this._internals.setValidity({})
      return
    }

    this._internals.setValidity(validity.state, validity.message, this._getAnchorElement())
  }

  reportValidity(): boolean {
    this._validate()
    return this._internals.reportValidity()
  }

  checkValidity(): boolean {
    this._validate()
    return this._internals.checkValidity()
  }
}
