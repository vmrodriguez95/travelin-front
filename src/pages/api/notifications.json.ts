import type { APIRoute } from "astro"

// NOTE: this is a static (prerendered) endpoint, so it can't read query/filter
// params at runtime. It returns the full dataset and c-filter applies the
// search + filter client-side. Each item carries a `type` matching the filter
// values (invitations / travel / alerts) so the chips can filter by it.
const DATA = [
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Daniel Fernández",
    "text": "Has sido invitado a unirte al viaje <strong>West Coast</strong> como <strong>Editor</strong>.",
    "date": "10-10-2023",
    "confirm": true,
    "type": "invitations"
  },
  {
    "logo": "/images/logo.png",
    "name": "Equipo de Travel In",
    "text": "Te quedan <strong>3 días</strong> para tu viaje a <strong>Japón</strong>.",
    "date": "10-10-2023",
    "confirm": false,
    "type": "travel"
  },
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Daniel Fernández",
    "text": "Te ha enviado una petición de amistad.",
    "date": "10-10-2023",
    "confirm": true,
    "type": "invitations"
  },
  {
    "logo": "/images/logo.png",
    "name": "Equipo de Travel In",
    "text": "Has conseguido el logro <strong>Beach Lover</strong>.",
    "date": "10-10-2023",
    "confirm": false,
    "type": "alerts"
  },
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Daniel Fernández",
    "text": "Ha añadido un POI nuevo al viaje <strong>West Coast</strong>.",
    "date": "10-10-2023",
    "confirm": true,
    "type": "travel"
  },
  {
    "logo": "/images/logo.png",
    "name": "Equipo de Travel In",
    "text": "Te has dado de alta en Travel In.",
    "date": "10-10-2023",
    "confirm": false,
    "type": "alerts"
  }
]

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ data: DATA }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
}
