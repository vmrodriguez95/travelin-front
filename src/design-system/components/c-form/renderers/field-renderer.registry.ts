import type { BasicFormField } from '../c-form.types'
import type { FieldRenderer } from './field-renderer.types'

// Field type → renderer. The form only asks here; a new field type is a new
// renderer registered from `renderers/index.ts`, not a new case in the form.
export class FieldRendererRegistry {

  private static _renderers = new Map<string, FieldRenderer<any>>()

  static register<T extends BasicFormField>(types: string | Array<string>, renderer: FieldRenderer<T>) {
    const list = Array.isArray(types) ? types : [types]

    list.forEach((type) => this._renderers.set(type, renderer))
  }

  static get(type: string): FieldRenderer | undefined {
    return this._renderers.get(type)
  }
}
