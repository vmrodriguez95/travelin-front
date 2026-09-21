import { html } from 'lit'
import type { FileFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

export class FileFieldRenderer implements FieldRenderer<FileFormField> {
  render(field: FileFormField, ctx: FieldRenderContext) {
    return html`
      <e-input-file
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        type=${field.type}
        helpmsg=${field.helpmsg}
        .messages=${field.messages ?? {}}
        ?required=${field.required}
        ?readonly=${field.readonly}
        value=${field.fillValue}
        extensions=${field.file.extensions}
        size=${field.file.maxSize}
        ?multiple=${field.file.multiple}
        .a11y=${field.a11y ?? {}}
        @change=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-input-file>
    `
  }
}
