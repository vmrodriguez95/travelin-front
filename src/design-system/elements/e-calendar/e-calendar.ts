import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'

// Utils
import {
  getWeekdayInitials,
  getMonthDays,
  getMonths,
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

  @property({ type: String }) min = ''

  @property({ type: String }) max = ''

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

  protected updated(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has('start')
      || changedProperties.has('min')
      || changedProperties.has('max')
    ) {
      this._syncCalendarView()
    }
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
                <button class="e-calendar__action" type="button" ?disabled=${this.readonly} @click=${this._onPreviousDate}>
                  <e-icon icon="arrow-left" size="l"></e-icon>
                </button>
              `)}
              <select id="month" class="e-calendar__choise" ?disabled=${this.readonly} @change=${this._onMonthChange}>
                ${map(this._months, (month, index) => html`
                  <option
                    value=${index + 1}
                    ?selected=${index + 1 === this._actualMonth}
                    ?disabled=${this._isMonthDisabled(index + 1, this._actualYear)}
                  >
                    ${month}
                  </option>
                `)}
              </select>
              <select id="year" class="e-calendar__choise" ?disabled=${this.readonly} @change=${this._onYearChange}>
                ${map(this._years, (year) => html`
                  <option value=${year} ?selected=${year === this._actualYear} ?disabled=${this._isYearDisabled(year)}>${year}</option>
                `)}
              </select>
              ${when(!this.readonly && !this._isLastDate(), () => html`
                <button class="e-calendar__action" type="button" ?disabled=${this.readonly} @click=${this._onNextDate}>
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
              <button
                class=${this._getDayClasses(day!)}
                type="button"
                ?disabled=${this.readonly || this._isDayDisabled(day!)}
                @click=${() => this._onChange(day!)}
              >
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
    const initialDate = this._getInitialViewDate()

    this._actualMonth = initialDate.month
    this._actualYear = initialDate.year
  }

  private _syncCalendarView() {
    this._years = this._getYears()

    const initialDate = this._getInitialViewDate()
    this._goToMonth(initialDate.month, initialDate.year)
  }

  private _getMinDate() {
    return this.min ? getDateFrom(this.min) : null
  }

  private _getMaxDate() {
    return this.max ? getDateFrom(this.max) : null
  }

  private _getInitialViewDate() {
    const referenceDate = this.start || this.min || Temporal.Now.plainDateISO().toString()
    const minDate = this._getMinDate()
    const maxDate = this._getMaxDate()
    let initialDate = getDateFrom(referenceDate)

    if (minDate && compareDates(initialDate, minDate) === -1) {
      initialDate = minDate
    }

    if (maxDate && compareDates(initialDate, maxDate) === 1) {
      initialDate = maxDate
    }

    return initialDate
  }

  private _goToMonth(month: number, year: number) {
    this._monthDays = getMonthDays(month, year)
    this._actualMonth = month
    this._actualYear = year
  }

  private _getMonthStart(month: number, year: number) {
    return getDateFrom({ day: 1, month, year })
  }

  private _getMonthEnd(month: number, year: number) {
    return getDateFrom({ day: 1, month, year }).with({ day: getDateFrom({ day: 1, month, year }).daysInMonth })
  }

  private _isMonthDisabled(month: number, year: number) {
    const minDate = this._getMinDate()
    const maxDate = this._getMaxDate()
    const monthStart = this._getMonthStart(month, year)
    const monthEnd = this._getMonthEnd(month, year)

    if (minDate && compareDates(monthEnd, minDate) === -1) {
      return true
    }

    if (maxDate && compareDates(monthStart, maxDate) === 1) {
      return true
    }

    return false
  }

  private _isYearDisabled(year: number) {
    return Array.from({ length: 12 }, (_, index) => index + 1).every((month) => {
      return this._isMonthDisabled(month, year)
    })
  }

  private _getNearestAvailableMonth(year: number, preferredMonth: number) {
    const availableMonths = Array.from({ length: 12 }, (_, index) => index + 1).filter((month) => {
      return !this._isMonthDisabled(month, year)
    })

    if (!availableMonths.length) return preferredMonth

    return availableMonths.reduce((bestMonth, month) => {
      const currentDistance = Math.abs(month - preferredMonth)
      const bestDistance = Math.abs(bestMonth - preferredMonth)

      return currentDistance < bestDistance ? month : bestMonth
    }, availableMonths[0])
  }

  private _isDayDisabled(day: number) {
    const actualDate = getDateFrom({ day, month: this._actualMonth, year: this._actualYear })
    const minDate = this._getMinDate()
    const maxDate = this._getMaxDate()

    if (minDate && compareDates(actualDate, minDate) === -1) {
      return true
    }

    if (maxDate && compareDates(actualDate, maxDate) === 1) {
      return true
    }

    return false
  }

  private _isFirstDate() {
    return this._actualMonth === this._getNearestAvailableMonth(this._actualYear, 1)
      && this._actualYear === this._years.find((year) => !this._isYearDisabled(year))
  }

  private _isLastDate() {
    const availableYears = this._years.filter((year) => !this._isYearDisabled(year))
    const lastAvailableYear = availableYears[availableYears.length - 1]

    return this._actualMonth === this._getNearestAvailableMonth(this._actualYear, 12)
      && this._actualYear === lastAvailableYear
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
    const defaultStartYear = date.year - 3
    const defaultEndYear = defaultStartYear + 9
    const minDate = this._getMinDate()
    const maxDate = this._getMaxDate()
    const initialDate = this._getInitialViewDate()
    let startYear = Math.min(defaultStartYear, initialDate.year)
    let endYear = Math.max(defaultEndYear, initialDate.year)

    if (minDate && maxDate) {
      startYear = minDate.year
      endYear = maxDate.year
    } else if (minDate) {
      startYear = minDate.year
      endYear = Math.max(defaultEndYear, startYear + 9, initialDate.year)
    } else if (maxDate) {
      endYear = maxDate.year
      startYear = Math.min(defaultStartYear, endYear - 9, initialDate.year)
    }

    const length = Math.max(endYear - startYear + 1, 1)

    return Array.from({ length }, (_, i) => {
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

    if (this._isMonthDisabled(newMonth, newYear)) return

    this._goToMonth(newMonth, newYear)
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

    if (this._isMonthDisabled(newMonth, newYear)) return

    this._goToMonth(newMonth, newYear)
  }

  private _onMonthChange(e: Event) {
    const target = e.currentTarget as HTMLSelectElement
    const newMonth = parseInt(target.value)

    if (this._isMonthDisabled(newMonth, this._actualYear)) return

    this._goToMonth(newMonth, this._actualYear)
  }

  private _onYearChange(e: Event) {
    const target = e.currentTarget as HTMLSelectElement
    const newYear = parseInt(target.value)
    const newMonth = this._getNearestAvailableMonth(newYear, this._actualMonth)

    if (this._isYearDisabled(newYear) || this._isMonthDisabled(newMonth, newYear)) return

    this._goToMonth(newMonth, newYear)
  }

  private _onChange(day: number) {
    const formData = new FormData()
    const newDate = getDateFrom({ day, month: this._actualMonth, year: this._actualYear }).toString()

    if (this._isDayDisabled(day)) return

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
