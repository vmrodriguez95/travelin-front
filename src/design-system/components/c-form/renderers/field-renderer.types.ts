import type { TemplateResult } from 'lit'
import type { DirectiveResult } from 'lit/directive.js'
import type { BasicFormField, FormBlock, SelectOption } from '../c-form.types'

// What a renderer may ask the form for while painting one field. It never
// reaches into the form itself, so a renderer can be added without the form
// knowing it exists.
export interface FieldRenderContext {
  // The submitted name, breadcrumbs included.
  name: string
  // The block the field sits in, for fields that read or write siblings.
  block?: FormBlock
  classes(field: BasicFormField): DirectiveResult
  value(field: BasicFormField): unknown
  siblingValue(key: string | undefined): string
  dependencyValues(field: BasicFormField): string[]
  selectOptions(field: BasicFormField & { options?: Array<SelectOption> }): Array<SelectOption>
  onChange(ev: CustomEvent, field: BasicFormField): void
}

export interface FieldRenderer<T extends BasicFormField = BasicFormField> {
  render(field: T, ctx: FieldRenderContext): TemplateResult
}
