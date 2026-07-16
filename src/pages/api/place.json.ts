import type { APIRoute } from "astro"

const DATA = {
  "id": "ChIJSyhE1-bPEQ0Rgw-0EMGqK9g",
  "location": {
    "latitude": 13.0389969,
    "longitude": 101.490104
  },
  "types": ["point_of_interest", "establishment"],
  "photos": [
    {
      "name": "",
      "widthPx": 4032,
      "heightPx": 3024,
      "authorAttribution": [{
        "displayName": "Javier",
        "uri": "",
        "photoUri": "/images/asakusa.webp",
      }],
      "flagContentUri": "",
      "googleMapsUri": "",
    }
  ],
  "displayName": {
    "text": "Parque del Alamillo",
    "languajeCode": "es"
  },
  "addressComponents": [
    {
      "longText": "Parque del Alamillo",
      "shortText": "Parque del Alamillo",
      "types": ["point_of_interest", "establishment"],
      "languageCode": "es"
    }
  ]
}


export const GET: APIRoute = ({ url }) => {
  return new Response(JSON.stringify({ data: DATA }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
};