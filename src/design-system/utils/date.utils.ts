import { Temporal } from '@js-temporal/polyfill'

type DateObject = { day: number; month: number; year: number }
type DateLike = string | Temporal.PlainDate | DateObject

interface DateRangeOptions {
  minDate?: Temporal.PlainDate | null
  maxDate?: Temporal.PlainDate | null
}

interface YearRangeOptions extends DateRangeOptions {
  defaultLength?: number
  defaultStartOffset?: number
}

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

export function getDateFrom(date: DateLike) {
  return Temporal.PlainDate.from(date)
}

export function getTimeFrom(date: string) {
  return Temporal.PlainDateTime.from(date)
}

export function getDateTimeFrom(date: string) {
  return Temporal.PlainDateTime.from(date)
}

export function getOptionalDate(date?: string | Temporal.PlainDate | null) {
  return date ? getDateFrom(date) : null
}

export function clampDate(date: DateLike, { minDate, maxDate }: DateRangeOptions = {}) {
  let normalizedDate = getDateFrom(date)

  if (minDate && compareDates(normalizedDate, minDate) === -1) {
    normalizedDate = minDate
  }

  if (maxDate && compareDates(normalizedDate, maxDate) === 1) {
    normalizedDate = maxDate
  }

  return normalizedDate
}

export function getMonthStart(month: number, year: number) {
  return getDateFrom({ day: 1, month, year })
}

export function getMonthEnd(month: number, year: number) {
  const monthStart = getMonthStart(month, year)

  return monthStart.with({ day: monthStart.daysInMonth })
}

export function isDateOutsideRange(date: DateLike, { minDate, maxDate }: DateRangeOptions = {}) {
  const normalizedDate = getDateFrom(date)

  if (minDate && compareDates(normalizedDate, minDate) === -1) {
    return true
  }

  if (maxDate && compareDates(normalizedDate, maxDate) === 1) {
    return true
  }

  return false
}

export function isMonthOutsideRange(month: number, year: number, { minDate, maxDate }: DateRangeOptions = {}) {
  const monthStart = getMonthStart(month, year)
  const monthEnd = getMonthEnd(month, year)

  if (minDate && compareDates(monthEnd, minDate) === -1) {
    return true
  }

  if (maxDate && compareDates(monthStart, maxDate) === 1) {
    return true
  }

  return false
}

export function getAvailableMonths(year: number, rangeOptions: DateRangeOptions = {}) {
  return Array.from({ length: 12 }, (_, index) => index + 1).filter((month) => {
    return !isMonthOutsideRange(month, year, rangeOptions)
  })
}

export function isYearOutsideRange(year: number, rangeOptions: DateRangeOptions = {}) {
  return getAvailableMonths(year, rangeOptions).length === 0
}

export function getNearestAvailableMonth(year: number, preferredMonth: number, rangeOptions: DateRangeOptions = {}) {
  const availableMonths = getAvailableMonths(year, rangeOptions)

  if (!availableMonths.length) return preferredMonth

  return availableMonths.reduce((bestMonth, month) => {
    const currentDistance = Math.abs(month - preferredMonth)
    const bestDistance = Math.abs(bestMonth - preferredMonth)

    return currentDistance < bestDistance ? month : bestMonth
  }, availableMonths[0])
}

export function getCalendarYears(initialDate: Temporal.PlainDate, {
  minDate,
  maxDate,
  defaultLength = 10,
  defaultStartOffset = 3
}: YearRangeOptions = {}) {
  const defaultStartYear = Temporal.Now.plainDateISO().year - defaultStartOffset
  const defaultEndYear = defaultStartYear + (defaultLength - 1)
  let startYear = Math.min(defaultStartYear, initialDate.year)
  let endYear = Math.max(defaultEndYear, initialDate.year)

  if (minDate && maxDate) {
    startYear = minDate.year
    endYear = maxDate.year
  } else if (minDate) {
    startYear = minDate.year
    endYear = Math.max(defaultEndYear, startYear + (defaultLength - 1), initialDate.year)
  } else if (maxDate) {
    endYear = maxDate.year
    startYear = Math.min(defaultStartYear, endYear - (defaultLength - 1), initialDate.year)
  }

  const length = Math.max(endYear - startYear + 1, 1)

  return Array.from({ length }, (_, index) => startYear + index)
}

export function printTime(date: string) {
  return getTimeFrom(date).toLocaleString(navigator.language, { hour: '2-digit', minute: '2-digit' })
}

export function printDateTime(date: string) {
  return getDateTimeFrom(date).toLocaleString(navigator.language, { day: '2-digit', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function compareDates(date1: Temporal.PlainDate | string, date2: Temporal.PlainDate | string) {
  return Temporal.PlainDate.compare(date1, date2)
}

// Month names as printed on vouchers. Kept explicit rather than derived from
// navigator.language: the document's language has nothing to do with the
// browser's, and a Spanish booking must parse for an English-locale user.
const MONTH_NAMES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
}

// Weekday names as printed on vouchers, accent-stripped, mapped to Temporal's
// dayOfWeek (1 = Monday).
const WEEKDAY_NAMES: Record<string, number> = {
  lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 7,
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7
}

// How far to look for the year a weekday points at. A given day and month
// falls on the same weekday every five or six years, so this window holds two
// candidates at most and the nearest one wins.
const WEEKDAY_YEAR_RADIUS = 6

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.$/, '')
    .trim()
}

