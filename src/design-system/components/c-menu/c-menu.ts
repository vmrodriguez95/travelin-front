import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement } from 'lit/decorators.js'

import styles from './c-menu.style.scss?inline'

@customElement('c-menu')
export class CMenu extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
    <div class="c-menu">
      <slot name="logo" />
        
        <slot name="nav" />
        
        <slot name="profile" />
      </div>
    `
  }
}