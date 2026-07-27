import { unzipSync } from 'fflate'

import type { Coordinates } from '@ds/types/pois.types'
import type {
  HotelVoucherDraft,
  TransportSegmentPointDraft,
  TransportType,
  TransportVoucherDraft,
  VoucherNote
} from '@ds/types/voucher.types'
import { toIsoDateTime } from '@ds/utils/date.utils'
import type { PassField, PassJson, PassStructure, PkpassTransportAdapter } from '@ds/types/pkpass.types'

const TRANSIT_TYPE_MAP: Record<string, TransportType> = {
  PKTransitTypeAir: 'flight',
  PKTransitTypeTrain: 'train',
  PKTransitTypeBus: 'bus',
  PKTransitTypeBoat: 'ferry',
  PKTransitTypeGeneric: 'bus'
}

const TRANSPORT_LABEL: Record<TransportType, string> = {
  flight: 'Vuelo',
  train: 'Tren',
  bus: 'Bus',
  ferry: 'Ferry',
  cruise: 'Crucero',
  car: 'Coche'
}

// --- reading -----------------------------------------------------------------

// Reads the pass.json out of a .pkpass ZIP archive.
export async function readPassJson(file: File): Promise<PassJson> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const entries = unzipSync(bytes, { filter: (f) => f.name === 'pass.json' })

  const raw = entries['pass.json']
  if (!raw) {
    throw new Error('El archivo .pkpass no contiene pass.json')
  }

  return JSON.parse(new TextDecoder().decode(raw)) as PassJson
}

// --- shared field helpers ----------------------------------------------------

function getStructure(pass: PassJson): PassStructure | undefined {
  return pass.boardingPass ?? pass.eventTicket ?? pass.generic ?? pass.coupon ?? pass.storeCard
}

function collectFields(structure?: PassStructure): PassField[] {
  if (!structure) return []

  return [
    ...(structure.headerFields ?? []),
    ...(structure.primaryFields ?? []),
    ...(structure.secondaryFields ?? []),
    ...(structure.auxiliaryFields ?? []),
    ...(structure.backFields ?? [])
  ]
}

function fieldValue(field?: PassField): string {
  return field ? String(field.value ?? '').trim() : ''
}

function fieldLabel(field?: PassField): string {
  return field ? String(field.label ?? '').trim() : ''
}

// Exact key lookup — the precise path once we know a vendor's field keys.
function byKey(fields: PassField[], key: string): PassField | undefined {
  return fields.find((field) => field.key === key)
}

// Fuzzy lookup by key/label keywords — used by the generic fallback adapter.
function findField(fields: PassField[], keywords: string[]): PassField | undefined {
  return fields.find((field) => {
    const haystack = `${field.key} ${field.label ?? ''}`.toLowerCase()
    return keywords.some((keyword) => haystack.includes(keyword))
  })
}

function toCoordinates(pass: PassJson): Coordinates {
  const location = pass.locations?.[0]
  return location ? [location.longitude, location.latitude] : [0, 0]
}

function organizationMatches(pass: PassJson, needle: string): boolean {
  const org = (pass.organizationName ?? '').toLowerCase()
  const identifier = (pass.passTypeIdentifier ?? '').toLowerCase()
  return org.includes(needle) || identifier.includes(needle)
}

// --- date helpers ------------------------------------------------------------

