import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import styles from './e-notification.style.scss?inline'

@customElement('e-notification')
export class ENotification extends LitElement {

  @property({ type: String }) type = 'info' // 'success' | 'warning' | 'error' | info

  @state() _loaded = false

  @state() _closing = false

  static styles = css`${unsafeCSS(styles)}`

  protected firstUpdated(_changedProperties: PropertyValues): void {
    setTimeout(() => {
      this._loaded = true
    }, 100)
  }

  render() {
    const classes = classMap({
      'e-notification': true,
      'e-notification--show': this._loaded,
      'e-notification--closing': this._closing,
      [`e-notification--${this.type}`]: this.type
    })

    return html`
      <div class=${classes}>
        <button class="e-notification__close" type="button" @click=${this._close}>
          <e-icon icon="close" size="s"></e-icon>
        </button>
        <e-icon icon=${this._getIcon()} size="l"></e-icon> <slot></slot>
      </div>
    `
  }

  private _getIcon() {
    switch (this.type) {
      case 'success':
        return 'check-circle'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'info'
    }
  }

  private _close() {
    this._closing = true
    setTimeout(() => this.remove(), 400)
  }
}
