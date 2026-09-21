import { html } from 'lit'
import type { CheckboxGroupFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

export class CheckboxGroupFieldRenderer implements FieldRenderer<CheckboxGroupFormField> {
  render(field: CheckboxGroupFormField, ctx: FieldRenderContext) {
    const checkedValues = ctx.value(field)

    return html`
      <e-checkbox-group
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        helpmsg=${field.helpmsg}
        .messages=${field.messages ?? {}}
        .options=${field.options ?? []}
        .value=${Array.isArray(checkedValues) ? checkedValues : []}
        .a11y=${field.a11y ?? {}}
        ?canAdd=${field.canAdd}
        addLabel=${field.addLabel ?? ''}
        nameLabel=${field.nameLabel ?? ''}
        namePlaceholder=${field.namePlaceholder ?? ''}
        ?required=${field.required}
        ?readonly=${field.readonly}
        @change=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-checkbox-group>
    `
  }
}
