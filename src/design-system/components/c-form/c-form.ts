import { LitElement, html, css, unsafeCSS, type PropertyValues } from 'lit'
import { customElement, property, query, queryAll } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js'
import { classMap } from 'lit/directives/class-map.js'

// Types
import type { FormSchema, FormField } from './c-form.types'

import styles from './c-form.style.scss?inline'

@customElement('c-form')
export class CForm extends LitElement {

  @property({ type: String }) action = ''

  @property({ type: String }) method = ''

  @property({ type: String }) submitLabel = ''

  @property({ type: Object }) data!: FormSchema

  @query('form') form!: HTMLFormElement

  @queryAll('.c-form__field') fields!: NodeListOf<HTMLInputElement>

  _dependencies: Array<any> = []

  static styles = css`${unsafeCSS(styles)}`

  protected updated(_changedProperties: PropertyValues): void {
    if (this._dependencies.length > 0) {
      this._activateDependencies()
    }
  }

  render() {
    return html`
      <div class="c-form">
        <form action=${this.action} method=${this.method} @submit=${this._onSubmit}>
          ${this._printSections(this.data.sections)}
          <e-button class="c-form__submit" type="submit" size="full" @click=${this._onSubmit}>${this.submitLabel}</e-button>
        </form>
      </div>
    `
  }

  private _getFieldClasses(field: FormField) {
    return classMap({
      'c-form__field': true,
      'c-form__field--full': field.fieldSize === 'full'
    })
  }

  private _getFormData() {
    const formData = new FormData(this.form)

    console.log(formData)
  }

  private _isValid() {
    
    this.fields.forEach((field: HTMLInputElement) => {
      console.log(field.reportValidity())
    })

    return false
  }
  
  private _onSubmit(ev: Event) {
    ev.preventDefault()
    ev.stopPropagation()

    if (this._isValid()) {
      this._getFormData()
      return false
    }

    return false
  }

  private _onChange(ev: CustomEvent, field: FormField) {
    const target = ev.currentTarget as HTMLInputElement

    switch (field.type) {
      case 'calendar':
        field.value = ev.detail
        break
      default:
        field.value = target.value
    }
  }

  private _printFields(field: FormField) {
    if ('dependsOn' in field) {
      this._dependencies.push({
        field: field.id,
        dependsOn: field.dependsOn,
        isRegistered: false
      })
    }

    switch(field.type) {
      case 'hidden':
        return html`
          <input type="hidden" name=${field.name} value=${field.fillValue} />
        `
      case 'text':
        return html`
          <e-input
            class=${this._getFieldClasses(field)}
            id=${field.id}
            name=${field.name}
            label=${field.label}
            type=${field.type}
            helpmsg=${field.helpmsg}
            ?required=${field.required}
            ?readonly=${field.readonly}
            value=${field.fillValue}
            @input=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-input>
        `
      case 'search':
        return html`
          <e-input-search
            class=${this._getFieldClasses(field)}
            id=${field.id}
            api=${field.api}
            name=${field.name}
            label=${field.label}
            helpmsg=${field.helpmsg}
            ?required=${field.required}
            ?readonly=${field.readonly}
            @change=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-input-search>
        `
      case 'calendar':
        let start = '', end = '';

        if (Array.isArray(field.fillValue)) {
          [start, end] = field.fillValue
        }

        return html`
          <e-calendar
            class=${this._getFieldClasses(field)}
            id=${field.id}
            name=${field.name}
            label=${field.label}
            type=${field.type}
            helpmsg=${field.helpmsg}
            ?required=${field.required}
            ?readonly=${field.readonly}
            start=${start}
            end=${end}
            @change=${(ev: CustomEvent) => this._onChange(ev, field)}
          ></e-calendar>
        `
    }
  }

  private _printSections(sections: FormSchema['sections']) {
    const keys = Object.keys(this.data.sections)

    return keys.map((key: string) => {
      const section = sections[key]

      return html`
        <fieldset class="c-form__section">
          <legend class="c-form__title">${section.legend}</legend>
          ${map(Object.keys(section.fields), (fieldKey: string) => this._printFields(section.fields[fieldKey]))}
        </fieldset>
      `
    })
  }

  private _activateDependencies() {
    // this._dependencies.forEach((dependency: any) => {
    //   if (this.data.sections[dependency.dependsOn].fields[dependency.field].value) {
    //     if (!dependency.isRegistered) {
    //       dependency.isRegistered = true
    //       this._dependencies.push({
    //         field: dependency.field,
    //         dependsOn: dependency.dependsOn,
    //         isRegistered: false
    //       })
    //     }
    //   }
    // })
  }
}