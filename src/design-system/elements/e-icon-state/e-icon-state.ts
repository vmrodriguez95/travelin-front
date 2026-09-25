import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// Types
import type { PoiChannelData } from '@ds/utils/poi-channel.utils'

// Controllers
import { DataUpdateController } from '@ds/controllers/data-update.controller'

// Utils
import { DATA_UPDATE_EVENT } from '@ds/utils/data-update.utils'
import { findHolderData, whenHoldersDefined } from '@ds/utils/data-holder.utils'

import styles from './e-icon-state.style.scss?inline'

// An icon that tells whether a field of an item holds something (a POI saved
// in collections: bookmark vs bookmark-filled). The item is its own `data`
// or, inside a card, the card's copy, and it follows page-wide updates.
@customElement('e-icon-state')
export class EIconState extends LitElement {

  @property({ type: String }) icon = ''

  @property({ type: String }) activeIcon = ''

  @property({ type: String }) field = ''

  @property({ type: String }) size = ''

  @property({ type: Object }) data: PoiChannelData | null = null

  private _dataUpdate = new DataUpdateController(this, () => this.data, (data) => { this.data = data })

  static styles = css`${unsafeCSS(styles)}`

  connectedCallback() {
    super.connectedCallback()

    document.addEventListener(DATA_UPDATE_EVENT, this._onDataUpdate)
    whenHoldersDefined(this).then(() => this.requestUpdate())
  }

  disconnectedCallback() {
    document.removeEventListener(DATA_UPDATE_EVENT, this._onDataUpdate)
    super.disconnectedCallback()
  }

  render() {
    return html`
      <e-icon icon=${this._isActive ? this.activeIcon : this.icon} size=${this.size}></e-icon>
    `
  }

  private get _isActive(): boolean {
    const data = (this.data ?? findHolderData(this)) as Record<string, unknown> | null
    const value = data?.[this.field]

    return Array.isArray(value) ? value.length > 0 : Boolean(value)
  }

  // The card merges the same announcement in its own listener, which may run
  // after this one; reading it once every listener is done sees the result.
  private _onDataUpdate = () => {
    queueMicrotask(() => this.requestUpdate())
  }
}
