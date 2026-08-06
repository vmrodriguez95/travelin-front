import type { VoucherDraft, VoucherPoiType } from '../types/voucher.types'

const HOTEL_SCHEMA = `{
  "coordinates": [longitude, latitude],
  "name": "Hotel name",
  "type": "poi_hotel",
  "icon": "hotel",
  "types": ["hotel"],
  "address": "Full address",
  "dateStart": "YYYY-MM-DDTHH:mm:ss.SSS",
  "dateEnd": "YYYY-MM-DDTHH:mm:ss.SSS",
  "image": "",
  "notes": [{ "icon": "restaurant|star|bed|wifi|check-in-out", "text": "..." }]
}`

const TRANSPORT_SCHEMA = `{
  "type": "poi_transport",
  "typeTransport": "flight|cruise|ferry|train|bus|car",
  "booking": { "provider": "", "price": 0, "currency": "" },
  "passengers": [{ "name": "..." }],
  "segments": [{
    "duration": "", "operator": "", "transportNumber": "", "class": "",
    "origin": { "code": "", "name": "", "address": "", "coordinates": [longitude, latitude], "platform": "", "date": "YYYY-MM-DDTHH:mm:ss.SSS" },
    "destiny": { "code": "", "name": "", "address": "", "coordinates": [longitude, latitude], "platform": "", "date": "YYYY-MM-DDTHH:mm:ss.SSS" },
    "passengers": [{ "name": "", "seat": "" }]
  }],
  "name": "Auto-generated from typeTransport + origin.name - destiny.name",
}`

// Builds the instruction sent to the local LLM to turn raw PDF text into a voucher draft.
export function buildVoucherPrompt(poiType: VoucherPoiType, pdfText: string): string {
  const schema = poiType === 'poi_hotel' ? HOTEL_SCHEMA : TRANSPORT_SCHEMA

  return [
    'You extract structured travel booking data from raw text.',
    'Return ONLY a valid JSON object, no markdown, no code fences, no explanation.',
    'Match this exact schema and key order:',
    schema,
    'Rules:',
    '- Use ISO wall-clock dates "YYYY-MM-DDTHH:mm:ss.SSS".',
    '- coordinates are [longitude, latitude] numbers; use [0, 0] if unknown.',
    '- Unknown string fields must be "", unknown arrays must be [], unknown numbers must be 0.',
    '- Never invent data that is not present in the text.',
    '',
    'Booking text:',
    pdfText
  ].join('\n')
}

// Parses the model output into a voucher draft, tolerating code fences and surrounding prose.
export function parseVoucherJson(raw: string, poiType: VoucherPoiType): VoucherDraft {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('La IA no devolvió un JSON válido')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    throw new Error('No se pudo interpretar la respuesta de la IA')
  }

  const draft = parsed as Partial<VoucherDraft>
  if (draft.type !== poiType) {
    throw new Error(`La IA devolvió un tipo inesperado: ${String(draft.type)}`)
  }

  return draft as VoucherDraft
}
