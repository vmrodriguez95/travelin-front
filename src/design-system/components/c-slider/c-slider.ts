import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

// Styles
import styles from './c-slider.style.scss?inline'

@customElement('c-slider')
export class CSlider extends LitElement {

  @property({ type: String }) prevText = 'Ir a la diapositiva anterior'

  @property({ type: String }) nextText = 'Ir a la diapositiva siguiente'

  @property({ type: String }) itemText = 'Ir a la diapositiva'

  @state() _slideCounter: number = 0

  @state() _actualSlide: number = 0

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <div class="c-slider" aria-live="polite">
        <div class="c-slider__content">
          <slot @slotchange=${this._updateSlideCounter}></slot>
        </div>
        ${when(this._slideCounter > 1, () => html`
          <div class="c-slider__actions">
            <button
              class=${this._getArrowLeftClasses(this._actualSlide - 1)}
              type="button"
              ?disabled=${this._actualSlide === 0}
              @click=${this._arrowLeftAction}
              aria-label=${this.prevText}
            >
              <e-icon icon="arrow-left" size="l"></e-icon>
            </button>
            ${Array.from({ length: this._slideCounter }, (_, i) => html`
              <button
                class=${this._getSlideButtonClasses(i)}
                type="button"
                @click=${() => this._goToSlide(i)}
                aria-label="${this.itemText} ${i + 1}"
                aria-current=${i === this._actualSlide ? 'true' : 'false'}
              ></button>
            `)}
            <button
              class=${this._getArrowRightClasses(this._actualSlide + 1)}
              type="button"
              ?disabled=${this._actualSlide === this._slideCounter - 1}
              @click=${this._arrowRightAction}
              aria-label=${this.nextText}
            >
              <e-icon icon="arrow-right" size="l"></e-icon>
            </button>
          </div>
        `)}
      </div>
    `
  }

  private _updateSlideCounter(e: Event) {
    const childNodes = (e.target as HTMLSlotElement).assignedElements({ flatten: true })

    this._slideCounter = childNodes.length
  }

  private _getArrowLeftClasses(index: number) {
    return classMap({
      'c-slider__arrow': true,
      'c-slider__arrow--disabled': index < 0
    })
  }

  private _getArrowRightClasses(index: number) {
    return classMap({
      'c-slider__arrow': true,
      'c-slider__arrow--disabled': index === this._slideCounter
    })
  }

  private _getSlideButtonClasses(index: number) {
    return classMap({
      'c-slider__action': true,
      'c-slider__action--active': index === this._actualSlide
    })
  }

  private _goToSlide(index: number) {
    this._actualSlide = index

    const content = this.shadowRoot?.querySelector('.c-slider__content') as HTMLElement

    if (content) {
      content.style.transform = `translateX(-${index * 100}%)`
    }
  }

  private _arrowRightAction() {
    if (this._actualSlide === this._slideCounter - 1) return

    this._actualSlide++

    this._goToSlide(this._actualSlide)
  }

  private _arrowLeftAction() {
    if (this._actualSlide === 0) return

    this._actualSlide--

    this._goToSlide(this._actualSlide)
  }

  reset() {
    this._actualSlide = 0

    this._goToSlide(this._actualSlide)
  }
}
