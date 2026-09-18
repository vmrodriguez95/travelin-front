import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, queryAssignedElements } from 'lit/decorators.js'

// Types
import type { CModal } from '@ds/components/c-modal/c-modal'
import type { PoiChannelData } from '@ds/utils/poi-channel.utils'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'
import { DataUpdateController } from '@ds/controllers/data-update.controller'
import {
  POI_SELECT_EVENT,
  MODAL_OPEN_EVENT,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

import styles from './e-modal-trigger.style.scss?inline'

@customElement('e-modal-trigger')
export class EModalTrigger extends LitElement {

  @property({ type: String, reflect: true }) modal = ''

  // With a channel the trigger no longer clones a template: it announces the
  // item (`data`) so a modal, a resume and a form already on the page react
  // to it. One modal then serves every trigger.
  @property({ type: String }) channel = ''

  @property({ type: Object }) data: PoiChannelData | null = null

  @queryAssignedElements({ selector: 'template' }) _templates!: Array<HTMLElement>

  private _channel = new ChannelController(this, () => this.channel, {})

  // The snapshot announced must be the current one, so it follows the
  // page-wide updates of its record.
  private _dataUpdate = new DataUpdateController(this, () => this.data, (data) => { this.data = data })

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <button class="e-modal-trigger" @click=${this._openModal}>
        <slot />
      </button>
    `
  }

  private _openModal(ev: Event) {
    ev.stopPropagation()

    if (this.channel) {
      this._openByChannel()
      return
    }

    const modal = document.getElementById(this.modal) as CModal

    if (modal) modal.showModal(this._templates[0] as HTMLTemplateElement)
  }

  private _openByChannel() {
    if (this.data) {
      this._channel.dispatch<PoiSelectEventDetail>(POI_SELECT_EVENT, {
        data: this.data,
        source: this,
        view: 'resume'
      })
    }

    this._channel.dispatch(MODAL_OPEN_EVENT)
  }
}
