// Types
import type { VoucherExtension, VoucherPoiType } from '../types/voucher.types'

// The host states one endpoint template — "/api/{id}/{poiType}/{extension}" —
// and the reader fills it in per request: the id is `manifest` the first time
// and the vendor's organization afterwards, the poiType is the form being
// filled in, and the extension is the one of the file the user uploaded.
//
// Every part is encoded: the organization is derived from an uploaded document,
// so it may not walk out of the path it is written into.
export function buildVoucherEndpoint(
  template: string,
  params: { id: string; poiType: VoucherPoiType; extension: VoucherExtension }
): string {
  if (!template) return ''

  return template.replace(/\{(id|poiType|extension)\}/g, (_, key: keyof typeof params) => encodeURIComponent(params[key]))
}
