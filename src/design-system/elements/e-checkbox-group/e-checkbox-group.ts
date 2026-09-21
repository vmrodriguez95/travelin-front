import { html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'

import type { CheckboxOption } from '@ds/components/c-form/c-form.types'
import type { CheckboxGroupA11y } from './e-checkbox-group.types'
import type { EInput } from '@ds/elements/e-input/e-input'
import type { EInputIcon } from '@ds/elements/e-input-icon/e-input-icon'

import { FormElement } from '../../abstracts/form-element.base'
import type { ValidityResult } from '../../abstracts/form-element.base'

import style from './e-checkbox-group.style.scss?inline'

@customElement('e-checkbox-group')
export class ECheckboxGroup extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: Array }) options: CheckboxOption[] = []

  @property({ type: Array }) value: string[] = []

  // Lets the user add an option on the spot. Added options are submitted by
  // name (and icon) instead of id, so the server can tell they are new.
  @property({ type: Boolean }) canAdd = false

  @property({ type: String }) addLabel = ''

  @property({ type: String }) nameLabel = ''

  @property({ type: String }) namePlaceholder = ''

  @property({ type: Object }) a11y: CheckboxGroupA11y = {}

  @state() private _added: CheckboxOption[] = []

  @state() private _adding = false

  @state() private _newName = ''

  @state() private _newIcon = ''

  @state() private _newError = ''

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('required') || changed.has('_added')) {
      this._publishValue()
    }
  }

  render() {
    return html`
      <fieldset class="e-checkbox-group" aria-label=${this.a11y.group ?? this.label}>
        ${when(this.label, () => html`
          <legend class="e-checkbox-group__label">
            ${this.label} ${when(this.required, () => html`*`)}
            ${when(this.helpmsg, () => html`
              <button class="u-input-info__button" type="button" aria-label=${this.helpmsg}>
                <e-icon icon="info" size="m"></e-icon>
                <p class="u-input-info__helpmsg">${this.helpmsg}</p>
              </button>
            `)}
          </legend>
        `)}
        <div class="e-checkbox-group__options">
          ${map(this._allOptions, (option) => this._printOption(option))}
        </div>
        ${when(this._errorMessage, () => html`
          <p class="e-checkbox-group__error">${this._errorMessage}</p>
        `)}
        ${when(this.canAdd && !this.readonly, () => this._printAdd())}
      </fieldset>
    `
  }

  private get _allOptions(): CheckboxOption[] {
    return [...this.options, ...this._added]
  }

  private _printOption(option: CheckboxOption) {
    const checked = this.value.includes(option.value)
    const classes = classMap({
      'e-checkbox-group__option': true,
      'e-checkbox-group__option--checked': checked
    })

    return html`
      <label class=${classes}>
        <input
          class="e-checkbox-group__input"
          type="checkbox"
          name=${this.name}
          value=${option.value}
          .checked=${checked}
          ?disabled=${this.readonly}
          @change=${this._onChange}
        />
        ${when(option.icon, () => html`<e-icon icon=${option.icon} size="m"></e-icon>`)}
        <span class="e-checkbox-group__text">${option.label}</span>
      </label>
    `
  }

  private _printAdd() {
    if (!this._adding) {
      return html`
        <button class="e-checkbox-group__add" type="button" @click=${this._startAdd}>
          <e-icon icon="add" size="m"></e-icon> ${this.addLabel}
        </button>
      `
    }

    return html`
      <div class="e-checkbox-group__new">
        <div class="e-checkbox-group__new-actions">
          <button class="e-checkbox-group__new-action" type="button" @click=${this._confirmAdd} aria-label=${this.a11y.confirm ?? 'Confirmar'}>
            <e-icon icon="check" size="s"></e-icon>
          </button>
          <button class="e-checkbox-group__new-action" type="button" @click=${this._cancelAdd} aria-label=${this.a11y.cancel ?? 'Cancelar'}>
            <e-icon icon="remove" size="m"></e-icon>
          </button>
        </div>
        <div class="e-checkbox-group__new-fields">
          <e-input-icon
            id="${this.id}-new-icon"
            .value=${this._newIcon}
            .a11y=${this.a11y}
            @change=${this._onNewIcon}
          ></e-input-icon>
          <e-input
            class="e-checkbox-group__new-name"
            id="${this.id}-new-name"
            label=${this.nameLabel}
            placeholder=${this.namePlaceholder}
            .value=${this._newName}
            .a11y=${{ clear: this.a11y.clear }}
            @input=${this._onNewName}
          ></e-input>
        </div>
        ${when(this._newError, () => html`
          <p class="e-checkbox-group__error">${this._newError}</p>
        `)}
      </div>
    `
  }

  private _onChange(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement

    this._setValue(input.checked
      ? [...this.value, input.value]
      : this.value.filter((value) => value !== input.value))
  }

  private _setValue(value: string[]) {
    this._touched = true
    this.value = value
    this.dispatchEvent(new Event('change'))
  }

  private _startAdd() {
    this._adding = true
    this._newName = ''
    this._newIcon = ''
    this._newError = ''
  }

  private _cancelAdd() {
    this._adding = false
  }

  private _onNewName(ev: Event) {
    this._newName = String((ev.currentTarget as EInput).value)
    this._newError = ''
  }

  private _onNewIcon(ev: Event) {
    this._newIcon = (ev.currentTarget as EInputIcon).value
  }

  // A confirmed option joins the group already checked: whoever adds one
  // wants the item in it.
  private _confirmAdd() {
    const label = this._newName.trim()

    if (!label) {
      this._newError = this.messages.required ?? 'Este campo es obligatorio'
      return
    }

    const option: CheckboxOption = { label, value: crypto.randomUUID(), icon: this._newIcon }

    this._added = [...this._added, option]
    this._adding = false
    this._setValue([...this.value, option.value])
  }

  private _isAdded(value: string) {
    return this._added.some((option) => option.value === value)
  }

  // Checked options reach the server as `name[i][id]`; the ones added here
  // have no id yet, so they go as `name[i][name]` and `name[i][icon]`.
  private _publishValue() {
    const formData = new FormData()
    let index = 0

    this.value.forEach((value) => {
      const option = this._allOptions.find((candidate) => candidate.value === value)

      if (!option) return

      const prefix = `${this.name}[${index++}]`

      if (this._isAdded(value)) {
        formData.append(`${prefix}[name]`, option.label)
        formData.append(`${prefix}[icon]`, option.icon ?? '')
      } else {
        formData.append(`${prefix}[id]`, value)
      }
    })

    this._validate()
    this._internals.setFormValue(formData)
  }

  formResetCallback() {
    super.formResetCallback()

    this.value = []
    this._added = []
    this._adding = false
  }

  protected _calculateValidity(): ValidityResult {
    if (this.required && this.value.length === 0) {
      return this._getRequiredValidity()
    }

    return this._getDefaultValidity()
  }
}
