import type { APIRoute, GetStaticPaths } from 'astro'
import type { PdfProfile, PdfProfileManifestEntry } from '@ds/components/c-voucher-reader/types/pdf-profile.types'
import type { VoucherPoiType } from '@ds/components/c-voucher-reader/types/voucher.types'

// The manifest carries only what the client needs to recognise a vendor. The
// client matches against it and then asks for that id, so the id it requests
// always comes from here and never from the uploaded document.
//
// One manifest per poiType, so two profiles of the same brand — a hotel one and
// a transport one, both fingerprinted on "booking.com" — can never be confused
// with each other: the reader only downloads the catalogue for the form it is
// filling in.
//
// Served at /api/<poiType>/pdf/manifest, alongside the profiles: a static build
// writes them into the same directory, so the name is reserved and a vendor
// profile may not use the id "manifest".
const modules = import.meta.glob('../../../../data/pdf/*/*.json', { eager: true, import: 'default' })
const PROFILES = Object.values(modules) as PdfProfile[]

const POI_TYPES: VoucherPoiType[] = ['poi_hotel', 'poi_transport']

export const getStaticPaths: GetStaticPaths = () =>
  POI_TYPES.map((poiType) => ({
    params: { poiType },
    props: {
      manifest: PROFILES
        .filter((profile) => profile.poiType === poiType)
        .map(({ id, match }): PdfProfileManifestEntry => ({ id, match }))
    }
  }))

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify({ data: (props as { manifest: PdfProfileManifestEntry[] }).manifest }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
