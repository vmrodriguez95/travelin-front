import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Styles
import styles from './c-tabs.style.scss?inline'

@customElement('c-tabs')
export class CTabs extends LitElement {

  @property({ type: Number }) selected = 0

  @property({ type: String }) channel = ''

  @state() _tabs: string[] = []

  private _channel = new ChannelController(
    this,
    () => this.channel,
    {
      onTabSelect: (detail) => this._selectByIndex(detail.index)
    }
  )

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <div class="c-tabs">
        <div class="c-tabs__list" role="tablist">
          ${this._tabs.map((label, i) => html`
            <button
              class=${this._getTabClasses(i)}
              type="button"
              role="tab"
              id="c-tabs-tab-${i}"
              aria-selected=${i === this.selected ? 'true' : 'false'}
              aria-controls="c-tabs-panel-${i}"
              tabindex=${i === this.selected ? '0' : '-1'}
              @click=${() => this._selectTab(i)}
            >
              ${label}
            </button>
          `)}
        </div>
        <div class="c-tabs__content">
          <slot @slotchange=${this._updateTabs}></slot>
        </div>
      </div>
    `
  }

  private _updateTabs(e: Event) {
    const elements = (e.target as HTMLSlotElement).assignedElements({ flatten: true })

    this._tabs = elements.map((el, i) => el.getAttribute('data-label') ?? `Tab ${i + 1}`)

    this._syncPanels(elements)
  }

  private _selectTab(index: number) {
    this._selectByIndex(index)

    this.dispatchEvent(new CustomEvent('tab-change', {
      detail: { index },
      bubbles: true,
      composed: true
    }))
  }

  private _selectByIndex(index: number) {
    this.selected = index

    this._syncPanels(this._getPanels())
  }

  private _getPanels() {
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null

    return slot ? slot.assignedElements({ flatten: true }) : []
  }

  private _syncPanels(elements: Element[]) {
    elements.forEach((el, i) => {
      const isActive = i === this.selected

      el.setAttribute('role', 'tabpanel')
      el.setAttribute('id', `c-tabs-panel-${i}`)
      el.setAttribute('aria-labelledby', `c-tabs-tab-${i}`)
      el.toggleAttribute('hidden', !isActive)
    })
  }

  private _getTabClasses(index: number) {
    return classMap({
      'c-tabs__tab': true,
      'c-tabs__tab--active': index === this.selected
    })
  }
}
