import { html } from 'lit'
import type { SelectFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

export class SelectFieldRenderer implements FieldRenderer<SelectFormField> {
  render(field: SelectFormField, ctx: FieldRenderContext) {
    return html`
      <e-select
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        type=${field.type}
        helpmsg=${field.helpmsg}
        .messages=${field.messages ?? {}}
        default=${field.default}
        .options=${ctx.selectOptions(field)}
        ?required=${field.required}
        ?readonly=${field.readonly}
        .value=${ctx.value(field)}
        @change=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-select>
    `
  }
}
