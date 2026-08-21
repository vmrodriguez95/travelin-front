// Utils
import { toIsoDateTime } from '@ds/utils/date.utils'

// Types
import type { Coordinates } from '@ds/types/pois.types'
import type { PassField, PassJson, PassStructure } from '../types/pkpass.types'
import type { TransportParts, TransportSegmentPointDraft, TransportType, TransportVoucherDraft } from '../types/voucher.types'

export const TRANSIT_TYPE_MAP: Record<string, TransportType> = {
  PKTransitTypeAir: 'flight',
  PKTransitTypeTrain: 'train',
  PKTransitTypeBus: 'bus',
  PKTransitTypeBoat: 'ferry',
  PKTransitTypeGeneric: 'bus'
}

export const TRANSPORT_LABEL: Record<TransportType, string> = {
  flight: 'Vuelo',
  train: 'Tren',
  bus: 'Bus',
  ferry: 'Ferry',
  cruise: 'Crucero',
  car: 'Coche'
}

// --- field access ------------------------------------------------------------

export function getStructure(pass: PassJson): PassStructure | undefined {
  return pass.boardingPass ?? pass.eventTicket ?? pass.generic ?? pass.coupon ?? pass.storeCard
}

export function collectFields(structure?: PassStructure): PassField[] {
  if (!structure) return []

  return [
    ...(structure.headerFields ?? []),
    ...(structure.primaryFields ?? []),
    ...(structure.secondaryFields ?? []),
    ...(structure.auxiliaryFields ?? []),
    ...(structure.backFields ?? [])
  ]
}

export function fieldValue(field?: PassField): string {
  return field ? String(field.value ?? '').trim() : ''
}

export function fieldLabel(field?: PassField): string {
  return field ? String(field.label ?? '').trim() : ''
}

// Exact key lookup — the precise path once we know a vendor's field keys.
export function byKey(fields: PassField[], key: string): PassField | undefined {
  return fields.find((field) => field.key === key)
}

// Fuzzy lookup by key/label keywords — used by the generic fallback parser.
export function findField(fields: PassField[], keywords: string[]): PassField | undefined {
  return fields.find((field) => {
    const haystack = `${field.key} ${field.label ?? ''}`.toLowerCase()
    return keywords.some((keyword) => haystack.includes(keyword))
  })
}

export function toCoordinates(pass: PassJson): Coordinates {
  const location = pass.locations?.[0]
  return location ? [location.longitude, location.latitude] : [0, 0]
}

export function organizationMatches(pass: PassJson, needle: string): boolean {
  const org = (pass.organizationName ?? '').toLowerCase()
  const identifier = (pass.passTypeIdentifier ?? '').toLowerCase()
  return org.includes(needle) || identifier.includes(needle)
}

// --- date helpers ------------------------------------------------------------

// Returns the "YYYY-MM-DD" part of a pass date. Accepts ISO, "DD/MM/YYYY" and
// year-less "DD/MM" (in which case the current year is assumed, per product rule).
export function datePart(value?: string): string {
  if (!value) return ''

  const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month}-${day}`
  }

  const slashMatch = value.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)
  if (slashMatch) {
    const [, day, month, year] = slashMatch
    const resolvedYear = year ?? String(new Date().getFullYear())
    return `${resolvedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return ''
}

// Finds the first field value that contains a date token (ISO or "DD/MM"[/YYYY]),
// so the generic parser can still date a pass that has no top-level relevantDate.
export function findDateText(fields: PassField[]): string {
  const field = fields.find((candidate) => /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/.test(fieldValue(candidate)))
  return fieldValue(field)
}

// Combines a date part with a "HH:mm" time into a normalized ISO datetime.
export function combineDateTime(date: string, time: string): string {
  if (!date) return ''

  const timeMatch = time.match(/(\d{1,2}):(\d{2})/)
  if (!timeMatch) return toIsoDateTime(date)

  const [, hour, minute] = timeMatch
  return toIsoDateTime(`${date}T${hour.padStart(2, '0')}:${minute}:00`)
}

