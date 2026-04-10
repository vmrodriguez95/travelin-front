
// BASE
interface PoiBase {
  id: string
  idUser: string
  idTrip: string
  idItinerary: string
  name: string
  types: string[]
}

interface Notes {
  icon: string
  text: string
}

// POI HOTEL
export interface PoiHotel extends PoiBase {
  location: string
  coordenates: [number, number]
  dateStart: string
  dateEnd: string
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
  city: string
  country: string
  coordenates: [number, number]
  platform: string
  type: string
  date: string
}

interface TransportSegmentOperator {
  name: string
  code: string
}

interface TransportSegmentVehicle {
  type: string
  model: string
}

interface TransportPerson {
  name: string
  seat: string
}

export interface TransportSegment {
  origin: TransportSegmentPart
  duration: string
  destination: TransportSegmentPart
  departureDate: string
  arrivalDate: string
  operator: TransportSegmentOperator
  transportNumber: string
  vehicle: TransportSegmentVehicle
  passengers: Array<TransportPerson>
}

export interface PoiTransport extends PoiBase {
  type: string // flight, cruise, ferry, train, bus, car
  file: string
  order: number
  booking: TransportBooking
  segments: Array<TransportSegment>
}

// POI
export interface Poi extends PoiBase {
  location: string
  coordenates: [number, number]
  time: string
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