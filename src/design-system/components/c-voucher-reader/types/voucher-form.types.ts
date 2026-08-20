// Payloads that mirror the poi_transport / poi_hotel form schemas (section keys +
// field names), so c-form's structured filler can populate them generically.

export interface FormFillPoint {
  location: string
  platform: string
  date: string
  coordinates: [number, number]
}

export interface FormFillSegment {
  operator: string
  duration: string
  transportNumber: string
  class: string
  origin: FormFillPoint
  destiny: FormFillPoint
  passengers: Array<{ name: string; seat: string }>
}

export interface TransportFormFill {
  core: { name: string; typeTransport: string }
  booking: { provider: string; price: string; currency: string }
  passengers: Array<{ name: string }>
  segments: FormFillSegment[]
}

export interface HotelFormFill {
  core: {
    location: string
    coordinates: [number, number]
    // String, like the transport form's price: the field is a number input and
    // an empty string is what leaves it blank rather than showing a stray 0.
    price: string
    // ISO code ("EUR"), matching the `value` of the currency select options.
    currency: string
    date: { dateStart: string; dateEnd: string }
    notes: Array<{ icon: string; text: string }>
  }
}
