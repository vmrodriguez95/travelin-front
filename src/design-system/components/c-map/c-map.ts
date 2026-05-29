import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type { MapMarker } from '@ds/types/pois'

// Utils
import { loadGoogleMapsApi } from '@ds/utils/google-maps.utils'
import { getIconSvg } from '@ds/utils/icon.utils'
import {
  getPoiChannel,
  POI_CLEAR_EVENT,
  POI_HOVER_CLEAR_EVENT,
  POI_HOVER_EVENT,
  POI_REMOVE_EVENT,
  POI_SELECT_EVENT,
  type PoiHoverEventDetail,
  type PoiRemoveEventDetail,
  type PoiSelectEventDetail
} from '@ds/utils/poi-channel.utils'

import styles from './c-map.style.scss?inline'

const SELECTED_ZOOM = 15

@customElement('c-map')
export class CMap extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: String }) latitude = ''

  @property({ type: String }) longitude = ''

  @property({ type: String }) fullheight = 'full'

  @property({ type: String }) channel = ''

  @property({ type: String }) apiKey = ''

  @property({ type: String }) mapId = 'DEMO_MAP_ID'

  @property({ type: Number }) gap = 0

  @property({ type: Number }) zoom = 12


  @property({ type: Array }) markers: Array<MapMarker> = []

  @state() _height = 0

  @queryAsync('.c-map__viewport') _viewport!: Promise<HTMLElement>

  _channelBus: EventTarget | null = null

  _defaultShowSearch = false

  _google: any = null

  _mapsLibrary: any = null

  _markerLibrary: any = null

  _map: any = null

  _markerInstances = new Map<string, any>()

  _resizeHandler: (() => void) | null = null

  _lastMarkerClick = {
    id: '',
    time: 0
  }

  _selectedIdPoi = ''

  _hoveredIdPoi = ''

  _markerStyles = {
    default: {
      background: '#323232',
      borderColor: '#323232',
      iconColor: '#FFFFFF',
      scale: 1
    },
    hovered: {
      background: '#FC6D20',
      borderColor: '#FC6D20',
      iconColor: '#FFFFFF',
      scale: 1.15
    },
    selected: {
      background: '#FC6D20',
      borderColor: '#FC6D20',
      iconColor: '#FFFFFF',
      scale: 1.2
    }
  }

  connectedCallback(): void {
    super.connectedCallback()

    this._activateFullHeight()
    this._connectToChannel()
  }

  disconnectedCallback() {
    this._disconnectFromChannel()
    this._removeResizeHandler()

    super.disconnectedCallback()
  }

  protected firstUpdated() {
    this._setupMap()
  }

  protected updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('channel')) {
      this._disconnectFromChannel()
      this._connectToChannel()
    }

    if (changedProperties.has('markers') || changedProperties.has('latitude') || changedProperties.has('longitude')) {
      this._setupMap()
    }
  }

  render() {
    const classes = classMap({
      'c-map': true,
      'c-map--height-auto': this.fullheight === 'auto'
    })

    return html`
      <div class=${classes}>
        ${this._hasInteractiveMarkers()
          ? html`<div class="c-map__viewport c-map__canvas" style=${this._getViewportStyle()}></div>`
          : html`
            <iframe
              class="c-map__viewport c-map__iframe"
              style=${this._getViewportStyle()}
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
              src=${this._getEmbedSrc()}
            ></iframe>
          `
        }
      </div>
    `
  }

  private _getViewportStyle() {
    return this.fullheight === 'auto' || this._height === 0 ? '' : `height:${this._height}px;`
  }

  private _hasInteractiveMarkers() {
    return this.markers.length > 0 && Boolean(this.apiKey)
  }

  private _getEmbedSrc() {
    if (this.apiKey && this.latitude && this.longitude) {
      return `https://www.google.com/maps/embed/v1/view?key=${this.apiKey}&center=${this.latitude},${this.longitude}&zoom=${this.zoom}`
    }

    return `https://www.google.com/maps?q=${this.latitude},${this.longitude}&z=${this.zoom}&output=embed`
  }

  private _setHeight(height: number) {
    this._height = height
  }

  private _calcHeight(viewport: HTMLElement) {
    const height = window.innerHeight - viewport.offsetTop - 40 - this.gap

    this._setHeight(height)
  }

  private _removeResizeHandler() {
    if (!this._resizeHandler) return

    window.removeEventListener('resize', this._resizeHandler)
    this._resizeHandler = null
  }

  private _calcHeightOnResize(viewport: HTMLElement) {
    this._removeResizeHandler()

    this._resizeHandler = () => {
      this._calcHeight(viewport)
    }

    window.addEventListener('resize', this._resizeHandler)
  }

  private _activateFullHeight() {
    if (this.fullheight === 'full') {
      this._viewport.then((viewport: HTMLElement) => {
        this._calcHeight(viewport)
        this._calcHeightOnResize(viewport)
      })
    }
  }

  private _getMarkerPosition(marker: MapMarker) {
    return {
      lng: marker.coordinates[0],
      lat: marker.coordinates[1]
    }
  }

  private _getMapCenter() {
    return {
      lat: parseFloat(this.latitude) || 0,
      lng: parseFloat(this.longitude) || 0
    }
  }

  private _createMap(container: HTMLElement) {
    const { Map } = this._mapsLibrary

    this._map = new Map(container, {
      center: this._getMapCenter(),
      zoom: this.zoom,
      mapId: this.mapId,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })
  }

  private _clearMarkers() {
    this._markerInstances.forEach((markerInstance) => {
      markerInstance.map = null
    })

    this._markerInstances.clear()
  }

  private _removePoiMarkers(idPoi: string) {
    this.markers.forEach((marker) => {
      if (marker.idPoi !== idPoi && marker.id !== idPoi) return

      const markerInstance = this._markerInstances.get(marker.id)

      if (markerInstance) {
        markerInstance.map = null
        this._markerInstances.delete(marker.id)
      }
    })

    this.markers = this.markers.filter((marker) => marker.idPoi !== idPoi && marker.id !== idPoi)

    if (this._selectedIdPoi === idPoi) {
      this._selectedIdPoi = ''
    }

    if (this._hoveredIdPoi === idPoi) {
      this._hoveredIdPoi = ''
    }
  }

  private _syncMarkers() {
    if (!this._map || !this.markers.length) return

    this._clearMarkers()

    const bounds = new this._google.maps.LatLngBounds()
    const { AdvancedMarkerElement } = this._markerLibrary

    this.markers.forEach((marker) => {
      const position = this._getMarkerPosition(marker)
      const markerInstance = new AdvancedMarkerElement({
        position,
        map: this._map,
        title: marker.label,
        content: this._createMarkerContent(marker),
        gmpClickable: true
      })

      markerInstance.addListener('gmp-click', () => this._onMarkerClick(marker))

      bounds.extend(position)
      this._markerInstances.set(marker.id, markerInstance)
    })

    if (this.markers.length === 1) {
      this._map.setCenter(this._getMarkerPosition(this.markers[0]))
      this._map.setZoom(SELECTED_ZOOM)
      return
    }

    this._map.fitBounds(bounds)

    if (this._selectedIdPoi) {
      this._focusPoiMarkers(this._selectedIdPoi)
    }
  }

  private _getMarkerIcon(marker: MapMarker) {
    return marker.icon || 'location'
  }

  private _getMarkerStyle(marker: MapMarker) {
    if (this._selectedIdPoi && marker.idPoi === this._selectedIdPoi) {
      return this._markerStyles.selected
    }

    if (this._hoveredIdPoi && marker.idPoi === this._hoveredIdPoi) {
      return this._markerStyles.hovered
    }

    return this._markerStyles.default
  }

  private _refreshMarkerStyles() {
    if (!this._map || !this._markerLibrary || !this._markerInstances.size) return

    this.markers.forEach((marker) => {
      const markerInstance = this._markerInstances.get(marker.id)

      if (!markerInstance) return

      markerInstance.content = this._createMarkerContent(marker)
    })
  }

  private _createMarkerContent(marker: MapMarker) {
    const markerStyle = this._getMarkerStyle(marker)
    const wrapper = document.createElement('div')
    const icon = document.createElement('div')
    const scale = markerStyle.scale
    const size = 24 * scale
    let pointerStart: { x: number, y: number } | null = null

    wrapper.style.width = `${40 * scale}px`
    wrapper.style.height = `${40 * scale}px`
    wrapper.style.borderRadius = '999px'
    wrapper.style.display = 'flex'
    wrapper.style.alignItems = 'center'
    wrapper.style.justifyContent = 'center'
    wrapper.style.backgroundColor = markerStyle.background
    wrapper.style.border = `2px solid ${markerStyle.borderColor}`
    wrapper.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.22)'
    wrapper.style.cursor = 'pointer'
    wrapper.style.touchAction = 'manipulation'
    wrapper.style.userSelect = 'none'
    wrapper.style.transition = 'transform 0.2s ease'
    wrapper.style.transform = this._selectedIdPoi && marker.idPoi === this._selectedIdPoi ? 'translateY(-2px)' : 'translateY(0)'

    icon.style.width = `${size}px`
    icon.style.height = `${size}px`
    icon.style.display = 'flex'
    icon.style.alignItems = 'center'
    icon.style.justifyContent = 'center'
    icon.style.color = markerStyle.iconColor
    icon.innerHTML = this._normalizeMarkerSvg(this._getMarkerIcon(marker))

    wrapper.appendChild(icon)
    wrapper.addEventListener('pointerdown', (ev) => {
      pointerStart = { x: ev.clientX, y: ev.clientY }
    })
    wrapper.addEventListener('pointerup', (ev) => {
      if (!pointerStart) return

      const movement = Math.hypot(ev.clientX - pointerStart.x, ev.clientY - pointerStart.y)
      pointerStart = null

      if (movement > 6) return

      ev.preventDefault()
      ev.stopPropagation()
      this._onMarkerClick(marker)
    })

    return wrapper
  }

  private _normalizeMarkerSvg(iconName: string) {
    const svg = getIconSvg(iconName)

    if (!svg) return ''

    return svg.replace('<svg', '<svg style="width:100%;height:100%;display:block;fill:currentColor;"')
  }

  private _focusMarker(marker: MapMarker) {
    if (!this._map) return

    this._map.panTo(this._getMarkerPosition(marker))
    this._map.setZoom(SELECTED_ZOOM)
  }

  private _isDuplicateMarkerClick(marker: MapMarker) {
    const now = Date.now()
    const isDuplicate = this._lastMarkerClick.id === marker.id && now - this._lastMarkerClick.time < 300

    this._lastMarkerClick = {
      id: marker.id,
      time: now
    }

    return isDuplicate
  }

  private _onMarkerClick(marker: MapMarker) {
    if (this._isDuplicateMarkerClick(marker)) return

    this._selectedIdPoi = marker.idPoi || marker.id
    this._refreshMarkerStyles()
    this._focusMarker(marker)

    if (!this._channelBus || !marker.data) return

    this._channelBus.dispatchEvent(new CustomEvent<PoiSelectEventDetail>(POI_SELECT_EVENT, {
      detail: {
        data: marker.data,
        source: this,
        view: marker.view || 'detail'
      }
    }))
  }

  private async _setupMap() {
    if (!this._hasInteractiveMarkers()) return

    const container = await this._viewport

    this._google = await loadGoogleMapsApi(this.apiKey)
    this._mapsLibrary = this._mapsLibrary || await this._google.maps.importLibrary('maps')
    this._markerLibrary = this._markerLibrary || await this._google.maps.importLibrary('marker')

    if (!this._map) {
      this._createMap(container)
    }

    this._syncMarkers()
  }

  private _focusPoiMarkers(idPoi: string) {
    if (!this._map || !this.markers.length) return

    const selectedMarkers = this.markers.filter((marker) => marker.idPoi === idPoi || marker.id === idPoi)

    if (!selectedMarkers.length) return

    if (selectedMarkers.length === 1) {
      this._focusMarker(selectedMarkers[0])
      return
    }

    const bounds = new this._google.maps.LatLngBounds()

    selectedMarkers.forEach((marker) => {
      bounds.extend(this._getMarkerPosition(marker))
    })

    this._map.fitBounds(bounds)
  }

  private _connectToChannel() {
    if (!this.channel) return

    this._channelBus = getPoiChannel(this.channel)
    this._channelBus.addEventListener(POI_SELECT_EVENT, this._onSelectionChange as EventListener)
    this._channelBus.addEventListener(POI_CLEAR_EVENT, this._onSelectionClear)
    this._channelBus.addEventListener(POI_HOVER_EVENT, this._onHoverChange as EventListener)
    this._channelBus.addEventListener(POI_HOVER_CLEAR_EVENT, this._onHoverClear)
    this._channelBus.addEventListener(POI_REMOVE_EVENT, this._onPoiRemove as EventListener)
  }

  private _disconnectFromChannel() {
    if (!this._channelBus) return

    this._channelBus.removeEventListener(POI_SELECT_EVENT, this._onSelectionChange as EventListener)
    this._channelBus.removeEventListener(POI_CLEAR_EVENT, this._onSelectionClear)
    this._channelBus.removeEventListener(POI_HOVER_EVENT, this._onHoverChange as EventListener)
    this._channelBus.removeEventListener(POI_HOVER_CLEAR_EVENT, this._onHoverClear)
    this._channelBus.removeEventListener(POI_REMOVE_EVENT, this._onPoiRemove as EventListener)
    this._channelBus = null
  }

  private _onSelectionChange = (ev: Event) => {
    const event = ev as CustomEvent<PoiSelectEventDetail>

    this._selectedIdPoi = event.detail.data.id

    if (event.detail.source === this) return

    if (this._hasInteractiveMarkers()) {
      this._refreshMarkerStyles()
      this._focusPoiMarkers(this._selectedIdPoi)
    }
  }

  private _onSelectionClear = () => {
    this._selectedIdPoi = ''

    if (this._hasInteractiveMarkers()) {
      this._syncMarkers()
    }
  }

  private _onHoverChange = (ev: Event) => {
    const event = ev as CustomEvent<PoiHoverEventDetail>

    this._hoveredIdPoi = event.detail.data.id

    if (this._hasInteractiveMarkers()) {
      this._refreshMarkerStyles()
    }
  }

  private _onHoverClear = () => {
    this._hoveredIdPoi = ''

    if (this._hasInteractiveMarkers()) {
      this._refreshMarkerStyles()
    }
  }

  private _onPoiRemove = (ev: Event) => {
    const event = ev as CustomEvent<PoiRemoveEventDetail>

    this._removePoiMarkers(event.detail.data.id)
  }
}
