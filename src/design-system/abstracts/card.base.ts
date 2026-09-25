import { LitElement } from 'lit'
import { property, state } from 'lit/decorators.js'

// Types
import type { PoiChannelData, PoiChannelView } from '@ds/utils/poi-channel.utils'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import {
  POI_CLEAR_EVENT,
  POI_HOVER_CLEAR_EVENT,
  POI_HOVER_EVENT,
  POI_MOVE_EVENT,
  POI_REMOVE_EVENT,
  POI_SELECT_EVENT,
  type PoiHoverEventDetail,
  type PoiMoveEventDetail,
  type PoiRemoveEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'
import { scrollIntoNearestVerticalContainer, scrollToPageEnd } from '@ds/utils/action.utils'

// Requests
import { FetchSuccessEvent } from '@ds/requests/fetch-success.event'

// Mixins
import { Responsive } from '@ds/mixins/responsive'

// A card that stands for one item of a channel: it announces the item when
// clicked or hovered, follows the selection made elsewhere (map, detail) and
// leaves the list when a request about its item succeeds. Subclasses render
// the body and say which view the item opens in.
export abstract class CardBase<T extends PoiChannelData> extends Responsive(LitElement) {

  @property({ type: Object }) data!: T

  @property({ type: String }) icon = ''

  @property({ type: String }) channel = ''

  @property({ type: String }) menu = ''

  @property({ type: Boolean, reflect: true }) active = false

  @state() actionsShowed = false

  protected _isSelectedData = false

  protected _channel = new ChannelController(
    this,
    () => this.channel,
    {
      [POI_SELECT_EVENT]: (detail) => this._onSelectionChange(detail),
      [POI_CLEAR_EVENT]: () => this._onSelectionClear(),
    }
  )

  // The element that takes focus when the item is selected from elsewhere.
  protected abstract _getCardElement(): HTMLElement | null

  // Where the item opens when the card is clicked.
  protected abstract _getSelectView(): PoiChannelView

  connectedCallback() {
    super.connectedCallback()

    document.addEventListener(FetchSuccessEvent.type, this._onFetchSuccess as EventListener)
  }

  disconnectedCallback() {
    document.removeEventListener(FetchSuccessEvent.type, this._onFetchSuccess as EventListener)

    super.disconnectedCallback()
  }

  protected _onKeydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      this._onClick()
    }
  }

  protected _onClick = () => {
    this._channel.dispatch<PoiSelectEventDetail>(POI_SELECT_EVENT, {
      data: this.data,
      source: this,
      view: this._getSelectView()
    })

    scrollToPageEnd()
  }

  protected _onHoverStart = () => {
    this._channel.dispatch<PoiHoverEventDetail>(POI_HOVER_EVENT, {
      data: this.data,
      source: this
    })
  }

  protected _onHoverEnd = () => {
    this._channel.dispatch(POI_HOVER_CLEAR_EVENT, { source: this })
  }

  protected _showActions(ev: Event) {
    ev.stopPropagation()
    this.actionsShowed = !this.actionsShowed
  }

  // How the card leaves the DOM; a subclass may animate it first.
  protected _removeFromDOM() {
    this.remove()
  }

  // Only a request that says so moves the item; anything else removed it.
  private _isMoveRequest(ev: Event) {
    return ev instanceof FetchSuccessEvent && ev.intent === 'move'
  }

  // The id the requester says it acted on wins; the answer's own id is the
  // fallback for requests that carry no item (a cloned delete template).
  private _getSubjectId(ev: Event): string | undefined {
    if (ev instanceof FetchSuccessEvent && ev.subjectId) return ev.subjectId

    return (ev as CustomEvent).detail?.data?.id
  }

  private _onFetchSuccess = (ev: Event) => {
    if (this._getSubjectId(ev) !== this.data.id) return

    const detail = { data: this.data, source: this }

    if (this._isMoveRequest(ev)) {
      this._channel.dispatch<PoiMoveEventDetail>(POI_MOVE_EVENT, detail)
    } else {
      this._channel.dispatch<PoiRemoveEventDetail>(POI_REMOVE_EVENT, detail)
    }

    if (this._isSelectedData) {
      this._channel.dispatch(POI_CLEAR_EVENT)
    }

    this._removeFromDOM()
  }

  private async _focusSelectedCard() {
    await this.updateComplete

    scrollIntoNearestVerticalContainer(this)
    this._getCardElement()?.focus({ preventScroll: true })
  }

  private _onSelectionChange(detail: PoiSelectEventDetail) {
    this._isSelectedData = detail.data.id === this.data.id
    this.active = this._isSelectedData

    if (this._isSelectedData && detail.source !== this) {
      this._focusSelectedCard()
    }
  }

  private _onSelectionClear() {
    this._isSelectedData = false
    this.active = false
  }
}
