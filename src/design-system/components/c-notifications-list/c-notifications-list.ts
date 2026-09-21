import { html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

// Types
import type { Notification } from './c-notifications-list.types'

// Abstracts
import { FilteredListBase } from '@ds/abstracts/filtered-list.base'

@customElement('c-notifications-list')
export class CNotificationsList extends FilteredListBase<Notification> {

  protected _getListClass() {
    return 'ti-notifications__list'
  }

  protected _getEmptyClass() {
    return 'ti-notifications__empty'
  }

  protected _getEmptyMessage() {
    return 'No hay notificaciones que coincidan con tu búsqueda.'
  }

  protected _renderItem(notification: Notification) {
    return html`
      <li class="ti-notifications__item">
        <div class="ti-notification-item">
          <div class="ti-notification-item__head">
            ${notification.image ? html`
              <picture class="ti-notification-item__image">
                <img class="u-image--responsive" src=${notification.image} alt=${notification.name} width="40" height="40" />
              </picture>
            ` : ''}
            ${notification.logo ? html`
              <picture class="ti-notification-item__logo">
                <img class="u-image--responsive" src=${notification.logo} alt=${notification.name} width="42" height="48" />
              </picture>
            ` : ''}
            <span class="ti-notification-item__text">${notification.name}</span>
          </div>
          <p class="ti-notification-item__text">${unsafeHTML(notification.text)}</p>
          <p class="ti-notification-item__date">${notification.date}</p>
          ${notification.confirm ? html`
            <div class="ti-notification-item__actions">
              <e-fetch action=${this.action} method="POST" color="green" size="thin">
                <span>Aceptar</span>
              </e-fetch>
              <e-fetch action=${this.action} method="POST" color="red" size="thin">
                <span>Rechazar</span>
              </e-fetch>
            </div>
          ` : ''}
        </div>
      </li>
    `
  }
}
