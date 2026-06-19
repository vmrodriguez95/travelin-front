import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, queryAsync } from 'lit/decorators.js'

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
export class CGlobe extends LitElement {

  @property({ type: Array }) data: GlobeGeoFeature[] = []

  @property({ type: Array }) countries: String[] = []

  @queryAsync('.c-globe') globe!: Promise<HTMLElement>

  static styles = css`${unsafeCSS(styles)}`

  async firstUpdated(): Promise<void> {
    const container = await this.globe
    const { default: Globe } = await import('globe.gl')

    this._renderGlobe(container, Globe)
  }

  render() {
    return html`<div class="c-globe"></div>`
  }

  private _renderGlobe(container: HTMLElement, Globe: typeof import('globe.gl').default) {
    return new Globe(container)
      .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
      .backgroundColor('rgba(34, 34, 34, 1)')
      .pointOfView({ altitude: 1.5 }, 0)
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
  }
}
