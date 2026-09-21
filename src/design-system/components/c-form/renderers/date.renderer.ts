import { html } from 'lit'
import type { DateFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

// date, time and datetime-local.
export class DateFieldRenderer implements FieldRenderer<DateFormField> {
  render(field: DateFormField, ctx: FieldRenderContext) {
    return html`
      <e-input-date
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        helpmsg=${field.helpmsg}
        .messages=${field.messages ?? {}}
        type=${field.type}
        min=${field.min}
        max=${field.max}
        .value=${ctx.value(field)}
        ?required=${field.required}
        ?readonly=${field.readonly}
        @change=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-input-date>
    `
  }
}
