// Fallback for PDFs with no vendor profile: best-effort label matching over the
// whole document. It is deliberately modest — it fills what it can recognise and
// leaves the rest for the user to correct, and those corrections are what a real
// profile gets built from later.

// Utils
import { assembleTransportDraft, datePart, parsePrice, point } from '@ds/components/c-voucher-reader/utils/pkpass-field.utils'
import { hotelDraft, normalizeLabel, parseGpsCoordinates, toLines } from '@ds/components/c-voucher-reader/utils/pdf-field.utils'
import { compareDates, findDocumentYear, parseNaturalDate, toIsoDateTime } from '@ds/utils/date.utils'

// Types
import type { PdfPage } from '../types/pdf.types'
import type { HotelVoucherDraft, TransportVoucherDraft, VoucherDraft, VoucherPoiType } from '../types/voucher.types'

const CHECK_IN_LABELS = ['entrada', 'check-in', 'check in', 'llegada', 'arrival']
const CHECK_OUT_LABELS = ['salida', 'check-out', 'check out', 'departure']
const ADDRESS_LABELS = ['direccion', 'address', 'domicilio']
const ORIGIN_LABELS = ['origen', 'origin', 'from', 'desde', 'salida']
const DESTINY_LABELS = ['destino', 'destination', 'to', 'hasta', 'llegada']
const PRICE_LABELS = ['precio final', 'precio total', 'total', 'importe', 'price']

// Every date-looking token in the document, with where it was found, so a value
// can be attributed to the nearest label that precedes it.
function datesWithPosition(text: string, year: number): Array<{ index: number; iso: string }> {
  const pattern = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b|(?<!\d)\d{1,2}(?!\d)\s*(?:de\s+)?[A-Za-zÁÉÍÓÚáéíóúÜü.]{3,}(?:\s*(?:de|,)?\s*\d{4})?/gi

  return [...text.matchAll(pattern)]
    .map((match) => ({ index: match.index ?? 0, iso: datePart(match[0]) || parseNaturalDate(match[0], year) }))
    .filter((entry) => entry.iso)
}

function findLabelPosition(haystack: string, labels: string[]): number {
  for (const label of labels) {
    const index = haystack.indexOf(label)
    if (index !== -1) return index
  }

  return -1
}

// How far past a label a value may sit and still be considered its value.
// Without this bound the search runs to the end of the document and happily
// returns, say, a cancellation deadline as the check-in date.
const LABEL_PROXIMITY = 400

// First date that appears just after a label.
function dateNearLabel(text: string, labels: string[], year: number): string {
  const position = findLabelPosition(normalizeLabel(text), labels)
  if (position === -1) return ''

  const candidate = datesWithPosition(text, year)
    .find((entry) => entry.index >= position && entry.index <= position + LABEL_PROXIMITY)

  return candidate?.iso ?? ''
}

function valueAfterLabel(lines: string[], labels: string[]): string {
  const index = lines.findIndex((line) => labels.some((label) => normalizeLabel(line).includes(label)))
  if (index === -1) return ''

  const line = lines[index]
  const separator = line.indexOf(':')

  return (separator === -1 ? lines[index + 1] ?? '' : line.slice(separator + 1)).split('\t')[0].trim()
}

function parseGenericHotel(lines: string[], text: string, year: number): HotelVoucherDraft {
  const address = valueAfterLabel(lines, ADDRESS_LABELS)
  const addressIndex = lines.findIndex((line) => normalizeLabel(line).includes(normalizeLabel(address)))
  const { price, currency } = parsePrice(valueAfterLabel(lines, PRICE_LABELS))

  return hotelDraft({
    // The property name is usually printed immediately above its address.
    name: address && addressIndex > 0 ? lines[addressIndex - 1].split('\t')[0].trim() : '',
    address,
    price,
    currency,
    coordinates: parseGpsCoordinates(text),
    dateStart: dateNearLabel(text, CHECK_IN_LABELS, year),
    dateEnd: dateNearLabel(text, CHECK_OUT_LABELS, year)
  })
}

function parseGenericTransport(lines: string[], text: string, year: number): TransportVoucherDraft {
  const day = dateNearLabel(text, [...ORIGIN_LABELS, ...CHECK_IN_LABELS], year)
  const { price, currency } = parsePrice(valueAfterLabel(lines, PRICE_LABELS))

  return assembleTransportDraft({
    typeTransport: 'flight',
    price,
    currency,
    origin: point({ name: valueAfterLabel(lines, ORIGIN_LABELS), date: toIsoDateTime(day) }),
    destiny: point({ name: valueAfterLabel(lines, DESTINY_LABELS) })
  })
}

export function parseGenericPdf(pages: PdfPage[], text: string, poiType: VoucherPoiType): VoucherDraft {
  const lines = pages.flatMap((page) => toLines(page.cells))
  const year = findDocumentYear(text)

  return poiType === 'poi_hotel'
    ? parseGenericHotel(lines, text, year)
    : parseGenericTransport(lines, text, year)
}

// Last gate before the draft reaches the form. A value that cannot be trusted is
// blanked rather than passed on: the user reviews an empty field, but can easily
// miss a plausible-looking wrong one.
export function sanitizeDraft(draft: VoucherDraft): VoucherDraft {
  if (draft.type === 'poi_transport') {
    const booking = draft.booking

    return {
      ...draft,
      booking: {
        ...booking,
        price: Number.isFinite(booking.price) && booking.price >= 0 ? booking.price : 0
      }
    }
  }

  const [longitude, latitude] = draft.coordinates
  const validCoordinates = Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180

  // A stay cannot end before it starts, nor last zero nights — either means the
  // two dates were misread, most often by picking the same one twice.
  const orderedDates = draft.dateStart && draft.dateEnd
    ? compareDates(draft.dateStart.slice(0, 10), draft.dateEnd.slice(0, 10)) < 0
    : true

  return {
    ...draft,
    coordinates: validCoordinates ? draft.coordinates : [0, 0],
    price: Number.isFinite(draft.price) && draft.price >= 0 ? draft.price : 0,
    dateEnd: orderedDates ? draft.dateEnd : ''
  }
}