// Returns the "YYYY-MM-DD" part of a pass date. Accepts ISO, "DD/MM/YYYY" and
// year-less "DD/MM" (in which case the current year is assumed, per product rule).
function datePart(value?: string): string {
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
// so the generic adapter can still date a pass that has no top-level relevantDate.
function findDateText(fields: PassField[]): string {
  const field = fields.find((candidate) => /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/.test(fieldValue(candidate)))
  return fieldValue(field)
}

// Combines a date part with a "HH:mm" time into a normalized ISO datetime.
function combineDateTime(date: string, time: string): string {
  if (!date) return ''

  const timeMatch = time.match(/(\d{1,2}):(\d{2})/)
  if (!timeMatch) return toIsoDateTime(date)

  const [, hour, minute] = timeMatch
  return toIsoDateTime(`${date}T${hour.padStart(2, '0')}:${minute}:00`)
}

// Extracts amount + currency from a free-text price such as "65,70 €".
function parsePrice(value: string): { price: number; currency: string } {
  if (!value) return { price: 0, currency: '' }

  const amount = value.match(/(\d+(?:[.,]\d{1,2})?)/)
  const price = amount ? Number(amount[1].replace(',', '.')) : 0
  const currency = /€|eur/i.test(value) ? 'EUR' : /\$|usd/i.test(value) ? 'USD' : /£|gbp/i.test(value) ? 'GBP' : ''

  return { price, currency }
}

// --- draft assembly ----------------------------------------------------------

function point(opts: Partial<TransportSegmentPointDraft>): TransportSegmentPointDraft {
  return {
    code: opts.code ?? '',
    name: opts.name ?? '',
    address: opts.address ?? '',
    coordinates: opts.coordinates ?? [0, 0],
    platform: opts.platform ?? '',
    date: opts.date ?? ''
  }
}

interface TransportParts {
  typeTransport: TransportType
  reference?: string
  ticketNumber?: string
  provider?: string
  price?: number
  currency?: string
  operator?: string
  transportNumber?: string
  seatClass?: string
  duration?: string
  passengerName?: string
  seat?: string
  origin: TransportSegmentPointDraft
  destiny: TransportSegmentPointDraft
}

function assembleTransportDraft(parts: TransportParts): TransportVoucherDraft {
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
      reference: parts.reference ?? '',
      ticketNumber: parts.ticketNumber ?? '',
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

// --- vendor adapters ---------------------------------------------------------

const airEuropaAdapter: PkpassTransportAdapter = {
  id: 'air-europa',
  matches: (pass) => organizationMatches(pass, 'air europa'),
  parse(pass) {
    const fields = collectFields(pass.boardingPass)
    const boardPoint = byKey(fields, 'boardPoint')
    const offPoint = byKey(fields, 'offPoint')
    // The pass carries no year — boardingTime holds "HH:mm DD/MM", so datePart
    // resolves the year to the current one.
    const day = datePart(fieldValue(byKey(fields, 'boardingTime')))

    return assembleTransportDraft({
      typeTransport: 'flight',
      reference: fieldValue(byKey(fields, 'recloc')),
      ticketNumber: fieldValue(byKey(fields, 'ticket')),
      provider: pass.organizationName ?? 'Air Europa',
      operator: pass.organizationName ?? 'Air Europa',
      transportNumber: fieldValue(byKey(fields, 'flightNb')),
      seatClass: fieldValue(byKey(fields, 'bookingClass')),
      passengerName: fieldValue(byKey(fields, 'passenger')),
      seat: fieldValue(byKey(fields, 'seat')),
      origin: point({
        code: fieldValue(boardPoint),
        name: fieldLabel(boardPoint),
        platform: fieldValue(byKey(fields, 'gate')),
        date: combineDateTime(day, fieldValue(byKey(fields, 'departureTime')))
      }),
      destiny: point({ code: fieldValue(offPoint), name: fieldLabel(offPoint) })
    })
  }
}

const iberiaAdapter: PkpassTransportAdapter = {
  id: 'iberia',
  matches: (pass) => organizationMatches(pass, 'iberia'),
  parse(pass) {
    const fields = collectFields(pass.boardingPass)
    const depart = byKey(fields, 'depart')
    const destination = byKey(fields, 'destination')
    const day = datePart(pass.relevantDate)

    return assembleTransportDraft({
      typeTransport: 'flight',
      reference: fieldValue(byKey(fields, 'bookingCode')),
      ticketNumber: fieldValue(byKey(fields, 'numBillete')),
      provider: pass.organizationName ?? 'Iberia',
      operator: fieldValue(byKey(fields, 'ciaName')).replace(/^operad(or|o por)\s+/i, '') || (pass.organizationName ?? 'Iberia'),
      transportNumber: fieldValue(byKey(fields, 'flightNumber')),
      seatClass: fieldValue(byKey(fields, 'class')),
      passengerName: fieldValue(byKey(fields, 'passenger')),
      seat: fieldValue(byKey(fields, 'seat')),
      origin: point({
        code: pass.departureCode ?? fieldValue(depart),
        name: fieldLabel(depart),
        platform: fieldValue(byKey(fields, 'gate')),
        date: combineDateTime(day, fieldValue(byKey(fields, 'horaSalida')))
      }),
      destiny: point({
        code: pass.arrivalCode ?? fieldValue(destination),
        name: fieldLabel(destination),
        date: combineDateTime(day, fieldValue(byKey(fields, 'horaLlegada')))
      })
    })
  }
}

const alsaAdapter: PkpassTransportAdapter = {
  id: 'alsa',
  matches: (pass) => organizationMatches(pass, 'alsa'),
  parse(pass) {
    const fields = collectFields(pass.boardingPass)
    const origin = byKey(fields, 'origin')
    const destination = byKey(fields, 'destination')
    const day = datePart(pass.relevantDate)

    const reservation = fieldValue(byKey(fields, 'yourReservation'))
    const ticketNumber = reservation.match(/billete[^:]*:\s*([0-9]+)/i)?.[1] ?? ''

    return assembleTransportDraft({
      typeTransport: 'bus',
      reference: fieldValue(byKey(fields, 'locator')),
      ticketNumber,
      provider: pass.organizationName ?? 'Alsa',
      operator: pass.organizationName ?? 'Alsa',
      seatClass: fieldValue(byKey(fields, 'class')),
      passengerName: fieldValue(byKey(fields, 'name')),
      seat: fieldValue(byKey(fields, 'seat')),
      origin: point({ name: fieldLabel(origin), date: combineDateTime(day, fieldValue(origin)) }),
      destiny: point({ name: fieldLabel(destination), date: combineDateTime(day, fieldValue(destination)) })
    })
  }
}

const renfeAdapter: PkpassTransportAdapter = {
  id: 'renfe',
  matches: (pass) => organizationMatches(pass, 'renfe'),
  parse(pass) {
    const fields = collectFields(pass.boardingPass)
    const origin = byKey(fields, 'boardingTime')
    const destiny = byKey(fields, 'destino')
    const day = datePart(pass.relevantDate) || datePart(fieldValue(byKey(fields, 'destinofecha')))
    const { price, currency } = parsePrice(fieldValue(byKey(fields, 'precio')))

    return assembleTransportDraft({
      typeTransport: 'train',
      reference: fieldValue(byKey(fields, 'localizador')),
      ticketNumber: fieldValue(byKey(fields, 'numbil')),
      provider: pass.organizationName ?? 'Renfe',
      operator: pass.organizationName ?? 'Renfe',
      price,
      currency,
      transportNumber: fieldValue(byKey(fields, 'tren')),
      seatClass: fieldValue(byKey(fields, 'clasefrontal')),
      passengerName: fieldValue(byKey(fields, 'nombrepasajero')) || fieldValue(byKey(fields, 'pasajero')),
      seat: fieldValue(byKey(fields, 'asiento')),
      origin: point({ name: fieldLabel(origin), coordinates: toCoordinates(pass), date: combineDateTime(day, fieldValue(origin)) }),
      destiny: point({ name: fieldLabel(destiny), date: combineDateTime(day, fieldValue(destiny)) })
    })
  }
}

// Fallback for unknown vendors: best-effort fuzzy matching on field keys/labels.
const genericAdapter: PkpassTransportAdapter = {
  id: 'generic',
  matches: () => true,
  parse(pass) {
    const structure = getStructure(pass)
    const fields = collectFields(structure)
    const typeTransport = TRANSIT_TYPE_MAP[structure?.transitType ?? ''] ?? 'flight'

    const originField = findField(fields, ['origin', 'from', 'depart', 'origen', 'salida', 'board'])
    const destinationField = findField(fields, ['destination', 'destino', 'to', 'arriv', 'llegada', 'off'])
    const passengerField = findField(fields, ['passenger', 'pasajero', 'name', 'nombre'])
    // Year-less "DD/MM" dates resolve to the current year (per product rule).
    const day = datePart(pass.relevantDate) || datePart(findDateText(fields))

    return assembleTransportDraft({
      typeTransport,
      reference: fieldValue(findField(fields, ['recloc', 'booking', 'localizador', 'locator', 'reference', 'reserva'])),
      ticketNumber: fieldValue(findField(fields, ['ticket', 'billete', 'numbil'])),
      provider: pass.organizationName ?? '',
      operator: pass.organizationName ?? '',
      transportNumber: fieldValue(findField(fields, ['flight', 'tren', 'train', 'number', 'vuelo', 'numero', 'número'])),
      seatClass: fieldValue(findField(fields, ['class', 'clase', 'cabin'])),
      passengerName: fieldValue(passengerField),
      seat: fieldValue(findField(fields, ['seat', 'asiento'])),
      origin: point({
        code: fieldValue(originField),
        name: fieldLabel(originField),
        coordinates: toCoordinates(pass),
        platform: fieldValue(findField(fields, ['gate', 'puerta', 'platform', 'andén', 'anden'])),
        date: day ? combineDateTime(day, fieldValue(originField)) : ''
      }),
      destiny: point({ code: fieldValue(destinationField), name: fieldLabel(destinationField) })
    })
  }
}

const TRANSPORT_ADAPTERS: PkpassTransportAdapter[] = [
  airEuropaAdapter,
  iberiaAdapter,
  alsaAdapter,
  renfeAdapter,
  genericAdapter
]

// --- public API --------------------------------------------------------------

export function pkpassToTransportDraft(pass: PassJson): TransportVoucherDraft {
  const adapter = TRANSPORT_ADAPTERS.find((candidate) => candidate.matches(pass)) ?? genericAdapter
  return adapter.parse(pass)
}

export function pkpassToHotelDraft(pass: PassJson): HotelVoucherDraft {
  const fields = collectFields(getStructure(pass))

  const notes: VoucherNote[] = []
  const checkIn = findField(fields, ['check-in', 'checkin', 'entrada'])
  const checkOut = findField(fields, ['check-out', 'checkout', 'salida'])
  if (checkIn || checkOut) {
    notes.push({
      icon: 'check-in-out',
      text: [fieldValue(checkIn), fieldValue(checkOut)].filter(Boolean).join(' · ')
    })
  }

  const room = findField(fields, ['room', 'habitación', 'habitacion'])
  if (room) {
    notes.push({ icon: 'bed', text: fieldValue(room) })
  }

  const address = findField(fields, ['address', 'dirección', 'direccion'])

  return {
    coordinates: toCoordinates(pass),
    name: pass.logoText || pass.organizationName || pass.description || '',
    type: 'poi_hotel',
    icon: 'hotel',
    types: ['hotel'],
    address: fieldValue(address) || pass.locations?.[0]?.relevantText || '',
    dateStart: toIsoDateTime(pass.relevantDate),
    dateEnd: toIsoDateTime(pass.expirationDate),
    image: '',
    notes
  }
}
