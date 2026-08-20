import type { APIRoute } from 'astro'
import type { PdfProfile, PdfProfileManifestEntry } from '@ds/components/c-voucher-reader/types/pdf-profile.types'

// The manifest carries only what the client needs to recognise a vendor. The
// client matches against it and then asks for that id, so the id it requests
// always comes from here and never from the uploaded document.
//
// Served at /api/pdf/manifest rather than /api/pdf: a static build writes the
// profiles into a dist/api/pdf/ directory, so that path cannot also be a file.
// The name is therefore reserved — a vendor profile may not use the id
// "manifest".
const modules = import.meta.glob('../../../data/pdf/*.json', { eager: true, import: 'default' })
const PROFILES = Object.values(modules) as PdfProfile[]

const MANIFEST: PdfProfileManifestEntry[] = PROFILES.map(({ id, match }) => ({ id, match }))

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ data: MANIFEST }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
