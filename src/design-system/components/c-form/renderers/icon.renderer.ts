import { html } from 'lit'
import type { BasicFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

export class IconFieldRenderer implements FieldRenderer {
  render(field: BasicFormField, ctx: FieldRenderContext) {
    return html`
      <e-input-icon
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        helpmsg=${field.helpmsg}
        .messages=${field.messages ?? {}}
        .value=${ctx.value(field)}
        .a11y=${field.a11y ?? {}}
        ?required=${field.required}
        ?readonly=${field.readonly}
        @change=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-input-icon>
    `
  }
}
