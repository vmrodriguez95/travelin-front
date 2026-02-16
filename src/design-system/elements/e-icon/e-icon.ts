import { LitElement, html, css, unsafeCSS } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { property, customElement } from 'lit/decorators.js'

import { EICON_LIST } from './e-icon.list'

import style from './e-icon.style.scss?inline'

@customElement('e-icon')
export class EIcon extends LitElement {
  /**
   * Sets custom props
   */
  @property({ type: String }) icon = ''

  @property({ type: String }) strokewidth = undefined

  @property({ type: String }) size = ''

  /**
   * Renders scoped styles
   */
  static styles = css`${unsafeCSS(style)}`

  /**
   * Renders template
   */
  render() {
    const classes = { 'e-icon': true, 'hover': true }
    if (this.size) {
      Object.defineProperty(classes, `e-icon--${this.size}`, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: true
      })
    }

    const styles = {}
    if (this.strokewidth) {
      Object.defineProperty(styles, '--eIconStrokeWidth', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: `${this.strokewidth}px`
      })
    }

    return html`
      <div class=${classMap(classes)} style=${styleMap(styles)}>
        ${unsafeSVG(EICON_LIST[this.icon])}
      </div>
    `
  }
}
