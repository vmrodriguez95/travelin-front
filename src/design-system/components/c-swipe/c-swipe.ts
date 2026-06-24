import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'

// Utils
import { clamp } from '@ds/utils/number.utils'
import { breakpoints } from '@ds/utils/variables'

// Styles
import styles from './c-swipe.style.scss?inline'

@customElement('c-swipe')
export class CSwipe extends LitElement {

  private static readonly DESKTOP_BREAKPOINT = breakpoints.xl

  @property({ type: String }) action = ''
  @property({ type: Number }) cutoff = 0

  @query('slot', true) private _slot!: HTMLSlotElement
  @query('.c-swipe__action') private _handleEl!: HTMLButtonElement | null

  @state() private _height = 0
  @state() private _isMobile = true
  @state() private _isDragging = false

  private _minHeight = 0
  private _maxHeight = 0
  private _dragStartY = 0
  private _dragStartHeight = 0

  private _resizeObserver!: ResizeObserver
  private _mediaQuery!: MediaQueryList

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback() {
    super.connectedCallback()
    this._mediaQuery = window.matchMedia(`(min-width: ${CSwipe.DESKTOP_BREAKPOINT}px)`)
    this._mediaQuery.addEventListener('change', this._onBreakpointChange)
    this._isMobile = !this._mediaQuery.matches
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._mediaQuery.removeEventListener('change', this._onBreakpointChange)
    this._resizeObserver?.disconnect()
  }

  protected firstUpdated(): void {
    this._resizeObserver = new ResizeObserver(() => this._measure())
    if (this.parentElement) this._resizeObserver.observe(this.parentElement)
    this._measure()
  }

  updated() {
    if (this._isMobile) {
      this.style.height = `${this._height}px`
    } else {
      this.style.height = ''
    }
  }

  render() {
    const showAction = this._isMobile

    return html`
      <div class="c-swipe">
        ${showAction ? html`
          <button
            class="c-swipe__action"
            aria-label=${this.action}
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          ></button>
        ` : ''}
        <div class="c-swipe__content">
          <slot @slotchange=${this._measure}></slot>
        </div>
      </div>
    `
  }

  private _onBreakpointChange = (ev: MediaQueryListEvent) => {
    this._isMobile = !ev.matches
    this._measure()
  }

  private _measure() {
    if (!this._isMobile) return

    // Parent height is the reliable max — host has no CSS height until we set it
    this._maxHeight = (this.parentElement?.clientHeight ?? 0) || this.getBoundingClientRect().height

    const wrapper = this._slot?.assignedElements()[0] as HTMLElement | undefined
    const firstCard = wrapper?.firstElementChild as HTMLElement | undefined

    if (firstCard) {
      const hostStyle = getComputedStyle(this)
      const handleHeight = this._handleEl
        ? this._handleEl.offsetHeight + parseInt(getComputedStyle(this._handleEl).marginBottom)
        : 0
      const paddingTop = parseInt(hostStyle.paddingTop) || 0
      const paddingBottom = parseInt(hostStyle.paddingBottom) || 0

      this._minHeight = paddingTop + handleHeight + firstCard.offsetHeight + paddingBottom
    } else {
      this._minHeight = this._maxHeight * 0.2
    }

    if (this._height === 0 || this._height < this._minHeight) {
      this._height = this._minHeight
    }
    this._height = clamp(this._height, this._minHeight, this._maxHeight)
  }

  private _onPointerDown = (ev: PointerEvent) => {
    if (!this._isMobile) return
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId)
    this._dragStartY = ev.clientY
    this._dragStartHeight = this._height
    this._isDragging = true
    this.classList.add('is-dragging')
  }

  private _onPointerMove = (ev: PointerEvent) => {
    if (!this._isDragging) return
    ev.preventDefault()
    const delta = this._dragStartY - ev.clientY
    this._height = clamp(this._dragStartHeight + delta, this._minHeight, this._maxHeight)
  }

  private _onPointerUp = () => {
    if (!this._isDragging) return
    this._isDragging = false
    this.classList.remove('is-dragging')

    const mid = (this._minHeight + this._maxHeight) / 2
    this._height = this._height > mid ? this._maxHeight : this._minHeight
  }
}
