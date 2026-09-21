import { html, css, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

// Types
import type { Poi, PoiHotel, Reminder, Note } from '@ds/types/pois.types'
import type { PoiChannelView } from '@ds/utils/poi-channel.utils'

// Abstracts
import { CardBase } from '@ds/abstracts/card.base'

// Controllers
import { DataUpdateController } from '@ds/controllers/data-update.controller'

// Utils
import { isResumeViewType } from '@ds/utils/poi-channel.utils'

// Styles
import styles from './c-card-poi.style.scss?inline'

@customElement('c-card-poi')
export class CCardPoi extends CardBase<Poi | PoiHotel | Reminder | Note> {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) type = ''

  @query('.c-card-poi') _card!: HTMLElement

  @state() removing = false

  @state() hasImage = false

  private _dataUpdate = new DataUpdateController(this, () => this.data, (data) => { this.data = data })

  render() {
    const classes = classMap({
      'c-card-poi': true,
      'c-card-poi--active': this.active,
      'c-card-poi--removing': this.removing
    })

    const headClasses = classMap({
      'c-card-poi__head': true,
      'c-card-poi__head--reminder': this.icon === 'reminder'
    })

    return html`
      <div
        class=${classes}
        role="button"
        tabindex="0"
        @click=${this._onClick}
        @keydown=${this._onKeydown}
        @mouseenter=${this._onHoverStart}
        @mouseleave=${this._onHoverEnd}
        @focus=${this._onHoverStart}
        @blur=${this._onHoverEnd}
      >
        <div class=${headClasses}>
          <slot name="img" @slotchange=${this.handleSlotChange}></slot>
          ${when(this.icon && !this.hasImage,
            () => html`<e-icon class="c-card-poi__icon" icon=${this.icon} size=${this.breakpoint === 'sm' ? 'l' : 'xl'}></e-icon>`
          )}
        </div>
        <div class="c-card-poi__content">
          <slot name="title"></slot>
          <slot name="description"></slot>
        </div>
        <div class="c-card-poi__end">
          <slot name="date"></slot>

          <div class=${classMap({
            'c-card-poi__actions': true,
            'c-card-poi__actions--showed': this.actionsShowed
          })}>
            <slot name="action"></slot>
            <button class="c-card-poi__menu" @click=${this._showActions} aria-label=${this.menu}>
              <e-icon icon="menu" size="m"></e-icon>
            </button>
          </div>
        </div>
      </div>
    `
  }

  protected _getCardElement(): HTMLElement | null {
    return this._card ?? null
  }

  protected _getSelectView(): PoiChannelView {
    return isResumeViewType(this.type) ? 'resume' : 'detail'
  }

  // Fades out before leaving, so the list closes the gap smoothly.
  protected override _removeFromDOM() {
    this.removing = true
    setTimeout(() => { this.remove() }, 501)
  }

  private handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement

    this.hasImage = slot.assignedElements().length > 0
  }
}
