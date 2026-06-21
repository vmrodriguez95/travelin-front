import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// Mixins
import { Responsive } from '@ds/mixins/responsive'

// Styles
import styles from './e-stat.style.scss?inline'

@customElement('e-stat')
export class EStat extends Responsive(LitElement) {

  @property({ type: String }) icon = ''

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <div class="e-stat">
        <e-icon class="e-stat__icon" icon=${this.icon} size=${this._getIconSize()}></e-icon>
        <div class="e-stat__content">
          <slot name="text"></slot>
          <slot name="title"></slot>
        </div>
      </div>
    `
  }

  private _getIconSize() {
    switch (this.breakpoint) {
      case 'sm':
        return 'l'
      case 'md':
        return 'xl'
      case 'lg':
      case 'xl':
        return 'xxl'
      default:
        return 'xxl'
    }
  }
}
