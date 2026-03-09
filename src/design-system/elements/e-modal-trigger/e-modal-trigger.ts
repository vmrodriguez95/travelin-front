import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import styles from './e-modal-trigger.style.scss?inline'

@customElement('e-modal-trigger')
export class EModalTrigger extends LitElement {

  @property({ type: String, reflect: true }) modal = ''

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <button class="e-modal-trigger" @click=${this._openModal}>
        <slot />
      </button>
    `
  }

  private _openModal() {
    const modal = document.getElementById(this.modal) as HTMLDialogElement

    if (modal) modal.showModal()
  }
}