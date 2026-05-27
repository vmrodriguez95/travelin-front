import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { live } from 'lit/directives/live.js'

// Types
import type { SearchResult, SearchApiResponse } from './e-input-search.types.ts'

// Controllers
import { SimpleGetClient } from '@ds/requests/index.ts'
import { SimpleRequestController } from '@ds/controllers/request.controller.ts'

// Utils
import { debounce } from '../../utils/action.utils.ts'

// Styles
import style from './e-input-search.style.scss?inline'

@customElement('e-input-search')
export class EInputSearch extends LitElement {

  @property({ type: String }) id = ''

  @property({ type: String }) name = ''

  @property({ type: String }) label = ''

  @property({ type: String }) api = ''

  @property({ type: String }) helpmsg = ''

  @property({ type: String, reflect: true }) value: string = ''

  @property({ type: String, reflect: true }) displayValue: string = ''

  @property({ type: Boolean }) queryAsValue = false

  @property({ type: Boolean }) required = false

  @property({ type: Boolean }) readonly = false

  @state() _searchResults: Array<SearchResult> = []

  @state() _open = false

  @query('input') _input!: HTMLInputElement

  private _internals: ElementInternals

  private _client = new SimpleGetClient({ baseUrl: '', timeoutMs: 8000 })

  private _request = new SimpleRequestController(this, this._client)

  private _debounceSearch = debounce(() => { this._onSearch() }, 300)

  static styles = css`${unsafeCSS(style)}`

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
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
            ?readonly=${this.readonly}
            ?required=${this.required}
            aria-autocomplete="list"
            aria-expanded=${this._open ? 'true' : 'false'}
            .value=${live(this.displayValue || this.value)}
            @input=${this._debounceSearch}
            @blur=${this._onBlur}
            @keyup=${this._detectEscape}
          />

          <e-icon class="e-input-search__icon" icon="search" size="m"></e-icon>

          ${when(this._request.loading, () => html`
            <span class="u-spinner" aria-hidden="true"></span>
          `)}

          ${when(this.displayValue, () => html`
            <button class="e-input-search__clear" @click=${this._onClean}>
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

  private async _onSearch() {
    if (this.readonly) return

    const query = this._input.value

    this.value = ''
    this.displayValue = query

    if (this.queryAsValue) {
      this.value = query

      this._validate()
      this._internals.setFormValue(this.value)

      this.dispatchEvent(new Event('change'))
    }

    if (!this.api || query.length < 2) {
      this._searchResults = []
      this._open = false
      return
    }

    try {
      const data = await this._request.get<SearchApiResponse>(this.api, query)

      this._searchResults = Array.isArray(data?.data) ? data.data : []
      this._open = this._searchResults.length > 0
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      if (e?.message === 'Stale response ignored') return

      console.error(e)
      this._searchResults = []
      this._open = false
    }
  }

  private _onChange(result: SearchResult) {
    this.value = result.value
    this.displayValue = result.label
    this._searchResults = []
    this._open = false

    this._validate()
    this._internals.setFormValue(this.value)

    this.dispatchEvent(new Event('change'))
  }

  private _onBlur() {
    this._searchResults = []
    this._open = false
  }

  private _onClean() {
    this.value = ''
    this.displayValue = ''
    this._searchResults = []
    this._open = false

    this._validate()
    this._internals.setFormValue(this.value)

    this.dispatchEvent(new Event('change'))
  }

  private _validate() {
    const validity = this._calculateValidity()
    
    if (validity.valid) {
      this._internals.setValidity({})
      return
    }

    this._internals.setValidity(
      validity.state,
      validity.message,
      this._input
    )
  }

  private _getDefaultValidy() {
    return { valid: true, message: "", state: {} as any }
  }

  private _getRequiredValidy() {
    return {
      valid: false,
      message: "Este campo es obligatorio",
      state: { valueMissing: true }
    }
  }

  private _calculateValidity() {
    if (this.required && !this.value) {
      return this._getRequiredValidy()
    }
    
    return this._getDefaultValidy() 
  }

  reportValidity() {
    this._validate()
    return this._internals.reportValidity()
  }

  checkValidity() {
    this._validate()
    return this._internals.checkValidity()
  }
}
