import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

// Mixins
import { Responsive } from '@ds/mixins/responsive'

// Styles
import styles from './c-header.style.scss?inline'

@customElement('c-header')
export class CHeader extends Responsive(LitElement) {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) bg = ''
  @property({ type: String }) url = ''
  @property({ type: String }) openA11y = ''
  @property({ type: String }) backA11y = ''
  @property({ type: String }) heading = ''
  @property({ type: String }) subheading = ''
  @property({ type: String }) complement = ''

  @state() _menuOpened = false

  _menuBreakpointsAllowed = ['sm', 'md', 'lg']

  render() {
    const classes = classMap({
      'c-header': true,
      'c-header--bg': this.bg !== ''
    })

    const sheetClasses = classMap({
      'c-header__sheet': true,
      'c-header__sheet--open': this._menuOpened
    })

    return html`
      <section class=${classes}>
        ${when(this.bg, () => html`
          <picture class="c-header__background">
            <img class="c-header__image" src=${this.bg} alt="Picture about ${this.heading}" loading="lazy" height="240" width="1500" />
          </picture>
        `)}
        <div class="c-header__wrapper">
          ${when(this.url, () => html`
            <a class="c-header__link" href=${this.url} title=${this.backA11y}>
              <e-icon icon="arrow-left" size=${this._isSmallSize() ? 'm' : 'l'}></e-icon>
            </a>
          `)}
          <div class="c-header__info">
            <h1 class="c-header__title">${this.heading}</h1>
            ${when(this.subheading, () => html`
              <p class="c-header__subtitle">
                <e-icon icon="calendar" size="s"></e-icon> ${this.subheading}
                ${when(this.complement, () => html`
                  <span class="c-header__separator">·</span> <e-icon icon="group" size="s"></e-icon> ${this.complement}
                `)}
              </p>
            `)}
          </div>
          ${when(this._isSmallSize(), () => html`
            <div class="c-header__menu">
              <button class="c-header__opener" type="button" @click=${this._openMenu} aria-label=${this.openA11y}>
                <e-icon icon="menu" size=${this._isSmallSize() ? 'm' : 'l'}></e-icon>
              </button>
              <div class=${sheetClasses}>
                <slot></slot>
              </div>
            </div>
          `, () => html`
            <div class="c-header__actions">
              <slot></slot>
            </div>
          `)}
        </div>
      </section>
    `
  }

  private _isSmallSize(): Boolean {
    return this._menuBreakpointsAllowed.includes(this.breakpoint)
  }

  private _openMenu() {
    this._menuOpened = !this._menuOpened
  }
}