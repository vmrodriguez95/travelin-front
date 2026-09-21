import { LitElement, html, css, unsafeCSS, type TemplateResult } from 'lit'
import { customElement, property, query, queryAll, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { repeat } from 'lit/directives/repeat.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type {
  FormBlock,
  FormSchema,
  FormSection,
  BasicFormField,
  SearchFormField,
  FormArraySection
} from './c-form.types'
import type { EInputSearch } from '@ds/elements/e-input-search/e-input-search'

// Renderers
import { FieldRendererRegistry, type FieldRenderContext } from './renderers'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import { printDateTime } from '@ds/utils/date-format.utils'
import { FormDependencyResolver } from '@ds/utils/form-dependency.utils'
import { applyFieldUpdates, blockHasAnyValue, createBlock, fillEntry } from '@ds/utils/form-fill.utils'
import {
  getFieldValue,
  getSiblingValue,
  isArraySection,
  isRenderableEntry,
  isSubSection,
  joinBreadcrumbsWithName,
  setFieldValue,
  setSiblingValue,
  type FormEntry
} from '@ds/utils/form-schema.utils'
import {
  FORM_FILL_EVENT,
  FORM_MODIFY_FIELDS_EVENT,
  FORM_SUBMIT_SUCCESS_EVENT,
  type FormFillEventDetail,
  type FormModifyFieldsEventDetail,
  type FormSubmitSuccessEventDetail
} from '@ds/utils/poi-channel.utils'

// Requests
import { SimpleFormClient } from '@ds/requests/form-client'

import styles from './c-form.style.scss?inline'

// Renders a schema as a form. Each field type is painted by its renderer
// (`renderers/`); this class owns the layout of sections and repeaters, the
// user's edits to the schema, and the submit.
@customElement('c-form')
export class CForm extends LitElement {

  @property({ type: String }) action = ''

  @property({ type: String }) method = ''
  
  @property({ type: String }) submitLabel = ''

  @property({ type: String }) enctype = 'application/x-www-form-urlencoded'

  @property({ type: Object }) data!: FormSchema

  @property({ type: Boolean }) empty = false

  @property({ type: Boolean }) modal = false

  // Sends the form through fetch instead of a native submit, so the page is
  // not reloaded. Success and error are announced with the same events as
  // e-fetch (`fetch-success` / `fetch-error`) so c-modal closes on its own.
  @property({ type: Boolean }) fetch = false

  @property({ type: String }) channel = ''

  @state() private _submitting = false

  @state() private _error: string | null = null

  @query('form') _form!: HTMLFormElement

  @query('.c-form__submit') _submitButton!: HTMLButtonElement

  @queryAll('.c-form__field') fields!: NodeListOf<HTMLInputElement>

  private _internals: ElementInternals

  private _client = new SimpleFormClient()

  private _pristineData!: FormSchema

  private _workingData: FormSchema | null = null

  // Rebuilt on every render, so dependency lookups are cached for one paint.
  private _dependencies!: FormDependencyResolver

  private _channel = new ChannelController(
    this,
    () => this.channel,
    {
      [FORM_MODIFY_FIELDS_EVENT]: (detail) => this._onFormModifyFields(detail),
      [FORM_FILL_EVENT]: (detail) => this._onFormFill(detail)
    }
  )

  static formAssociated = true

  static styles = css`${unsafeCSS(styles)}`

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  // The form writes into the schema as the user types, so it works on its
  // own copy: the object handed in stays as the owner left it, and a pristine
  // copy is kept to start over after a fetched submit.
  protected willUpdate(changed: Map<string, unknown>) {
    if (changed.has('data') && this.data && this.data !== this._workingData) {
      this._pristineData = window.structuredClone(this.data)
      this._workingData = window.structuredClone(this.data)
      this.data = this._workingData
    }
  }

  render() {
    const classes = classMap({
      'c-form': true,
      'c-form--empty': this.empty,
      'c-form--modal': this.modal
    })

    this._dependencies = new FormDependencyResolver(this.data.sections)

    return html`
      <form class=${classes} action=${this.action} method=${this.method} enctype=${this.enctype} @submit=${this._onSubmit}>
        ${this._printSections(this.data.sections)}
        ${when(this._error, () => html`
          <p class="c-form__error">${this._error}</p>
        `)}
        <e-button class="c-form__submit" type="submit" size="full" ?disabled=${this._submitting} @click=${this._onSubmit}>${this.submitLabel}</e-button>
      </form>
    `
  }

  // Submit

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

    if (this.fetch) {
      ev.preventDefault()
      this._submitByFetch(formData)
      return false
    }

