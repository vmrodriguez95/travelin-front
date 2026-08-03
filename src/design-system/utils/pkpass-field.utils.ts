// Utils
import { toIsoDateTime } from '@ds/utils/date.utils'

// Types
import type { Coordinates } from '@ds/types/pois.types'
import type { PassField, PassJson, PassStructure } from '@ds/types/pkpass.types'
import type { TransportParts, TransportSegmentPointDraft, TransportType, TransportVoucherDraft } from '@ds/types/voucher.types'

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

// Extracts amount + currency from a free-text price such as "65,70 €".
export function parsePrice(value: string): { price: number; currency: string } {
  if (!value) return { price: 0, currency: '' }

  const amount = value.match(/(\d+(?:[.,]\d{1,2})?)/)
  const price = amount ? Number(amount[1].replace(',', '.')) : 0
  const currency = /€|eur/i.test(value) ? 'EUR' : /\$|usd/i.test(value) ? 'USD' : /£|gbp/i.test(value) ? 'GBP' : ''

  return { price, currency }
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

  const passengerName = parts.passengerName ?? ''

  return {
    name,
    type: 'poi_transport',
    typeTransport: parts.typeTransport,
    booking: {
      provider: parts.provider ?? '',
      price: parts.price ?? 0,
      currency: parts.currency ?? ''
    },
    passengers: passengerName ? [{ name: passengerName }] : [],
    segments: [
      {
        duration: parts.duration ?? '',
        operator: parts.operator ?? parts.provider ?? '',
        transportNumber: parts.transportNumber ?? '',
        class: parts.seatClass ?? '',
        origin: parts.origin,
        destiny: parts.destiny,
        passengers: passengerName ? [{ name: passengerName, seat: parts.seat ?? '' }] : []
      }
    ]
  }
}
