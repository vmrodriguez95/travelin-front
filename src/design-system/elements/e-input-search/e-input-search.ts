import { html, css, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { live } from 'lit/directives/live.js'

import type { SearchResult, SearchApiResponse } from './e-input-search.types.ts'

import { SimpleGetClient } from '@ds/requests/index.ts'
import { SimpleRequestController } from '@ds/controllers/request.controller.ts'

import { debounce } from '../../utils/action.utils.ts'

import { FormElement } from '../../abstracts/form-element.base.ts'
import type { ValidityResult } from '../../abstracts/form-element.base.ts'

import style from './e-input-search.style.scss?inline'
import { PoiChannelController } from '@ds/controllers/poi-channel.controller.ts'
import { POI_SELECT_EVENT, type PoiSelectEventDetail } from '@ds/utils/poi-channel.utils.ts'
import type { Poi } from '@ds/types/pois.ts'

@customElement('e-input-search')
export class EInputSearch extends FormElement {

  static styles = css`${unsafeCSS(style)}`

  @property({ type: String }) api = ''

  @property({ type: String }) label = ''

  @property({ type: String }) places = ''

  @property({ type: String }) channel = ''

  @property({ type: String }) placeholder = ''

  @property({ type: String, reflect: true }) value: string = ''

  @property({ type: String, reflect: true }) displayValue: string = ''

  @property({ type: Boolean }) queryAsValue = false

  @state() _searchResults: Array<SearchResult> = []

  @state() _open = false

  @query('input') _input!: HTMLInputElement

  private _client = new SimpleGetClient({ baseUrl: '', timeoutMs: 8000 })

  private _request = new SimpleRequestController(this, this._client)

  private _searchId = 0

  private _channel = new PoiChannelController(
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
            .value=${live(this.displayValue || this.value)}
            @input=${this._onInput}
            @blur=${this._onBlur}
            @keyup=${this._detectEscape}
          />
          <e-icon class="e-input-search__icon" icon="search" size="m"></e-icon>
          ${when(this._request.loading, () => html`
            <span class="u-spinner" aria-hidden="true"></span>
          `)}
          ${when(this.displayValue, () => html`
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

  private _onInput(ev: Event) {
    if (this.readonly) return

    const query = (ev.target as HTMLInputElement).value
    const hadValue = Boolean(this.value)
    const searchId = ++this._searchId

    this.value = ''
    this.displayValue = query
    this._request.abort()

    if (this.queryAsValue) {
      this.value = query

      this._validate()
      this._internals.setFormValue(this.value)

      this.dispatchEvent(new Event('change'))
    } else {
      this._internals.setFormValue('')

      if (hadValue) {
        this._validate()
        this.dispatchEvent(new Event('change'))
      }
    }

    if (!this.api || query.length < 2) {
      this._searchResults = []
      this._open = false
      return
    }

    this._debounceSearch(query, searchId)
  }

  private async _onSearch(query: string, searchId: number) {
    if (this.readonly) return
    if (searchId !== this._searchId || query !== this.displayValue) return

    try {
      const data = await this._request.get<SearchApiResponse>(this.api, query)

      if (searchId !== this._searchId || query !== this.displayValue) return

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
      return await this._request.get<SearchApiResponse>(this.places, placeId)
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      if ((e as Error)?.message === 'Stale response ignored') return

      console.error(e)
    }
  }

  private async _onChange(result: SearchResult) {
    this._searchId++
    this._request.abort()
    this.value = result.value
    this.displayValue = result.label
    this._searchResults = []
    this._open = false

    this._validate()
    this._internals.setFormValue(this.value)

    this.dispatchEvent(new Event('change'))

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
    this.value = ''
    this.displayValue = ''
    this._searchResults = []
    this._open = false

    this._validate()
    this._internals.setFormValue(this.value)

    this.dispatchEvent(new Event('change'))
  }

  protected _calculateValidity(): ValidityResult {
    if (this.required && !this.value) {
      return this._getRequiredValidity()
    }

    return this._getDefaultValidity()
  }
}
