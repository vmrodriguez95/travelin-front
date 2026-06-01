import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { when } from 'lit/directives/when.js'

import styles from './e-achievement.style.scss?inline'

@customElement('e-achievement')
export class EAchievement extends LitElement {

  @property({ type: String }) icon = ''

  @property({ type: String }) color = ''

  @property({ type: Number }) actual = 0

  @property({ type: Number }) total = 0

  static styles = css`${unsafeCSS(styles)}`

  render() {
    const styles = {}
    if (this.color) {
      Object.defineProperty(styles, '--border-color', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: `var(--color-${this.color})`
      })
    }

    return html`
      <div class="e-achievement" style=${styleMap(styles)}>
        <div class="e-achievement__icon">
          <e-icon icon=${this.icon} size="xxl"></e-icon>
        </div>
        <slot name="title"></slot>
        <div class="e-achievement__end">
          ${when(this.actual < this.total, () => html`
            <p class="e-achievement__text">${this.actual} / ${this.total}</p>
          `)}
          <slot name="text"></slot>
        </div>
      </div>
    `
  }
}
