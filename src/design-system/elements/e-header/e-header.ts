import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

import styles from './e-header.style.scss?inline'

@customElement('e-header')
export class EButton extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) bg = ''

  @property({ type: String }) url = ''

  @property({ type: String }) heading = ''

  @property({ type: String }) subheading = ''

  render() {
    const classes = classMap({
      'e-header': true,
      'e-header--bg': this.bg
    })

    return html`
      <section class=${classes}>
        ${when(this.bg, () => html`
          <img class="e-header__background" src=${this.bg} alt="Picture about ${this.heading}" />
        `)}
        <div class="e-header__content">
          ${when(this.url, () => html`
            <a class="e-header__link" href=${this.url} title="Ir atrás">
              <e-icon icon="arrow-left" size="l"></e-icon>
            </a>
          `)}
          <h1 class="e-header__title">${this.heading}</h1>
          ${when(this.subheading, () => html`
            <p class"e-header__subtitle">${this.subheading}</p>
          `)}
        </div>
      </section>
    `
  }
}