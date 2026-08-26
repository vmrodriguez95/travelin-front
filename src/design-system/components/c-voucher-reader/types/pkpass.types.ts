import type { TransportType, TransportVoucherDraft, VoucherExtension, VoucherPoiType } from './voucher.types'

// Raw Apple Wallet pass.json shapes (https://developer.apple.com/documentation/walletpasses)

export interface PassField {
  key: string
  label?: string
  value: string | number
  attributedValue?: string
  changeMessage?: string
}

export interface PassStructure {
  transitType?: string
  headerFields?: PassField[]
  primaryFields?: PassField[]
  secondaryFields?: PassField[]
  auxiliaryFields?: PassField[]
  backFields?: PassField[]
}

export interface PassLocation {
  latitude: number
  longitude: number
  relevantText?: string
}

export interface PassBarcode {
  message: string
  format: string
  altText?: string
}

export interface PassJson {
  description?: string
  organizationName?: string
  logoText?: string
  passTypeIdentifier?: string
  relevantDate?: string
  expirationDate?: string
  // Some airlines (e.g. Iberia) expose the route codes at the top level.
  departureCode?: string
  arrivalCode?: string
  carrierIataCode?: string
  locations?: PassLocation[]
  barcode?: PassBarcode
  barcodes?: PassBarcode[]
  boardingPass?: PassStructure
  eventTicket?: PassStructure
  coupon?: PassStructure
  generic?: PassStructure
  storeCard?: PassStructure
}

// A vendor-specific reader that knows the exact field layout of one company's
// pass.json. Used by the in-code generic fallback parser.
export interface PkpassTransportAdapter {
  id: string
  matches(pass: PassJson): boolean
  parse(pass: PassJson): TransportVoucherDraft
}

// --- Vendor profiles (declarative, backend-owned) ----------------------------

// Named string transforms the interpreter can apply to a resolved value.
export type TransformName = 'stripCarrierPrefix'

// Where a value comes from. String shorthand = a field's value by key.
export interface ProfileFieldAccessor {
  field: string
  from?: 'value' | 'label'
  transform?: TransformName
}

export interface ProfileTopAccessor {
  top: string // a top-level pass.json property (e.g. "departureCode")
  transform?: TransformName
}

export interface ProfileConstAccessor {
  const: string
}

export type ProfileAccessorSingle = string | ProfileFieldAccessor | ProfileTopAccessor | ProfileConstAccessor

// An array means "first non-empty wins".
export type ProfileAccessor = ProfileAccessorSingle | ProfileAccessorSingle[]

// A date source: "relevantDate" | "expirationDate" | "field:<key>". An array is a fallback chain.
export type ProfileDate = string | string[]

export interface ProfilePoint {
  code?: ProfileAccessor
  name?: ProfileAccessor
  address?: ProfileAccessor
  platform?: ProfileAccessor
  time?: ProfileAccessor // resolved, then combined with the segment date
  coordinates?: boolean // true → pass.locations[0]
}

// How to read a journey out of a pass.json.
export interface VendorProfileMapper {
  typeTransport: TransportType
  provider: string
  date?: ProfileDate
  operator?: ProfileAccessor
  transportNumber?: ProfileAccessor
  class?: ProfileAccessor
  passenger?: ProfileAccessor
  seat?: ProfileAccessor
  price?: ProfileAccessor
  origin: ProfilePoint
  destiny: ProfilePoint
  custom?: string // escape-hatch: delegate to a coded parser by id
}

// Same envelope as the PDF profiles — id, match, poiType, extension, mapper —
// so both catalogues are stored and served the same way. The reader still finds
// a pass profile by the pass's own organization, never by `match`.
export interface VendorProfile {
  id: string
  match: string[]
  poiType: VoucherPoiType
  extension: Extract<VoucherExtension, 'pkpass'>
  mapper: VendorProfileMapper
}