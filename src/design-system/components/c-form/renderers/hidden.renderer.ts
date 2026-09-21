import { html } from 'lit'
import type { BasicFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

export class HiddenFieldRenderer implements FieldRenderer {
  render(field: BasicFormField, ctx: FieldRenderContext) {
    return html`
      <input type="hidden" name=${ctx.name} value=${Array.isArray(field.fillValue) ? JSON.stringify(field.fillValue) : field.fillValue} />
    `
  }
}
