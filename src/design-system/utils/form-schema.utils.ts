import type { BasicFormField, FormArraySection, FormBlock, FormSchema, FormSection } from '@ds/components/c-form/c-form.types'

// Finds a field by its `name` anywhere in a schema: sections, subsections
// and repeater schemas alike. Returns the first match.
export function findFormField(schema: FormSchema, name: string): BasicFormField | undefined {
  for (const section of Object.values(schema.sections)) {
    const field = findInEntry(section, name)

    if (field) return field
  }

  return undefined
}

function findInEntry(entry: BasicFormField | FormSection | FormArraySection, name: string): BasicFormField | undefined {
  if ('schema' in entry) {
    return findInBlock(entry.schema, name)
  }

  if ('fields' in entry && !Array.isArray(entry.fields)) {
    return findInBlock(entry.fields, name)
  }

  const field = entry as BasicFormField

  return field.name === name ? field : undefined
}

function findInBlock(block: FormBlock, name: string): BasicFormField | undefined {
  for (const [key, entry] of Object.entries(block)) {
    if (key === 'randomId' || !entry || typeof entry !== 'object') continue

    const field = findInEntry(entry as BasicFormField | FormSection | FormArraySection, name)

    if (field) return field
  }

  return undefined
}
