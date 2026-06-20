import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, queryAsync, state } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js'
import { Responsive } from '../../mixins/responsive'

import styles from './c-globe.style.scss?inline'

interface GlobeGeoFeature {
  type: string
  properties: {
    ADMIN: string
    ISO_A2: string
    [key: string]: unknown
  }
  geometry: object
}

@customElement('c-globe')
export class CGlobe extends Responsive(LitElement) {

  @property({ type: Array }) data: GlobeGeoFeature[] = []

  @property({ type: Array }) countries: String[] = []

  @property({ type: String }) errorMessage = ''

  @state() onLoadFailed = false

  @queryAsync('.c-globe') globe!: Promise<HTMLElement>

  static styles = css`${unsafeCSS(styles)}`

  async firstUpdated(): Promise<void> {
    const container = await this.globe
    const { default: Globe } = await import('globe.gl')

    this._renderGlobe(container, Globe)
  }

  render() {
    return html`
      <div class="c-globe"></div>
      ${when(this.onLoadFailed, () => html`
        <p class="c-globe__error">${this.errorMessage}</p>
      `)}
    `
  }

  private _computeAltitude(width: number, height: number) {
    const FOV = 45                       // globe.gl main camera vertical FOV
    const margin = 1.2                   // >1 = padding around the globe; tune to taste
    const vHalf = (FOV * Math.PI / 180) / 2
    const hHalf = Math.atan(Math.tan(vHalf) * (width / height))
    return margin / Math.sin(Math.min(vHalf, hHalf)) - 1
  }

  private _getAltitudeByBreakpoint() {
    switch (this.breakpoint) {
      case 'sm':
        return 2
      case 'md':
        return 1.8
      case 'lg':
        return 1.7
      case 'xl':
        return this._computeAltitude(this.clientWidth, this.clientHeight)
      default:
        return 2
    }
  }

  private _renderGlobe(container: HTMLElement, Globe: typeof import('globe.gl').default) {
    try {
      return new Globe(container)
        .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
        .backgroundColor('rgba(34, 34, 34, 1)')
        .pointOfView({ altitude: this._getAltitudeByBreakpoint() }, 0)
        .lineHoverPrecision(0)
        .polygonsData(this.data)
        .polygonAltitude(0.01)
        .height(this.clientHeight || container.getBoundingClientRect().height)
        .width(container.getBoundingClientRect().width)
        .polygonCapColor((d: object) => {
          const feature = d as GlobeGeoFeature
          if(this.countries.includes(feature.properties.ISO_A2)) {
            return 'rgba(252, 110, 32, 1)'
          }
  
          return 'rgba(34, 34, 34, 1)'
        })
        .polygonSideColor(() => 'black')
        .polygonStrokeColor(() => 'rgba(50, 50, 50, 1)')
        .polygonLabel((d: object) => {
          const feature = d as GlobeGeoFeature
          return `<b>${feature.properties.ADMIN} (${feature.properties.ISO_A2})</b>`
        })
        .polygonsTransitionDuration(300)
  
    } catch (error) {
      this.onLoadFailed = true
    }
  }
}
