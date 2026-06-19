# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev           # Start Astro dev server (design system docs site)
pnpm build         # Build both web (Astro) and design system (Vite library)
pnpm build:web     # Build Astro site only → dist/
pnpm build:ds      # Build design system as ES library → dist/design-system/
pnpm preview       # Preview the built Astro site
```

No lint or test scripts are configured.

## Environment

Copy `.env.example` to `.env` and fill in:
- `VITE_GOOGLE_MAPS_API_KEY` — used by `c-map` component

## Architecture

This repo is a **design system for the Travelin travel app**. It has two build targets that share the same source:

1. **Astro docs site** (`pnpm build:web`) — a component explorer/documentation site served at dev time
2. **ES library** (`pnpm build:ds`) — bundles `src/design-system/index.ts` as `dist/design-system/app.js` for consumption by the main app

### Source layout

```
src/
  design-system/   # The actual library (exported as ES module)
  web/             # Astro docs site shell (NOT exported to consumers)
  common/          # Shared SCSS styles (used by both)
  data/            # Static JSON data (globe, POIs, currency)
  forms/           # JSON form schemas consumed by c-form
  pages/           # Astro file-based routes for the docs site
```

### Path aliases

| Alias | Points to |
|---|---|
| `@ds` | `src/design-system` |
| `@web` | `src/web` |
| `@common` | `src/common` |

### Design system internals (`src/design-system/`)

All components are **Lit web components** (`LitElement`, TypeScript decorators). The library auto-registers everything via glob imports in `index.ts`:

```ts
import.meta.glob('./components/c-*/c-*.ts', { eager: true })
import.meta.glob('./elements/e-*/e-*.ts', { eager: true })
```

**Naming convention:**
- `e-*` — atomic elements (e-button, e-icon, e-input, etc.)
- `c-*` — composite components (c-header, c-form, c-map, c-globe, etc.)

**Every element/component folder follows the same structure:**
```
e-button/
  e-button.ts          # LitElement class with @customElement decorator
  e-button.style.scss  # Scoped styles, imported as ?inline
  e-button.config.ts   # Config object describing props (used by docs site)
  e-button.demo.astro  # Astro demo shown in the docs site
  index.ts             # Exports meta, config, Demo (consumed by registry)
```

The `index.ts` exports `meta` (name/tag/icon/description), `config`, and `Demo` — these feed the docs site's registry.

**Shared design system pieces:**
- `controllers/` — Lit `ReactiveController` implementations (e.g. `SimpleRequestController` with in-memory FIFO cache and abort support)
- `requests/` — `SimpleGetClient` HTTP client with timeout and abort signal support
- `styles/` — re-exports `@common/styles/index.scss`
- `types/` — shared TypeScript types for POIs, Intl, etc.
- `utils/` — shared utilities (e.g. date formatting)

`globe.gl` is split into its own chunk (`lib/globe.gl.js`) via `manualChunks` in the Vite build config to avoid bundling it with the main `app.js`.

### Docs site internals (`src/web/`)

The docs site is a static Astro site. Routes are dynamic and driven by registries:

- `src/web/registry/components.ts` — globs all `c-*/index.ts`, builds `ComponentRegistryItem[]`
- `src/web/registry/elements.ts` — same for `e-*/index.ts`
- `src/web/registry/compositions.ts` — for web/compositions
- `src/web/registry/simulator.ts` — for the desktop simulator view
- `src/web/registry/foundations.ts` / `icons.ts` — foundations and icon registry

Pages:
- `/components/[tag]` — renders a component demo + live prop config panel + HTML code preview
- `/elements/[tag]` — same for elements
- `/simulator/[tag]` — full-screen composition preview (no sidebar), linked from the header

**Compositions** (`src/web/compositions/`) are full page-level demos of real app screens (Home, Login, TripList, POI list, etc.) with their own SCSS files. Some composition SCSS is imported directly into `src/common/styles/index.scss`.

### Styles

Global styles live in `src/common/styles/`. All utility classes use the `u-` prefix; design system tokens use the `ti-` prefix. Sass variables for breakpoints, border-radius, and design tokens are in `src/common/styles/variables/`.

Component-level styles use `?inline` imports and are injected via `unsafeCSS` inside the Lit component's `static styles`.
