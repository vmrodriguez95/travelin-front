import { html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { live } from 'lit/directives/live.js'
import { classMap } from 'lit/directives/class-map.js'

import { EICON_LIST } from '@ds/elements/e-icon/e-icon.list'

import { FormElement } from '../form-element.base'
import type { ValidityResult } from '../form-element.base'

import style from './e-input-icon.style.scss?inline'

@customElement('e-input-icon')
export class EInputIcon extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: String, reflect: true }) value = ''

  @property({ type: Object }) a11y: Record<string, string> = {}

  @state() _open = false

  connectedCallback(): void {
    super.connectedCallback()

    window.addEventListener('keyup', this._onEscape)
  }

  disconnectedCallback(): void {
    window.removeEventListener('keyup', this._onEscape)

    super.disconnectedCallback()
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('required')) {
      this._internals.setFormValue(this.value || null)
      this._validate()
    }
  }

  render() {
    const popupId = this._getPopupId()
    const popupClasses = classMap({
      'e-input-icon__popup': true,
      'e-input-icon__popup--open': this._open
    })

    return html`
      <div class="e-input-icon">
        <div class="e-input-icon__wrapper">
          <input
            id=${this.id}
            name=${this.name}
            aria-label=${this.label}
            class="e-input-icon__field"
            type="hidden"
            .value=${live(this.value)}
          />
          <button
            class="e-input-icon__choose"
            type="button"
            @click=${this._openPopup}
            aria-label=${this.a11y.choose}
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-controls=${popupId}
          >
            <e-icon icon=${this.value || 'smile-add'} size="l"></e-icon>
          </button>
          <div class=${popupClasses} aria-hidden=${this._open ? 'false' : 'true'}>
            <ul id=${popupId} class="e-input-icon__popup__list" aria-label=${this.a11y.list}>
              ${map(Object.keys(EICON_LIST), (iconKey) => html`
                <li>
                  <button
                    class=${this._getIconClasses(iconKey)}
                    type="button"
                    @click=${() => this._onChange(iconKey)}
                    aria-label="${this.a11y.icon} ${iconKey}"
                  >
                    <e-icon icon=${iconKey} size="m"></e-icon>
                  </button>
                </li>
              `)}
            </ul>
          </div>
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-input-icon__error">${this._internals.validationMessage}</p>
        `)}
        ${when(this.helpmsg, () => html`
          <p class="e-input-icon__helpmsg">${this.helpmsg}</p>
        `)}
      </div>
    `
  }

  private _openPopup = () => {
    this._open = !this._open
  }

  private _closePopup() {
    this._open = false
  }

  private _getPopupId() {
    return `${this.id || 'icon-picker'}-popup`
  }

  private _onEscape = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this._closePopup()
    }
  }

  private _getIconClasses(iconKey: string) {
    return classMap({
      'e-input-icon__icon': true,
      'e-input-icon__icon--active': this.value === iconKey
    })
  }

  private _onChange(iconKey: string) {
    this.value = iconKey
    this._closePopup()

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
