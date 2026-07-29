import type { TransportVoucherDraft } from '@ds/types/voucher.types'

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
// pass.json. Adapters are tried in order; the first match parses the pass.
export interface PkpassTransportAdapter {
  id: string
  matches(pass: PassJson): boolean
  parse(pass: PassJson): TransportVoucherDraft
}