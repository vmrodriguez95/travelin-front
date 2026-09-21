import { html } from 'lit'
import { customElement } from 'lit/decorators.js'

// Types
import type { Friend } from './c-friends-list.types'

// Abstracts
import { FilteredListBase } from '@ds/abstracts/filtered-list.base'

@customElement('c-friends-list')
export class CFriendsList extends FilteredListBase<Friend> {

  protected _getListClass() {
    return 'ti-friends__list'
  }

  protected _getEmptyClass() {
    return 'ti-friends__empty'
  }

  protected _getEmptyMessage() {
    return 'No hay amigos que coincidan con tu búsqueda.'
  }

  protected _renderItem(friend: Friend) {
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
            <e-fetch action=${this.action} method="DELETE" icon="delete" color="dark" size="fit">
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
