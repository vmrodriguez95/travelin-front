import type { APIRoute, GetStaticPaths } from 'astro'
import type { PdfProfile } from '@ds/components/c-voucher-reader/types/pdf-profile.types'

// Mock backend: owns the PDF vendor profiles, one static file per business at
// /api/pdf/<id>. In production the real Travelin backend replaces this, and is
// where the AI-generated profiles land after review.
const modules = import.meta.glob('../../../data/pdf/*.json', { eager: true, import: 'default' })
const PROFILES = Object.values(modules) as PdfProfile[]

export const getStaticPaths: GetStaticPaths = () =>
  PROFILES.map((profile) => ({ params: { id: profile.id }, props: { profile } }))

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify({ data: (props as { profile: PdfProfile }).profile }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
