import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

import styles from './c-header.style.scss?inline'

@customElement('c-header')
export class CHeader extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) bg = ''

  @property({ type: String }) url = ''

  @property({ type: String }) heading = ''

  @property({ type: String }) subheading = ''

  @property({ type: String }) complement = ''

  @property({ type: Boolean }) animated = false

  @query('.c-header') _header!: HTMLElement

  _headerInitialHeight = 0

  connectedCallback(): void {
    super.connectedCallback()

    if (this.animated) {
      window.addEventListener('scroll', this._onScroll.bind(this))
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this._headerInitialHeight = this._header.getBoundingClientRect().height
  }

  render() {
    const classes = classMap({
      'c-header': true,
      'c-header--bg': this.bg
    })

    return html`
      <section class=${classes}>
        ${when(this.bg, () => html`
          <img class="c-header__background" src=${this.bg} alt="Picture about ${this.heading}" loading="lazy" height="240" width="1500" />
        `)}
        <div class="c-header__content">
          ${when(this.url, () => html`
            <a class="c-header__link" href=${this.url} title="Ir atrás">
              <e-icon icon="arrow-left" size="l"></e-icon>
            </a>
          `)}
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
        <div class="c-header__actions">
          <slot></slot>
        </div>
      </section>
    `
  }

  _onScroll() {
    const header = this._header
    const scrollY = window.scrollY

    header.style.height = `${this._headerInitialHeight - scrollY}px`
  }
}