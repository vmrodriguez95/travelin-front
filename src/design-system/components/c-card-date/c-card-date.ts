import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import styles from './c-card-date.style.scss?inline'

@customElement('c-card-date')
export class CCardDate extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Boolean }) isToday = false

  @property({ type: String }) text = ''

  render() {
    const classes = classMap({
      'c-card-date': true,
      'c-card-date--today': this.isToday
    })

    return html`
      <div class=${classes}>
        <div class="c-card-date__head">
          <slot name="index"></slot>
          <slot name="day"></slot>
          <slot name="month"></slot>
        </div>
        <div class="c-card-date__content">
          <p class="c-card-date__title">${this.text}</p>
          <slot />
        </div>
      </div>
    `
  }
}