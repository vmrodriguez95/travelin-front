import type { APIRoute } from "astro"

const DATA = [
  {
    "value": "ChIJSyhE1-bPEQ0Rgw-0EMGqK9g",
    "label": "Huelva",
    "helptext": "Huelva · Andalusia · Spain"
  }
]

export const GET: APIRoute = ({ url }) => {
  return new Response(JSON.stringify({ data: DATA }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
};