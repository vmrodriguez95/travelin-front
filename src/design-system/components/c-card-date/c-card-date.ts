import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import { Temporal } from '@js-temporal/polyfill'

import styles from './c-card-date.style.scss?inline'

@customElement('c-card-date')
export class CCardImage extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) index = ''

  @property({ type: String }) date = ''

  @property({ type: String }) text = ''

  private _day = ''

  private _month = ''

  private _tempDate!: Temporal.PlainDate

  connectedCallback(): void {
    this._setTempDate()
    this._setInfo()

    super.connectedCallback()
  }

  render() {
    const classes = classMap({
      'c-card-date': true,
      'c-card-date--today': this._isToday()
    })

    return html`
      <div class=${classes}>
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

  private _isToday() {
    return Temporal.PlainDate.compare(this._tempDate, Temporal.Now.plainDateISO()) === 0
  }

  private _setTempDate() {
    this._tempDate = Temporal.PlainDate.from(this.date)
  }

  private _setInfo() {
    this._setDay(this._tempDate.day.toString())
    this._setMonth(this._tempDate.toLocaleString(navigator.language, { month: 'long' }))
  }

  private _setDay(day: string) {
    this._day = day
  }

  private _setMonth(month: string) {
    this._month = month
  }
}