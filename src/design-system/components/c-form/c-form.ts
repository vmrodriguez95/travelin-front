import { LitElement, html, css, unsafeCSS, type TemplateResult } from 'lit'
import { customElement, property, query, queryAll } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { repeat } from 'lit/directives/repeat.js'
import { classMap } from 'lit/directives/class-map.js'

// Utils
import { printDateTime } from '@ds/utils/date.utils'

// Types
import type {
  FormBlock,
  FormSchema,
  FormSection,
  FileFormField,
  DateFormField,
  BasicFormField,
  SearchFormField,
  SelectFormField,
  FieldDependency,
  FormArraySection,
  CalendarFormField
} from './c-form.types'
import type { SelectOption } from './c-form.types'
import type { EInputSearch } from '@ds/elements/e-input-search/e-input-search'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'
import type { FormModifyFieldsEventDetail } from '@ds/utils/poi-channel.utils'

import styles from './c-form.style.scss?inline'

@customElement('c-form')
export class CForm extends LitElement {

  @property({ type: String }) action = ''

  @property({ type: String }) method = ''
  
  @property({ type: String }) submitLabel = ''

  @property({ type: String }) enctype = 'application/x-www-form-urlencoded'

  @property({ type: Object }) data!: FormSchema

  @property({ type: Boolean }) empty = false

  @property({ type: Boolean }) modal = false

  @property({ type: String }) channel = ''

  @query('form') _form!: HTMLFormElement

  @query('.c-form__submit') _submitButton!: HTMLButtonElement

  @queryAll('.c-form__field') fields!: NodeListOf<HTMLInputElement>

  private _internals: ElementInternals

  private _dependencies: Array<FieldDependency> = []

  private _channel = new ChannelController(
    this,
    () => this.channel,
    {
      onFormModifyFields: (detail) => this._onFormModifyFields(detail)
    }
  )

  static formAssociated = true

  static styles = css`${unsafeCSS(styles)}`

  constructor() {
    super()
    this._internals = this.attachInternals()
  }


