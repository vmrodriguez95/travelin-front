import { html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

import { FormElement } from '../form-element.base'
import type { ValidityResult } from '../form-element.base'

import style from './e-input-date.style.scss?inline'

@customElement('e-input-date')
export class EInputDate extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: String }) type = 'date'

  @property({ type: String }) value = ''

  @property({ type: String }) min = ''

  @property({ type: String }) max = ''

  @query('input') _input!: HTMLInputElement

  protected override _getAnchorElement(): HTMLElement {
    return this._input ?? this
  }

  render() {
    return html`
      <div class="e-input-date">
        ${when(this.label, () => html`
          <label class="e-input-date__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
            ${when(this.helpmsg, () => html`
              <button class="u-input-info__button" type="button" aria-label=${this.helpmsg}>
                <e-icon icon="info" size="m"></e-icon>
                <p class="u-input-info__helpmsg">${this.helpmsg}</p>
              </button>
            `)}
          </label>
        `)}
        <div class="e-input-date__wrapper">
          <input
            id=${this.id}
            name=${this.name}
            class="e-input-date__field"
            type=${this.type}
            min=${this.min}
            max=${this.max}
            ?readonly=${this.readonly}
            ?required=${this.required}
            value=${this.value}
            @change=${this._onChange}
          />
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-input-date__error">${this._internals.validationMessage}</p>
        `)}
      </div>
    `
  }

  private _onChange(e: Event) {
    const target = e.target as HTMLInputElement
    this.value = target.value

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
