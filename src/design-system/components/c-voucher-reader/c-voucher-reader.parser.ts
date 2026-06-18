export type VoucherTransportType = 'flight' | 'cruise' | 'ferry' | 'train' | 'bus' | 'car' | ''
export const VOUCHER_READER_DATA_EVENT = 'voucher-reader-data'

export type VoucherCoordinates = [number, number]

export interface VoucherTransportBooking {
  reference: string
  ticketNumber?: string
  provider?: string
  price?: number
  currency?: string
}

export interface VoucherTransportLocation {
  code?: string
  name?: string
  address?: string
  coordinates?: VoucherCoordinates
  platform?: string
  date?: string
}

export interface VoucherTransportPassenger {
  name: string
  seat?: string
}

export interface VoucherTransportSegment {
  duration?: string
  operator?: string
  transportNumber?: string
  class?: string
  origin?: VoucherTransportLocation
  destiny?: VoucherTransportLocation
  passengers: Array<VoucherTransportPassenger>
}

export interface VoucherTransportData {
  type: 'poi_transport'
  typeTransport: VoucherTransportType
  booking: VoucherTransportBooking
  passengers: Array<{ name: string }>
  segments: Array<VoucherTransportSegment>
}

interface ItineraryRow {
  date: string
  place: string
  departure: string
  arrival: string
}

const ITINERARY_ROW_REGEX = /(?:Dom|Lun|Mar|Mie|Mié|Jue|Vie|S[áa])\s+(\d{2}\/\d{2}\/\d{2,4})\s+(.+?)\s+(\d{2}:\d{2}|--:--)\s+(\d{2}:\d{2}|--:--)(?=\s+(?:Dom|Lun|Mar|Mie|Mié|Jue|Vie|S[áa])\s+\d{2}\/\d{2}\/\d{2,4}|\s*$)/g

const PDF_CRUISE_KEYWORDS = ['crucero', 'embarque', 'camarote', 'msc', 'passenger(s)']

export function parseTransportVoucherPdf(pageTexts: Array<string>): VoucherTransportData {
  const normalizedPages = pageTexts.map((pageText) => normalizeSpaces(pageText))
  const wholeText = normalizedPages.join(' ')
  const wholeLower = wholeText.toLowerCase()

  const typeTransport = inferTransportType(wholeLower)
  const bookingReference = extractFirstMatch(wholeText, /N[ÚU]MERO DE RESERVA\s+([A-Z0-9-]+)/i) ?? ''
  const provider = extractProvider(wholeText)
  const transportNumber = extractTransportNumber(wholeText)
  const cabin = extractFirstMatch(wholeText, /\bCamarote\s+([A-Z0-9-]+)/i)
  const embarkDate = extractFirstMatch(wholeText, /Fecha de Embarque\s+(\d{2}\/\d{2}\/\d{4})/i)
  const voyageLabel = extractVoyageDurationLabel(wholeText)
  const itinerarySource = normalizedPages.find((pageText) => /\bitinerario\b/i.test(pageText)) ?? normalizedPages[1] ?? wholeText
  const itineraryRows = extractItineraryRows(itinerarySource)
  const passengers = extractPassengers(normalizedPages[0] ?? wholeText)

  const firstRow = itineraryRows[0]
  const lastRow = itineraryRows[itineraryRows.length - 1]

  const originDate = firstRow ? buildIsoLikeDate(firstRow.date, firstRow.departure) : (embarkDate ? `${toIsoDate(embarkDate)}T00:00:00.000` : undefined)
  const destinyDate = lastRow ? buildIsoLikeDate(lastRow.date, lastRow.arrival === '--:--' ? '00:00' : lastRow.arrival) : undefined

  const originPlace = firstRow?.place ?? 'No detectado'
  const destinyPlace = lastRow?.place ?? originPlace

  const segmentPassengers = passengers.map((passenger) => ({
    name: passenger.name,
    seat: cabin ?? undefined
  }))

  return {
    type: 'poi_transport',
    typeTransport,
    booking: {
      reference: bookingReference,
      provider,
      ticketNumber: extractFirstMatch(wholeText, /(?:TICKET|BILLETE|TICKET NUMBER)\s+([A-Z0-9-]+)/i) ?? undefined,
      price: extractPrice(wholeText) ?? undefined,
      currency: extractCurrency(wholeText) ?? undefined
    },
    passengers,
    segments: [{
      duration: voyageLabel ?? computeCruiseDuration(itineraryRows, embarkDate),
      operator: provider,
      transportNumber,
      class: extractFirstMatch(wholeText, /\bTipo de Camarote\s+([A-Z0-9-]+)/i) ?? extractFirstMatch(wholeText, /\bExperiencia\s+([A-Z0-9-]+)/i),
      origin: buildLocation({
        name: originPlace,
        address: originPlace,
        date: originDate,
        platform: extractFirstMatch(wholeText, /Punto de encuentro\s+([A-Z0-9-]+)/i) ?? undefined
      }),
      destiny: buildLocation({
        name: destinyPlace,
        address: destinyPlace,
        date: destinyDate
      }),
      passengers: segmentPassengers
    }]
  }
}

