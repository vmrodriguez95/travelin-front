import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import styles from './c-card-image.style.scss?inline'

@customElement('c-card-image')
export class CCardImage extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) image = ''

  @property({ type: String }) name = ''

  @property({ type: String }) start = ''

  @property({ type: String }) end = ''

  render() {
    return html`
      <div class="c-card-image">
        <img class="c-card-image__background" src=${this.image} alt="Picture about ${this.name}" loading="lazy" />
        <div class="c-card-image__content">
          <p class="c-card-image__title">${this.name}</p>
          <p class="c-card-image__date">${this.start} - ${this.end}</p>
        </div>
      </div>
    `
  }
}