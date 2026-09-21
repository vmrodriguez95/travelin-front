import { html } from 'lit'
import type { CalendarFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

export class CalendarFieldRenderer implements FieldRenderer<CalendarFormField> {
  render(field: CalendarFormField, ctx: FieldRenderContext) {
    return html`
      <e-calendar
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        type=${field.type}
        helpmsg=${field.helpmsg}
        .messages=${field.messages ?? {}}
        start=${field.start}
        end=${field.end}
        min=${field.min || ''}
        max=${field.max || ''}
        ?required=${field.required}
        ?readonly=${field.readonly}
        .returnedValues=${field.returnedValues}
        @change=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-calendar>
    `
  }
}