  render() {
    const classes = classMap({
      'c-form': true,
      'c-form--empty': this.empty,
      'c-form--modal': this.modal
    })

    return html`
      <form class=${classes} action=${this.action} method=${this.method} enctype=${this.enctype} @submit=${this._onSubmit}>
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

  private _getFieldValue(field: BasicFormField) {
    return field.value ?? field.fillValue ?? ''
  }

  private _isRenderableSectionEntry(
    value: FormBlock[string]
  ): value is BasicFormField | FormSection | FormArraySection {
    return typeof value === 'object' && value !== null
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
    this._submitButton.disabled = true
  }

  private _onChange(ev: CustomEvent, field: BasicFormField) {
    switch (field.type) {
      case 'calendar':
        field.value = ev.detail
        field.fillValue = ev.detail
        break
      case 'search':
        const searchInput = ev.currentTarget as EInputSearch

        (field as SearchFormField).displayValue = searchInput.displayValue
        field.value = searchInput.value
        field.fillValue = searchInput.value
        break
      default:
        const defaultTarget = ev.currentTarget as HTMLInputElement

        field.value = defaultTarget.value
        field.fillValue = defaultTarget.value
    }

    this.requestUpdate()
  }

  private _onFormModifyFields(detail: FormModifyFieldsEventDetail) {
    const updates = detail.fields

    if (!updates || !Object.keys(updates).length) return

    Object.values(this.data.sections).forEach((section) => this._applyFieldUpdates(section, updates))

    this.requestUpdate()
  }

  private _applyFieldUpdates(entry: BasicFormField | FormSection | FormArraySection, updates: Record<string, string>) {
    if ('schema' in entry) {
      (entry as FormArraySection).fields?.forEach((block) => this._applyBlockUpdates(block, updates))
      return
    }

    if ('fields' in entry) {
      this._applyBlockUpdates((entry as FormSection).fields, updates)
      return
    }

    const field = entry as BasicFormField

    if (field.name in updates) {
      field.value = updates[field.name]
      field.fillValue = updates[field.name]
    }
  }

  private _applyBlockUpdates(block: FormBlock, updates: Record<string, string>) {
    Object.entries(block).forEach(([key, entry]) => {
      if (key === 'randomId' || !this._isRenderableSectionEntry(entry)) return

      this._applyFieldUpdates(entry, updates)
    })
  }

  private _addNewBlock(section: FormArraySection) {
    if (!section.fields) {
      section.fields = []
    }

    const newBlock = window.structuredClone(section.schema)

    newBlock.randomId = crypto.randomUUID()

    section.fields.push(newBlock)
    section.editingElementIdx = section.fields.length - 1
    this.requestUpdate()
  }

  private _hasArrayFields(field: FormArraySection) {
    return Array.isArray(field.fields) && field.fields.length > 0
  }

  private _hasFieldsWithValues(section: FormSection) {
    if ('fields' in section && !Array.isArray(section.fields)) {
      const fields = section.fields as FormBlock

      for (const [_, field] of Object.entries(fields)) {
        const basicField = field as BasicFormField

        if ('value' in basicField && basicField.value !== '' || basicField.fillValue) {
          return true
        }
      }
    }

    return false
  }

  private _hasAnyValue(section: FormArraySection | FormSection): boolean {
    const fields = section.fields as Array<FormBlock>

    for (const fieldList of fields) {
      for (const [key, field] of Object.entries(fieldList)) {
        if (key !== 'randomId') {
          const basicField = field as BasicFormField

          if (
            ('value' in basicField && basicField.value !== '' || basicField.fillValue) ||
            this._hasArrayFields(field as FormArraySection) ||
            this._hasFieldsWithValues(field as FormSection)
          ) {
            return true
          }
        }
      }
    }

    return false
  }

  private _confirmBlock(section: FormArraySection) {
    if (!this._hasAnyValue(section)) {
      section.fields?.splice(section.editingElementIdx as number, 1)
    }

    delete section.editingElementIdx

    this.requestUpdate()
  }

  private _editBlock(section: FormArraySection, index: number) {
    section.editingElementIdx = index
    this.requestUpdate()
  }

  private _removeBlock(fields: Array<FormBlock>, index: number) {
    fields.splice(index, 1)
    this.requestUpdate()
  }

  private joinBreadcrumbsWithName(name: string, breadcrumbs: string) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\[?${escaped}\\]?$`)

    if (breadcrumbs && !regex.test(breadcrumbs)) {
      return `${breadcrumbs}[${name}]`
    }

    if (breadcrumbs && regex.test(breadcrumbs)) {
      return breadcrumbs
    }

