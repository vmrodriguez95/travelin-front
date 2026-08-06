import type { APIRoute, GetStaticPaths } from 'astro'
import type { VendorProfile } from '@ds/components/c-voucher-reader/types/pkpass.types'

// Mock backend: owns the vendor profiles, one static file per business at
// /api/pkpass/<id>. In production the real Travelin backend replaces this.
const modules = import.meta.glob('../../../data/pkpass/*.json', { eager: true, import: 'default' })
const PROFILES = Object.values(modules) as VendorProfile[]

export const getStaticPaths: GetStaticPaths = () =>
  PROFILES.map((profile) => ({ params: { id: profile.id }, props: { profile } }))

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify({ data: (props as { profile: VendorProfile }).profile }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
