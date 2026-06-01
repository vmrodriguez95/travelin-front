import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

// Styles
import styles from './c-card-progress.style.scss?inline'

@customElement('c-card-progress')
export class CCardProgress extends LitElement {

  @property({ type: Number }) progress = 0

  static styles = css`${unsafeCSS(styles)}`

  render() {
    const classes = classMap({
      'c-card-progress': true,
      'c-card-progress--completed': this.progress === 100
    })

    return html`
      <div class=${classes}>
        <slot name="image"></slot>
        <div class="c-card-progress__content">
          <slot name="title"></slot>
          <slot name="text"></slot>
          ${when(this.progress < 100, () => html`
            <div class="c-card-progress__wrapper">
              <div class="c-card-progress__bar">
                <div class="c-card-progress__progress" style="width: ${this.progress}%;"></div>
              </div>
              <span class="c-card-progress__text">${this.progress}%</span>
            </div>
          `)}
        </div>
        <div class="c-card-progress__end">
          <slot name="status"></slot>
        </div>
      </div>
    `
  }

}
