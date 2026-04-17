import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

// Types
import type { Poi, PoiHotel, Reminder, Note } from '@ds/types/pois'

// Styles
import styles from './c-card-poi.style.scss?inline'

@customElement('c-card-poi')
export class CCardPoi extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Object }) data!: Poi | PoiHotel | Reminder | Note

  @property({ type: String }) icon = ''

  @property({ type: Boolean, reflect: true }) active = false

  @state() hasImage = false

  connectedCallback(): void {
    this._listenModalSuccessEvent()

    super.connectedCallback()
  }

  render() {
    const classes = classMap({
      'c-card-poi': true,
      'c-card-poi--active': this.active
    })

    const headClasses = classMap({
      'c-card-poi__head': true,
      'c-card-poi__head--reminder': this.icon === 'reminder'
    })

    return html`
      <div class=${classes} role="button" tabindex="0" @click=${this._onClick.bind(this)}>
        <div class=${headClasses}>
          <slot name="img" @slotchange=${this.handleSlotChange}></slot>
          ${when(this.icon && !this.hasImage,
            () => html`<e-icon class="c-card-poi__icon" icon=${this.icon} size="xl"></e-icon>`
          )}
        </div>
        <div class="c-card-poi__content">
          <slot name="title"></slot>
          <slot name="description"></slot>
        </div>
        <div class="c-card-poi__end">
          <slot name="date"></slot>

          <div class="c-card-poi__actions">
            <slot name="action"></slot>
          </div>
        </div>
      </div>
    `
  }

  private handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement

    this.hasImage = slot.assignedElements().length > 0
  }

  private _onClick() {
    this.dispatchEvent(new CustomEvent('showme', {
      detail: this.data,
      bubbles: true,
      composed: true
    }))
  }

  private _listenModalSuccessEvent() {
    const modal = document.querySelector('c-modal')
    
    if (modal) {
      modal.addEventListener('fetch-success', (ev: Event) => {
        const event = ev as CustomEvent

        if (event.detail.data.id === this.data.id) {
          this.remove()
        }
      })
    }
  }
}