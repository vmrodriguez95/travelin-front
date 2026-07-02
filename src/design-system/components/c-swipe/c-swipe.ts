import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'

// Controllers
import { PoiChannelController } from '@ds/controllers/poi-channel.controller'

// Utils
import { clamp } from '@ds/utils/number.utils'
import { breakpoints } from '@ds/utils/variables'
import {
  DAY_ACTIVE_EVENT,
  MENU_TOGGLE_EVENT,
  type DayActiveEventDetail,
  type MenuToggleEventDetail
} from '@ds/utils/poi-channel.utils'

// Styles
import styles from './c-swipe.style.scss?inline'

@customElement('c-swipe')
export class CSwipe extends LitElement {

  private static readonly DESKTOP_BREAKPOINT = breakpoints.xl
  private static readonly SETTLE_DELAY = 120

  @property({ type: String }) stage = ''
  @property({ type: String }) action = ''
  @property({ type: String }) channel = ''

  @state() private _isMobile = true

  @query('slot', true) private _slot!: HTMLSlotElement
  @query('.c-swipe__action') private _handleEl!: HTMLButtonElement | null
  @query('.c-swipe__content') private _contentEl!: HTMLElement | null

  private _isDragging = false
  private _isSnapping = false
  private _hidden = false
  private _menuHidden = false
  
  private _height = 0
  private _snapTimer = 0
  private _minHeight = 0
  private _maxHeight = 0
  private _dragStartY = 0
  private _fixedHeight = 0
  private _settleTimer = 0
  private _activeIndex = -1
  private _paddingBottom = 0
  private _dragStartHeight = 0

  private _resizeObserver!: ResizeObserver
  private _mediaQuery!: MediaQueryList
  private _stageEl: HTMLElement | null = null

