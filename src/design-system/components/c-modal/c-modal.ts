import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, query } from 'lit/decorators.js'

import styles from './c-modal.style.scss?inline'

@customElement('c-modal')
export class CModal extends LitElement {

  @query('dialog') _dialog!: HTMLDialogElement

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <dialog class="c-modal">
        <div class="c-modal__content">
          <button class="c-modal__close" @click=${this.closeModal}>
            <e-icon icon="close" size="l"></e-icon>
          </button>
          <slot name="title"></slot>
          <slot name="description"></slot>
          <slot></slot>
        </div>
      </dialog>
    `
  }

  firstUpdated() {
    this._dialog.addEventListener('click', (e) => {
      if (e.target === this._dialog) this.closeModal()
    })

    this._dialog.addEventListener('cancel', (event) => {
      event.preventDefault()
      this.closeModal()
    })
  }

  showModal(template: HTMLTemplateElement) {
    this.innerHTML = ''
    this.appendChild(template.content.cloneNode(true))

    this._detectFetchElement()

    this._dialog.showModal()
  }

  closeModal() {
    this._dialog.classList.add('is-closing')

    setTimeout(() => {
      this._dialog.close()
      this._dialog.classList.remove('is-closing')
    }, 201)
  }

  private _detectFetchElement() {
    const fetchElement = this.querySelector('e-fetch')

    if (fetchElement) {
      fetchElement.addEventListener('success', () => {
        this.closeModal()
      })
    }
  }
}