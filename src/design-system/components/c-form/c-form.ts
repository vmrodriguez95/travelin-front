import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query, queryAll } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type { FormSchema, BasicFormField, SearchFormField, CalendarFormField, FileFormField } from './c-form.types'

import styles from './c-form.style.scss?inline'

@customElement('c-form')
export class CForm extends LitElement {

  @property({ type: String }) action = ''

  @property({ type: String }) method = ''
  
  @property({ type: String }) type = ''

  @property({ type: String }) submitLabel = ''

  @property({ type: String }) enctype = 'application/x-www-form-urlencoded'

  @property({ type: Object }) data!: FormSchema

  @query('form') _form!: HTMLFormElement

  @queryAll('.c-form__field') fields!: NodeListOf<HTMLInputElement>

  private _internals: ElementInternals

  private _dependencies: Array<any> = []

  static formAssociated = true

  static styles = css`${unsafeCSS(styles)}`

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  render() {
    return html`
      <form class="c-form" action=${this.action} method=${this.method} enctype=${this.enctype} @submit=${this._onSubmit}>
        ${this._printSections(this.data.sections)}
        <e-button class="c-form__submit" type="submit" size="full" @click=${this._onSubmit}>${this.submitLabel}</e-button>
      </form>
    `
  }

  private _getFieldClasses(field: BasicFormField) {
    return classMap({
      'c-form__field': true,
      'c-form__field--full': field.fieldSize === 'full'
    })
  }

  private _isValid() {
    let isValid = true
    
    this.fields.forEach((field: HTMLInputElement) => {
      if (!field.reportValidity()) {
        isValid = false
      }
    })

    return isValid
  }
  
  private _onSubmit(ev: Event) {
    if (!this._isValid()) {
      ev.preventDefault()
      return false
    }

    const formData = new FormData(this._form)
    this._internals.setFormValue(formData)

    this._form.requestSubmit()
  }

  private _onChange(ev: CustomEvent, field: BasicFormField) {
    const target = ev.currentTarget as HTMLInputElement

    switch (field.type) {
      case 'calendar':
        field.value = ev.detail
        break
      default:
        field.value = target.value
    }
  }

  private _printFields(field: BasicFormField) {
    if ('dependsOn' in field) {
      this._dependencies.push({
        field: field.id,
        dependsOn: field.dependsOn,
        isRegistered: false
      })
    }

    switch(field.type) {
      case 'hidden':
        return html`
          <input type="hidden" name=${field.name} value=${field.fillValue} />
        `
      case 'text':
        return html`
          <e-input
            class=${this._getFieldClasses(field)}
            id=${field.id}
            name=${field.name}
            label=${field.label}
            type=${field.type}
            helpmsg=${field.helpmsg}
            ?required=${field.required}
            ?readonly=${field.readonly}
            value=${field.fillValue}
            @input=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-input>
        `
      case 'file':
        const fieldFile = field as FileFormField

        return html`
          <e-input-file
            class=${this._getFieldClasses(fieldFile)}
            id=${fieldFile.id}
            name=${fieldFile.name}
            label=${fieldFile.label}
            type=${fieldFile.type}
            helpmsg=${fieldFile.helpmsg}
            ?required=${fieldFile.required}
            ?readonly=${fieldFile.readonly}
            value=${fieldFile.fillValue}
            extensions=${fieldFile.file.extensions}
            size=${fieldFile.file.maxSize}
            ?multiple=${fieldFile.file.multiple}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldFile)}
          ></e-input-file>
        `
      case 'search':
        const fieldSearch = field as SearchFormField

        return html`
          <e-input-search
            class=${this._getFieldClasses(fieldSearch)}
            id=${fieldSearch.id}
            api=${fieldSearch.api}
            name=${fieldSearch.name}
            label=${fieldSearch.label}
            helpmsg=${fieldSearch.helpmsg}
            ?required=${fieldSearch.required}
            ?readonly=${fieldSearch.readonly}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldSearch)}
          ></e-input-search>
        `
      case 'calendar':
        const fieldCalendar = field as CalendarFormField

        return html`
          <e-calendar
            class=${this._getFieldClasses(fieldCalendar)}
            id=${fieldCalendar.id}
            name=${fieldCalendar.name}
            label=${fieldCalendar.label}
            type=${fieldCalendar.type}
            helpmsg=${fieldCalendar.helpmsg}
            ?required=${fieldCalendar.required}
            ?readonly=${fieldCalendar.readonly}
            .returnedValues=${fieldCalendar.returnedValues}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldCalendar)}
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
          ${when(section.legend, () => html`
            <legend class="c-form__title">${section.legend}</legend>
          `)}
          ${map(Object.keys(section.fields), (fieldKey: string) => this._printFields(section.fields[fieldKey]))}
        </fieldset>
      `
    })
  }
}