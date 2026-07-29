import type { Coordinates } from '@ds/types/pois.types'

export type VoucherPoiType = 'poi_hotel' | 'poi_transport'

export type TransportType = 'flight' | 'cruise' | 'ferry' | 'train' | 'bus' | 'car'

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
  passengerName?: string
  seat?: string
  origin: TransportSegmentPointDraft
  destiny: TransportSegmentPointDraft
}