function normalizeWeekday(value: string): number {
  const key = normalizeName(value)
  if (WEEKDAY_NAMES[key]) return WEEKDAY_NAMES[key]

  const match = Object.keys(WEEKDAY_NAMES).find((name) => name.startsWith(key) && key.length >= 3)
  return match ? WEEKDAY_NAMES[match] : 0
}

// A voucher that omits the year usually still prints the weekday — "mar, 28 oct".
// Only an abbreviation closed by a comma or a full name counts: on its own,
// "mar" is far more likely to be "marzo" than "martes".
function findWeekday(value: string): number {
  const abbreviation = value.match(/(?:^|\s)([A-Za-z\u00C0-\u024F]{3,})\.?\s*,/)
  const fromAbbreviation = abbreviation ? normalizeWeekday(abbreviation[1]) : 0
  if (fromAbbreviation) return fromAbbreviation

  for (const word of value.match(/[A-Za-z\u00C0-\u024F]{5,}/g) ?? []) {
    const weekday = WEEKDAY_NAMES[normalizeName(word)]
    if (weekday) return weekday
  }

  return 0
}

// The year in which this day and month actually fall on the printed weekday:
// the nearest to the current one, preferring the future when two tie. Beats any
// year guessed from elsewhere in the document — a passport expiry date is a
// year, but not this journey's.
function yearMatchingWeekday(month: number, day: number, weekday: number): number {
  const offsets = [0]
  for (let distance = 1; distance <= WEEKDAY_YEAR_RADIUS; distance++) offsets.push(distance, -distance)

  const current = Temporal.Now.plainDateISO().year

  for (const offset of offsets) {
    try {
      const candidate = Temporal.PlainDate.from({ year: current + offset, month, day })
      if (candidate.dayOfWeek === weekday) return candidate.year
    } catch {
      // 29 February in a common year: not this one.
      continue
    }
  }

  return 0
}

function normalizeMonth(value: string): number {
  const key = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (MONTH_NAMES[key]) return MONTH_NAMES[key]

  // Abbreviations such as "sept", "ago." or "Aug".
  const match = Object.keys(MONTH_NAMES).find((name) => name.startsWith(key) && key.length >= 3)
  return match ? MONTH_NAMES[match] : 0
}

// Reads a date written out in words — "29 AGOSTO", "18 de agosto de 2026",
// "18 August 2026", "August 18, 2026" — and returns it as "YYYY-MM-DD".
//
// Vouchers often omit the year. When one prints the weekday — "mar, 28 oct" —
// that pins the year down on its own; otherwise `fallbackYear` fills the gap,
// and without one the current year is assumed, matching the rule already used
// for "DD/MM".
export function parseNaturalDate(value?: string | null, fallbackYear?: number): string {
  if (!value) return ''

  const year = fallbackYear ?? Temporal.Now.plainDateISO().year

  // The day is bounded on both sides so a four-digit year is never mistaken
  // for one: without it, "agosto 2026" reads as day 20 of August.
  // "29 [de] agosto [de 2026]"
  const dayFirst = value.match(/(?<!\d)(\d{1,2})(?!\d)\s*(?:de\s+)?([A-Za-zÁÉÍÓÚáéíóúÜü.]{3,})(?:\s*(?:de|,)?\s*(\d{4}))?/)
  // "August 18, 2026"
  const monthFirst = value.match(/([A-Za-zÁÉÍÓÚáéíóúÜü.]{3,})\s+(\d{1,2})(?!\d)(?:\s*,?\s*(\d{4}))?/)

  for (const [, first, second, matchedYear] of [dayFirst, monthFirst].filter(Boolean) as RegExpMatchArray[]) {
    const dayFromFirst = /^\d/.test(first)
    const day = Number(dayFromFirst ? first : second)
    const month = normalizeMonth(dayFromFirst ? second : first)

    if (!month || !day || day > 31) continue

    const weekday = findWeekday(value)
    const resolvedYear = Number(matchedYear) || (weekday && yearMatchingWeekday(month, day, weekday)) || year

    try {
      return Temporal.PlainDate.from({ year: resolvedYear, month, day }).toString()
    } catch {
      continue
    }
  }

  return ''
}

// Picks the most plausible year mentioned in a document, so a voucher that
// prints "29 AGOSTO" without a year can still be dated. Falls back to the
// current year when the text names none.
export function findDocumentYear(text: string): number {
  const current = Temporal.Now.plainDateISO().year
  const years = [...text.matchAll(/\b(20\d{2})\b/g)]
    .map((match) => Number(match[1]))
    .filter((year) => year >= current - 1 && year <= current + 5)

  return years.length ? Math.min(...years) : current
}

// Normalizes any date-like string (with or without time/offset) to the
// "YYYY-MM-DDTHH:mm:ss.SSS" wall-clock format used by our POI drafts.
export function toIsoDateTime(date?: string | null): string {
  if (!date) return ''

  try {
    return Temporal.PlainDateTime.from(date).toString({ fractionalSecondDigits: 3 })
  } catch {
    try {
      return Temporal.PlainDate.from(date.slice(0, 10)).toPlainDateTime().toString({ fractionalSecondDigits: 3 })
    } catch {
      return ''
    }
  }
}
