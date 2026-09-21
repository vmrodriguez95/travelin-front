import { LitElement, html, type PropertyValues, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'

// Types
import type { FilterChangeDetail } from '@ds/components/c-filter/c-filter.types'

// A list rendered by the server that a c-filter on the same page takes over:
// the markup stays untouched until the first `filter:change`, then Lit
// renders the filtered items in its place. Subclasses render one item and
// name the list.
export abstract class FilteredListBase<T> extends LitElement {

  // Endpoint the item actions (accept, reject, delete) talk to.
  @property({ type: String }) action = '/api/poi.json'

  @state() protected _items?: Array<T>

  private _hydrated = false

  protected abstract _getListClass(): string

  protected abstract _getEmptyClass(): string

  protected abstract _getEmptyMessage(): string

  protected abstract _renderItem(item: T): TemplateResult

  private _onFilterChange = (ev: Event) => {
    this._items = (ev as CustomEvent<FilterChangeDetail>).detail.data as Array<T>
  }

  // Light DOM so the global `ti-*` composition styles apply to the list.
  createRenderRoot() {
    return this
  }

  connectedCallback(): void {
    super.connectedCallback()

    document.addEventListener('filter:change', this._onFilterChange)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()

    document.removeEventListener('filter:change', this._onFilterChange)
  }

  // `_items` stays undefined until the first `filter:change`.
  shouldUpdate(): boolean {
    return this._items !== undefined
  }

  // On the first client render, drop the server-rendered list so lit renders a
  // fresh one in its place instead of appending after it.
  protected update(changed: PropertyValues): void {
    if (!this._hydrated) {
      this._hydrated = true
      this.replaceChildren()
    }

    super.update(changed)
  }

  render() {
    return html`
      <ul class=${this._getListClass()}>
        ${this._items && this._items.length
          ? map(this._items, (item) => this._renderItem(item))
          : html`<li class=${this._getEmptyClass()}>${this._getEmptyMessage()}</li>`}
      </ul>
    `
  }
}
