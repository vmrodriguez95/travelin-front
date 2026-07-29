
// BASE
interface PoiBase {
  id: string
  idUser: string
  idTrip: string
  idItinerary: string
  type: string
  name: string
  types: string[]
}

interface Notes {
  icon: string
  text: string
}

export type Coordinates = [number, number]

export interface MapMarker {
  id: string
  idPoi: string
  label: string
  type: string
  coordinates: Coordinates
  icon?: string
  day?: number
  data?: Poi | PoiHotel | PoiTransport | Reminder | Note
  view?: 'resume' | 'detail'
}

// POI HOTEL
export interface PoiHotel extends PoiBase {
  location: string
  coordinates: Coordinates
  dateStart: string
  dateEnd: string
  address: string
  image: string
  file: string
  order: number
  notes: Array<Notes>
}

// POI TRANSPORT
interface TransportBooking {
  reference: string
  ticketNumber: number
  provider: string
  price: number
  currency: string
}

interface TransportSegmentPart {
  code: string
  name: string
  address: string
  coordinates: Coordinates
  platform: string
  gate: string
  date: string
}

interface TransportSegmentOperator {
  name: string
  code: string
}

export interface TransportPerson {
  name: string
  seat: string
}

export interface TransportSegment {
  duration: string
  transportNumber: string
  class: string
  qr: string
  origin: TransportSegmentPart
  destiny: TransportSegmentPart
  operator: TransportSegmentOperator
  passengers: Array<TransportPerson>
}

export interface PoiTransport extends PoiBase {
  type: string
  typeTransport: string // flight, cruise, ferry, train, bus, car
  file: string
  order: number
  booking: TransportBooking
  passengers: Array<TransportPerson>
  segments: Array<TransportSegment>
}

// POI
export interface Poi extends PoiBase {
  location: string
  coordinates: Coordinates
  time: string
  icon: string
  address: string
  image: string
  file: string
  order: number
  notes: Array<Notes>
  price: number
}

// REMINDER
export interface Reminder extends PoiBase {
  time: string
  order: number
  notes: Array<Notes>
}

// NOTE
export interface Note extends PoiBase {
  time: string
  icon: string
  notes: Array<Notes>
  order: number
}

// PLACE
export interface Place {
  coordinates: Number[]
  types: string[]
  location: string
  image: string
  name: string
  address: String
  city: string
  country: string
  iso: string
  locality: string
}