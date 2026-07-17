import { LitElement, html, type PropertyValues } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'

// Types
import type { Friend } from './c-friends-list.types'
import type { FilterChangeDetail } from '../c-filter/c-filter.types'

@customElement('c-friends-list')
export class CFriendsList extends LitElement {

  @state() private _friends?: Array<Friend>

  private _hydrated = false

  private _onFilterChange = (ev: Event) => {
    this._friends = (ev as CustomEvent<FilterChangeDetail>).detail.data as Array<Friend>
  }

  // Light DOM so the global `ti-*` composition styles apply to the list.
  createRenderRoot() {
    return this
  }

  connectedCallback(): void {
    super.connectedCallback()

    document.addEventListener('filter:change', this._onFilterChange)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()

    document.removeEventListener('filter:change', this._onFilterChange)
  }

  // Keep the server-rendered list untouched until the user interacts with the
  // filter. `_friends` stays undefined until the first `filter:change` event.
  shouldUpdate(): boolean {
    return this._friends !== undefined
  }

  // On the first client render, drop the server-rendered list so lit renders a
  // fresh one in its place instead of appending after it.
  protected update(changed: PropertyValues): void {
    if (!this._hydrated) {
      this._hydrated = true
      this.replaceChildren()
    }

    super.update(changed)
  }

  render() {
    return html`
      <ul class="ti-friends__list">
        ${this._friends && this._friends.length
          ? map(this._friends, (friend) => this._renderFriend(friend))
          : html`<li class="ti-friends__empty">No hay amigos que coincidan con tu búsqueda.</li>`}
      </ul>
    `
  }

  private _renderFriend(friend: Friend) {
    return html`
      <li class="ti-friends__item">
        <div class="ti-friend-item">
          <div class="ti-friend-item__head">
            ${friend.image ? html`
              <picture class="ti-friend-item__image">
                <img class="u-image--responsive" src=${friend.image} alt=${friend.name} width="40" height="40" />
              </picture>
            ` : ''}
            <span class="ti-friend-item__text">${friend.name}</span>
          </div>
          <p class="ti-friend-item__date">${friend.date}</p>
          <p class="ti-friend-item__text"><small class="ti-friend-item__small">Último viaje juntos:</small> ${friend.lastTravel}</p>
          <p class="ti-friend-item__text"><span class="ti-friend-item__status ti-friend-item__status--${this._statusModifier(friend.status)}"></span> ${friend.status}</p>
          <div class="ti-friend-item__actions">
            <e-fetch action="/api/poi.json" method="DELETE" icon="delete" color="dark" size="fit">
              <e-icon icon="delete" size="m"></e-icon>
            </e-fetch>
          </div>
        </div>
      </li>
    `
  }

  private _statusModifier(status: string): string {
    if (status === 'Activo') return 'green'
    if (status === 'Pendiente') return 'yellow'

    return 'red'
  }
}
