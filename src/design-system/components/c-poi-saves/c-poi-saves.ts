import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

// Types
import type { FormSchema, CheckboxGroupFormField } from '@ds/components/c-form/c-form.types'
import type { CForm } from '@ds/components/c-form/c-form'
import type { SavesResponse, Collection } from './c-poi-saves.types'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import {
  FORM_MODIFY_FIELDS_EVENT,
  FORM_SUBMIT_SUCCESS_EVENT,
  POI_SELECT_EVENT,
  type FormModifyFieldsEventDetail,
  type FormSubmitSuccessEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'
import { dispatchDataUpdate } from '@ds/utils/data-update.utils'
import { findFormField } from '@ds/utils/form-schema.utils'

// Styles
import styles from './c-poi-saves.style.scss?inline'

// The "save to collections" modal, shared by every POI on the page. A
// trigger announces the POI on the channel; this component prefills the
// form with it, and after a save it spreads the answer: the new collections
// join the form for the next POI, and the saved POI learns where it lives.
@customElement('c-poi-saves')
export class CPoiSaves extends LitElement {

  @property({ type: String }) channel = ''

  @property({ type: String }) action = ''

  @property({ type: String }) method = 'POST'

  @property({ type: String }) enctype = 'multipart/form-data'

  @property({ type: String }) heading = ''

  @property({ type: String }) submitLabel = ''

  @property({ type: String }) close = ''

  @property({ type: String }) idField = 'idPoi'

  @property({ type: String }) collectionsField = 'collections'

  @property({ type: Object }) data!: FormSchema

  @query('c-form') _form!: CForm

  private _channel = new ChannelController(this, () => this.channel, {
    [POI_SELECT_EVENT]: (detail) => this._onSelect(detail),
    [FORM_SUBMIT_SUCCESS_EVENT]: (detail) => this._onSaved(detail)
  })

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <c-modal class="c-poi-saves" close=${this.close} channel=${this.channel} @modal-close=${this._onModalClose}>
        <h2 slot="title">${this.heading}</h2>
        <c-poi-resume-form class="c-poi-saves__resume" channel=${this.channel} static></c-poi-resume-form>
        <c-form
          fetch
          modal
          action=${this.action}
          method=${this.method}
          enctype=${this.enctype}
          submitLabel=${this.submitLabel}
          channel=${this.channel}
          .data=${this.data}
        ></c-form>
      </c-modal>
    `
  }

  private _onSelect(detail: PoiSelectEventDetail) {
    const poi = detail.data as { id: string; collections?: string[] }

    this._channel.dispatch<FormModifyFieldsEventDetail>(FORM_MODIFY_FIELDS_EVENT, {
      fields: {
        [this.idField]: poi.id,
        [this.collectionsField]: poi.collections ?? []
      },
      source: this
    })
  }

  private _onSaved(detail: FormSubmitSuccessEventDetail) {
    const saved = (detail.data as SavesResponse)?.data

    if (!saved) return

    this._addCollections(saved.collections)

    dispatchDataUpdate({
      id: saved.idPoi,
      changes: { collections: saved.collections.map((collection) => collection.id) },
      source: this
    })
  }

  // The schema is replaced, not mutated, so c-form sees a new value and
  // takes it as the fresh starting point for the next POI.
  private _addCollections(collections: Array<Collection>) {
    const schema = window.structuredClone(this.data)
    const field = findFormField(schema, this.collectionsField) as CheckboxGroupFormField | undefined

    if (!field) return

    const known = new Set(field.options.map((option) => option.value))

    collections
      .filter((collection) => !known.has(collection.id))
      .forEach((collection) => field.options.push({
        label: collection.name,
        value: collection.id,
        icon: collection.icon
      }))

    this.data = schema
  }

  // Leaving without saving must not carry choices over to the next POI.
  private _onModalClose() {
    this._form?.reset()
  }
}
