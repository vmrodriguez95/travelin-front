import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'

// Types
import type { Filter } from './c-filter.types'

// Styles
import styles from './c-filter.style.scss?inline'

@customElement('c-filter')
export class CFilter extends LitElement {

  @property({ type: String }) api = ""

  @property({ type: String }) placeholder = ""
  
  @property({ type: Array}) filters: Array<Filter> = []

  active!: Filter

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    super.connectedCallback()

    this.active = this.getDefaultFilter()
  }

  render() {
    return html`
      <div class="c-filter">
        <e-input-search
          class="c-filter__field"
          id="search"
          api=${this.api}
          name="search"
          placeholder=${this.placeholder}
        ></e-input-search>
        <ul class="c-filter__list">
          ${map(this.filters, (filter) => html`
            <li class="c-filter__item">
              <button class="c-filter__button" ?active=${this.active.value === filter.value}>
                <e-icon icon=${filter.icon} size="s"></e-icon>
                <span class="c-filter__text">${filter.label}</span>
              </button>
            </li>
          `)}
        </ul>
      </div>
    `
  }

  getDefaultFilter() {
    return this.filters.find((filter) => filter.default) || this.filters[0]
  }
}
