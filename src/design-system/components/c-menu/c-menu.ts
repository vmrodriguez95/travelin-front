import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import { MENU_TOGGLE_EVENT, type MenuToggleEventDetail } from '@ds/utils/poi-channel.utils'

import styles from './c-menu.style.scss?inline'

@customElement('c-menu')
export class CMenu extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) channel = ''

  private _channel = new ChannelController(
    this,
    () => this.channel,
    {
      [MENU_TOGGLE_EVENT]: (detail: MenuToggleEventDetail) => this._toggleHideMenu(detail),
    }
  )

  render() {
    return html`
      <div class="c-menu">
        <slot name="logo"></slot>
        <nav>
          <ul class="c-menu__list">
            <slot name="links"></slot>
          </ul>
        </nav>
        <slot name="profile"></slot>
      </div>
    `
  }

  private _toggleHideMenu = (detail: MenuToggleEventDetail) => {
    this.classList.toggle('is-hidden', detail.hidden)
  }
}
