# Research Document: Global Theme and Localization (i18n)

This document outlines the technical research, selected designs, and rationale for implementing the global theme and localization toggle systems.

## 1. Global Theme System (Light/Dark Mode)

### Technical Analysis
* **Tailwind CSS v4 Dark Mode**: Tailwind CSS v4 uses CSS variables for styling. Dark mode can be activated via class-based approaches (e.g. putting a `.dark` class on the `<html>` or `<body>` element) or via system preference. To ensure a global toggling system that overrides the system default, the class-based approach is optimal. When `.dark` is added to `<html>`, classes like `dark:bg-slate-900` are applied.
* **Initialization Workflow**:
  1. Check `LocalStorage` for a saved value (`theme` key).
  2. If absent, check OS preference: `window.matchMedia('(prefers-color-scheme: dark)').matches`.
  3. If true, set theme to `dark`; else set to `light`.
  4. Apply the theme class (`dark`) to the document root `<html>` element.
* **Transitions**: A CSS transition on background-color and color properties will be added to `globals.css` (e.g. `transition: background-color 0.3s ease, color 0.3s ease`) to ensure smooth visual shifts.

### Decisions & Rationale
* **Decision**: Class-based dark mode toggle via custom `ThemeProvider` React Context.
* **Rationale**: Custom React context provides a clean API `useTheme()` for child components to query `theme` (light/dark) and `toggleTheme()` while managing side-effects like updating the root DOM class list and syncing to `LocalStorage`.

---

## 2. Localization (i18n) System

### Technical Analysis
* **Framework i18n**: Next.js App Router has standard middleware-based internationalization, but for single-page applications or simple instant state-based switching without page reload, a custom React `I18nProvider` loading client-side JSON dictionaries (`en.json`, `vi.json`) is the lightweight, instant, and high-performance choice.
* **State Management**:
  1. Store the active locale state (`en` or `vi`) in a React Context.
  2. Provide a translation function `t(key: string)` that resolves nested object paths (e.g. `t('navbar.theme_tooltip')`).
  3. Support fallback: if a key is missing in `vi.json`, retrieve from `en.json`.
* **Instant Switching**: Changing the context locale state triggers a React re-render of all text elements consuming the `t` hook, achieving instant translation without router navigation or document reload.

### Decisions & Rationale
* **Decision**: Light-weight context-based `I18nProvider` with nested key path resolution support.
* **Rationale**: Eliminates page reload latency, allows instant translation toggling, and satisfies the requirement to avoid hardcoded UI strings.

---

## 3. Automation & Key Synchronization

### Technical Analysis
* **Automated Key Sync**: When developers add new translation keys in code, we want a simple process to prevent locale drift (where keys exist in `en.json` but not in `vi.json`).
* **Approach**: Implement a validation script or proxy behavior in development. For production/build, we can write a simple node script (`scripts/sync-locales.mjs`) that merges keys from both `en.json` and `vi.json`, filling missing keys with the counterpart value as a temporary fallback, ensuring both files have identical key structures.

### Decisions & Rationale
* **Decision**: Implement a Node-based locale sync script (`scripts/sync-locales.mjs`) that runs before the build or can be triggered manually to automatically align keys.
* **Rationale**: Keeps translation files identical, preventing runtime undefined values for missing keys in Vietnamese or English.
