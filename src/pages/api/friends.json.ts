import type { APIRoute } from "astro"

// NOTE: this is a static (prerendered) endpoint, so it can't read query/filter
// params at runtime. It returns the full dataset and c-filter applies the
// search + filter client-side. Each item carries a `type` matching the filter
// values (invitations / travel / alerts) so the chips can filter by it.
const DATA = [
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Daniel Fernández",
    "date": "10-10-2023",
    "lastTravel": "Costa Rica · 2024",
    "status": "Activo",
    "type": "travel"
  },
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Lucía Gómez",
    "date": "02-05-2024",
    "lastTravel": "Japón · 2025",
    "status": "Pendiente",
    "type": "invitations"
  },
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Marcos Ruiz",
    "date": "18-11-2023",
    "lastTravel": "Islandia · 2024",
    "status": "Activo",
    "type": "travel"
  },
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Elena Torres",
    "date": "27-01-2024",
    "lastTravel": "Marruecos · 2023",
    "status": "Pendiente",
    "type": "invitations"
  },
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Javier Molina",
    "date": "09-09-2023",
    "lastTravel": "Perú · 2025",
    "status": "Activo",
    "type": "alerts"
  },
  {
    "image": "https://testingbot.com/free-online-tools/random-avatar/40",
    "name": "Sara Navarro",
    "date": "14-03-2024",
    "lastTravel": "Tailandia · 2024",
    "status": "Activo",
    "type": "travel"
  }
]

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ data: DATA }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
}
