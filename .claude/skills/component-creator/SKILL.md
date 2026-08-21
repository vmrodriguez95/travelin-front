---
name: component-creator
model: haiku
---

# component-creator

Scaffold a new Lit web component with all required files in the correct directory.

## When to use

Invoke when the user runs `/component-creator` or asks to create a new design system element or component (e.g. "create e-badge", "add a new c-tabs component"). 

## Instructions

1. **Resolve the component name.**
   - If the user provided a name (e.g. `e-badge`, `c-tabs`) use it directly.
   - If no name was given, ask: _"What should the component be named? Use the `e-` prefix for atomic elements and `c-` for composite components."_

2. **Determine the target directory** from the prefix:
   - `e-*` → `src/design-system/elements/<name>/`
   - `c-*` → `src/design-system/components/<name>/`
   - Any other prefix → ask the user to clarify.

3. **Derive the class name** from the tag: convert the kebab-case tag to PascalCase removing the prefix separator (e.g. `e-button` → `EButton`, `c-card-date` → `CCardDate`).

4. **Create the five files** below in the target directory. Replace every occurrence of:
   - `{tag}` with the full tag name (e.g. `e-badge`)
   - `{ClassName}` with the PascalCase class name (e.g. `EBadge`)

---

### File 1 — `{tag}.ts`

```ts
import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import styles from './{tag}.style.scss?inline'

@customElement('{tag}')
export class {ClassName} extends LitElement {

  static styles = css`${unsafeCSS(styles)}`

  render() {
    return html`
      <div class="{tag}">
        <slot></slot>
      </div>
    `
  }
}
```

---

### File 2 — `{tag}.style.scss`

```scss
@use '@common/styles/tools/tools.scss' as *;
@use '@common/styles/tools/typography.scss' as *;

.{tag} {
}
```

---

### File 3 — `{tag}.config.ts`

```ts
export const config = {
  props: {},
  slots: {}
}
```

---

### File 4 — `{tag}.demo.astro`

```astro
---
const { id } = Astro.props
---

<{tag} data-component id={id}>
  <slot />
</{tag}>
```

---

### File 5 — `index.ts`

```ts
export const meta = {
  name: '',
  icon: 'rectangle',
  tag: '{tag}',
  description: ''
}

export { config } from './{tag}.config'
export { default as Demo } from './{tag}.demo.astro'
```

---

## After creating the files

Remind the user to fill in:
- `meta.name` — human-readable display name shown in the docs sidebar
- `meta.description` — one-line description shown on the component page
- `meta.icon` — sidebar icon name (see `src/web/registry/icons.ts` for available icons)
- Any `props` entries in the config if the component accepts properties
