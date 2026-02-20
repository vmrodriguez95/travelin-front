import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// Types
import type { FormSchema } from '@web/types/form'

import styles from './c-form.style.scss?inline'

@customElement('c-form')
export class CForm extends LitElement {

  @property({ type: String }) action = ''

  @property({ type: String }) method = ''

  @property({ type: Object }) data!: FormSchema

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <div class="c-form">
        
      </div>
    `
  }
}