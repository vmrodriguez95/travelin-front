import { html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { live } from 'lit/directives/live.js'

import { FormElement } from '../form-element.base'
import type { ValidityResult } from '../form-element.base'

import style from './e-textarea.style.scss?inline'

@customElement('e-textarea')
export class ETextarea extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: String, reflect: true }) value = ''

  @query('textarea') _input!: HTMLInputElement

  protected override _getAnchorElement(): HTMLElement {
    return this._input ?? this
  }

  protected updated(changed: Map<string, unknown>) {
    const currentValue = this._getCurrentValue()

    if (changed.has('value') || changed.has('required')) {
      this._internals.setFormValue(currentValue || null)
      this._validate()
    }
  }

  render() {
    return html`
      <div class="e-textarea">
        ${when(this.label, () => html`
          <label class="e-textarea__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
            ${when(this.helpmsg, () => html`
              <button class="u-input-info__button" type="button" aria-label=${this.helpmsg}>
                <e-icon icon="info" size="m"></e-icon>
                <p class="u-input-info__helpmsg">${this.helpmsg}</p>
              </button>
            `)}
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

  private _getCurrentValue() {
    if (this._input) {
      return this._input.value || ''
    }

    return this.value?.toString() || ''
  }

  protected _calculateValidity(): ValidityResult {
    if (this.required && !this.value) {
      return this._getRequiredValidity()
    }

    return this._getDefaultValidity()
  }
}
