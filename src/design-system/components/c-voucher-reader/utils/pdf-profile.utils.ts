// Utils
import { assembleTransportDraft, combineDateTime, datePart, parsePrice, point } from '@ds/components/c-voucher-reader/utils/pkpass-field.utils'
import {
  cropCells,
  findLabelIndex,
  hotelDraft,
  normalizeLabel,
  parseGpsCoordinates,
  readLine,
  toLines
} from '@ds/components/c-voucher-reader/utils/pdf-field.utils'
import { findDocumentYear, parseNaturalDate } from '@ds/utils/date.utils'

// Types
import type { PdfPage } from '../types/pdf.types'
import type { TransportSegmentPointDraft, VoucherDraft, VoucherNote } from '../types/voucher.types'
import type {
  PdfAccessor,
  PdfAccessorSingle,
  PdfHotelProfile,
  PdfProfile,
  PdfProfileManifestEntry,
  PdfProfilePoint,
  PdfTransformName,
  PdfTransportProfile
} from '../types/pdf-profile.types'

// Fixed, named transforms. Extend here rather than growing the JSON DSL.
const TRANSFORMS: Record<PdfTransformName, (value: string) => string> = {
  collapseSpaces: (value) => value.replace(/\s+/g, ' ').trim(),
  stripTrailingPunctuation: (value) => value.replace(/[\s.,;:·-]+$/, ''),
  upper: (value) => value.toUpperCase(),
  stripLabel: (value) => value.replace(/^[^:]*:\s*/, '').trim()
}

function applyTransform(value: string, transform?: PdfTransformName): string {
  return transform && TRANSFORMS[transform] ? TRANSFORMS[transform](value) : value
}

// Lines the accessor is allowed to see: one cropped region, or the whole
// document when the profile does not narrow it down.
function linesFor(pages: PdfPage[], box?: { page?: number }): string[] {
  if (!box) return pages.flatMap((page) => toLines(page.cells))

  const page = pages[box.page ?? 0]
  return page ? toLines(cropCells(page, box)) : []
}

function resolveSingle(pages: PdfPage[], accessor: PdfAccessorSingle): string {
  if (typeof accessor === 'string') {
    return resolveSingle(pages, { label: accessor })
  }

  if ('const' in accessor) {
    return accessor.const
  }

  if ('concat' in accessor) {
    return accessor.concat
      .map((part) => resolveSingle(pages, part))
      .filter(Boolean)
      .join(accessor.separator ?? ' ')
      .trim()
  }

  if ('regex' in accessor) {
    const text = linesFor(pages, accessor.within).join('\n')

    try {
      const match = text.match(new RegExp(accessor.regex, 'i'))
      return applyTransform(match?.[accessor.group ?? 1] ?? '', accessor.transform)
    } catch {
      // A malformed pattern yields no value rather than breaking the read.
      return ''
    }
  }

  if ('linesAfter' in accessor || 'linesBefore' in accessor) {
    const lines = linesFor(pages, accessor.within)
    const after = 'linesAfter' in accessor
    const index = findLabelIndex(lines, after ? accessor.linesAfter : accessor.linesBefore)
    if (index === -1) return ''

    const block = after
      ? lines.slice(index + 1, index + 1 + accessor.count)
      : lines.slice(Math.max(0, index - accessor.count), index)

    return applyTransform(block.join(accessor.separator ?? ', ').trim(), accessor.transform)
  }

  const lines = linesFor(pages, accessor.within)
  const index = findLabelIndex(lines, accessor.label)
  if (index === -1) return ''

  const below = accessor.below ?? 0
  // The label only needs stripping when the value shares its line.
  const raw = readLine(lines[index + below], accessor.column, below ? undefined : accessor.label)

  return applyTransform(raw, accessor.transform)
}

