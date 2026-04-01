import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'

// Utils
import {
  getWeekdayInitials,
  getMonthDays,
  getMonths,
  getMonth,
  getYear,
  isToday,
  getDateFrom,
  compareDates
} from '../../utils/date.utils'

import { Temporal } from '@js-temporal/polyfill'

// Styles
import style from './e-calendar.style.scss?inline'

@customElement('e-calendar')
export class ECalendar extends LitElement {

  private _internals: ElementInternals

  @property({ type: String }) id = ''

  @property({ type: String }) name = ''

  @property({ type: String }) label = ''

  @property({ type: String }) value = ''

  @property({ type: String }) helpmsg = ''

  @property({ type: String }) start = ''

  @property({ type: String }) end = ''

  @property({ type: Array }) returnedValues = []

  @property({ type: Boolean }) required = false

  @property({ type: Boolean }) readonly = false
  
  @state() _actualMonth: number = 0

  @state() _actualYear: number = 0

  _years: Array<number> = []

  _months: Array<string> = []

  _monthDays: Array<number | null> = []

  _weekdaysInititals: Array<string> = []

  static styles = css`${unsafeCSS(style)}`

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  connectedCallback(): void {
    this._initialize()

    this._months = getMonths()
    this._years = this._getYears()
    this._monthDays = getMonthDays(this._actualMonth, this._actualYear)
    this._weekdaysInititals = getWeekdayInitials()

    super.connectedCallback()
  }

