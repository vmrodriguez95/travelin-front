import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

// Types
import type { CModal } from '@ds/components/c-modal/c-modal'

import styles from './e-modal-trigger.style.scss?inline'

@customElement('e-modal-trigger')
export class EModalTrigger extends LitElement {

  @property({ type: String, reflect: true }) modal = ''

  _template!: HTMLTemplateElement

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback(): void {
    this._template = this.querySelector('template') as HTMLTemplateElement

    super.connectedCallback()
  }

  render() {
    return html`
      <button class="e-modal-trigger" @click=${this._openModal}>
        <slot />
      </button>
    `
  }

  private _openModal() {
    const modal = document.getElementById(this.modal) as CModal

    if (modal) modal.showModal(this._template)
  }
}