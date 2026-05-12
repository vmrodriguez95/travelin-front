import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query, queryAll } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'

// Styles
import styles from './c-verify.style.scss?inline'

@customElement('c-verify')
export class CVerify extends LitElement {

  @property({ type: String }) email = ''

  @property({ type: String }) action = ''

  @property({ type: String }) method = 'POST'

  @property({ type: String }) submitLabel = 'Enviar'

  @query('form') form!: HTMLFormElement

  @query('input[name="code"]') _codeField!: HTMLInputElement

  @query('input[name="email"]') _emailField!: HTMLInputElement

  @queryAll('input:not([type="hidden"])') inputs!: NodeListOf<HTMLInputElement>

  static styles = css`${unsafeCSS(styles)}`

  protected firstUpdated() {
    this._activateObservers()
  }

  render() {
    return html`
      <div class="c-verify">
        <slot name="title"></slot>
        <slot name="description"></slot>
        <div class="c-verify__code">
          ${map(Array.from({ length: 4 }), (_, i) => html`
            <input
              id="code${i}"
              name="code${i}"
              type="text"
              minLength="0"
              maxLength="1"
              class="c-verify__input"
              @paste=${this._pasteHandler}
              @input=${this._changeHandler}
              @change=${this._changeHandler}
              @keyup=${this._keyupHandler}
            />
          `)}
        </div>
        <slot></slot>
        <form
          class="c-verify__form"
          action=${this.action}
          method=${this.method}
          enctype="application/x-www-form-urlencoded"
          @submit=${this._submitHandler}
        >
          <fieldset class="c-verify__fieldset">
            <legend class="c-verify__legend">Código de verificación</legend>
            <input type="hidden" name="code" />
            ${when(this.email, () => html`
              <input type="hidden" name="email" value=${this.email} />
            `)}
            <e-button
              class="c-verify__button"
              type="submit"
              size="full"
              @click=${this._dispatchSubmit}
            >${this.submitLabel}</e-button>
          </fieldset>
        </form>
      </div>
    `
  }

  private _isCodeValid(code: string) {
    return /[0-9]{4}/g.test(code)
  }

  private _getCodeFromInputs() {
    let code = ''

    this.inputs.forEach((input) => {
      code += input.value
    })

    return code
  }

  private _dispatchSubmit() {
    this.form.dispatchEvent(new Event('submit'))
  }

  private _isValueAttr(mutation: MutationRecord) {
    return mutation.type === 'attributes' && mutation.attributeName === 'value'
  }

  private _isMaxLengthAttr(mutation: MutationRecord) {
    return mutation.type === 'attributes' && mutation.attributeName === 'value'
  }

  private _observerEmailRule = (mutation: MutationRecord, input: HTMLInputElement) => {
    if (this._isValueAttr(mutation) && input.value !== this.email) {
      input.value = this.email
      input.setAttribute('value', this.email)
    }
  }

  private _observerCodeRule = (mutation: MutationRecord, input: HTMLInputElement) => {
    if (this._isValueAttr(mutation) && input.value && !this._isCodeValid(input.value)) {
      input.value = ''
      input.setAttribute('value', '')
    }
  }

  private _observerInputRule = (mutation: MutationRecord, input: HTMLInputElement) => {
    if (this._isValueAttr(mutation) && input.value) {
      input.value = ''
      input.setAttribute('value', '')
    } else if (this._isMaxLengthAttr(mutation) && input.maxLength !== 1) {
      input.setAttribute('maxLength', '1')
    }
  }

  private _createObserverForInput(input: HTMLInputElement, rules: Function) {
    return new MutationObserver((mutationsList: MutationRecord[]) => {
      for(let mutation of mutationsList) {
        rules(mutation, input)
      }
    })
  }

  private _addObserverToInput(input: HTMLInputElement, rules: Function) {
    const observer = this._createObserverForInput(input, rules)
    const config = { attributes: true, attributeFilter: ['value', 'maxLength'] }

    observer.observe(input, config)
  }

  private _activateObservers() {
    this.inputs.forEach((input) => {
      this._addObserverToInput(input, this._observerInputRule)
    })
    this._addObserverToInput(this._codeField, this._observerCodeRule)
    this._addObserverToInput(this._emailField, this._observerEmailRule)
  }

  private _submitHandler = (ev: SubmitEvent) => {
    ev.preventDefault()
    const code = this._codeField.value

    if (this._isCodeValid(code)) {
      this.form.submit()
    }
  }

  private _pasteHandler = (ev: ClipboardEvent) => {
    const content = ev.clipboardData?.getData('text')
    const isCode = content && this._isCodeValid(content)

    if (!content || !isCode) return false

    const splittedNumber = content.split('')

    this.inputs.forEach((input, index) => {
      input.value = splittedNumber[index]
    })
  }

  private _changeHandler = (ev: Event) => {
    const target = ev.target as HTMLInputElement
    const value = target.value

    if (value.length > 1) {
      target.value = value.slice(0, 1)
    } else {
      target.value = value.replace(/[^0-9]/g, '')
    }

    const code = this._getCodeFromInputs()
    this._codeField.value = this._isCodeValid(code) ? code : ''

    if (target.nextElementSibling && target.value) {
      (target.nextElementSibling as HTMLInputElement).focus()
    }

  }

  private _backspaceAction(target: HTMLInputElement) {
    this._codeField.value = ''

    if (!target.previousElementSibling) return

    (target.previousElementSibling as HTMLInputElement).focus()
  }

  private _enterAction() {
    const code = this._getCodeFromInputs()

    if (this._isCodeValid(code)) {
      this.form.submit()
    }
  }

  private _keyupHandler = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case 'Backspace':
        this._backspaceAction(ev.target as HTMLInputElement)
        break
      case 'Enter':
        this._enterAction()
        break
    }
  }
}
