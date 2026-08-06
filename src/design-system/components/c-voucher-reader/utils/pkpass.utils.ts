import { unzipSync } from 'fflate'

// Utils
// import { toIsoDateTime } from '@ds/utils/date.utils'
import {
  TRANSIT_TYPE_MAP,
  assembleTransportDraft,
  collectFields,
  combineDateTime,
  datePart,
  fieldLabel,
  fieldValue,
  findDateText,
  findField,
  getStructure,
  point,
  toCoordinates
} from '@ds/components/c-voucher-reader/utils/pkpass-field.utils'
import { parseWithProfile } from '@ds/components/c-voucher-reader/utils/pkpass-profile.utils'

// Types
import type { TransportVoucherDraft } from '../types/voucher.types'
import type { PassJson, VendorProfile } from '../types/pkpass.types'

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

// Slug derived from the pass organization, used to request the vendor profile
// (e.g. "Air Europa" → "air-europa"). Empty when there is no organization.
export function getPassProfileId(pass: PassJson): string {
  return (pass.organizationName ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// --- transport ---------------------------------------------------------------

// Uses the backend-provided vendor profile when available, otherwise falls back
// to the in-code generic parser (best-effort fuzzy matching).
export function pkpassToTransportDraft(pass: PassJson, profile?: VendorProfile | null): TransportVoucherDraft {
  return profile ? parseWithProfile(pass, profile) : parseGenericTransport(pass)
}

// Fallback for unknown vendors: best-effort fuzzy matching on field keys/labels.
function parseGenericTransport(pass: PassJson): TransportVoucherDraft {
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
    destiny: point({
      code: fieldValue(destinationField),
      name: fieldLabel(destinationField),
      date: day ? combineDateTime(day, fieldValue(destinationField)) : ''
    })
  })
}

// --- hotel -------------------------------------------------------------------
// export function pkpassToHotelDraft(pass: PassJson): HotelVoucherDraft {
//   const fields = collectFields(getStructure(pass))

//   const notes: VoucherNote[] = []
//   const checkIn = findField(fields, ['check-in', 'checkin', 'entrada'])
//   const checkOut = findField(fields, ['check-out', 'checkout', 'salida'])
//   if (checkIn || checkOut) {
//     notes.push({
//       icon: 'check-in-out',
//       text: [fieldValue(checkIn), fieldValue(checkOut)].filter(Boolean).join(' · ')
//     })
//   }

//   const room = findField(fields, ['room', 'habitación', 'habitacion'])
//   if (room) {
//     notes.push({ icon: 'bed', text: fieldValue(room) })
//   }

//   const address = findField(fields, ['address', 'dirección', 'direccion'])

//   return {
//     coordinates: toCoordinates(pass),
//     name: pass.logoText || pass.organizationName || pass.description || '',
//     type: 'poi_hotel',
//     icon: 'hotel',
//     types: ['hotel'],
//     address: fieldValue(address) || pass.locations?.[0]?.relevantText || '',
//     dateStart: toIsoDateTime(pass.relevantDate),
//     dateEnd: toIsoDateTime(pass.expirationDate),
//     image: '',
//     notes
//   }
// }
