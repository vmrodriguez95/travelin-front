import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import styles from './c-card-date.style.scss?inline'
import { Temporal } from '@js-temporal/polyfill'

@customElement('c-card-date')
export class CCardImage extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) index = ''

  @property({ type: String }) date = ''

  @property({ type: String }) text = ''

  private _day = ''

  private _month = ''

  connectedCallback(): void {
    this._setInfo()

    super.connectedCallback()
  }

  render() {
    return html`
      <div class="c-card-date">
        <div class="c-card-date__head">
          <p class="c-card-date__index">Día ${this.index}</p>
          <p class="c-card-date__day">${this._day}</p>
          <p class="c-card-date__month">${this._month}</p>
        </div>
        <div class="c-card-date__content">
          <p class="c-card-date__title">${this.text}</p>
          <slot />
        </div>
      </div>
    `
  }

  private _setInfo() {
    const newDate = Temporal.PlainDate.from(this.date)

    this._setDay(newDate.day.toString())
    this._setMonth(newDate.toLocaleString(navigator.language, { month: 'long' }))
  }

  private _setDay(day: string) {
    this._day = day
  }

  private _setMonth(month: string) {
    this._month = month
  }
}