import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'

import styles from './c-swipe.style.scss?inline'

@customElement('c-swipe')
export class CSwipe extends LitElement {

  @property({ type: String }) action = 'Desliza para ver el mapa'

  @state() _offsetY = 0

  @state() _isDragging = false

  @query('.c-swipe') _swipe!: HTMLElement

  _startingPointY = 0

  _maxOffset = 380

  static styles = css`${unsafeCSS(styles)}`

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this._startingPointY = this._swipe.getBoundingClientRect().top
  }

  render() {
    const styles = { top: `${this._offsetY}px` }

    return html`
      <div class="c-swipe" style=${styleMap(styles)}>
        <button
          class="c-swipe__action"
          aria-label=${this.action}
          @mousedown=${this._calculateOffsetStart}
          @touchstart=${this._calculateOffsetStart}
          @mousemove=${this._calculateOffsetMove}
          @touchmove=${this._calculateOffsetMove}
          @mouseup=${this._calculateOffsetEnd}
          @touchend=${this._calculateOffsetEnd}
        ></button>
        <div class="c-swipe__content">
          <slot></slot>
        </div>
      </div>
    `
  }

  private _calculateOffsetStart = () => {
    this._isDragging = true
  }

  private _calculateOffsetMove = (ev: MouseEvent | TouchEvent) => {
    if (!this._isDragging) return
    this._deactivateScroll()

    const event = ev instanceof MouseEvent ? ev : ev.touches[0]

    let offsetY = 0
    const swipeOffset = event.clientY - this._startingPointY

    if (swipeOffset < 0) {
      offsetY = 0
    } else if (swipeOffset < this._maxOffset) {
      offsetY = swipeOffset
    } else {
      offsetY = this._maxOffset
    }

    this._offsetY = offsetY
  }

  private _calculateOffsetEnd = () => {
    this._isDragging = false
    this._activateScroll()
  }

  private _activateScroll() {
    document.body.style.overflow = ''
    this._swipe.style.overflow = ''
  }

  private _deactivateScroll() {
    document.body.style.overflow = 'hidden'
    this._swipe.style.overflow = 'hidden'
  }
}