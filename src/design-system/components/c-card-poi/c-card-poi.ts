import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

import styles from './c-card-poi.style.scss?inline'

@customElement('c-card-poi')
export class CCardPoi extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) icon = ''

  @state() hasImage = false

  render() {
    const headClasses = classMap({
      'c-card-poi__head': true,
      'c-card-poi__head--reminder': this.icon === 'reminder'
    })

    return html`
      <button class="c-card-poi">
        <p class=${headClasses}>
          <slot name="img" @slotchange=${this.handleSlotChange}></slot>
          ${when(this.icon && !this.hasImage,
            () => html`<e-icon class="c-card-poi__icon" icon=${this.icon} size="xl"></e-icon>`
          )}
        </p>
        <p class="c-card-poi__content">
          <slot name="title"></slot>
          <slot name="description"></slot>
        </p>
        <p class="c-card-poi__end">
          <slot name="date"></slot>
        </p>
      </button>
    `
  }

  private handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement

    this.hasImage = slot.assignedElements().length > 0
  }
}