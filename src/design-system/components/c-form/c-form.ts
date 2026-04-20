import { LitElement, html, css, unsafeCSS, type TemplateResult } from 'lit'
import { customElement, property, query, queryAll } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type {
  FormSchema,
  BasicFormField,
  SearchFormField,
  CalendarFormField,
  FileFormField,
  FormSection,
  FormArraySection,
  FormBlock,
  DateFormField,
  SelectFormField
} from './c-form.types'

import styles from './c-form.style.scss?inline'
import { repeat } from 'lit/directives/repeat.js'

@customElement('c-form')
export class CForm extends LitElement {

  @property({ type: String }) action = ''

  @property({ type: String }) method = ''
  
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

  private _addNewBlock(section: FormArraySection) {
    if (!section.fields) {
      section.fields = []
    }

    const newBlock = window.structuredClone(section.schema)

    // @ts-ignore - Agregamos un id único a cada bloque para optimizar el renderizado con repeat
    newBlock.randomId = crypto.randomUUID()

    section.fields.push(newBlock)
    this.requestUpdate()
  }

  private _removeBlock(fields: Array<FormBlock>, index: number) {
    fields.splice(index, 1)
    this.requestUpdate()
  }

  private joinBreadcrumbsWithName(breadcrumbs: string, name: string) {
    let newName = name
    const regex = new RegExp(`\\[${name}\\]$`)

    if(breadcrumbs && !regex.test(breadcrumbs)) {
      newName = `${breadcrumbs}[${name}]`
    } else if (breadcrumbs && regex.test(breadcrumbs)) {
      newName = breadcrumbs
    }

    return newName
  }
    