    return name
  }

  private _normalizeSelectOption(value: string): SelectOption {
    return {
      value,
      label: value
    }
  }

  private _dedupeSelectOptions(options: Array<SelectOption>) {
    const seen = new Set<string>()

    return options.filter((option) => {
      const key = `${String(option.value)}::${option.label}`

      if (!String(option.value) || seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }

  private _collectValuesFromDependency(node: unknown, pathParts: Array<string>): string[] {
    if (!node) return []

    if (pathParts.length === 0) {
      if (typeof node === 'string') {
        return node ? [node] : []
      }

      if (typeof node === 'object' && 'value' in node) {
        const field = node as BasicFormField
        const value = this._getFieldValue(field)

        return typeof value === 'string' && value ? [value] : []
      }

      return []
    }

    const [currentPart, ...rest] = pathParts

    if (Array.isArray(node)) {
      return node.flatMap((item) => this._collectValuesFromDependency(item, pathParts))
    }

    if (typeof node !== 'object') {
      return []
    }

    const record = node as Record<string, unknown>

    if (currentPart in record) {
      return this._collectValuesFromDependency(record[currentPart], rest)
    }

    if ('fields' in record) {
      return this._collectValuesFromDependency(record.fields, pathParts)
    }

    return []
  }

  private _getDependencyOptions(field: BasicFormField) {
    const dependsOn = field.dependsOn || []

    if (!dependsOn.length) return []

    const dependencyValues = dependsOn.flatMap((dependencyPath) => {
      return this._collectValuesFromDependency(this.data.sections, dependencyPath.split('.'))
    })

    return this._dedupeSelectOptions(
      dependencyValues.map((value) => this._normalizeSelectOption(value))
    )
  }

  private _getSelectFieldOptions(field: SelectFormField) {
    const declaredOptions = field.options || []
    const dependencyOptions = this._getDependencyOptions(field)

    return this._dedupeSelectOptions([...declaredOptions, ...dependencyOptions])
  }

  private _getDependencyValues(field: BasicFormField) {
    const dependsOn = field.dependsOn || []

    if (!dependsOn.length) return []

    return dependsOn.flatMap((dependencyPath) => {
      return this._collectValuesFromDependency(this.data.sections, dependencyPath.split('.'))
    })
  }

  private _getDateTimeFormat(date: string = '') {
    if (!date) return ''

    return printDateTime(date)
  }
    

  private _printField(field: BasicFormField, breadcrumbs: string): TemplateResult {
    const name = this.joinBreadcrumbsWithName(field.name, breadcrumbs)

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
      case 'email':
      case 'password':
      case 'number':
        const dependencyValues = this._getDependencyValues(field)
        const compareValue = field.type === 'password' ? dependencyValues[0] || '' : ''

        return html`
          <e-input
            class=${this._getFieldClasses(field)}
            id=${field.id}
            name=${name}
            label=${field.label}
            type=${field.type}
            helpmsg=${field.helpmsg}
            .a11y=${field.a11y}
            .messages=${field.messages ?? {}}
            .minlength=${field.minLength || 0}
            .maxlength=${field.maxLength || 255}
            ?required=${field.required}
            ?readonly=${field.readonly}
            .value=${this._getFieldValue(field)}
            compareValue=${compareValue}
            placeholder=${field.placeholder}
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
            .messages=${field.messages ?? {}}
            ?autofocus=${field.autofocus}
            ?required=${field.required}
            ?readonly=${field.readonly}
            value=${this._getFieldValue(field)}
            @input=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-textarea>
        `

      case 'select':
        const fieldSelect = field as SelectFormField
        fieldSelect.options = this._getSelectFieldOptions(fieldSelect)

        return html`
          <e-select
            class=${this._getFieldClasses(fieldSelect)}
            id=${fieldSelect.id}
            name=${name}
            label=${fieldSelect.label}
            type=${fieldSelect.type}
            helpmsg=${fieldSelect.helpmsg}
            .messages=${field.messages ?? {}}
            default=${fieldSelect.default}
            .options=${fieldSelect.options}
            ?required=${fieldSelect.required}
            ?readonly=${fieldSelect.readonly}
            .value=${this._getFieldValue(fieldSelect)}
            @change=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-select>
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
            .messages=${field.messages ?? {}}
            ?required=${fieldFile.required}
            ?readonly=${fieldFile.readonly}
            value=${fieldFile.fillValue}
            extensions=${fieldFile.file.extensions}
            size=${fieldFile.file.maxSize}
            ?multiple=${fieldFile.file.multiple}
            .a11y=${fieldFile.a11y}
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
            .messages=${field.messages ?? {}}
            ?queryAsValue=${fieldSearch.queryAsValue}
            ?required=${fieldSearch.required}
            ?readonly=${fieldSearch.readonly}
            .value=${this._getFieldValue(fieldSearch)}
            displayValue=${fieldSearch.displayValue}
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
            .messages=${field.messages ?? {}}
            .value=${this._getFieldValue(field)}
            .a11y=${field.a11y}
            ?required=${field.required}
            ?readonly=${field.readonly}
            @change=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-input-icon>
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
            .messages=${field.messages ?? {}}
            start=${fieldCalendar.start}
            end=${fieldCalendar.end}
            min=${fieldCalendar.min || ''}
            max=${fieldCalendar.max || ''}
            ?required=${fieldCalendar.required}
            ?readonly=${fieldCalendar.readonly}
            .returnedValues=${fieldCalendar.returnedValues}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldCalendar)}
          ></e-calendar>
        `
      case 'date':
      case 'time':
      case 'datetime-local':
        const fieldDate = field as DateFormField

        return html`
          <e-input-date
            class=${this._getFieldClasses(fieldDate)}
            id=${fieldDate.id}
            name=${name}
            label=${fieldDate.label}
            helpmsg=${fieldDate.helpmsg}
            .messages=${field.messages ?? {}}
            type=${fieldDate.type}
            min=${fieldDate.min}
            max=${fieldDate.max}
            .value=${this._getFieldValue(fieldDate)}
            ?required=${fieldDate.required}
            ?readonly=${fieldDate.readonly}
            @change=${(ev: CustomEvent) => this._onChange(ev, fieldDate)}
          ></e-input-date>
        `

      default:
        return html`<p>Campo no registrado</p>`
    }
  }

  private _printArraySection(fieldBlock: FormBlock, section: FormArraySection, fields: Array<FormBlock>, breadcrumbs: string, index: number): TemplateResult {
    return html`
      <div class="c-form__repeater__block">
        <div class="c-form__repeater__actions">
          <button class="c-form__repeater__action" type="button" @click=${() => this._confirmBlock(section)} aria-label=${section.confirmLabel ?? 'Confirmar cambios'}>
            <e-icon icon="check" size="s"></e-icon>
          </button>
          <button class="c-form__repeater__action" type="button" @click=${() => this._removeBlock(fields, index)} aria-label=${section.cancelLabel ?? 'Cancelar cambios'}>
            <e-icon icon="remove" size="m"></e-icon>
          </button>
        </div>
        <div class="c-form__repeater__fields c-form__repeater__fields--${section.grid}">
          ${map(Object.keys(fieldBlock), (key: string) => {
            const entry = fieldBlock[key]

            if (key !== 'randomId' && this._isRenderableSectionEntry(entry)) {
              return this._printSection(entry, `${breadcrumbs}[${index}][${key}]`)
            }

            return ''
          })}
        </div>
      </div>
    `
  }

  private _printSubSection(section: FormSection, fields: FormBlock, breadcrumbs: string): TemplateResult {
    return html`
      <div class="c-form__subsection">
        ${when(section.sectionTitle, () => html`
          <h3 class="c-form__subtitle">${section.sectionTitle}</h3>
        `)}

        ${map(Object.keys(fields), (key: string) => {
          const entry = fields[key]

          if (this._isRenderableSectionEntry(entry)) {
            return this._printSection(entry, breadcrumbs ? `${breadcrumbs}[${key}]` : `${key}`)
          }

          return ''
        })}
      </div>
    `
  }

  private _printResumeValue(field: BasicFormField, breadcrumbs: string): TemplateResult {
    const value = field.value || field.fillValue
    const name = this.joinBreadcrumbsWithName(field.name, breadcrumbs)

    if (field.showInResume) {

      switch(field.type) {
        case 'datetime-local':
          return html`
            <p class="c-form__text">${this._getDateTimeFormat(value as string)}</p>
            <input type="hidden" name=${name} value=${value} />
          `
        default:
          return html`
            <p class="c-form__text">${value}</p>
            <input type="hidden" name=${name} value=${value} />
          `
      }
    }

    return html`<input type="hidden" name=${name} value=${value} />`
  }

  private _printResume(fieldBlock: FormBlock, section: FormArraySection, fields: Array<FormBlock>, breadcrumbs: string, index: number): TemplateResult {

    return html`
      <div class="c-form__resume">
        ${map(Object.keys(fieldBlock), (key: string) => {
          const entry = fieldBlock[key] as BasicFormField | FormSection | FormArraySection

          if (key !== 'randomId' && !('fields' in entry) && !('schema' in entry)) {
            // Si es un campo
            return this._printResumeValue(entry, `${breadcrumbs}[${index}]`)
          } else if (key !== 'randomId' && 'fields' in entry && !Array.isArray(entry.fields)) {
            // Si es un FormSection
            const fields = entry.fields as FormBlock

            return html`${map(Object.keys(fields), (subkey: string) => {
              return this._printResumeValue(fields[subkey] as BasicFormField, `${breadcrumbs}[${index}][${key}]`)
            })}`
          } else if (key !== 'randomId' && 'fields' in entry && Array.isArray(entry.fields)) {
            // Si es un FormArraySection
            const fields = entry.fields as Array<FormBlock>

            return html`
              ${'resumeLabel' in entry ? html`
                <p class="c-form__text">${fields.length} ${entry.resumeLabel?.toLowerCase()}</p>
              ` : ''}

              ${map(fields, (fieldBlock: FormBlock, subindex: number) =>
                map(Object.keys(fieldBlock), (subkey: string) =>
                  when(subkey !== 'randomId', () => {
                    const field = fieldBlock[subkey] as BasicFormField
                    const name = this.joinBreadcrumbsWithName(field.name, `${breadcrumbs}[${index}][${key}][${subindex}]`)

                    return html`<input type="hidden" name=${name} value=${field.value}>`
                  })
                )
              )}
            `
          }

          // Para todo lo demás, Mastercard
          return ''
        })}
        <div class="c-form__resume__actions">
          <button class="c-form__resume__action" type="button" @click=${() => this._editBlock(section, index)} aria-label=${section.editLabel ?? 'Editar elemento'}>
            <e-icon icon="edit" size="m"></e-icon>
          </button>
          ${when(section.canRemove, () => html`
            <button class="c-form__resume__action" type="button" @click=${() => this._removeBlock(fields, section.editingElementIdx as number)} aria-label=${section.removeLabel ?? 'Eliminar elemento'}>
              <e-icon icon="delete" size="m"></e-icon>
            </button>
          `)}
        </div>
      </div>
    `
  }

  private _printRepeater(section: FormArraySection, fields: Array<FormBlock>, breadcrumbs: string): TemplateResult {
    return html`
        <div class="c-form__repeater">
          ${when(section.sectionTitle, () => html`
            <h2 class="c-form__subtitle">${section.sectionTitle}</h2>
          `)}
          ${when(section.sectionHelpmsg, () => html`
            <p class="c-form__helpmsg">${section.sectionHelpmsg}</p>
          `)}
          ${when('fields' in section && fields.length > 0,
            () => repeat(
              fields,
              (fieldBlock: FormBlock, index: number) => fieldBlock.randomId || `${breadcrumbs}-${index}`,
              (fieldBlock: FormBlock, index: number) => {

                if ('editingElementIdx' in section && section.editingElementIdx === index) {
                  return this._printArraySection(fieldBlock, section, fields, breadcrumbs, index)
                }

                return this._printResume(fieldBlock, section, fields, breadcrumbs, index)
              }
            ),
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

  private _printSection(section: BasicFormField | FormSection | FormArraySection, breadcrumbs: string): TemplateResult {
    if ('schema' in section) {
      // Schema indica que esa estructura de campos se debe pintar en un repeater
      // En caso de que la casuística sea un FormArraySection
      const fields = section.fields as Array<FormBlock>

      return this._printRepeater(section as FormArraySection, fields, breadcrumbs)
    }

    if ('fields' in section && !Array.isArray(section.fields)) {
      // En caso de que la casuística sea un FormSection
      const fields = section.fields as FormBlock

      return this._printSubSection(section, fields, breadcrumbs)
    }

    // En caso de que la casuística sea un BasicFormField
    return this._printField(section as BasicFormField, breadcrumbs)
  }

  private _printSections(sections: FormSchema['sections']) {
    const keys = Object.keys(this.data.sections)

    return map(keys, (key: string) => html`
      <fieldset class="c-form__section">
        ${when(sections[key].legend, () => html`
          <legend class="c-form__title ${sections[key].legendPosition ? `c-form__title--${sections[key].legendPosition}` : ''}">${sections[key].legend}</legend>
        `)}
        ${when(sections[key].helpmsg, () => html`
          <p class="c-form__helpmsg">${sections[key].helpmsg}</p>
        `)}
        ${this._printSection(sections[key], sections[key].removeMainKey ? '' : key)}
      </fieldset>
    `)
  }
}
