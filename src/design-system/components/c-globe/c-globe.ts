import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property, queryAsync } from 'lit/decorators.js'

import styles from './c-globe.style.scss?inline'

@customElement('c-globe')
export class CGlobe extends LitElement {

  @property({ type: Array }) data: any = []

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
      .height(window.innerHeight - 88 - 180 - 32 - 16)
      .width(container.getBoundingClientRect().width)
      .polygonCapColor((d: any) => {
        if(this.countries.includes(d.properties.ISO_A2)) {
          return 'rgba(252, 110, 32, 1)'
        }

        return 'rgba(34, 34, 34, 1)'
      })
      .polygonSideColor(() => 'black')
      .polygonStrokeColor(() => 'rgba(50, 50, 50, 1)')
      .polygonLabel((d: any) => `<b>${d.properties.ADMIN} (${d.properties.ISO_A2})</b>`)
      .polygonsTransitionDuration(300)
  }
}
