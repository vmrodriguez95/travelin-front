import { html, css, unsafeCSS } from 'lit'
import { customElement, query } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { map } from 'lit/directives/map.js'

// Types
import type { PoiTransport, TransportSegment } from '@ds/types/pois.types'
import type { PoiChannelView } from '@ds/utils/poi-channel.utils'

// Abstracts
import { CardBase } from '@ds/abstracts/card.base'

// Utils
import { printTime } from '@ds/utils/date-format.utils'

// Styles
import styles from './c-card-transport.style.scss?inline'

@customElement('c-card-transport')
export class CCardTransport extends CardBase<PoiTransport> {

  static styles = css`${unsafeCSS(styles)}`

  @query('.c-card-transport') _card!: HTMLElement

  render() {
    const classes = classMap({
      'c-card-transport': true,
      'c-card-transport--active': this.active
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
        <div class="c-card-transport__head">
          <e-icon class="c-card-transport__icon" icon=${this.icon} size=${this.breakpoint === 'sm' ? 'l' : 'xl'}></e-icon>
        </div>
        <div class="c-card-transport__content">
          <div class="c-card-transport__segments">
            ${map(this.data.segments, (item: TransportSegment) => html`
              <p class="c-card-transport__segment">
                <span>${this._getCity(item.origin.address)} ${printTime(item.origin.date)}</span> <span class="c-card-transport__duration">${item.duration}</span> <span>${this._getCity(item.destiny.address)} ${printTime(item.destiny.date)}</span>
              </p>
            `)}
          </div>
        </div>
        <div class="c-card-transport__end">
          <div class=${classMap({
            'c-card-transport__actions': true,
            'c-card-transport__actions--showed': this.actionsShowed
          })}>
            <slot name="action"></slot>
            <button class="c-card-transport__menu" @click=${this._showActions} aria-label=${this.menu}>
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
    return 'detail'
  }

  private _getCity(address: string) {
    return address.split(', ')[0]
  }
}
