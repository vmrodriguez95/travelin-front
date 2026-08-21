import type { Coordinates } from '@ds/types/pois.types'

export type VoucherPoiType = 'poi_hotel' | 'poi_transport'

export type TransportType = 'flight' | 'cruise' | 'ferry' | 'train' | 'bus' | 'car'

export interface VoucherErrors {
  invalidFile: string
  fileTooLarge: string
  emptyContent: string
  readError: string
}

export type VoucherErrorCode = keyof VoucherErrors

export interface VoucherStatusMessages {
  reading: string
  processing: string
}

export type VoucherStatusKey = keyof VoucherStatusMessages

export interface VoucherNote {
  icon: string
  text: string
}

// HOTEL
export interface HotelVoucherDraft {
  coordinates: Coordinates
  name: string
  type: 'poi_hotel'
  icon: 'hotel'
  types: ['hotel']
  address: string
  dateStart: string
  dateEnd: string
  price: number
  currency: string
  image: string
  notes: VoucherNote[]
}

// TRANSPORT
export interface TransportBookingDraft {
  provider: string
  price: number
  currency: string
}

export interface TransportPassengerDraft {
  name: string
}

export interface TransportSegmentPassengerDraft {
  name: string
  seat: string
}

export interface TransportSegmentPointDraft {
  code: string
  name: string
  address: string
  coordinates: Coordinates
  platform: string
  date: string
}

export interface TransportSegmentDraft {
  duration: string
  operator: string
  transportNumber: string
  class: string
  origin: TransportSegmentPointDraft
  destiny: TransportSegmentPointDraft
  passengers: TransportSegmentPassengerDraft[]
}

export interface TransportVoucherDraft {
  name: string
  type: 'poi_transport'
  typeTransport: TransportType
  booking: TransportBookingDraft
  passengers: TransportPassengerDraft[]
  segments: TransportSegmentDraft[]
}

export type VoucherDraft = HotelVoucherDraft | TransportVoucherDraft

export interface TransportParts {
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
  // One traveller, as read from a pass. `passengers` carries a full list when
  // the source is a voucher that prints several rows; it wins when set.
  passengerName?: string
  seat?: string
  passengers?: TransportSegmentPassengerDraft[]
  // Several legs, already assembled. Supersedes origin/destiny, which then only
  // name the draft.
  segments?: TransportSegmentDraft[]
  origin: TransportSegmentPointDraft
  destiny: TransportSegmentPointDraft
}
