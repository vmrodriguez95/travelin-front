import type { APIRoute } from "astro"

// NOTE: this is a static (prerendered) endpoint, so it cannot read the
// submitted body at runtime. It answers what a real save would: the POI
// saved and every collection it now belongs to, each with the id the
// server gave it — including the ones created in this same request. Saves
// are keyed by the POI `location` (the place), so that is what it echoes.
// It must not carry an `id` matching a POI, since the cards remove
// themselves when a fetch answers with their own id.
const DATA = {
  location: "mock-place-ele-hotel-higashi-ueno",
  collections: [
    { id: "col-wishlist", name: "Quiero ir", icon: "location" },
    { id: "col-japan", name: "Japón", icon: "temple-buddhist" }
  ]
}

const respond = () => new Response(JSON.stringify({ data: DATA }), {
  headers: { "Content-Type": "application/json; charset=utf-8" },
})

// GET only exists so the static build can prerender the file.
export const GET: APIRoute = respond

export const POST: APIRoute = respond