function resolveAccessor(pages: PdfPage[], accessor?: PdfAccessor): string {
  if (accessor == null) return ''

  if (Array.isArray(accessor)) {
    for (const candidate of accessor) {
      const value = resolveSingle(pages, candidate)
      if (value) return value
    }
    return ''
  }

  return resolveSingle(pages, accessor)
}

// Vouchers often print a day and month with no year; the year is taken from
// elsewhere in the document, falling back to the current one.
function resolveDate(pages: PdfPage[], year: number, accessor?: PdfAccessor): string {
  const raw = resolveAccessor(pages, accessor)
  if (!raw) return ''

  return datePart(raw) || parseNaturalDate(raw, year)
}

function buildPoint(pages: PdfPage[], day: string, profilePoint?: PdfProfilePoint): TransportSegmentPointDraft {
  if (!profilePoint) return point({})

  return point({
    code: resolveAccessor(pages, profilePoint.code),
    name: resolveAccessor(pages, profilePoint.name),
    address: resolveAccessor(pages, profilePoint.address),
    platform: resolveAccessor(pages, profilePoint.platform),
    date: profilePoint.time ? combineDateTime(day, resolveAccessor(pages, profilePoint.time)) : ''
  })
}

function parseHotel(pages: PdfPage[], profile: PdfHotelProfile, year: number): VoucherDraft {
  const dateStart = resolveDate(pages, year, profile.dateStart)
  const dateEnd = resolveDate(pages, year, profile.dateEnd)

  const notes: VoucherNote[] = (profile.notes ?? [])
    .map((note) => ({ icon: note.icon, text: resolveAccessor(pages, note.text) }))
    .filter((note) => note.text)

  const coordinates = profile.coordinates
    ? parseGpsCoordinates(resolveAccessor(pages, profile.coordinates))
    : undefined

  const { price, currency } = profile.price
    ? parsePrice(resolveAccessor(pages, profile.price))
    : { price: 0, currency: '' }

  return hotelDraft({
    name: resolveAccessor(pages, profile.name),
    address: resolveAccessor(pages, profile.address),
    coordinates,
    price,
    currency,
    dateStart: combineDateTime(dateStart, resolveAccessor(pages, profile.timeStart)) || dateStart,
    dateEnd: combineDateTime(dateEnd, resolveAccessor(pages, profile.timeEnd)) || dateEnd,
    notes
  })
}

function parseTransport(pages: PdfPage[], profile: PdfTransportProfile, year: number): VoucherDraft {
  const day = resolveDate(pages, year, profile.date)
  const { price, currency } = profile.price
    ? parsePrice(resolveAccessor(pages, profile.price))
    : { price: 0, currency: '' }

  return assembleTransportDraft({
    typeTransport: profile.typeTransport,
    provider: profile.provider,
    operator: resolveAccessor(pages, profile.operator) || undefined,
    price,
    currency,
    transportNumber: resolveAccessor(pages, profile.transportNumber),
    seatClass: resolveAccessor(pages, profile.class),
    passengerName: resolveAccessor(pages, profile.passenger),
    seat: resolveAccessor(pages, profile.seat),
    origin: buildPoint(pages, day, profile.origin),
    destiny: buildPoint(pages, day, profile.destiny)
  })
}

// Turns a PDF into a voucher draft using a declarative vendor profile.
export function parseWithPdfProfile(pages: PdfPage[], text: string, profile: PdfProfile): VoucherDraft {
  const year = findDocumentYear(text)

  return profile.poiType === 'poi_hotel'
    ? parseHotel(pages, profile, year)
    : parseTransport(pages, profile, year)
}

// Picks the vendor whose fingerprint appears in the document. The id can only
// ever come from the server's manifest, never from the document itself, so a
// crafted PDF cannot steer which profile gets requested.
export function detectProfileId(text: string, manifest: PdfProfileManifestEntry[]): string {
  const haystack = normalizeLabel(text)

  const entry = manifest.find((candidate) =>
    candidate.match.some((needle) => needle && haystack.includes(normalizeLabel(needle)))
  )

  return entry?.id ?? ''
}
