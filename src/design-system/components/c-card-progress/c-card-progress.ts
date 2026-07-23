import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'

// Styles
import styles from './c-card-progress.style.scss?inline'

@customElement('c-card-progress')
export class CCardProgress extends LitElement {

  @property({ type: Number }) value = 0

  @property({ type: Number }) total = 0

  @property({ type: Boolean }) animated = false

  _progress = 0

  static styles = css`${unsafeCSS(styles)}`

  render() {
    const classes = classMap({
      'c-card-progress': true,
      'c-card-progress--completed': this.value === this.total,
      'c-card-progress--animated': this.animated
    })

    return html`
      <div class=${classes}>
        <slot name="image"></slot>
        <div class="c-card-progress__content">
          <slot name="title"></slot>
          <slot name="text"></slot>
          ${when(this.value < this.total, () => html`
            <e-progress-bar value=${this.value} total=${this.total} showPercentage></e-progress-bar>
          `)}
        </div>
        <div class="c-card-progress__end">
          <slot name="status"></slot>
        </div>
      </div>
    `
  }

}
