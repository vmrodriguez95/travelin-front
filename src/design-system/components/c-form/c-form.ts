import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'

// Types
import type { FormSchema } from '@web/types/form'

import styles from './c-form.style.scss?inline'

@customElement('c-form')
export class CForm extends LitElement {

  @property({ type: String }) action = ''

  @property({ type: String }) method = ''

  @property({ type: Object }) data!: FormSchema

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <div class="c-form">
        <form action=${this.action} method=${this.method}>
          ${this._printSections(this.data.sections)}
        </form>
      </div>
    `
  }

  private _printFields(field: FormField) {
    switch(field.type) {
      case 'hidden':
        return html`
          <input type="hidden" name=${field.name} />
        `
      case 'text':
        return html`
          <e-input
            id=${field.id}
            name=${field.name}
            label=${field.label}
            type=${field.type}
            helpmsg=${field.helpmsg}
            required=${field.required}
            readonly=${field.readonly}
          ></e-input>
        `
      case 'calendar':
        return html`
          <e-calendar
            id=${field.id}
            name=${field.name}
            label=${field.label}
            type=${field.type}
            helpmsg=${field.helpmsg}
            required=${field.required}
            readonly=${field.readonly}
          ></e-calendar>
        `
    }
  }

  private _printSections(sections: FormSchema['sections']) {
    const keys = Object.keys(this.data.sections)

    return keys.map((key: string) => {
      const section = sections[key]

      return html`
        <fieldset class="c-form__section">
          <legend class="c-form__section__title">${section.sectionTitle}</legend>
          ${map(Object.keys(section.fields), (fieldKey: string) => this._printFields(section.fields[fieldKey]))}
        </fieldset>
      `
    })
  }
}