import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

import styles from './c-modal.style.scss?inline'

@customElement('c-modal')
export class CModal extends LitElement {

  @property({ type: String }) id = 'modal'

  @property({ type: String }) close = 'Cerrar modal'

  @query('dialog') _dialog!: HTMLDialogElement

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <dialog class="c-modal" aria-modal="true">
        <div class="c-modal__content">
          <button class="c-modal__close" type="button" @click=${this.closeModal} aria-label=${this.close}>
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

    this._syncA11yReferences()
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
      fetchElement.addEventListener('fetch-success', () => {
        this.closeModal()
      })
    }
  }

  private _syncA11yReferences() {
    const titleElement = this.querySelector('[slot="title"]') as HTMLElement | null
    const descriptionElement = this.querySelector('[slot="description"]') as HTMLElement | null

    this._setA11yElement('title', titleElement)
    this._setA11yElement('description', descriptionElement)
  }

  private _setA11yElement(type: string, element: HTMLElement | null) {
    if (element) {
      const id = `${this.id}-${type}`

      element.id = id
      this._dialog.setAttribute('aria-describedby', id)
    } else {
      this._dialog.removeAttribute('aria-describedby')
    }
  }
}