  private _channel = new PoiChannelController(
    this,
    () => this.channel,
    {
      onSelect: () => this._setHidden(true),
      onClear: () => this._setHidden(false),
    }
  )

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
    this._detachScrollSpy()
  }

  protected firstUpdated(): void {
    this._resizeObserver = new ResizeObserver(() => this._measure())
    this._stageEl ??= this._resolveStage()
    if (this._stageEl) this._resizeObserver.observe(this._stageEl)
    this._measure()
    this._syncScrollSpy()
  }

  updated() {
    this._applyHeight()
  }

  render() {
    return html`
      <div class="c-swipe">
        ${this._isMobile ? html`
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
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `
  }

  private _applyHeight() {
    if (this._isMobile) {
      this.style.height = `${this._height}px`
      this.classList.toggle('is-collapsed', this._isCollapsed())
      this.classList.toggle('is-hidden', this._hidden)
    } else {
      this.style.height = ''
      this.classList.remove('is-collapsed')
      this.classList.remove('is-hidden')
    }

    this._syncMenu()
  }

  private _getHostStyles(): { paddingTop: number, paddingBottom: number } {
    const hostStyle = getComputedStyle(this)

    const paddingTop = parseInt(hostStyle.paddingTop) || 0
    const paddingBottom = parseInt(hostStyle.paddingBottom) || 0

    return { paddingTop, paddingBottom }
  }

  // The app menu should get out of the way whenever the sheet occupies the
  // bottom (collapsed) or is dismissed for a selection (hidden). We broadcast
  // that intent so c-menu can hide itself — no cross-component styling.
  private _syncMenu() {
    const hidden = this._isMobile && (this._hidden || this._isCollapsed())

    if (hidden === this._menuHidden) return

    this._menuHidden = hidden
    this._channel.dispatch<MenuToggleEventDetail>(MENU_TOGGLE_EVENT, { hidden, source: this })
  }

  // Hidden while a POI is selected (poi-select) and restored on poi-clear
  private _setHidden(hidden: boolean) {
    if (this._hidden === hidden) return
    this._hidden = hidden
    this._applyHeight()
  }

  private _onBreakpointChange = (ev: MediaQueryListEvent) => {
    this._isMobile = !ev.matches
    this._measure()
    this._syncScrollSpy()
  }

  private _onSlotChange = () => {
    this._measure()
    this._syncScrollSpy()
  }

  private _getItems(): HTMLElement[] {
    const wrapper = this._slot?.assignedElements()[0] as HTMLElement | undefined

    return wrapper ? Array.from(wrapper.children) as HTMLElement[] : []
  }

  private _syncScrollSpy() {
    this._detachScrollSpy()

    if (!this._isMobile || !this.channel || !this._contentEl) return

    this._contentEl.addEventListener('scroll', this._onScroll, { passive: true })
    this._emitActiveIndex()
  }

  private _detachScrollSpy() {
    this._contentEl?.removeEventListener('scroll', this._onScroll)
    window.clearTimeout(this._settleTimer)
    window.clearTimeout(this._snapTimer)
    this._isSnapping = false
  }

  private _onScroll = () => {
    if (this._isSnapping) return

    window.clearTimeout(this._settleTimer)
    this._settleTimer = window.setTimeout(() => this._onSettle(), CSwipe.SETTLE_DELAY)
  }

  private _onSettle() {
    const index = this._computeActiveIndex()

    if (index < 0) return

    if (this._isCollapsed()) {
      this._centerItem(index)
    }

    this._emitActiveIndex(index)
  }

  private _isCollapsed(): boolean {
    return this._height <= this._minHeight + 1
  }

  private _centerItem(index: number) {
    if (!this._contentEl) return

    const item = this._getItems()[index]

    if (!item) return

    const itemRect = item.getBoundingClientRect()
    const viewport = this._contentEl.getBoundingClientRect()
    const delta = (itemRect.top + itemRect.height / 2) - (viewport.top + viewport.height / 2)

    if (Math.abs(delta) < 1) return

    this._isSnapping = true
    window.clearTimeout(this._snapTimer)
    this._snapTimer = window.setTimeout(() => { this._isSnapping = false }, 600)

    this._contentEl.scrollTo({ top: this._contentEl.scrollTop + delta, behavior: 'smooth' })
  }

  private _computeActiveIndex(): number {
    if (!this._contentEl) return -1

    const items = this._getItems()

    if (!items.length) return -1

    const viewport = this._contentEl.getBoundingClientRect()
    let bestIndex = -1
    let bestVisible = 0

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect()
      const visible = Math.min(rect.bottom, viewport.bottom) - Math.max(rect.top, viewport.top)

      if (visible > bestVisible) {
        bestVisible = visible
        bestIndex = index
      }
    })

    return bestIndex
  }

  private _emitActiveIndex(index = this._computeActiveIndex()) {
    if (index < 0 || index === this._activeIndex) return

    this._activeIndex = index
    const item = this._getItems()[index] as HTMLElement | undefined
    this._channel.dispatch<DayActiveEventDetail>(DAY_ACTIVE_EVENT, {
      value: item?.dataset.marker ?? '',
      source: this
    })
  }

  private _resolveStage(): HTMLElement | null {
    if (this.stage) return this.closest<HTMLElement>(this.stage)
    return (this.offsetParent as HTMLElement | null) ?? this.parentElement
  }

  private _measure() {
    if (!this._isMobile) return

    this._stageEl ??= this._resolveStage()
    this._maxHeight = this._stageEl?.clientHeight || this.getBoundingClientRect().height

    const wrapper = this._slot?.assignedElements()[0] as HTMLElement | undefined
    const firstCard = wrapper?.firstElementChild as HTMLElement | undefined

    if (firstCard) {
      const { paddingTop, paddingBottom } = this._getHostStyles()
      const handleHeight = this._handleEl ? this._handleEl.offsetHeight + parseInt(getComputedStyle(this._handleEl).marginBottom) : 0

      this._fixedHeight = paddingTop + handleHeight + firstCard.offsetHeight
      this._minHeight = this._fixedHeight + paddingBottom
    } else {
      this._minHeight = this._maxHeight * 0.2
    }

    if (this._height === 0 || this._height < this._minHeight) {
      this._height = this._minHeight
    }

    this._height = clamp(this._height, this._minHeight, this._maxHeight)
    this._applyHeight()
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
    this._applyHeight()
  }

  private _onPointerUp = () => {
    if (!this._isDragging) return
    this._isDragging = false
    this.classList.remove('is-dragging')

    this._minHeight = this._fixedHeight + this._getHostStyles().paddingBottom

    const mid = (this._minHeight + this._maxHeight) / 2
    this._height = this._height > mid ? this._maxHeight : this._minHeight
    this._applyHeight()
  }
}
