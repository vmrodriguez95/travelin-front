import { html } from 'lit'
import type { BasicFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

export class TextareaFieldRenderer implements FieldRenderer {
  render(field: BasicFormField, ctx: FieldRenderContext) {
    return html`
      <e-textarea
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        helpmsg=${field.helpmsg}
        .messages=${field.messages ?? {}}
        ?autofocus=${field.autofocus}
        ?required=${field.required}
        ?readonly=${field.readonly}
        value=${ctx.value(field)}
        @input=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-textarea>
    `
  }
}
