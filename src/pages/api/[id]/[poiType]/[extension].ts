import type { APIRoute, GetStaticPaths } from 'astro'
import type { PdfProfile } from '@ds/components/c-voucher-reader/types/pdf-profile.types'
import type { VendorProfile } from '@ds/components/c-voucher-reader/types/pkpass.types'

// Mock backend: owns the vendor profiles, one static file per business at
// /api/<id>/<poiType>/<extension>, mirroring src/data/<extension>/<poiType>/<id>.json.
// In production the real Travelin backend replaces this, and is where the
// AI-generated profiles land after review.
//
// PDF and pkpass profiles share one envelope — id, match, poiType, extension,
// mapper — so one route serves both catalogues and the reader only has to fill
// in the three parts of its endpoint template.
const modules = import.meta.glob([
  '../../../../data/pdf/*/*.json',
  '../../../../data/pkpass/*/*.json'
], { eager: true, import: 'default' })

const PROFILES = Object.values(modules) as Array<PdfProfile | VendorProfile>

// A catalogue is one poiType read out of one file type. Scoping it both ways is
// what keeps two profiles of the same brand apart: Booking sells stays and
// flights, and both are fingerprinted on "booking.com", but the reader only
// ever sees the catalogue for the form it is filling in and the file it was
// handed.
const CATALOGUES = PROFILES
  .map(({ poiType, extension }) => ({ poiType, extension }))
  .filter((catalogue, index, all) =>
    all.findIndex((other) => other.poiType === catalogue.poiType && other.extension === catalogue.extension) === index)

// The id "manifest" is reserved: it answers with the fingerprints of a whole
// catalogue, which is how the reader recognises a vendor before asking for it
// by id. The id it then requests always comes from here and never from the
// uploaded document, so a crafted voucher cannot steer which profile is
// fetched — and no vendor profile may use "manifest" as its own id.
export const getStaticPaths: GetStaticPaths = () => [
  ...PROFILES.map((profile) => ({
    params: { id: profile.id, poiType: profile.poiType, extension: profile.extension },
    props: { data: profile }
  })),
  ...CATALOGUES.map(({ poiType, extension }) => ({
    params: { id: 'manifest', poiType, extension },
    props: {
      data: PROFILES
        .filter((profile) => profile.poiType === poiType && profile.extension === extension)
        .map(({ id, match }) => ({ id, match }))
    }
  }))
]

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify({ data: (props as { data: unknown }).data }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
