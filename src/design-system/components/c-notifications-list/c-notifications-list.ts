import { LitElement, html, type PropertyValues } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

// Types
import type { Notification } from './c-notifications-list.types'
import type { FilterChangeDetail } from '../c-filter/c-filter.types'

@customElement('c-notifications-list')
export class CNotificationsList extends LitElement {

  @state() private _notifications?: Array<Notification>

  private _hydrated = false

  private _onFilterChange = (ev: Event) => {
    this._notifications = (ev as CustomEvent<FilterChangeDetail>).detail.data as Array<Notification>
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
  // filter. `_notifications` stays undefined until the first `filter:change`.
  shouldUpdate(): boolean {
    return this._notifications !== undefined
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
      <ul class="ti-notifications__list">
        ${this._notifications && this._notifications.length
          ? map(this._notifications, (notification) => this._renderNotification(notification))
          : html`<li class="ti-notifications__empty">No hay notificaciones que coincidan con tu búsqueda.</li>`}
      </ul>
    `
  }

  private _renderNotification(notification: Notification) {
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
              <e-fetch action="/api/poi.json" method="POST" color="green" size="thin">
                <span>Aceptar</span>
              </e-fetch>
              <e-fetch action="/api/poi.json" method="POST" color="red" size="thin">
                <span>Rechazar</span>
              </e-fetch>
            </div>
          ` : ''}
        </div>
      </li>
    `
  }
}
