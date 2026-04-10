import { Temporal } from '@js-temporal/polyfill'

function getFirstDayOfWeek() {
  const intlLocale = new Intl.Locale(navigator.language)

  return intlLocale.weekInfo?.firstDay ?? 1
}

function getStartOfWeek() {
  const today = Temporal.Now.plainDateISO()
  const firstDayOfWeek = getFirstDayOfWeek()

  const offset = today.dayOfWeek - firstDayOfWeek
  return today.subtract({ days: offset >= 0 ? offset : 7 + offset })
}

export function getYear(date: string) {
  return date ? Temporal.PlainDate.from(date).year : Temporal.Now.plainDateISO().year
}

export function getMonth(date: string) {
  return date ? Temporal.PlainDate.from(date).month : Temporal.Now.plainDateISO().month
}

export function getMonthName(month: number, year: number) {
  return Temporal.PlainDate.from({ day: 1, month, year }).toLocaleString(navigator.language, { month: 'long' })
}

export function getWeekdayInitials(): Array<string> {
  const startOfWeek = getStartOfWeek()

  return Array.from({ length: 7 }, (_, i) => {
    const date = startOfWeek.add({ days: i })
    const name = date.toLocaleString(navigator.language, { weekday: 'long' })
    return name.charAt(0).toUpperCase()
  })
}

export function getMonthDays(month: number, year: number): Array<number | null> {
  const firstDayOfWeek = getFirstDayOfWeek()

  const firstOfMonth = Temporal.PlainDate.from({ day: 1, month, year })
  const daysInMonth = firstOfMonth.daysInMonth
  const firstWeekday = firstOfMonth.dayOfWeek

  // Cálculo del offset dependiendo del primer día de semana
  const offset = (firstWeekday - firstDayOfWeek + 7) % 7
  const arrayOffsets = Array.from({ length: offset }, () => null)
  const arrayDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return [...arrayOffsets, ...arrayDays]
}

export function getMonths() {
  const date = Temporal.Now.plainDateISO()

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const year = date.year

    return getMonthName(month, year)
  })
}

export function isToday(date: Temporal.PlainDate | string) {
  const now = Temporal.Now.plainDateISO()

  return compareDates(date, now) === 0
}

export function getDateFrom(date: string | Temporal.PlainDate) {
  return Temporal.PlainDate.from(date)
}

export function getTimeFrom(date: string) {
  return Temporal.PlainTime.from(date).toLocaleString(navigator.language, { hour: '2-digit', minute: '2-digit' })
}

export function compareDates(date1: Temporal.PlainDate | string, date2: Temporal.PlainDate | string) {
  return Temporal.PlainDate.compare(date1, date2)
}