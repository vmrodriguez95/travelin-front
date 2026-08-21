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
import type { TransportSegmentDraft, TransportSegmentPassengerDraft, TransportSegmentPointDraft, TransportType, VoucherDraft, VoucherNote } from '../types/voucher.types'
import type {
  PdfAccessor,
  PdfAccessorSingle,
  PdfHotelProfile,
  PdfLineAccessor,
  PdfPassengerList,
  PdfProfile,
  PdfLineSource,
  PdfProfileManifestEntry,
  PdfProfilePoint,
  PdfProfileSegments,
  PdfTransformName,
  PdfTransportProfile,
  PdfTypeTransport
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

// Where an accessor reads from. The document answers with the crop it is asked
// for; a segment block ignores the crop and answers with its own lines, which
// is what lets the same accessors work inside a repeating block.
function documentSource(pages: PdfPage[]): PdfLineSource {
  return (box) => linesFor(pages, box)
}

function blockSource(lines: string[]): PdfLineSource {
  return () => lines
}

// A source pinned to one page: the accessor's crop still applies, but only
// within that sheet. This is what a per-page segment reads from.
function pageSource(pages: PdfPage[], index: number): PdfLineSource {
  return (box) => linesFor(pages, { ...box, page: index })
}

function resolveSingle(source: PdfLineSource, accessor: PdfAccessorSingle): string {
  if (typeof accessor === 'string') {
    return resolveSingle(source, { label: accessor })
  }

  if ('const' in accessor) {
    return accessor.const
  }

  if ('concat' in accessor) {
    return accessor.concat
      .map((part) => resolveSingle(source, part))
      .filter(Boolean)
      .join(accessor.separator ?? ' ')
      .trim()
  }

  if ('regex' in accessor) {
    const text = source(accessor.within).join('\n')

    try {
      const match = text.match(new RegExp(accessor.regex, 'i'))
      return applyTransform(match?.[accessor.group ?? 1] ?? '', accessor.transform)
    } catch {
      // A malformed pattern yields no value rather than breaking the read.
      return ''
    }
  }

  if ('linesAfter' in accessor || 'linesBefore' in accessor) {
    const lines = source(accessor.within)
    const after = 'linesAfter' in accessor
    const index = findLabelIndex(lines, after ? accessor.linesAfter : accessor.linesBefore)
    if (index === -1) return ''

    const block = after
      ? lines.slice(index + 1, index + 1 + accessor.count)
      : lines.slice(Math.max(0, index - accessor.count), index)

    return applyTransform(block.join(accessor.separator ?? ', ').trim(), accessor.transform)
  }

  const lines = source(accessor.within)
  const index = findLabelIndex(lines, accessor.label)
  if (index === -1) return ''

  const below = accessor.below ?? 0
  // The label only needs stripping when the value shares its line.
  const raw = readLine(lines[index + below], accessor.column, below ? undefined : accessor.label)

  return applyTransform(raw, accessor.transform)
}

function resolveAccessor(source: PdfLineSource, accessor?: PdfAccessor): string {
  if (accessor == null) return ''

  if (Array.isArray(accessor)) {
    for (const candidate of accessor) {
      const value = resolveSingle(source, candidate)
      if (value) return value
    }
    return ''
  }

  return resolveSingle(source, accessor)
}

// Vouchers often print a day and month with no year; the year is taken from
// elsewhere in the document, falling back to the current one.
function resolveDate(source: PdfLineSource, year: number, accessor?: PdfAccessor): string {
  const raw = resolveAccessor(source, accessor)
  if (!raw) return ''

  return datePart(raw) || parseNaturalDate(raw, year)
}

// Rows of a passenger table, bounded by the labels the profile gives.
function passengerRows(pages: PdfPage[], source: PdfLineSource, list: PdfPassengerList): string[] {
  const lines = source(list.within)
  const start = findLabelIndex(lines, list.after)
  if (start === -1) return []

  const rows: string[] = []

  for (const line of lines.slice(start + 1)) {
    const normalized = normalizeLabel(line)
    if (list.until?.some((needle) => normalized.includes(normalizeLabel(needle)))) break
    rows.push(line)
  }

  return rows
}

function readFromLine(line: string, accessor?: PdfLineAccessor): string {
  if (!accessor) return ''

  const raw = 'column' in accessor
    ? readLine(line, accessor.column)
    : line.match(new RegExp(accessor.regex, 'i'))?.[accessor.group ?? 1] ?? ''

  return applyTransform(raw, accessor.transform)
}

// Travellers as described by one of the two shapes a profile can use: a table
// of rows, or a single name and seat.
function resolvePassengers(
  pages: PdfPage[],
  source: PdfLineSource,
  spec: { passengers?: PdfPassengerList; passenger?: PdfAccessor; seat?: PdfAccessor }
): TransportSegmentPassengerDraft[] {
  if (spec.passengers) {
    return passengerRows(pages, source, spec.passengers)
      .map((line) => ({
        name: readFromLine(line, spec.passengers?.name),
        seat: readFromLine(line, spec.passengers?.seat)
      }))
      .filter((passenger) => passenger.name)
  }

  const name = resolveAccessor(source, spec.passenger)
  return name ? [{ name, seat: resolveAccessor(source, spec.seat) }] : []
}

// A vendor that only ever sells one mode states it outright; the rest point at
// the line where the vehicle is printed and map its wording onto a type.
function resolveTypeTransport(pages: PdfPage[], typeTransport: PdfTypeTransport): TransportType {
  if (typeof typeTransport === 'string') return typeTransport

  const value = normalizeLabel(resolveAccessor(documentSource(pages), typeTransport.from))
  if (!value) return typeTransport.fallback

  const entry = Object.entries(typeTransport.map)
    .find(([needle]) => value.includes(normalizeLabel(needle)))

  return entry?.[1] ?? typeTransport.fallback
}

function buildPoint(source: PdfLineSource, day: string, year: number, profilePoint?: PdfProfilePoint): TransportSegmentPointDraft {
  if (!profilePoint) return point({})

  const pointDay = (profilePoint.date && resolveDate(source, year, profilePoint.date)) || day

  return point({
    code: resolveAccessor(source, profilePoint.code),
    name: resolveAccessor(source, profilePoint.name),
    address: resolveAccessor(source, profilePoint.address),
    platform: resolveAccessor(source, profilePoint.platform),
    date: profilePoint.time ? combineDateTime(pointDay, resolveAccessor(source, profilePoint.time)) : ''
  })
}

function parseHotel(pages: PdfPage[], profile: PdfHotelProfile, year: number): VoucherDraft {
  const source = documentSource(pages)
  const dateStart = resolveDate(source, year, profile.dateStart)
  const dateEnd = resolveDate(source, year, profile.dateEnd)

  const notes: VoucherNote[] = (profile.notes ?? [])
    .map((note) => ({ icon: note.icon, text: resolveAccessor(source, note.text) }))
    .filter((note) => note.text)

  const coordinates = profile.coordinates
    ? parseGpsCoordinates(resolveAccessor(source, profile.coordinates))
    : undefined

  const { price, currency } = profile.price
    ? parsePrice(resolveAccessor(source, profile.price))
    : { price: 0, currency: '' }

  return hotelDraft({
    name: resolveAccessor(source, profile.name),
    address: resolveAccessor(source, profile.address),
    coordinates,
    price,
    currency,
    dateStart: combineDateTime(dateStart, resolveAccessor(source, profile.timeStart)) || dateStart,
    dateEnd: combineDateTime(dateEnd, resolveAccessor(source, profile.timeEnd)) || dateEnd,
    notes
  })
}

// One block of lines per leg: a new one opens on every line matching `startsAt`
// and runs until the next one, the end of the crop, or a line the profile
// declares as the end of the list.
function segmentBlocks(pages: PdfPage[], list: PdfProfileSegments): string[][] {
  const lines = linesFor(pages, list.within)
  if (!list.startsAt) return []

  const startsAt = new RegExp(list.startsAt, 'i')
  const blocks: string[][] = []

  for (const line of lines) {
    const normalized = normalizeLabel(line)
    if (list.until?.some((needle) => normalized.includes(normalizeLabel(needle)))) break

    if (startsAt.test(line)) {
      blocks.push([line])
      continue
    }

    blocks.at(-1)?.push(line)
  }

  return blocks
}

function buildSegments(
  pages: PdfPage[],
  profile: PdfTransportProfile,
  year: number,
  passengers: TransportSegmentPassengerDraft[]
): TransportSegmentDraft[] {
  const list = profile.segments

  if (!list) return []

  // A leg is either a whole page or a run of lines. Both end up as a source the
  // ordinary accessors can read from.
  const sources = list.perPage
    ? pages.map((_, index) => pageSource(pages, index))
    : segmentBlocks(pages, list).map(blockSource)

  const carriesTravellers = list.passengers ?? list.passenger

  return sources
    .map((source) => {
      const day = resolveDate(source, year, list.date ?? profile.date)

      return {
        duration: '',
        operator: resolveAccessor(source, list.operator ?? profile.operator) || profile.provider,
        transportNumber: resolveAccessor(source, list.transportNumber ?? profile.transportNumber),
        class: resolveAccessor(source, list.class ?? profile.class),
        origin: buildPoint(source, day, year, list.origin),
        destiny: buildPoint(source, day, year, list.destiny),
        passengers: carriesTravellers ? resolvePassengers(pages, source, list) : passengers
      }
    })
    // A page with no journey on it — a terms-and-conditions sheet, a blank —
    // is not a leg.
    .filter((segment) => segment.origin.name || segment.origin.code || segment.destiny.name || segment.destiny.code)
}

function parseTransport(pages: PdfPage[], profile: PdfTransportProfile, year: number): VoucherDraft {
  const source = documentSource(pages)
  const day = resolveDate(source, year, profile.date)
  const { price, currency } = profile.price
    ? parsePrice(resolveAccessor(source, profile.price))
    : { price: 0, currency: '' }

  const passengers = resolvePassengers(pages, source, profile)
  const segments = buildSegments(pages, profile, year, passengers)

  return assembleTransportDraft({
    typeTransport: resolveTypeTransport(pages, profile.typeTransport),
    provider: profile.provider,
    operator: resolveAccessor(source, profile.operator) || undefined,
    price,
    currency,
    transportNumber: resolveAccessor(source, profile.transportNumber),
    seatClass: resolveAccessor(source, profile.class),
    passengers,
    segments: segments.length ? segments : undefined,
    origin: buildPoint(source, day, year, profile.origin),
    destiny: buildPoint(source, day, year, profile.destiny)
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
