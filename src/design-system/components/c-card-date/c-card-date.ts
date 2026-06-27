import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

// Controllers
import { PoiChannelController } from '@ds/controllers/poi-channel.controller'

// Utils
import {
  DAY_HOVER_EVENT,
  DAY_HOVER_CLEAR_EVENT,
  type DayHoverEventDetail
} from '@ds/utils/poi-channel.utils'

import styles from './c-card-date.style.scss?inline'

@customElement('c-card-date')
export class CCardDate extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Boolean }) isToday = false

  @property({ type: String }) text = ''

  @property({ type: String }) channel = ''

  @property({ type: Number }) day = -1

  private _channel = new PoiChannelController(
    this,
    () => this.channel,
    {}
  )

  render() {
    const classes = classMap({
      'c-card-date': true,
      'c-card-date--today': this.isToday
    })

    return html`
      <div
        class=${classes}
        @mouseenter=${this._onHoverStart}
        @mouseleave=${this._onHoverEnd}
        @focusin=${this._onHoverStart}
        @focusout=${this._onHoverEnd}
      >
        <div class="c-card-date__head">
          <slot name="index"></slot>
          <slot name="day"></slot>
          <slot name="month"></slot>
        </div>
        <div class="c-card-date__content">
          <p class="c-card-date__title">${this.text}</p>
          <slot></slot>
        </div>
      </div>
    `
  }

  private _onHoverStart = () => {
    if (this.day < 0) return

    this._channel.dispatch<DayHoverEventDetail>(DAY_HOVER_EVENT, {
      day: this.day,
      source: this
    })
  }

  private _onHoverEnd = () => {
    if (this.day < 0) return

    this._channel.dispatch(DAY_HOVER_CLEAR_EVENT, { source: this })
  }
}
