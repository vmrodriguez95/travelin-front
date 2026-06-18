export const meta = {
  name: 'Voucher Reader',
  icon: 'voucher',
  tag: 'c-voucher-reader',
  description: 'Vista del lector de vales.'
}

export { config } from './c-voucher-reader.config'
export { default as Demo } from './c-voucher-reader.demo.astro'
export { VOUCHER_READER_DATA_EVENT, parseTransportVoucherPdf, type VoucherTransportData } from './c-voucher-reader.parser'