  private _printField(field: BasicFormField, breadcrumbs: string): TemplateResult {
    const name = this.joinBreadcrumbsWithName(breadcrumbs, field.name)

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
          <input type="hidden" name=${name} value=${Array.isArray(field.fillValue) ? JSON.stringify(field.fillValue) : field.fillValue} />
        `

      case 'text':
      case 'number':
        return html`
          <e-input
            class=${this._getFieldClasses(field)}
            id=${field.id}
            name=${name}
            label=${field.label}
            type=${field.type}
            helpmsg=${field.helpmsg}
            ?required=${field.required}
            ?readonly=${field.readonly}
            value=${field.fillValue}
            @input=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-input>
        `

      case 'textarea':
        return html`
          <e-textarea
            class=${this._getFieldClasses(field)}
            id=${field.id}
            name=${name}
            label=${field.label}
            helpmsg=${field.helpmsg}
            ?autofocus=${field.autofocus}
            ?required=${field.required}
            ?readonly=${field.readonly}
            value=${field.fillValue || field.value}
            @input=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-textarea>
        `

      case 'select':
        const fieldSelect = field as SelectFormField

        return html`
          <e-select
            class=${this._getFieldClasses(fieldSelect)}
            id=${fieldSelect.id}
            name=${name}
            label=${fieldSelect.label}
            type=${fieldSelect.type}
            helpmsg=${fieldSelect.helpmsg}
            .options=${fieldSelect.options}
            ?required=${fieldSelect.required}
            ?readonly=${fieldSelect.readonly}
            value=${fieldSelect.fillValue}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldSelect)}
          ></e-input>
        `

      case 'file':
        const fieldFile = field as FileFormField

        return html`
          <e-input-file
            class=${this._getFieldClasses(fieldFile)}
            id=${fieldFile.id}
            name=${name}
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
            name=${name}
            label=${fieldSearch.label}
            helpmsg=${fieldSearch.helpmsg}
            ?required=${fieldSearch.required}
            ?readonly=${fieldSearch.readonly}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldSearch)}
          ></e-input-search>
        `

      case 'icon':
        return html`
          <e-input-icon
            class=${this._getFieldClasses(field)}
            id=${field.id}
            name=${name}
            label=${field.label}
            helpmsg=${field.helpmsg}
            value=${field.fillValue || field.value}
            ?required=${field.required}
            ?readonly=${field.readonly}
            @change=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-input-search>
        `

      case 'calendar':
        const fieldCalendar = field as CalendarFormField

        return html`
          <e-calendar
            class=${this._getFieldClasses(fieldCalendar)}
            id=${fieldCalendar.id}
            name=${name}
            label=${fieldCalendar.label}
            type=${fieldCalendar.type}
            helpmsg=${fieldCalendar.helpmsg}
            ?required=${fieldCalendar.required}
            ?readonly=${fieldCalendar.readonly}
            .returnedValues=${fieldCalendar.returnedValues}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldCalendar)}
          ></e-calendar>
        `
      case 'date':
      case 'time':
        const fieldDate = field as DateFormField

        return html`
          <e-input-date
            class=${this._getFieldClasses(fieldDate)}
            id=${fieldDate.id}
            name=${name}
            label=${fieldDate.label}
            helpmsg=${fieldDate.helpmsg}
            type=${fieldDate.type}
            min=${fieldDate.min}
            max=${fieldDate.max}
            value=${fieldDate.fillValue || fieldDate.value}
            ?required=${fieldDate.required}
            ?readonly=${fieldDate.readonly}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldDate)}
          ></e-input-date>
        `

      default:
        return html`<p>Campo no registrado</p>`
    }
  }

  private _printSection(section: BasicFormField | FormSection | FormArraySection, breadcrumbs: string): TemplateResult {
    if ('schema' in section) {
      // Schema indica que esa estructura de campos se debe pintar en un repeater
      // En caso de que la casuística sea un FormArraySection
      const arraySection = section as FormArraySection
      const fields = arraySection.fields as Array<FormBlock>

      return html`
        <div class="c-form__repeater">
          ${when(section.sectionTitle, () => html`
            <h2 class="c-form__subtitle">${section.sectionTitle}</h2>
          `)}
          ${when(section.sectionHelpmsg, () => html`
            <p class="c-form__helpmsg">${section.sectionHelpmsg}</p>
          `)}
          ${when('fields' in section && fields.length > 0,
            () => map(
              fields,
              (fieldBlock: FormBlock, index: number) => html`
              <div class="c-form__repeater__block">
                <div class="c-form__repeater__fields c-form__repeater__fields--${section.grid}">
                  ${repeat(
                    Object.keys(fieldBlock),
                    () => fieldBlock.randomId,
                    (key: string) => {
                      if (key !== 'randomId') {
                        return this._printSection(fieldBlock[key], `${breadcrumbs}[${index}][${key}]`)
                      }

                      return ''
                    }
                  )}
                </div>
                <div class="c-form__repeater__actions">
                  ${when(arraySection.canRemove, () => html`
                    <button class="c-form__remove" type="button" @click=${() => this._removeBlock(fields, index)}>
                      <e-icon icon="remove" size="m"></e-icon>
                    </button>
                  `)}
                </div>
              </div>
            `),
            () => html`
              <p class="c-form__empty">${section.emptyMsg}</p>
            `
          )}
          ${when(section.canAdd, () => html`
            <button class="c-form__add" type="button" @click=${() => this._addNewBlock(section)}>
              <e-icon icon="add" size="m"></e-icon> ${section.addLabel}
            </button>
          `)}
        </div>
      `
    }

    if ('fields' in section && !Array.isArray(section.fields)) {
      // En caso de que la casuística sea un FormSection
      const fields = section.fields as FormBlock

      return html`
        <div class="c-form__subsection">
          ${when(section.sectionTitle, () => html`
            <h3 class="c-form__subtitle">${section.sectionTitle}</h3>
          `)}

          ${map(Object.keys(fields), (key: string, index: number) => {
            return this._printSection(fields[key], breadcrumbs ? `${breadcrumbs}[${key}]` : `${key}`)
          })}
        </div>
      `
    }

    // En caso de que la casuística sea un BasicFormField
    return this._printField(section as BasicFormField, breadcrumbs)
  }

  private _printSections(sections: FormSchema['sections']) {
    const keys = Object.keys(this.data.sections)

    return map(keys, (key: string) => html`
      <fieldset class="c-form__section">
        ${when(sections[key].legend, () => html`
          <legend class="c-form__title">${sections[key].legend}</legend>
        `)}
        ${when(sections[key].helpmsg, () => html`
          <p class="c-form__helpmsg">${sections[key].helpmsg}</p>
        `)}
        ${this._printSection(sections[key], sections[key].removeMainKey ? '' : key)}
      </fieldset>
    `)
  }
}