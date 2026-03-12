import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import styles from './c-search.style.scss?inline'

@customElement('c-search')
export class CSearch extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  @property({ type: Boolean }) api = ''

  render() {
    const classes = classMap({
      'c-search': true
    })

    return html`
      <div class=${classes}>
        <e-input
          class="c-search__field"
          id="search"
          name="search"
          type="text"
          icon="search"
          value=""
        ></e-input>
      </div>
    `
  }
}