import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type { MapMarker, Poi, PoiHotel } from '@ds/types/pois.types'
import type { PoiChannelData } from '@ds/utils/poi-channel.utils'

// Controllers
import { ChannelController } from '@ds/controllers/channel.controller'

// Utils
import { loadGoogleMapsApi } from '@ds/utils/google-maps.utils'
import { getIconSvg } from '@ds/utils/icon.utils'
import { BREAKPOINTS } from '@ds/utils/variables'
import {
  POI_SELECT_EVENT,
  type PoiHoverEventDetail,
  type PoiRemoveEventDetail,
  type PoiSelectEventDetail,
  type DayHoverEventDetail,
  type DayActiveEventDetail
} from '@ds/utils/poi-channel.utils'

// Styles
import styles from './c-map.style.scss?inline'

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

  @property({ type: Number }) bottomOffset = 40

  @property({ type: Number }) zoom = 12

  @property({ type: String }) activeKey = 'idPoi'

  @property({ type: Array }) markers: Array<MapMarker> = []

  @state() _height = 0

  @queryAsync('.c-map__viewport') _viewport!: Promise<HTMLElement>

  _selectedZoom = 15

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

  _initialLatitude = ''

  _initialLongitude = ''

  _initialZoom = 12

  _hoveredIdPoi = ''

  _hoveredDay = -1

  _markersCommonId = ''

  _activeValue = ''

  _isMobile = false

  _mediaQuery: MediaQueryList | null = null

  _markerStates = new Map<string, string>()

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

  private _channel = new ChannelController(
    this,
    () => this.channel,
    {
      onSelect: (detail) => this._onSelectionChange(detail),
      onClear: () => this._onSelectionClear(),
      onHover: (detail) => this._onHoverChange(detail),
      onHoverClear: () => this._onHoverClear(),
      onRemove: (detail) => this._onPoiRemove(detail),
      onDayHover: (detail) => this._onDayHoverChange(detail),
      onDayHoverClear: () => this._onDayHoverClear(),
      onDayActive: (detail) => this._onDayActiveChange(detail),
    }
  )

  connectedCallback(): void {
    super.connectedCallback()

    this._initialLatitude = this.latitude
    this._initialLongitude = this.longitude
    this._initialZoom = this.zoom

    this._mediaQuery = window.matchMedia(`(min-width: ${BREAKPOINTS.xl}px)`)
    this._isMobile = !this._mediaQuery.matches
    this._mediaQuery.addEventListener('change', this._onBreakpointChange)

    this._activateFullHeight()
  }

  disconnectedCallback() {
    this._removeResizeHandler()
    this._mediaQuery?.removeEventListener('change', this._onBreakpointChange)

    super.disconnectedCallback()
  }

  protected firstUpdated() {
    this._setupMap()
  }

  protected updated(changedProperties: PropertyValues<this>) {
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

  private _onBreakpointChange = (ev: MediaQueryListEvent) => {
    this._isMobile = !ev.matches
    this._syncMarkers()
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
    const height = window.innerHeight - viewport.offsetTop - this.bottomOffset - this.gap

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

  private _displayedMarkers(): Array<MapMarker> {
    if (this._isMobile && this._markersCommonId) {
      const markers = this.markers.filter((marker) => marker.id === this._markersCommonId)
      return markers.length ? markers : this.markers
    }

    return this.markers
  }

  private _syncMarkers() {
    if (!this._map || !this.markers.length) return

    const displayed = this._displayedMarkers()

    this._clearMarkers()
    this._markerStates.clear()

    if (!displayed.length) return

    const bounds = new this._google.maps.LatLngBounds()
    const { AdvancedMarkerElement } = this._markerLibrary

    displayed.forEach((marker) => {
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
      this._markerStates.set(marker.id, this._getMarkerStateKey(marker))
    })

    if (displayed.length === 1) {
      this._map.setCenter(this._getMarkerPosition(displayed[0]))
      this._map.setZoom(this._selectedZoom)
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

  private _isActiveMarker(marker: MapMarker) {
    if (this._activeValue === '') return false

    return String((marker as unknown as Record<string, unknown>)[this.activeKey] ?? '') === this._activeValue
  }

  private _getMarkerStateKey(marker: MapMarker) {
    if (this._selectedIdPoi && marker.idPoi === this._selectedIdPoi) {
      return 'selected'
    }

    if (this._isActiveMarker(marker)) {
      return 'selected'
    }

    if (this._hoveredIdPoi && marker.idPoi === this._hoveredIdPoi) {
      return 'hovered'
    }

    if (this._hoveredDay >= 0 && marker.day === this._hoveredDay) {
      return 'hovered'
    }

    return 'default'
  }

  private _getMarkerStyle(marker: MapMarker) {
    return this._markerStyles[this._getMarkerStateKey(marker) as keyof typeof this._markerStyles]
  }

  private _refreshMarkerStyles() {
    if (!this._map || !this._markerLibrary || !this._markerInstances.size) return

    this._displayedMarkers().forEach((marker) => {
      const markerInstance = this._markerInstances.get(marker.id)

      if (!markerInstance) return

      const nextState = this._getMarkerStateKey(marker)

      if (this._markerStates.get(marker.id) === nextState) return

      this._markerStates.set(marker.id, nextState)
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
    this._map.setZoom(this._selectedZoom)
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

    if (!marker.data) return

    this._channel.dispatch<PoiSelectEventDetail>(POI_SELECT_EVENT, {
      data: marker.data,
      source: this,
      view: marker.view || 'detail'
    })
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

  private _onSelectionChange(detail: PoiSelectEventDetail) {
    this._selectedIdPoi = detail.data.id

    if (detail.source === this) return

    if (this._hasInteractiveMarkers()) {
      this._refreshMarkerStyles()
      this._focusPoiMarkers(this._selectedIdPoi)
      return
    }

    this._centerOnPoi(detail.data)
  }

  private _centerOnPoi(data: PoiChannelData) {
    const coordinates = (data as Poi | PoiHotel).coordinates

    if (!coordinates) return

    this.longitude = String(coordinates[0])
    this.latitude = String(coordinates[1])
    this.zoom = this._selectedZoom
  }

  private _onSelectionClear() {
    this._selectedIdPoi = ''

    if (this._hasInteractiveMarkers()) {
      this._syncMarkers()
      return
    }

    this._resetCenter()
  }

  private _resetCenter() {
    this.latitude = this._initialLatitude
    this.longitude = this._initialLongitude
    this.zoom = this._initialZoom
  }

  private _onHoverChange(detail: PoiHoverEventDetail) {
    this._hoveredIdPoi = detail.data.id

    if (this._hasInteractiveMarkers()) {
      this._refreshMarkerStyles()
    }
  }

  private _onHoverClear() {
    this._hoveredIdPoi = ''

    if (this._hasInteractiveMarkers()) {
      this._refreshMarkerStyles()
    }
  }

  private _onDayHoverChange(detail: DayHoverEventDetail) {
    this._hoveredDay = detail.day

    if (this._hasInteractiveMarkers()) {
      this._refreshMarkerStyles()
    }
  }

  private _onDayHoverClear() {
    this._hoveredDay = -1

    if (this._hasInteractiveMarkers()) {
      this._refreshMarkerStyles()
    }
  }

  private _onDayActiveChange(detail: DayActiveEventDetail) {
    this._activeValue = detail.value

    if (!this._hasInteractiveMarkers()) return

    this._refreshMarkerStyles()
  }

  private _onPoiRemove(detail: PoiRemoveEventDetail) {
    this._removePoiMarkers(detail.data.id)
  }
}
