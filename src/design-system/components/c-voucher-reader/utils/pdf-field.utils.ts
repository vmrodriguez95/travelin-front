// Primitives for reading a PDF's text layout: turning positioned cells back
// into lines, cropping a page to a region, and locating values around a label.
// The profile interpreter builds on these; it owns no layout logic of its own.

// Utils
import { toIsoDateTime } from '@ds/utils/date.utils'

// Types
import type { Coordinates } from '@ds/types/pois.types'
import type { HotelVoucherDraft } from '../types/voucher.types'
import type { PdfCropBox, PdfPage, PdfTextCell, PdfTextRow } from '../types/pdf.types'

// Vertical distance, in PDF user-space units, within which two items are still
// considered part of the same line. Fragments of one visual line do not always
// share an exact baseline, and this margin groups them anyway.
const ROW_TOLERANCE = 2

// Horizontal gap that reads as a column break rather than a word break.
// Anything wider becomes a tab, so the model can tell a label from its value.
const COLUMN_GAP = 12

// Narrowest gap still worth rendering as a space.
const WORD_GAP = 0.9

// Groups cells that share a baseline into rows, top to bottom.
export function toRows(cells: PdfTextCell[]): PdfTextRow[] {
  const rows: PdfTextRow[] = []

  // Sorting by baseline alone keeps the comparator a valid total order; the
  // horizontal pass happens per row, once the grouping is settled.
  for (const cell of [...cells].sort((a, b) => b.y - a.y)) {
    const current = rows.at(-1)

    if (current && Math.abs(current.y - cell.y) <= ROW_TOLERANCE) {
      current.cells.push(cell)
      continue
    }

    rows.push({ y: cell.y, cells: [cell] })
  }

  return rows
}

// Renders a row left to right, turning wide gaps into column separators.
export function renderRow(row: PdfTextRow): string {
  let line = ''
  let previousEnd: number | null = null

  for (const cell of [...row.cells].sort((a, b) => a.x - b.x)) {
    if (previousEnd !== null) {
      const gap = cell.x - previousEnd

      if (gap > COLUMN_GAP) {
        line += '\t'
      } else if (gap > WORD_GAP) {
        line += ' '
      }
    }

    line += cell.text
    previousEnd = cell.x + cell.width
  }

  return line.trimEnd()
}

export function toLines(cells: PdfTextCell[]): string[] {
  return toRows(cells)
    .map(renderRow)
    .filter((line) => line.trim())
}

// Whole-document text, used for vendor detection and the generic parser.
export function renderPages(pages: PdfPage[]): string {
  return pages
    .map((page) => toLines(page.cells).join('\n'))
    .join('\n\n')
    .trim()
}

// Keeps only the cells inside a fractional crop. Vendor layouts place blocks at
// fixed positions, so a profile can point at one and ignore the rest of the
// page — which is what untangles side-by-side columns, since rows belonging to
// different columns share no baseline and would otherwise interleave.
export function cropCells(page: PdfPage, box?: PdfCropBox): PdfTextCell[] {
  if (!box) return page.cells

  const xMin = (box.xMin ?? 0) * page.width
  const xMax = (box.xMax ?? 1) * page.width
  const yMin = (box.yMin ?? 0) * page.height
  const yMax = (box.yMax ?? 1) * page.height

  return page.cells.filter((cell) => {
    // Crops are written top-down; PDF user space counts up from the bottom.
    const fromTop = page.height - cell.y
    return cell.x >= xMin && cell.x <= xMax && fromTop >= yMin && fromTop <= yMax
  })
}

// Case- and accent-insensitive, so a profile can write "Direccion" or "DIRECCIÓN".
export function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findLabelIndex(lines: string[], label: string): number {
  const needle = normalizeLabel(label)
  return lines.findIndex((line) => normalizeLabel(line).includes(needle))
}

// Reads one tab-separated column of a line, or the whole line when no column
// is asked for. Strips the label itself when the value sits on the same line.
export function readLine(line: string | undefined, column?: number, label?: string): string {
  if (!line) return ''

  if (column != null) {
    return (line.split('\t')[column] ?? '').trim()
  }

  if (!label) return line.trim()

  const index = normalizeLabel(line).indexOf(normalizeLabel(label))
  if (index === -1) return line.trim()

  return line.slice(index + label.length).replace(/^[\s:·-]+/, '').trim()
}

// Reads decimal-minute coordinates as printed on hotel vouchers, e.g.
// "N 040° 37.547, E 14° 22.917" → [14.38195, 40.625783] (longitude first).
//
// The pattern is deliberately strict: uppercase hemisphere, a degree sign, and
// minutes on the same line. Loosening any of those makes it match the "de" in
// "de 15:00" or swallow a time from the line below, and a coordinate that is
// wrong by a few degrees puts the hotel in another province.
export function parseGpsCoordinates(value: string): Coordinates {
  const matches = [...value.matchAll(/\b([NSEW])[ \t]*(\d{1,3})°[ \t]*(\d{1,2}(?:[.,]\d+)?)/g)]
  if (matches.length < 2) return [0, 0]

  let latitude = 0
  let longitude = 0

  for (const [, hemisphere, degrees, minutes] of matches) {
    const decimal = Number(degrees) + (minutes ? Number(minutes.replace(',', '.')) / 60 : 0)
    const signed = /[SW]/i.test(hemisphere) ? -decimal : decimal

    if (/[NS]/i.test(hemisphere)) {
      latitude = signed
    } else {
      longitude = signed
    }
  }

  if (!latitude && !longitude) return [0, 0]

  return [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))]
}

// Fills in the required shape of a hotel draft, mirroring point() for transport.
// Unknown fields stay empty rather than guessed.
export function hotelDraft(opts: Partial<HotelVoucherDraft>): HotelVoucherDraft {
  return {
    name: opts.name ?? '',
    type: 'poi_hotel',
    icon: 'hotel',
    types: ['hotel'],
    coordinates: opts.coordinates ?? [0, 0],
    address: opts.address ?? '',
    dateStart: toIsoDateTime(opts.dateStart) || '',
    dateEnd: toIsoDateTime(opts.dateEnd) || '',
    price: opts.price ?? 0,
    currency: opts.currency ?? '',
    image: opts.image ?? '',
    notes: opts.notes ?? []
  }
}