  render() {
    const inputClasses = classMap({
      'e-calendar': true,
      'e-calendar--readonly': this.readonly,
      'e-calendar--required': this.required
    })

    return html`
      <div class=${inputClasses}>
        ${when(this.label, () => html`
          <label class="e-calendar__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
          </label>
        `)}
        <div class="e-calendar__wrapper">
          <div class="e-calendar__header">
            <span class="e-calendar__counter">${this._getDaysCounter()}</span>
            <div class="e-calendar__actions">
              ${when(!this.readonly && !this._isFirstDate(), () => html`
                <button class="e-calendar__action" ?disabled=${this.readonly} @click=${this._onPreviousDate}>
                  <e-icon icon="arrow-left" size="l"></e-icon>
                </button>
              `)}
              <select id="month" class="e-calendar__choise" ?disabled=${this.readonly} @change=${this._onMonthChange}>
                ${map(this._months, (month, index) => html`
                  <option value=${index + 1} ?selected=${index + 1 === this._actualMonth}>${month}</option>
                `)}
              </select>
              <select id="year" class="e-calendar__choise" ?disabled=${this.readonly} @change=${this._onYearChange}>
                ${map(this._years, (year) => html`
                  <option value=${year} ?selected=${year === this._actualYear}>${year}</option>
                `)}
              </select>
              ${when(!this.readonly && !this._isLastDate(), () => html`
                <button class="e-calendar__action" ?disabled=${this.readonly} @click=${this._onNextDate}>
                  <e-icon icon="arrow-right" size="l"></e-icon>
                </button>
              `)}
            </div>
          </div>
          <div class="e-calendar__body">
            ${map(this._weekdaysInititals, (day) => html`
              <p class="e-calendar__initial">${day}</p>
            `)}
            ${map(this._monthDays, (day) => when(day, () => html`
              <button class=${this._getDayClasses(day!)} ?disabled=${this.readonly} @click=${() => this._onChange(day!)}>
                ${day}
              </button>
            `, () => html`
              <span></span>
            `))}
          </div>
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-calendar__error">${this._internals.validationMessage}</p>
        `)}
        ${when(this.helpmsg, () => html`
          <p class="e-calendar__helpmsg">${this.helpmsg}</p>
        `)}
      </div>
    `
  }

  // General
  private _initialize() {
    this._actualMonth = getMonth(this.start)
    this._actualYear = getYear(this.start)
  }

  private _isFirstDate() {
    return this._actualMonth === 1 && this._actualYear === this._years[0]
  }

  private _isLastDate() {
    return this._actualMonth === 12 && this._actualYear === this._years[this._years.length - 1]
  }

  private _isSingle(day: number) {
    return this.start === getDateFrom({ day, month: this._actualMonth, year: this._actualYear }).toString() && !this.end
  }

  private _isStart(day: number) {
    return this.start === getDateFrom({ day, month: this._actualMonth, year: this._actualYear }).toString() && this.end
  }

  private _isMiddle(day: number) {
    if (!this.start || !this.end) return false

    const startDate = getDateFrom(this.start)
    const endDate = getDateFrom(this.end)
    const actualDate = getDateFrom({ day, month: this._actualMonth, year: this._actualYear })

    return compareDates(startDate, actualDate) === -1 && compareDates(endDate, actualDate) === 1
  }

  private _isEnd(day: number) {
    return this.end === getDateFrom({ day, month: this._actualMonth, year: this._actualYear }).toString()
  }

  private _getDaysCounter() {
    if (!this.start && !this.end) return '0 días seleccionados'

    if (this.start && !this.end) return '1 día seleccionado'

    const startDate = getDateFrom(this.start)
    const endDate = getDateFrom(this.end)

    return `${startDate.until(endDate, { largestUnit: 'day' }).days + 1} días seleccionados`
  }

  private _getYears() {
    const date = Temporal.Now.plainDateISO()
    const limitOfYears = 10
    const startYear = date.year - 3

    return Array.from({ length: limitOfYears }, (_, i) => {
      return startYear + i
    })
  }

  private _getDayClasses(day: number) {
    const actualDate = getDateFrom({day, month: this._actualMonth, year: this._actualYear})

    return classMap({
      'e-calendar__day': true,
      'e-calendar__day--today': isToday(actualDate),
      'e-calendar__day--single': this._isSingle(day),
      'e-calendar__day--start': this._isStart(day),
      'e-calendar__day--middle': this._isMiddle(day),
      'e-calendar__day--end': this._isEnd(day),
    })
  }

  // Events

  private _onPreviousDate() {
    let newMonth = this._actualMonth
    let newYear = this._actualYear

    if (this._actualMonth === 1) {
      newMonth = 12
      newYear = this._actualYear - 1
    } else {
      newMonth--
    }

    this._monthDays = getMonthDays(newMonth, newYear)
    this._actualMonth = newMonth
    this._actualYear = newYear
  }

  private _onNextDate() {
    let newMonth = this._actualMonth
    let newYear = this._actualYear

    if (this._actualMonth === 12) {
      newMonth = 1
      newYear = this._actualYear + 1
    } else {
      newMonth++
    }

    this._monthDays = getMonthDays(newMonth, newYear)
    this._actualMonth = newMonth
    this._actualYear = newYear
  }

  private _onMonthChange(e: Event) {
    const target = e.currentTarget as HTMLSelectElement
    const newMonth = parseInt(target.value)

    this._monthDays = getMonthDays(newMonth, this._actualYear)
    this._actualMonth = newMonth
  }

  private _onYearChange(e: Event) {
    const target = e.currentTarget as HTMLSelectElement
    const newYear = parseInt(target.value)

    this._monthDays = getMonthDays(this._actualMonth, newYear)
    this._actualYear = newYear
  }

  private _onChange(day: number) {
    const formData = new FormData()
    const newDate = getDateFrom({ day, month: this._actualMonth, year: this._actualYear }).toString()

    if (!this.start && !this.end) {
      this.start = newDate
      this.value = newDate
    } else if (this.start && compareDates(this.start, newDate) === 1 && !this.end) {
      this.start = newDate
      this.value = newDate
    } else if (this.start && compareDates(this.start, newDate) === -1 && !this.end) {
      this.end = newDate
    } else if (this.start && this.end) {
      this.start = newDate
      this.value = newDate
      this.end = ''
    }

    if (this.returnedValues.length) {
      formData.append(this.returnedValues[0], this.start)
      formData.append(this.returnedValues[1], this.end || '')
    }

    this._validate()
    this._internals.setFormValue(formData)
    this.dispatchEvent(new CustomEvent('change', { detail: [this.start, this.end] }))
  }

  // Validation
  private _validate() {
    const validity = this._calculateValidity()
    
    if (validity.valid) {
      this._internals.setValidity({})
      return
    }

    this._internals.setValidity(
      validity.state,
      validity.message,
      this
    )
  }

  private _getDefaultValidy() {
    return { valid: true, message: "", state: {} as any }
  }

  private _getRequiredValidy() {
    return {
      valid: false,
      message: "Ninguna fecha seleccionada",
      state: { valueMissing: true }
    }
  }

  private _calculateValidity() {
    if (this.required && !this.value) {
      return this._getRequiredValidy()
    }
    
    return this._getDefaultValidy()
  }

  reportValidity() {
    this._validate()
    return this._internals.reportValidity()
  }

  checkValidity() {
    this._validate()
    return this._internals.checkValidity()
  }
}