import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'

// Types
import type { Filter, FilterChangeDetail } from './c-filter.types'

// Utils
import { debounce } from '../../utils/action.utils.ts'
import { filterCollection } from '../../utils/filter.utils.ts'

// Styles
import styles from './c-filter.style.scss?inline'

@customElement('c-filter')
export class CFilter extends LitElement {

  @property({ type: String }) api = ""

  @property({ type: String }) placeholder = ""

  @property({ type: Array}) filters: Array<Filter> = []

  @state() active!: Filter

  @state() query = ""

  private _items: Array<Record<string, unknown>> = []

  private _loaded = false

  private _loading = false

  private _abort?: AbortController

  private _debouncedApply = debounce(() => this._apply(), 300)

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    super.connectedCallback()

    this.active = this.getDefaultFilter()
  }

  render() {
    return html`
      <div class="c-filter">
        <div class="c-filter__field">
          <e-icon class="c-filter__icon" icon="search" size="m"></e-icon>
          <input
            class="c-filter__input"
            type="search"
            name="search"
            .value=${this.query}
            placeholder=${this.placeholder}
            @input=${this._onInput}
          />
        </div>
        <ul class="c-filter__list">
          ${map(this.filters, (filter) => html`
            <li class="c-filter__item">
              <button
                type="button"
                class="c-filter__button"
                ?active=${this.active.value === filter.value}
                @click=${() => this._onFilter(filter)}
              >
                <e-icon icon=${filter.icon} size="s"></e-icon>
                <span class="c-filter__text">${filter.label}</span>
              </button>
            </li>
          `)}
        </ul>
      </div>
    `
  }

  private _onInput(ev: Event) {
    this.query = (ev.target as HTMLInputElement).value

    this._debouncedApply()
  }

  private _onFilter(filter: Filter) {
    if (this.active.value === filter.value) return

    this.active = filter

    this._apply()
  }

  // Fetches the dataset once, lazily, on the first user interaction. The list
  // is never touched on page load — only when the user searches or filters.
  private async _load() {
    if (this._loaded || this._loading || !this.api) return

    this._loading = true

    const controller = new AbortController()
    this._abort = controller

    try {
      const response = await fetch(this.api, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const json = await response.json()

      this._items = Array.isArray(json?.data) ? json.data : []
      this._loaded = true
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return

      console.error(e)
      this._items = []
    } finally {
      this._loading = false

      if (this._abort === controller) this._abort = undefined
    }
  }

  private async _apply() {
    await this._load()

    const data = filterCollection(this._items, this.query, this.active.value)

    this.dispatchEvent(new CustomEvent<FilterChangeDetail>('filter:change', {
      detail: { data, query: this.query.trim(), filter: this.active.value },
      bubbles: true,
      composed: true
    }))
  }

  getDefaultFilter() {
    return this.filters.find((filter) => filter.default) || this.filters[0]
  }
}
