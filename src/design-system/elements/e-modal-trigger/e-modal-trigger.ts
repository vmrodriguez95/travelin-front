import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query, queryAssignedElements } from 'lit/decorators.js'

// Types
import type { CModal } from '@ds/components/c-modal/c-modal'

import styles from './e-modal-trigger.style.scss?inline'

@customElement('e-modal-trigger')
export class EModalTrigger extends LitElement {

  @property({ type: String, reflect: true }) modal = ''

  // _template!: HTMLTemplateElement

  @queryAssignedElements({ selector: 'template' }) _templates!: Array<HTMLElement>

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <button class="e-modal-trigger" @click=${this._openModal}>
        <slot />
      </button>
    `
  }

  private _openModal() {
    const modal = document.getElementById(this.modal) as CModal

    if (modal) modal.showModal(this._templates[0] as HTMLTemplateElement)
  }
}