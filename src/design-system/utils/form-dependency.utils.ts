import type { BasicFormField, FormSchema, SelectOption } from '@ds/components/c-form/c-form.types'
import { getFieldValue } from './form-schema.utils'

// Walks a dependency path ("segments.origin.location") through the schema
// and gathers every non-empty value found; repeater blocks contribute one
// value each.
export function collectDependencyValues(node: unknown, pathParts: Array<string>): string[] {
  if (!node) return []

  if (pathParts.length === 0) {
    if (typeof node === 'string') {
      return node ? [node] : []
    }

    if (typeof node === 'object' && 'value' in node) {
      const value = getFieldValue(node as BasicFormField)

      return typeof value === 'string' && value ? [value] : []
    }

    return []
  }

  const [currentPart, ...rest] = pathParts

  if (Array.isArray(node)) {
    return node.flatMap((item) => collectDependencyValues(item, pathParts))
  }

  if (typeof node !== 'object') {
    return []
  }

  const record = node as Record<string, unknown>

  if (currentPart in record) {
    return collectDependencyValues(record[currentPart], rest)
  }

  if ('fields' in record) {
    return collectDependencyValues(record.fields, pathParts)
  }

  return []
}

export function normalizeSelectOption(value: string): SelectOption {
  return { value, label: value }
}

export function dedupeSelectOptions(options: Array<SelectOption>) {
  const seen = new Set<string>()

  return options.filter((option) => {
    const key = `${String(option.value)}::${option.label}`

    if (!String(option.value) || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

// Resolves `dependsOn` paths against one schema. Built once per render: the
// same path asked by several fields walks the schema only the first time.
export class FormDependencyResolver {

  private _sections: FormSchema['sections']

  private _cache = new Map<string, string[]>()

  constructor(sections: FormSchema['sections']) {
    this._sections = sections
  }

  valuesFor(field: BasicFormField): string[] {
    const dependsOn = field.dependsOn || []

    if (!dependsOn.length) return []

    return dependsOn.flatMap((path) => this._valuesAt(path))
  }

  optionsFor(field: BasicFormField): Array<SelectOption> {
    return dedupeSelectOptions(this.valuesFor(field).map(normalizeSelectOption))
  }

  // Declared options first, then the ones read from the dependencies. The
  // field itself is left untouched: options are derived, never stored.
  selectOptionsFor(field: BasicFormField & { options?: Array<SelectOption> }): Array<SelectOption> {
    return dedupeSelectOptions([...(field.options || []), ...this.optionsFor(field)])
  }

  private _valuesAt(path: string): string[] {
    let values = this._cache.get(path)

    if (!values) {
      values = collectDependencyValues(this._sections, path.split('.'))
      this._cache.set(path, values)
    }

    return values
  }
}
