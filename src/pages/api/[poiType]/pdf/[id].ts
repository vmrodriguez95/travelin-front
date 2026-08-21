import type { APIRoute, GetStaticPaths } from 'astro'
import type { PdfProfile } from '@ds/components/c-voucher-reader/types/pdf-profile.types'

// Mock backend: owns the PDF vendor profiles, one static file per business at
// /api/<poiType>/pdf/<id>, mirroring src/data/pdf/<poiType>/<id>.json. In production the real Travelin backend replaces
// this, and is where the AI-generated profiles land after review.
//
// The poiType segment scopes the catalogue: a vendor that sells both stays and
// transport (Booking, for one) has one profile per type, and the reader only
// ever sees the ones matching the form the user is filling in.
const modules = import.meta.glob('../../../../data/pdf/*/*.json', { eager: true, import: 'default' })
const PROFILES = Object.values(modules) as PdfProfile[]

export const getStaticPaths: GetStaticPaths = () =>
  PROFILES.map((profile) => ({ params: { poiType: profile.poiType, id: profile.id }, props: { profile } }))

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify({ data: (props as { profile: PdfProfile }).profile }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
