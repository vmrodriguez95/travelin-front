import { html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'

import type { SelectOption } from '@ds/components/c-form/c-form.types'

import { FormElement } from '../form-element.base'
import type { ValidityResult } from '../form-element.base'

import style from './e-select.style.scss?inline'

@customElement('e-select')
export class ESelect extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: String }) default = ''

  @property({ type: String, reflect: true }) value: string = ''

  @property({ type: Array }) options: SelectOption[] = []

  @query('select') _select!: HTMLSelectElement

  protected override _getAnchorElement(): HTMLElement {
    return this._select ?? this
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('required')) {
      this._internals.setFormValue(this.value || null)
      this._validate()
    }
  }

  render() {
    return html`
      <div class="e-select">
        ${when(this.label, () => html`
          <label class="e-select__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
            ${when(this.helpmsg, () => html`
              <button class="u-input-info__button" type="button" aria-label=${this.helpmsg}>
                <e-icon icon="info" size="m"></e-icon>
                <p class="u-input-info__helpmsg">${this.helpmsg}</p>
              </button>
            `)}
          </label>
        `)}
        <div class="e-select__wrapper">
          <select
            id=${this.id}
            name=${this.name}
            class="e-select__field"
            ?readonly=${this.readonly}
            ?required=${this.required}
            value=${this.value}
            @change=${this._onChange}
          >
            <option value="">${this.default}</option>
            ${this.options.map(option => html`
              <option value=${option.value} ?selected=${option.value === this.value}>
                ${option.label}
              </option>
            `)}
          </select>
          <e-icon class="e-select__icon" icon="arrow-down" size="l"></e-icon>
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-select__error">${this._internals.validationMessage}</p>
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
