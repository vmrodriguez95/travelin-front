import { html, css, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

import { FormElement } from '../../abstracts/form-element.base'
import type { ValidityResult } from '../../abstracts/form-element.base'

import style from './e-input-file.style.scss?inline'

@customElement('e-input-file')
export class EInputFile extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: Object }) value: FileList | null = null

  @property({ type: String }) extensions = ''

  @property({ type: Object }) a11y: Record<string, string> = {}

  @property({ type: Number }) size = 1024 * 500 // 500kb

  @property({ type: Boolean }) multiple = false

  @state() _filename: string = ''

  @query('input') _input!: HTMLInputElement

  protected override _getAnchorElement(): HTMLElement {
    return this._input ?? this
  }

  render() {
    return html`
      <div class="e-input-file">
        ${when(this.label, () => html`
          <label class="e-input-file__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
            ${when(this.helpmsg, () => html`
              <button class="u-input-info__button" type="button" aria-label=${this.helpmsg}>
                <e-icon icon="info" size="m"></e-icon>
                <p class="u-input-info__helpmsg">${this.helpmsg}</p>
              </button>
            `)}
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
          <button class="e-input-file__fake-field" type="button" @click=${this._openFileBrowser} aria-label=${this.a11y.upload}>
            <e-icon icon="attach-file" size="m"></e-icon> ${this._filename}
          </button>
          ${when(this.value, () => html`
            <button class="e-input-file__clear" type="button" @click=${this._onClean} aria-label=${this.a11y.clear}>
              <e-icon icon="close" size="s"></e-icon>
            </button>
          `)}
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-input-file__error">${this._internals.validationMessage}</p>
        `)}
      </div>
    `
  }

  private _openFileBrowser() {
    this._input.click()
  }

  private _onChange(e: Event) {
    const target = e.target as HTMLInputElement
    this.value = target.files

    if (this.value && this.value.length > 0) {
      this._filename = this.value[0].name
    }

    this._validate()
    this._internals.setFormValue(this.value?.[0] || '')
  }

  private _onClean() {
    this.value = null
    this._filename = ''
    this._validate()
    this._internals.setFormValue(this.value)

    this.dispatchEvent(new Event('change'))
  }

  protected _calculateValidity(): ValidityResult {
    if (this.required && !this.value) {
      return this._getRequiredValidity()
    }

    return this._getDefaultValidity()
  }
}
