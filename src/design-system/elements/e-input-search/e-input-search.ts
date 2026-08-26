import { html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { live } from 'lit/directives/live.js'

// Types
import type { SearchResult, SearchApiResponse, PlaceApiResponse } from './e-input-search.types.ts'

// Utils
import { SimpleGetClient } from '@ds/requests/index.ts'
import { debounce } from '../../utils/action.utils.ts'
import { POI_SELECT_EVENT, type PoiSelectEventDetail } from '@ds/utils/poi-channel.utils.ts'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller.ts'
import { SimpleRequestController } from '@ds/controllers/request.controller.ts'

// Abstracts
import { FormElement } from '../../abstracts/form-element.base.ts'
import type { ValidityResult } from '../../abstracts/form-element.base.ts'

// Styles
import style from './e-input-search.style.scss?inline'

@customElement('e-input-search')
export class EInputSearch extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: String }) api = ''

  @property({ type: String }) label = ''

  @property({ type: String }) places = ''

  @property({ type: String }) channel = ''

  @property({ type: String }) placeholder = ''

  // The text the user sees, and what the field submits. A location is always
  // submitted as text so a form filled from a voucher is complete on its own.
  @property({ type: String, reflect: true }) value: string = ''

  // Set only while `value` is the untouched label of an option picked from the
  // list. It lets the backend resolve the exact place instead of the text.
  @property({ type: String, reflect: true }) placeId: string = ''

  @state() _searchResults: Array<SearchResult> = []

  @state() _open = false

  @query('input') _input!: HTMLInputElement

  private _client = new SimpleGetClient({ baseUrl: '', timeoutMs: 8000 })

  private _request = new SimpleRequestController(this, this._client)

  private _searchId = 0

  private _channel = new ChannelController(
    this,
    () => this.channel,
    { }
  )

  private _debounceSearch = debounce((query: string, searchId: number) => {
    this._onSearch(query, searchId)
  }, 300)

  protected override _getAnchorElement(): HTMLElement {
    return this._input ?? this
  }

  protected firstUpdated() {
    this._internals.setFormValue(this.value)
  }

  // `value` is also written from outside: a form filled from a voucher, or an
  // edit form hydrated from the API. Publishing it only on user input would
  // submit an empty field for everything the user never touched.
  protected updated(changed: PropertyValues) {
    if (!changed.has('value')) return

    this._internals.setFormValue(this.value)

    // Only refreshes an error already on screen. Validating unconditionally
    // would flag a required field the user has not reached yet.
    if (this._internals.validationMessage) this._validate()
  }

  render() {
    return html`
      <div class="e-input-search">
        ${when(this.label, () => html`
          <label class="e-input-search__label" for=${this.id}>
            ${this.label} ${when(this.required, () => html`*`)}
            ${when(this.helpmsg, () => html`
              <button class="u-input-info__button" type="button" aria-label=${this.helpmsg}>
                <e-icon icon="info" size="m"></e-icon>
                <p class="u-input-info__helpmsg">${this.helpmsg}</p>
              </button>
            `)}
          </label>
        `)}
        <div class="e-input-search__wrapper">
          <input
            id=${this.id}
            name=${this.name}
            class="e-input-search__field"
            type="text"
            autocomplete="off"
            placeholder=${this.placeholder}
            ?readonly=${this.readonly}
            ?required=${this.required}
            aria-autocomplete="list"
            aria-expanded=${this._open ? 'true' : 'false'}
            .value=${live(this.value)}
            @input=${this._onInput}
            @blur=${this._onBlur}
            @keyup=${this._detectEscape}
          />
          <e-icon class="e-input-search__icon" icon="search" size="m"></e-icon>
          ${when(this._request.loading, () => html`
            <span class="u-spinner" aria-hidden="true"></span>
          `)}
          ${when(this.value, () => html`
            <button class="e-input-search__clear" type="button" @click=${this._onClean}>
              <e-icon icon="close" size="s"></e-icon>
            </button>
          `)}
          ${when(this._open && this._searchResults.length, () => html`
            <ul class="e-input-search__results" role="listbox">
              ${this._searchResults.map((result: SearchResult) => html`
                <li class="e-input-search__result" role="option">
                  <button
                    type="button"
                    class="e-input-search__option"
                    @mousedown=${(e: MouseEvent) => e.preventDefault()}
                    @click=${() => this._onChange(result)}
                  >
                    <span class="e-input-search__text">${result.label}</span>
                    ${when(result.helptext, () => html`
                      <span class="e-input-search__helptext">${result.helptext}</span>
                    `)}
                  </button>
                </li>
              `)}
            </ul>
          `)}
        </div>
        ${when(this._internals.validationMessage, () => html`
          <p class="e-input-search__error">${this._internals.validationMessage}</p>
        `)}
      </div>
    `
  }

  private _detectEscape(ev: KeyboardEvent) {
    const key = ev.key

    if (key === 'Escape') this._onClean()
  }

  // Publishes the pair as one change: `placeId` describes a concrete option of
  // `value`, so the two can never be written apart.
  private _commit(value: string, placeId: string) {
    this.value = value
    this.placeId = placeId

    this._validate()

    this.dispatchEvent(new Event('change'))
  }

  private _onInput(ev: Event) {
    if (this.readonly) return

    const query = (ev.target as HTMLInputElement).value
    const searchId = ++this._searchId

    this._request.abort()

    // Typing over a picked option drops its id: keeping it would submit the old
    // place under the new text.
    this._commit(query, '')

    if (!this.api || query.length < 2) {
      this._searchResults = []
      this._open = false
      return
    }

    this._debounceSearch(query, searchId)
  }

  private async _onSearch(query: string, searchId: number) {
    if (this.readonly) return
    if (searchId !== this._searchId || query !== this.value) return

    try {
      const data = await this._request.get<SearchApiResponse>(this.api, query)

      if (searchId !== this._searchId || query !== this.value) return

      this._searchResults = Array.isArray(data?.data) ? data.data : []
      this._open = this._searchResults.length > 0
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      if ((e as Error)?.message === 'Stale response ignored') return

      console.error(e)
      this._searchResults = []
      this._open = false
    }
  }

  private async _getPlaceByRequest(placeId: string) {
    if (!placeId) return

    try {
      return await this._request.get<PlaceApiResponse>(this.places, placeId)
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      if ((e as Error)?.message === 'Stale response ignored') return

      console.error(e)
    }
  }

  private async _onChange(result: SearchResult) {
    this._searchId++
    this._request.abort()
    this._searchResults = []
    this._open = false

    this._commit(result.label, result.value)

    if (this.channel) {
      const place = await this._getPlaceByRequest(result.value)

      if (place) {
        this._channel.dispatch<PoiSelectEventDetail>(POI_SELECT_EVENT, {
          data: place.data,
          source: this,
          view: 'resume'
        })
      }
    }
  }

  private _onBlur() {
    this._searchResults = []
    this._open = false
  }

  private _onClean() {
    this._searchId++
    this._request.abort()
    this._searchResults = []
    this._open = false

    this._commit('', '')
  }

  protected _calculateValidity(): ValidityResult {
    if (this.required && !this.value) {
      return this._getRequiredValidity()
    }

    return this._getDefaultValidity()
  }
}