function inferTransportType(text: string): VoucherTransportType {
  if (text.includes('tren') || text.includes('train')) return 'train'
  if (text.includes('autob') || text.includes('bus')) return 'bus'
  if (text.includes('crucero') || text.includes('embarque') || text.includes('camarote')) return 'cruise'
  if (text.includes('vuelo') || text.includes('boarding') || text.includes('flight')) return 'flight'
  if (text.includes('ferry') || text.includes('barco') || text.includes('ship')) return 'ferry'
  if (text.includes('coche') || text.includes('car')) return 'car'
  return ''
}

function extractProvider(text: string) {
  const providerMatch = extractFirstMatch(text, /\bMSC\s+Cruceros\b/i) ?? extractFirstMatch(text, /\bMSC\s+Cruises\b/i)
  return providerMatch ?? (text.toLowerCase().includes('msc') ? 'MSC Cruceros' : undefined)
}

function extractTransportNumber(text: string) {
  return extractFirstMatch(text, /\bBarco\s+(.+?)(?:\s+Camarote\b|\s+Tipo de Camarote\b|\s+Experiencia\b)/i)
    ?? extractFirstMatch(text, /\bMSC\s+[A-Z][A-Za-z0-9-]*(?:\s+[A-Z][A-Za-z0-9-]*)?/i)
}

function extractPassengers(pageText: string): Array<{ name: string }> {
  const passengers: Array<{ name: string }> = []
  const regex = /Nombre\s+(.+?)\s+Apellido\s+(.+?)\s+Nacionalidad/gi
  for (const match of pageText.matchAll(regex)) {
    const givenName = normalizeSpaces(match[1] ?? '')
    const lastName = normalizeSpaces(match[2] ?? '')
    const fullName = normalizeSpaces([givenName, lastName].filter(Boolean).join(' '))

    if (fullName) {
      passengers.push({ name: toTitleCase(fullName) })
    }
  }

  if (passengers.length > 0) {
    return passengers
  }

  const fallbackMatch = extractFirstMatch(pageText, /Pasajero\(s\)\s+(.+?)\s+HORARIO DE CHECK-IN/i)
  if (!fallbackMatch) {
    return passengers
  }

  const rawNames = fallbackMatch.split(/\s{2,}|\n+/).map(normalizeSpaces).filter(Boolean)
  return rawNames.map((name) => ({ name: toTitleCase(name) }))
}

function extractItineraryRows(pageText: string): Array<ItineraryRow> {
  const rows: Array<ItineraryRow> = []
  const normalized = normalizeSpaces(pageText)

  for (const match of normalized.matchAll(ITINERARY_ROW_REGEX)) {
    const [date, place, departure, arrival] = match.slice(1)

    rows.push({
      date,
      place: normalizeSpaces(place),
      departure,
      arrival
    })
  }

  return rows
}

function computeCruiseDuration(rows: Array<ItineraryRow>, embarkDate?: string) {
  if (rows.length < 2) {
    return undefined
  }

  const start = rows[0]
  const end = rows[rows.length - 1]
  const startDate = parseDatePart(start.date)
  const endDate = parseDatePart(end.date)

  if (!startDate || !endDate) {
    return undefined
  }

  const nights = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86400000))
  const days = nights + 1

  return `${nights} noches / ${days} días`
}

function extractVoyageDurationLabel(text: string) {
  const voyageMatch = extractFirstMatch(text, /(\d+\s+noches?\s+\/\s+\d+\s+d[ií]as?)/i)
  return voyageMatch ? normalizeSpaces(voyageMatch) : undefined
}

function extractPrice(text: string) {
  const match = extractFirstMatch(text, /(?:€\s*|EUR\s*)(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)/i)
  if (!match) return undefined

  const parsed = Number(match.replace(/\./g, '').replace(',', '.'))
  return Number.isNaN(parsed) ? undefined : parsed
}

function extractCurrency(text: string) {
  if (/\bEUR\b|€/.test(text)) return 'EUR'
  if (/\bUSD\b|\$/.test(text)) return 'USD'
  if (/\bGBP\b|£/.test(text)) return 'GBP'
  return undefined
}

function buildLocation(location: VoucherTransportLocation): VoucherTransportLocation {
  return removeUndefinedFields(location)
}

function buildIsoLikeDate(date: string, time: string) {
  return `${toIsoDate(date)}T${time === '--:--' ? '00:00' : time}:00.000`
}

function parseDatePart(date: string) {
  const [day, month, year] = date.split('/')
  if (!day || !month || !year) return null

  const fullYear = year.length === 2 ? `20${year}` : year
  return new Date(Date.UTC(Number(fullYear), Number(month) - 1, Number(day)))
}

function toIsoDate(date: string) {
  const [day, month, year] = date.split('/')
  const fullYear = year.length === 2 ? `20${year}` : year
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function extractFirstMatch(text: string, regex: RegExp) {
  const match = text.match(regex)
  return match?.[1]?.trim()
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function removeUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T
}

export function isLikelyCruiseVoucher(pageTexts: Array<string>) {
  const wholeText = normalizeSpaces(pageTexts.join(' ')).toLowerCase()
  return PDF_CRUISE_KEYWORDS.some((keyword) => wholeText.includes(keyword))
}
