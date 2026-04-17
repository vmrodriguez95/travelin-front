import type { APIRoute } from "astro"

const DATA = [
  {
    "id": "177278946269aa9ed6b396d",
    "idUser": "177263595469a847322fb6d",
    "idTrip": "177272350469a99d30551f1",
    "idItinerary": "177272350569a99d317d3fe",
    "coordenates": [139.69171, 35.6895],
    "name": "Paseo con kimono",
    "time": "12:00",
    "price": 0,
    "image": "https://loremflickr.com/72/72/thailand",
    "notes": [],
    "types": ["poi"],
    "file": "",
    "order": 0,
    "createdAt": {
      "$date": "2026-03-06T09:31:02.739"
    },
    "updatedAt": {
      "$date": "2026-03-06T09:31:02.739"
    }
  }
]

export const DELETE: APIRoute = ({ url }) => {
  // const q = (url.searchParams.get("query") ?? "").toLowerCase().trim();
  // const results = q.length < 2 ? [] : DATA

  return new Response(JSON.stringify({ data: DATA[0] }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
};