    this._form.requestSubmit()
    this._submitButton.disabled = true
  }

  private async _submitByFetch(formData: FormData) {
    // The submit button and the form's own submit event both end up here, so
    // one click must never turn into two requests.
    if (this._submitting) return

    this._submitting = true
    this._error = null

    try {
      const data = await this._client.submit<unknown>(this.action, this.method || 'POST', formData, this.enctype)

      this.dispatchEvent(new CustomEvent('fetch-success', { detail: data, bubbles: true, composed: true }))
      this._channel.dispatch<FormSubmitSuccessEventDetail>(FORM_SUBMIT_SUCCESS_EVENT, { data, source: this })
      this.reset()
    } catch (err) {
      this._error = (err as Error).message
      this.dispatchEvent(new CustomEvent('fetch-error', { detail: err, bubbles: true, composed: true }))
    } finally {
      this._submitting = false
    }
  }

  // A fetched form stays on the page (it may live in a shared modal), so it
  // has to come back as it was first rendered: the schema is restored from the
  // copy taken when it arrived, which also drops any repeater blocks added,
  // and the native reset clears what the fields hold on their own.
  reset() {
    this._form.reset()
    this._workingData = window.structuredClone(this._pristineData)
    this.data = this._workingData
  }

  // Edits

  private _onChange(ev: CustomEvent, field: BasicFormField, block?: FormBlock) {
    switch (field.type) {
      case 'calendar':
        setFieldValue(field, ev.detail)
        break
      case 'search':
        const searchInput = ev.currentTarget as EInputSearch

        setFieldValue(field, searchInput.value)
        this._syncSearchSiblings(field as SearchFormField, searchInput, block)
        break
      default:
        setFieldValue(field, (ev.currentTarget as HTMLInputElement).value)
    }

    this.requestUpdate()
  }

  // A search field submits the text the user sees. The id of the picked option,
  // and anything else that only describes that option, live in sibling fields —
  // they are rewritten from the element on every change so they can never
  // describe a place other than the one currently written in the field.
  private _syncSearchSiblings(field: SearchFormField, input: EInputSearch, block?: FormBlock) {
    if (!block) return

    setSiblingValue(block, field.placeIdField, input.placeId)

    field.resetFields?.forEach((key) => setSiblingValue(block, key, ''))
  }

  private _onFormModifyFields(detail: FormModifyFieldsEventDetail) {
    const updates = detail.fields

    if (!updates || !Object.keys(updates).length) return

    Object.values(this.data.sections).forEach((section) => applyFieldUpdates(section, updates))

    this.requestUpdate()
  }

  private _onFormFill(detail: FormFillEventDetail) {
    const data = detail.data

    if (!data || !Object.keys(data).length) return

    Object.entries(this.data.sections).forEach(([key, section]) => {
      if (key in data) fillEntry(section, (data as Record<string, unknown>)[key])
    })

    this.requestUpdate()
  }

  // Repeater blocks

  private _addNewBlock(section: FormArraySection) {
    if (!section.fields) {
      section.fields = []
    }

    section.fields.push(createBlock(section))
    section.editingElementIdx = section.fields.length - 1
    this.requestUpdate()
  }

  // Validates only the block being collapsed. Its fields live in this same
  // shadow root, so the confirm button reaches them through its own wrapper.
  private _isBlockValid(ev: Event): boolean {
    const wrapper = (ev.currentTarget as HTMLElement).closest('.c-form__repeater__block')

    if (!wrapper) return true

    let isValid = true

    wrapper.querySelectorAll<HTMLInputElement>('.c-form__field').forEach((field: HTMLInputElement) => {
      if (!field.reportValidity()) {
        isValid = false
      }
    })

    return isValid
  }

  private _confirmBlock(ev: Event, section: FormArraySection) {
    const index = section.editingElementIdx as number
    const block = section.fields?.[index]

    // A block the user added and never filled in is discarded rather than
    // validated: there is nothing to keep, and nothing to complain about.
    if (block && !blockHasAnyValue(block)) {
      section.fields?.splice(index, 1)
      delete section.editingElementIdx

      this.requestUpdate()
      return
    }

    // Once collapsed the block renders as hidden inputs, so _isValid() can no
    // longer reach its fields on submit. This is the last point where a required
    // field can be stopped from being submitted empty.
    if (!this._isBlockValid(ev)) return

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

  // Rendering

  private _getFieldClasses(field: BasicFormField) {
    return classMap({
      'c-form__field': true,
      'c-form__field--full': field.fieldSize === 'full'
    })
  }

  // What a renderer may ask for while painting one field.
  private _getRenderContext(name: string, block?: FormBlock): FieldRenderContext {
    return {
      name,
      block,
      classes: (field) => this._getFieldClasses(field),
      value: (field) => getFieldValue(field),
      siblingValue: (key) => getSiblingValue(block, key),
      dependencyValues: (field) => this._dependencies.valuesFor(field),
      selectOptions: (field) => this._dependencies.selectOptionsFor(field),
      onChange: (ev, field) => this._onChange(ev, field, block)
    }
  }

  private _printField(field: BasicFormField, breadcrumbs: string, block?: FormBlock): TemplateResult {
    const renderer = FieldRendererRegistry.get(field.type)

    if (!renderer) return html`<p>Campo no registrado</p>`

    const name = joinBreadcrumbsWithName(field.name, breadcrumbs)

    return renderer.render(field, this._getRenderContext(name, block))
  }

  private _printArraySection(fieldBlock: FormBlock, section: FormArraySection, fields: Array<FormBlock>, breadcrumbs: string, index: number): TemplateResult {
    return html`
      <div class="c-form__repeater__block">
        <div class="c-form__repeater__actions">
          <button class="c-form__repeater__action" type="button" @click=${(ev: MouseEvent) => this._confirmBlock(ev, section)} aria-label=${section.confirmLabel ?? 'Confirmar cambios'}>
            <e-icon icon="check" size="s"></e-icon>
          </button>
          <button class="c-form__repeater__action" type="button" @click=${() => this._removeBlock(fields, index)} aria-label=${section.cancelLabel ?? 'Cancelar cambios'}>
            <e-icon icon="remove" size="m"></e-icon>
          </button>
        </div>
        <div class="c-form__repeater__fields c-form__repeater__fields--${section.grid}">
          ${map(Object.keys(fieldBlock), (key: string) => {
            const entry = fieldBlock[key]

            if (key !== 'randomId' && isRenderableEntry(entry)) {
              return this._printSection(entry, `${breadcrumbs}[${index}][${key}]`, fieldBlock)
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

          if (isRenderableEntry(entry)) {
            return this._printSection(entry, breadcrumbs ? `${breadcrumbs}[${key}]` : `${key}`, fields)
          }

          return ''
        })}
      </div>
    `
  }

  private _printResumeValue(field: BasicFormField, breadcrumbs: string): TemplateResult {
    const value = field.value || field.fillValue
    const name = joinBreadcrumbsWithName(field.name, breadcrumbs)

    if (field.showInResume) {
      const text = field.type === 'datetime-local' ? printDateTime(String(value ?? '')) : value

      return html`
        <p class="c-form__text">${text}</p>
        <input type="hidden" name=${name} value=${value} />
      `
    }

    return html`<input type="hidden" name=${name} value=${value} />`
  }

  private _printResume(fieldBlock: FormBlock, section: FormArraySection, fields: Array<FormBlock>, breadcrumbs: string, index: number): TemplateResult {

    return html`
      <div class="c-form__resume">
        ${map(Object.keys(fieldBlock), (key: string) => {
          const entry = fieldBlock[key]

          if (key === 'randomId' || !isRenderableEntry(entry)) return ''

          return this._printResumeEntry(entry, key, `${breadcrumbs}[${index}]`)
        })}
        <div class="c-form__resume__actions">
          ${when(section.canEdit !== false, () => html`
            <button class="c-form__resume__action" type="button" @click=${() => this._editBlock(section, index)} aria-label=${section.editLabel ?? 'Editar elemento'}>
              <e-icon icon="edit" size="m"></e-icon>
            </button>
          `)}
          ${when(section.canRemove, () => html`
            <button class="c-form__resume__action" type="button" @click=${() => this._removeBlock(fields, index)} aria-label=${section.removeLabel ?? 'Eliminar elemento'}>
              <e-icon icon="delete" size="m"></e-icon>
            </button>
          `)}
        </div>
      </div>
    `
  }

  // One entry of a collapsed block: a field shows its value, a subsection its
  // fields, a nested repeater a count plus hidden inputs for every value.
  private _printResumeEntry(entry: FormEntry, key: string, breadcrumbs: string): TemplateResult | string {
    if (isArraySection(entry)) {
      const fields = (entry.fields ?? []) as Array<FormBlock>

      return html`
        ${'resumeLabel' in entry ? html`
          <p class="c-form__text">${fields.length} ${entry.resumeLabel?.toLowerCase()}</p>
        ` : ''}

        ${map(fields, (fieldBlock: FormBlock, subindex: number) =>
          map(Object.keys(fieldBlock), (subkey: string) =>
            when(subkey !== 'randomId', () => {
              const field = fieldBlock[subkey] as BasicFormField
              const name = joinBreadcrumbsWithName(field.name, `${breadcrumbs}[${key}][${subindex}]`)

              return html`<input type="hidden" name=${name} value=${field.value}>`
            })
          )
        )}
      `
    }

    if (isSubSection(entry)) {
      const fields = entry.fields

      return html`${map(Object.keys(fields), (subkey: string) => {
        return this._printResumeValue(fields[subkey] as BasicFormField, `${breadcrumbs}[${key}]`)
      })}`
    }

    return this._printResumeValue(entry, breadcrumbs)
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
            () => when(section.emptyMsg, () => html`
              <p class="c-form__empty">${section.emptyMsg}</p>
            `)
          )}
          ${when(section.canAdd, () => html`
            <button class="c-form__add" type="button" @click=${() => this._addNewBlock(section)}>
              <e-icon icon="add" size="m"></e-icon> ${section.addLabel}
            </button>
          `)}
        </div>
      `
  }

  private _printSection(section: FormEntry, breadcrumbs: string, block?: FormBlock): TemplateResult {
    if (isArraySection(section)) {
      return this._printRepeater(section, section.fields as Array<FormBlock>, breadcrumbs)
    }

    if (isSubSection(section)) {
      return this._printSubSection(section, section.fields, breadcrumbs)
    }

    return this._printField(section, breadcrumbs, block)
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
