import type { BasicFormField, FormArraySection, FormBlock, FormSchema, FormSection } from '@ds/components/c-form/c-form.types'

export type FormEntry = BasicFormField | FormSection | FormArraySection

// A block maps keys to entries, plus the `randomId` string a repeater block
// carries; only the objects are entries the form can render or fill.
export function isRenderableEntry(value: FormBlock[string]): value is FormEntry {
  return typeof value === 'object' && value !== null
}

export function isArraySection(entry: FormEntry): entry is FormArraySection {
  return 'schema' in entry
}

export function isSubSection(entry: FormEntry): entry is FormSection {
  return 'fields' in entry && !Array.isArray(entry.fields)
}

export function isBasicField(entry: FormEntry): entry is BasicFormField {
  return !isArraySection(entry) && !isSubSection(entry)
}

export function getFieldValue(field: BasicFormField) {
  return field.value ?? field.fillValue ?? ''
}

export function setFieldValue(field: BasicFormField, value: string) {
  field.value = value
  field.fillValue = value
}

// The submitted name of a field nested in sections: "trip[segments][0][origin]".
// A breadcrumb that already ends with the name is kept as it is.
export function joinBreadcrumbsWithName(name: string, breadcrumbs: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`\\[?${escaped}\\]?$`)

  if (breadcrumbs && !regex.test(breadcrumbs)) {
    return `${breadcrumbs}[${name}]`
  }

  if (breadcrumbs && regex.test(breadcrumbs)) {
    return breadcrumbs
  }

  return name
}

// A plain field living next to another one in the same block, by key.
export function getSiblingField(block: FormBlock | undefined, key: string | undefined): BasicFormField | undefined {
  if (!block || !key) return undefined

  const sibling = block[key]

  if (!isRenderableEntry(sibling) || !isBasicField(sibling)) return undefined

  return sibling
}

export function getSiblingValue(block: FormBlock | undefined, key: string | undefined): string {
  const sibling = getSiblingField(block, key)

  return sibling ? String(getFieldValue(sibling) ?? '') : ''
}

export function setSiblingValue(block: FormBlock | undefined, key: string | undefined, value: string) {
  const sibling = getSiblingField(block, key)

  if (sibling) setFieldValue(sibling, value)
}

// Finds a field by its `name` anywhere in a schema: sections, subsections
// and repeater schemas alike. Returns the first match.
export function findFormField(schema: FormSchema, name: string): BasicFormField | undefined {
  for (const section of Object.values(schema.sections)) {
    const field = findInEntry(section, name)

    if (field) return field
  }

  return undefined
}

function findInEntry(entry: FormEntry, name: string): BasicFormField | undefined {
  if (isArraySection(entry)) {
    return findInBlock(entry.schema, name)
  }

  if (isSubSection(entry)) {
    return findInBlock(entry.fields, name)
  }

  return entry.name === name ? entry : undefined
}

function findInBlock(block: FormBlock, name: string): BasicFormField | undefined {
  for (const [key, entry] of Object.entries(block)) {
    if (key === 'randomId' || !isRenderableEntry(entry)) continue

    const field = findInEntry(entry, name)

    if (field) return field
  }

  return undefined
}
