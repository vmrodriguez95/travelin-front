import { html } from 'lit'
import type { BasicFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

// text, email, password and number. A password compares against the first
// value of its dependencies (the field it must repeat).
export class TextFieldRenderer implements FieldRenderer {
  render(field: BasicFormField, ctx: FieldRenderContext) {
    const compareValue = field.type === 'password' ? ctx.dependencyValues(field)[0] || '' : ''

    return html`
      <e-input
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        type=${field.type}
        helpmsg=${field.helpmsg}
        .a11y=${field.a11y ?? {}}
        .messages=${field.messages ?? {}}
        .minlength=${field.minLength || 0}
        .maxlength=${field.maxLength || 255}
        ?required=${field.required}
        ?readonly=${field.readonly}
        .value=${ctx.value(field)}
        compareValue=${compareValue}
        placeholder=${field.placeholder}
        @input=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-input>
    `
  }
}
