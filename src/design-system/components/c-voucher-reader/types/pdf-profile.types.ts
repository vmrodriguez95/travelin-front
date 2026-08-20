import type { PdfCropBox } from './pdf.types'
import type { TransportType, VoucherPoiType } from './voucher.types'

// --- Vendor profiles for PDF vouchers (declarative, backend-owned) -----------
//
// The interpreter only ever reads data from these objects, never executes them.
// A poisoned profile can put a wrong value in a form the user is already
// reviewing; it can never run code in the browser.

// Named string transforms the interpreter can apply to a resolved value.
export type PdfTransformName = 'collapseSpaces' | 'stripTrailingPunctuation' | 'upper' | 'stripLabel'

// Anchors on a label, then reads a value relative to it. The string shorthand
// `"Dirección:"` is this accessor with every option left at its default.
export interface PdfLabelAccessor {
  label: string
  // Lines below the one holding the label. 0 (default) means the same line.
  below?: number
  // Index into the target line's tab-separated columns. Omitted = whole line.
  column?: number
  within?: PdfCropBox
  transform?: PdfTransformName
}

// Runs against the rendered text of the crop (or the whole page when omitted).
export interface PdfRegexAccessor {
  regex: string
  group?: number
  within?: PdfCropBox
  transform?: PdfTransformName
}

// Grabs a run of whole lines around a label — addresses, mostly.
// Split into two variants with a required key each, so the interpreter's
// `'linesAfter' in accessor` check actually narrows the union.
interface PdfBlockAccessorBase {
  count: number
  separator?: string
  within?: PdfCropBox
  transform?: PdfTransformName
}

export interface PdfLinesAfterAccessor extends PdfBlockAccessorBase {
  linesAfter: string
}

export interface PdfLinesBeforeAccessor extends PdfBlockAccessorBase {
  linesBefore: string
}

export type PdfBlockAccessor = PdfLinesAfterAccessor | PdfLinesBeforeAccessor

// Glues several accessors together. Needed when a single value is split across
// lines by the layout — a day on one line and its month on the next.
export interface PdfConcatAccessor {
  concat: PdfAccessorSingle[]
  separator?: string
}

export interface PdfConstAccessor {
  const: string
}

export type PdfAccessorSingle =
  | string
  | PdfLabelAccessor
  | PdfRegexAccessor
  | PdfBlockAccessor
  | PdfConcatAccessor
  | PdfConstAccessor

// An array means "first non-empty wins" (same rule as the pkpass profiles).
export type PdfAccessor = PdfAccessorSingle | PdfAccessorSingle[]

export interface PdfProfilePoint {
  code?: PdfAccessor
  name?: PdfAccessor
  address?: PdfAccessor
  platform?: PdfAccessor
  time?: PdfAccessor
}

interface PdfProfileBase {
  id: string
  // Substrings looked up in the document text to recognise the vendor.
  // Unlike the pkpass profiles, this field is actually read.
  match: string[]
  poiType: VoucherPoiType
}

export interface PdfHotelProfile extends PdfProfileBase {
  poiType: 'poi_hotel'
  name?: PdfAccessor
  address?: PdfAccessor
  coordinates?: PdfAccessor
  price?: PdfAccessor
  dateStart?: PdfAccessor
  dateEnd?: PdfAccessor
  // Check-in / check-out times, combined with the dates above when present.
  timeStart?: PdfAccessor
  timeEnd?: PdfAccessor
  notes?: Array<{ icon: string; text: PdfAccessor }>
}

export interface PdfTransportProfile extends PdfProfileBase {
  poiType: 'poi_transport'
  typeTransport: TransportType
  provider: string
  operator?: PdfAccessor
  transportNumber?: PdfAccessor
  class?: PdfAccessor
  passenger?: PdfAccessor
  seat?: PdfAccessor
  price?: PdfAccessor
  date?: PdfAccessor
  origin: PdfProfilePoint
  destiny: PdfProfilePoint
}

export type PdfProfile = PdfHotelProfile | PdfTransportProfile

// What the manifest endpoint returns: enough to recognise a vendor, nothing more.
export interface PdfProfileManifestEntry {
  id: string
  match: string[]
}
