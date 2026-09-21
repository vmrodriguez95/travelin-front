import type { BasicFormField, CalendarFormField, FormArraySection, FormBlock } from '@ds/components/c-form/c-form.types'
import { isRenderableEntry, isArraySection, isSubSection, setFieldValue, type FormEntry } from './form-schema.utils'

// A fresh repeater block from the section's schema, with the id `repeat`
// keys it by.
export function createBlock(section: FormArraySection): FormBlock {
  const block = window.structuredClone(section.schema)

  block.randomId = crypto.randomUUID()

  return block
}

// Flat update: fields are matched by `name` wherever they live.
export function applyFieldUpdates(entry: FormEntry, updates: Record<string, string>) {
  if (isArraySection(entry)) {
    entry.fields?.forEach((block) => applyBlockUpdates(block, updates))
    return
  }

  if (isSubSection(entry)) {
    applyBlockUpdates(entry.fields, updates)
    return
  }

  if (entry.name in updates) {
    setFieldValue(entry, updates[entry.name])
  }
}

export function applyBlockUpdates(block: FormBlock, updates: Record<string, string>) {
  Object.entries(block).forEach(([key, entry]) => {
    if (key === 'randomId' || !isRenderableEntry(entry)) return

    applyFieldUpdates(entry, updates)
  })
}

// Structured fill: the payload mirrors the schema (section keys + field
// names), so repeater arrays (segments, passengers) are rebuilt block by block.
export function fillEntry(entry: FormEntry, value: unknown) {
  if (value == null) return

  if (isArraySection(entry)) {
    const items = Array.isArray(value) ? value : []

    entry.fields = items.map((item) => {
      const block = createBlock(entry)
      fillBlock(block, item as Record<string, unknown>)
      return block
    })
    return
  }

  if (isSubSection(entry)) {
    fillBlock(entry.fields, value as Record<string, unknown>)
    return
  }

  setFilledValue(entry, value)
}

export function fillBlock(block: FormBlock, values: Record<string, unknown>) {
  if (!values || typeof values !== 'object') return

  Object.entries(block).forEach(([key, entry]) => {
    if (key === 'randomId' || !isRenderableEntry(entry) || !(key in values)) return

    fillEntry(entry, values[key])
  })
}

export function setFilledValue(field: BasicFormField, value: unknown) {
  // A calendar is filled with a structured range ({ dateStart, dateEnd }), but
  // e-calendar paints and submits from its own `start`/`end`, so the range has
  // to be mapped onto those. The keys come from the field's own
  // `returnedValues`, which is the same contract e-calendar submits under.
  if (field.type === 'calendar') {
    const calendar = field as CalendarFormField
    const [startKey, endKey] = calendar.returnedValues ?? []
    const range = (value ?? {}) as Record<string, string>

    // Drafts carry full ISO datetimes; the calendar matches days as
    // "YYYY-MM-DD", so an unsliced value would never match a rendered day.
    calendar.start = (range[startKey] ?? '').slice(0, 10)
    calendar.end = (range[endKey] ?? '').slice(0, 10)
    calendar.value = calendar.start
    calendar.fillValue = calendar.start
    return
  }

  // Array values (e.g. coordinates) are carried as-is; hidden fields serialize them to JSON.
  if (Array.isArray(value)) {
    field.fillValue = value as unknown as Array<string>
    return
  }

  const stringValue = value == null ? '' : String(value)

  switch (field.type) {
    // A search field needs no special case: it submits its own text, so a
    // voucher fills it exactly like any other field and the user only reviews
    // it. Its sibling `placeId` stays empty until the user picks an option,
    // which is what tells the backend to resolve the place by text instead.
    case 'date':
    case 'time':
    case 'datetime-local':
      setFieldValue(field, stringValue.slice(0, 16))
      break
    default:
      setFieldValue(field, stringValue)
  }
}

// Whether a repeater block holds anything the user typed or that was filled
// in, at any depth.
export function blockHasAnyValue(block: FormBlock): boolean {
  return Object.entries(block).some(([key, entry]) => {
    if (key === 'randomId' || !isRenderableEntry(entry)) return false

    if (isArraySection(entry)) {
      return Array.isArray(entry.fields) && entry.fields.length > 0
    }

    if (isSubSection(entry)) {
      return blockHasFieldValues(entry.fields)
    }

    return fieldHasValue(entry)
  })
}

function fieldHasValue(field: BasicFormField) {
  return ('value' in field && field.value !== '') || Boolean(field.fillValue)
}

function blockHasFieldValues(block: FormBlock) {
  return Object.values(block).some((entry) => isRenderableEntry(entry) && fieldHasValue(entry as BasicFormField))
}
