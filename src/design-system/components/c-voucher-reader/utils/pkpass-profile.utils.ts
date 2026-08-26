// Utils
import {
  assembleTransportDraft,
  byKey,
  collectFields,
  combineDateTime,
  datePart,
  fieldLabel,
  fieldValue,
  getStructure,
  parsePrice,
  point,
  toCoordinates
} from '@ds/components/c-voucher-reader/utils/pkpass-field.utils'

// Types
import type { TransportSegmentPointDraft, TransportVoucherDraft } from '../types/voucher.types'
import type { PassField, PassJson, ProfileAccessor, ProfileAccessorSingle, ProfileDate, ProfilePoint, TransformName, VendorProfile } from '../types/pkpass.types'

// Fixed, named transforms. Extend here rather than growing the JSON DSL.
const TRANSFORMS: Record<TransformName, (value: string) => string> = {
  stripCarrierPrefix: (value) => value.replace(/^operad(or|o por)\s+/i, '').trim()
}

// Escape-hatch: profiles with a "custom" id delegate to a coded parser here.
const CUSTOM_PARSERS: Record<string, (pass: PassJson) => TransportVoucherDraft> = {}

function applyTransform(value: string, transform?: TransformName): string {
  return transform && TRANSFORMS[transform] ? TRANSFORMS[transform](value) : value
}

function resolveSingle(pass: PassJson, fields: PassField[], accessor: ProfileAccessorSingle): string {
  if (typeof accessor === 'string') {
    return fieldValue(byKey(fields, accessor))
  }

  if ('const' in accessor) {
    return accessor.const
  }

  if ('top' in accessor) {
    const raw = String((pass as Record<string, unknown>)[accessor.top] ?? '').trim()
    return applyTransform(raw, accessor.transform)
  }

  const field = byKey(fields, accessor.field)
  const raw = accessor.from === 'label' ? fieldLabel(field) : fieldValue(field)
  return applyTransform(raw, accessor.transform)
}

function resolveAccessor(pass: PassJson, fields: PassField[], accessor?: ProfileAccessor): string {
  if (accessor == null) return ''

  if (Array.isArray(accessor)) {
    for (const candidate of accessor) {
      const value = resolveSingle(pass, fields, candidate)
      if (value) return value
    }
    return ''
  }

  return resolveSingle(pass, fields, accessor)
}

function resolveDate(pass: PassJson, fields: PassField[], date?: ProfileDate): string {
  const sources = date == null ? ['relevantDate'] : Array.isArray(date) ? date : [date]

  for (const source of sources) {
    const raw = source === 'relevantDate' ? pass.relevantDate
      : source === 'expirationDate' ? pass.expirationDate
      : source.startsWith('field:') ? fieldValue(byKey(fields, source.slice(6)))
      : ''

    const day = datePart(raw)
    if (day) return day
  }

  return ''
}

function buildPoint(pass: PassJson, fields: PassField[], day: string, profilePoint?: ProfilePoint): TransportSegmentPointDraft {
  if (!profilePoint) return point({})

  return point({
    code: resolveAccessor(pass, fields, profilePoint.code),
    name: resolveAccessor(pass, fields, profilePoint.name),
    address: resolveAccessor(pass, fields, profilePoint.address),
    platform: resolveAccessor(pass, fields, profilePoint.platform),
    coordinates: profilePoint.coordinates ? toCoordinates(pass) : [0, 0],
    date: profilePoint.time ? combineDateTime(day, resolveAccessor(pass, fields, profilePoint.time)) : ''
  })
}

// Turns a pass.json into a transport draft using a declarative vendor profile.
export function parseWithProfile(pass: PassJson, profile: VendorProfile): TransportVoucherDraft {
  const mapper = profile.mapper

  if (mapper.custom && CUSTOM_PARSERS[mapper.custom]) {
    return CUSTOM_PARSERS[mapper.custom](pass)
  }

  const fields = collectFields(getStructure(pass))
  const day = resolveDate(pass, fields, mapper.date)
  const { price, currency } = mapper.price ? parsePrice(resolveAccessor(pass, fields, mapper.price)) : { price: 0, currency: '' }
  const operator = resolveAccessor(pass, fields, mapper.operator)

  return assembleTransportDraft({
    typeTransport: mapper.typeTransport,
    provider: mapper.provider,
    operator: operator || undefined,
    price,
    currency,
    transportNumber: resolveAccessor(pass, fields, mapper.transportNumber),
    seatClass: resolveAccessor(pass, fields, mapper.class),
    passengerName: resolveAccessor(pass, fields, mapper.passenger),
    seat: resolveAccessor(pass, fields, mapper.seat),
    origin: buildPoint(pass, fields, day, mapper.origin),
    destiny: buildPoint(pass, fields, day, mapper.destiny)
  })
}
