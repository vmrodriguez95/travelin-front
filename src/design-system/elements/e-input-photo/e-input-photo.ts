import { html, css, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

import { FormElement } from '../../abstracts/form-element.base'
import type { ValidityResult } from '../../abstracts/form-element.base'

import style from './e-input-photo.style.scss?inline'

@customElement('e-input-photo')
export class EInputPhoto extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: Object }) value: File | null = null

  @property({ type: String }) src = ''

  @property({ type: String }) extensions = 'image/*'

  @property({ type: Number }) size = 1024 * 1024 // 1MB

  @property({ type: Object }) a11y: Record<string, string> = {}

  @state() _preview = ''

  @query('input') _input!: HTMLInputElement

  disconnectedCallback(): void {
    super.disconnectedCallback()

    this._revokePreview()
  }

  protected override _getAnchorElement(): HTMLElement {
    return this._input ?? this
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('src') || changed.has('required')) {
      this._validate()
    }
  }

  render() {
    const photo = this._preview || this.src

    return html`
      <div class="e-input-photo">
        ${when(this.label, () => html`
          <label class="e-input-photo__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
            ${when(this.helpmsg, () => html`
              <button class="u-input-info__button" type="button" aria-label=${this.helpmsg}>
                <e-icon icon="info" size="m"></e-icon>
                <p class="u-input-info__helpmsg">${this.helpmsg}</p>
              </button>
            `)}
          </label>
        `)}
        <div class="e-input-photo__wrapper">
          <input
            id=${this.id}
            name=${this.name}
            class="e-input-photo__field"
            type="file"
            ?required=${this.required}
            accept=${this.extensions}
            @change=${this._onChange}
          />
          <button
            class="e-input-photo__preview"
            type="button"
            ?disabled=${this.readonly}
            aria-label=${this.a11y?.upload}
            @click=${this._openFileBrowser}
          >
            ${when(photo,
              () => html`<img class="e-input-photo__image" src=${photo} alt="" />`,
              () => html`<e-icon icon="person" size="xl"></e-icon>`
            )}
            ${when(!this.readonly, () => html`
              <span class="e-input-photo__edit">
                <e-icon icon="edit" size="m"></e-icon>
              </span>
            `)}
          </button>
          ${when(photo && !this.readonly, () => html`
            <button class="e-input-photo__clear" type="button" @click=${this._onClean} aria-label=${this.a11y?.clear}>
              <e-icon icon="close" size="s"></e-icon>
            </button>
          `)}
        </div>
        ${when(this._errorMessage, () => html`
          <p class="e-input-photo__error">${this._errorMessage}</p>
        `)}
      </div>
    `
  }

  private _openFileBrowser() {
    this._input.click()
  }

  private _onChange(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0] ?? null

    this._setFile(file)
    this._touch()

    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  }

  private _onClean() {
    this._input.value = ''
    this.src = ''

    this._setFile(null)
    this._touch()

    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  }

  private _setFile(file: File | null) {
    this._revokePreview()

    this.value = file
    this._preview = file ? URL.createObjectURL(file) : ''
    this._internals.setFormValue(file)
  }

  private _revokePreview() {
    if (this._preview) {
      URL.revokeObjectURL(this._preview)
    }
  }

  protected _calculateValidity(): ValidityResult {
    if (this.required && !this.value && !this.src) {
      return this._getRequiredValidity()
    }

    if (this.value && this.value.size > this.size) {
      return this._getSizeValidity()
    }

    if (this.value && !this.value.type.startsWith('image/')) {
      return this._getTypeValidity()
    }

    return this._getDefaultValidity()
  }

  private _getSizeValidity(): ValidityResult {
    return {
      valid: false,
      message: this.messages.maxLength ?? `La imagen no puede pesar más de ${Math.round(this.size / 1024 / 1024)} MB`,
      state: { rangeOverflow: true }
    }
  }

  private _getTypeValidity(): ValidityResult {
    return {
      valid: false,
      message: this.messages.mismatch ?? 'El archivo debe ser una imagen',
      state: { typeMismatch: true }
    }
  }
}
