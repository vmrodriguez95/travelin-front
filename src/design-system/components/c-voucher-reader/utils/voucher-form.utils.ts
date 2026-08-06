// Types
import type { HotelVoucherDraft, TransportSegmentPointDraft, TransportVoucherDraft } from '../types/voucher.types'
import type { FormFillPoint, HotelFormFill, TransportFormFill } from '../types/voucher-form.types'

function pointToFormFill(point: TransportSegmentPointDraft): FormFillPoint {
  return {
    location: point.name || point.code,
    platform: point.platform,
    date: point.date,
    coordinates: point.coordinates
  }
}

// Maps a parsed transport draft to the poi_transport form's section/field shape.
export function transportDraftToFormFill(draft: TransportVoucherDraft): TransportFormFill {
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
      origin: pointToFormFill(segment.origin),
      destiny: pointToFormFill(segment.destiny),
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
      date: { dateStart: draft.dateStart, dateEnd: draft.dateEnd },
      notes: draft.notes.map((note) => ({ icon: note.icon, text: note.text }))
    }
  }
}
