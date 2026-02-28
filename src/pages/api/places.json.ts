import type { APIRoute } from "astro"

const DATA = [
  {
    "value": "ChIJSyhE1-bPEQ0Rgw-0EMGqK9g",
    "label": "Huelva",
    "helptext": "Huelva · Andalusia · Spain"
  },
  {
    "value": "ChIJSyhE1-bPEQ0Rgw-0EMGqK9g",
    "label": "Córdoba",
    "helptext": "Córdoba · Andalusia · Spain"
  },
  {
    "value": "ChIJSyhE1-bPEQ0Rgw-0EMGqK9g",
    "label": "Cádiz",
    "helptext": "Cádiz · Andalusia · Spain"
  },
  {
    "value": "ChIJSyhE1-bPEQ0Rgw-0EMGqK9g",
    "label": "Dolomitas",
    "helptext": "Dolomitas · Italia"
  }
]

export const GET: APIRoute = ({ url }) => {
  // const q = (url.searchParams.get("query") ?? "").toLowerCase().trim();
  // const results = q.length < 2 ? [] : DATA

  return new Response(JSON.stringify({ data: DATA }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
};