import { html } from 'lit'
import type { BasicFormField } from '../c-form.types'
import type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

// The photo the profile already has arrives as a URL in `fillValue`. Once the
// user picks another one the value is a File, which is not something to show
// as an image source.
export class PhotoFieldRenderer implements FieldRenderer {
  render(field: BasicFormField, ctx: FieldRenderContext) {
    const src = typeof field.fillValue === 'string' ? field.fillValue : ''

    return html`
      <e-input-photo
        class=${ctx.classes(field)}
        id=${field.id}
        name=${ctx.name}
        label=${field.label}
        helpmsg=${field.helpmsg}
        src=${src}
        .messages=${field.messages ?? {}}
        .a11y=${field.a11y ?? {}}
        ?required=${field.required}
        ?readonly=${field.readonly}
        @change=${(ev: CustomEvent) => ctx.onChange(ev, field)}
      ></e-input-photo>
    `
  }
}
