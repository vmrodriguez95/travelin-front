// Prints the wall-clock date-times the API sends ("2026-03-06T09:31:02.739",
// with or without an offset, which is ignored) without pulling in the Temporal
// polyfill: these run on every card, the polyfill only where a calendar is.
function parseWallClock(date: string): Date | null {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/)

  if (!match) return null

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match

  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
}

export function printTime(date: string) {
  const parsed = parseWallClock(date)

  return parsed ? parsed.toLocaleString(navigator.language, { hour: '2-digit', minute: '2-digit' }) : ''
}

export function printDateTime(date: string) {
  const parsed = parseWallClock(date)

  return parsed
    ? parsed.toLocaleString(navigator.language, { day: '2-digit', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''
}
