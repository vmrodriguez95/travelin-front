// Types
import type { HotelVoucherDraft, TransportSegmentPointDraft, TransportVoucherDraft } from '../types/voucher.types'
import type { FormFillPoint, HotelFormFill, TransportFormFill } from '../types/voucher-form.types'

// A point's `code` is only an IATA code when the journey is a flight: a train
// or a ferry numbers its stations by its own scheme, and passing that on as
// IATA would put a plausible wrong code in a hidden field nobody reviews.
function pointToFormFill(point: TransportSegmentPointDraft, isFlight: boolean): FormFillPoint {
  return {
    location: point.name || point.code,
    platform: point.platform,
    date: point.date,
    coordinates: point.coordinates,
    iata: isFlight ? point.code : ''
  }
}

// Maps a parsed transport draft to the poi_transport form's section/field shape.
export function transportDraftToFormFill(draft: TransportVoucherDraft): TransportFormFill {
  const isFlight = draft.typeTransport === 'flight'

  return {
    core: {
      name: draft.name,
      typeTransport: draft.typeTransport
    },
    booking: {
      provider: draft.booking.provider,
      price: draft.booking.price ? String(draft.booking.price) : '',
      currency: draft.booking.currency
    },
    passengers: draft.passengers.map((passenger) => ({ name: passenger.name })),
    segments: draft.segments.map((segment) => ({
      operator: segment.operator,
      duration: segment.duration,
      transportNumber: segment.transportNumber,
      class: segment.class,
      origin: pointToFormFill(segment.origin, isFlight),
      destiny: pointToFormFill(segment.destiny, isFlight),
      passengers: segment.passengers.map((passenger) => ({ name: passenger.name, seat: passenger.seat }))
    }))
  }
}

// Maps a parsed hotel draft to the poi_hotel form's section/field shape.
export function hotelDraftToFormFill(draft: HotelVoucherDraft): HotelFormFill {
  return {
    core: {
      location: draft.name,
      coordinates: draft.coordinates,
      price: draft.price ? String(draft.price) : '',
      currency: draft.currency,
      date: { dateStart: draft.dateStart, dateEnd: draft.dateEnd },
      notes: draft.notes.map((note) => ({ icon: note.icon, text: note.text }))
    }
  }
}
