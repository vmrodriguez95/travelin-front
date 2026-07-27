import type { VoucherDraft, VoucherPoiType } from '@ds/types/voucher.types'

export type VoucherReaderStatus = 'idle' | 'reading' | 'success' | 'error'

export interface VoucherParsedEventDetail {
  poiType: VoucherPoiType
  data: VoucherDraft
  source?: EventTarget | null
}

export const VOUCHER_PARSED_EVENT = 'voucher:parsed'