// Extracts amount + currency from a free-text price such as "65,70 €" or
// "€ 1.262,74".
//
// Both "1.210,53" and "1,234.56" are the same amount written in different
// locales, so neither separator can be assumed to mean one thing. The rule
// used here: the last separator is the decimal point only when it splits off
// one or two digits; anything else is a thousands separator and is dropped.
// Symbols vouchers print instead of an ISO code. Order matters: "R$" and "S/"
// have to win over the bare "$" they contain.
const CURRENCY_SYMBOLS: Array<[string, string]> = [
  ['R$', 'BRL'], ['S/', 'PEN'], ['€', 'EUR'], ['£', 'GBP'], ['¥', 'JPY'], ['฿', 'THB'],
  ['₹', 'INR'], ['₩', 'KRW'], ['₫', 'VND'], ['₱', 'PHP'], ['₺', 'TRY'], ['₪', 'ILS'],
  ['₦', 'NGN'], ['₴', 'UAH'], ['₸', 'KZT'], ['zł', 'PLN'], ['Kč', 'CZK'], ['$', 'USD']
]

// The full ISO 4217 list, taken from the runtime rather than hardcoded, so any
// currency is recognised without a table to maintain. Resolved once; an engine
// without it (ES2022) leaves the set empty and symbol matching still applies.
let currencyCodes: Set<string> | null = null

function knownCurrencyCodes(): Set<string> {
  if (!currencyCodes) {
    try {
      currencyCodes = new Set(Intl.supportedValuesOf('currency'))
    } catch {
      currencyCodes = new Set()
    }
  }

  return currencyCodes
}

// An ISO code as printed — matched case-sensitively, because lowercasing turns
// ordinary words ("top", "all") into valid currency codes.
export function detectCurrency(value: string): string {
  const code = value.match(/\b[A-Z]{3}\b/g)?.find((candidate) => knownCurrencyCodes().has(candidate))
  if (code) return code

  return CURRENCY_SYMBOLS.find(([symbol]) => value.includes(symbol))?.[1] ?? ''
}

export function parsePrice(value: string): { price: number; currency: string } {
  const currency = detectCurrency(value ?? '')

  const match = value?.match(/\d[\d.,]*/)
  if (!match) return { price: 0, currency }

  const digits = match[0].replace(/[.,]+$/, '')
  const separator = Math.max(digits.lastIndexOf('.'), digits.lastIndexOf(','))
  const decimals = separator === -1 ? 0 : digits.length - separator - 1

  const normalized = decimals >= 1 && decimals <= 2
    ? `${digits.slice(0, separator).replace(/[.,]/g, '')}.${digits.slice(separator + 1)}`
    : digits.replace(/[.,]/g, '')

  const price = Number(normalized)

  return { price: Number.isFinite(price) ? price : 0, currency }
}

// --- draft assembly ----------------------------------------------------------

export function point(opts: Partial<TransportSegmentPointDraft>): TransportSegmentPointDraft {
  return {
    code: opts.code ?? '',
    name: opts.name ?? '',
    address: opts.address ?? '',
    coordinates: opts.coordinates ?? [0, 0],
    platform: opts.platform ?? '',
    date: opts.date ?? ''
  }
}

export function assembleTransportDraft(parts: TransportParts): TransportVoucherDraft {
  const label = TRANSPORT_LABEL[parts.typeTransport]
  const originName = parts.origin.name || parts.origin.code
  const destinyName = parts.destiny.name || parts.destiny.code
  const name = `${label} ${originName} - ${destinyName}`.trim()

  const passengers = parts.passengers?.length
    ? parts.passengers
    : (parts.passengerName ? [{ name: parts.passengerName, seat: parts.seat ?? '' }] : [])

  return {
    name,
    type: 'poi_transport',
    typeTransport: parts.typeTransport,
    booking: {
      provider: parts.provider ?? '',
      price: parts.price ?? 0,
      currency: parts.currency ?? ''
    },
    passengers: passengers.map((passenger) => ({ name: passenger.name })),
    segments: [
      {
        duration: parts.duration ?? '',
        operator: parts.operator ?? parts.provider ?? '',
        transportNumber: parts.transportNumber ?? '',
        class: parts.seatClass ?? '',
        origin: parts.origin,
        destiny: parts.destiny,
        passengers: passengers.map((passenger) => ({ name: passenger.name, seat: passenger.seat ?? '' }))
      }
    ]
  }
}
