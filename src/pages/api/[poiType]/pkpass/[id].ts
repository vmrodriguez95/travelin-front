import type { APIRoute, GetStaticPaths } from 'astro'
import type { VendorProfile } from '@ds/components/c-voucher-reader/types/pkpass.types'

// Mock backend: owns the .pkpass vendor profiles, one static file per business
// at /api/<poiType>/pkpass/<id>, mirroring src/data/pkpass/<poiType>/<id>.json.
// In production the real Travelin backend replaces this.
//
// Unlike a PDF profile, a pass profile carries no poiType of its own, so the
// folder is what classifies it: adding hotel passes later is a new folder, not
// a change to this route.
const modules = import.meta.glob('../../../../data/pkpass/*/*.json', { eager: true, import: 'default' })

const PROFILES = Object.entries(modules).map(([path, profile]) => ({
  poiType: path.split('/').at(-2) as string,
  profile: profile as VendorProfile
}))

export const getStaticPaths: GetStaticPaths = () =>
  PROFILES.map(({ poiType, profile }) => ({ params: { poiType, id: profile.id }, props: { profile } }))

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify({ data: (props as { profile: VendorProfile }).profile }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
