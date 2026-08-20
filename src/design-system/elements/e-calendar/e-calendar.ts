import { html, css, unsafeCSS, type PropertyValues } from 'lit'
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
  compareDates,
  getOptionalDate,
  clampDate,
  isDateOutsideRange,
  isMonthOutsideRange,
  isYearOutsideRange,
  getNearestAvailableMonth,
  getCalendarYears
} from '../../utils/date.utils'

import { Temporal } from '@js-temporal/polyfill'

import { FormElement } from '../../abstracts/form-element.base'
import type { ValidityResult } from '../../abstracts/form-element.base'

// Styles
import style from './e-calendar.style.scss?inline'

@customElement('e-calendar')
export class ECalendar extends FormElement {

  @property({ type: String }) value = ''

  @property({ type: String }) start = ''

  @property({ type: String }) end = ''

  @property({ type: String }) min = ''

  @property({ type: String }) max = ''

  @property({ type: Array }) returnedValues = []

  @state() _actualMonth: number = 0

  @state() _actualYear: number = 0

  _years: Array<number> = []

  _months: Array<string> = []

  _monthDays: Array<number | null> = []

  _weekdaysInititals: Array<string> = []

  static styles = css`${unsafeCSS(style)}`

  connectedCallback(): void {
    super.connectedCallback()

    this._initialize()

    this._months = getMonths()
    this._years = this._getYears()
    this._monthDays = getMonthDays(this._actualMonth, this._actualYear)
    this._weekdaysInititals = getWeekdayInitials()
  }

  // `value` is always the start of the range, whether it came from a click or
  // from a prefill. Deriving it here keeps the two entry points consistent
  // without an extra render pass.
  protected willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('start') && this.start && this.value !== this.start) {
      this.value = this.start
    }
  }

  protected updated(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has('start')
      || changedProperties.has('min')
      || changedProperties.has('max')
    ) {
      this._syncCalendarView()
    }

    // A range set from outside never went through the click handler, so this is
    // what makes prefilled dates count as a value: valid, and part of the form.
    //
    // The guard skips an untouched empty calendar on its first paint: validating
    // there would show "no dates selected" before the user has done anything.
    // A range that was present and got cleared still publishes, so the error
    // does appear once there is something to correct.
    const hadRange = Boolean(changedProperties.get('start') || changedProperties.get('end'))

    if ((changedProperties.has('start') || changedProperties.has('end')) && (this.start || this.end || hadRange)) {
      this._publishValue()
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
            ${when(this.helpmsg, () => html`
              <button class="u-input-info__button" type="button" aria-label=${this.helpmsg}>
                <e-icon icon="info" size="m"></e-icon>
                <p class="u-input-info__helpmsg">${this.helpmsg}</p>
              </button>
            `)}
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

  private _getRangeOptions() {
    return {
      minDate: getOptionalDate(this.min),
      maxDate: getOptionalDate(this.max)
    }
  }

  private _getInitialViewDate() {
    const referenceDate = this.start || this.min || Temporal.Now.plainDateISO().toString()
    
    return clampDate(referenceDate, this._getRangeOptions())
  }

  private _goToMonth(month: number, year: number) {
    this._monthDays = getMonthDays(month, year)
    this._actualMonth = month
    this._actualYear = year
  }

  private _isMonthDisabled(month: number, year: number) {
    return isMonthOutsideRange(month, year, this._getRangeOptions())
  }

  private _isYearDisabled(year: number) {
    return isYearOutsideRange(year, this._getRangeOptions())
  }

  private _isDayDisabled(day: number) {
    return isDateOutsideRange(
      { day, month: this._actualMonth, year: this._actualYear },
      this._getRangeOptions()
    )
  }

  private _isFirstDate() {
    return this._actualMonth === getNearestAvailableMonth(this._actualYear, 1, this._getRangeOptions())
      && this._actualYear === this._years.find((year) => !this._isYearDisabled(year))
  }

  private _isLastDate() {
    const availableYears = this._years.filter((year) => !this._isYearDisabled(year))
    const lastAvailableYear = availableYears[availableYears.length - 1]

    return this._actualMonth === getNearestAvailableMonth(this._actualYear, 12, this._getRangeOptions())
      && this._actualYear === lastAvailableYear
  }

  private _getActualDate(day: number) {
    return getDateFrom({ day, month: this._actualMonth, year: this._actualYear })
  }

  private _isSingle(day: number) {
    return this.start === this._getActualDate(day).toString() && !this.end
  }

  private _isStart(day: number) {
    return this.start === this._getActualDate(day).toString() && this.end
  }

  private _isMiddle(day: number) {
    if (!this.start || !this.end) return false

    const startDate = getDateFrom(this.start)
    const endDate = getDateFrom(this.end)
    const actualDate = this._getActualDate(day)

    return compareDates(startDate, actualDate) === -1 && compareDates(endDate, actualDate) === 1
  }

  private _isEnd(day: number) {
    return this.end === this._getActualDate(day).toString()
  }

  private _getDaysCounter() {
    if (!this.start && !this.end) return '0 días seleccionados'

    if (this.start && !this.end) return '1 día seleccionado'

    const startDate = getDateFrom(this.start)
    const endDate = getDateFrom(this.end)

    return `${startDate.until(endDate, { largestUnit: 'day' }).days + 1} días seleccionados`
  }

  private _getYears() {
    const initialDate = this._getInitialViewDate()

    return getCalendarYears(initialDate, this._getRangeOptions())
  }

  private _getDayClasses(day: number) {
    const actualDate = this._getActualDate(day)

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
    const newMonth = getNearestAvailableMonth(newYear, this._actualMonth, this._getRangeOptions())

    if (this._isYearDisabled(newYear) || this._isMonthDisabled(newMonth, newYear)) return

    this._goToMonth(newMonth, newYear)
  }

  // Publishes the current range to the owning form. Split out of the click
  // handler because a range can also arrive as properties — a voucher
  // prefilling the form — and those dates have to submit just the same.
  private _publishValue() {
    const formData = new FormData()

    if (this.returnedValues.length) {
      formData.append(this.returnedValues[0], this.start)
      formData.append(this.returnedValues[1], this.end || '')
    }

    this._validate()
    this._internals.setFormValue(formData)
  }

  private _onChange(day: number) {
    const newDate = this._getActualDate(day).toString()

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

    this._publishValue()
    this.dispatchEvent(new CustomEvent('change', { detail: [this.start, this.end] }))
  }

  // Validation

  protected override _getRequiredValidity(): ValidityResult {
    return {
      valid: false,
      message: 'Ninguna fecha seleccionada',
      state: { valueMissing: true }
    }
  }

  protected _calculateValidity(): ValidityResult {
    if (this.required && !this.value) {
      return this._getRequiredValidity()
    }

    return this._getDefaultValidity()
  }
}
