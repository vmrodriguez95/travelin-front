import { html } from 'lit'
import type { SearchFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

// The place id lives in a sibling field; it is read from there so the
// element shows the option currently picked, if any.
export class SearchFieldRenderer implements FieldRenderer<SearchFormField> {
  render(field: SearchFormField, ctx: FieldRenderContext) {
    return html`
      <e-input-search
        class=${ctx.classes(field)}
        id=${field.id}
        api=${field.api}
        name=${ctx.name}
        label=${field.label}
        helpmsg=${field.helpmsg}
        .messages=${field.messages ?? {}}
        ?required=${field.required}
        ?readonly=${field.readonly}
        .value=${ctx.value(field)}
        placeId=${ctx.siblingValue(field.placeIdField)}
        @change=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-input-search>
    `
  }
}
