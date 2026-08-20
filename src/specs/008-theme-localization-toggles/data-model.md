# Data Model & State Definition: Theme and Localization

This document defines the state schemas, storage models, and localized dictionary schemas for the theme and localization features.

## 1. Theme Configuration & LocalState

The theme state is represented in the client runtime as:

### ThemeState Schema
```typescript
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

### Storage Model (LocalStorage)
* **Key**: `theme`
* **Values**: `"light"` | `"dark"`
* **Default**: OS preference resolved via query `(prefers-color-scheme: dark)`.

---

## 2. Localization Dictionary Schema

The localization dictionaries `locales/en.json` and `locales/vi.json` share a unified JSON structure.

### Schema
```json
{
  "navbar": {
    "library": "string",
    "dashboard": "string",
    "study_together": "string",
    "library_map": "string",
    "sign_in": "string",
    "join_now": "string",
    "theme_tooltip_light": "string",
    "theme_tooltip_dark": "string",
    "language_tooltip": "string",
    "theme_aria_label": "string",
    "language_aria_label": "string"
  }
}
```

### State Hook Interface (i18n)
```typescript
interface I18nContextType {
  locale: 'en' | 'vi';
  t: (key: string) => string;
  toggleLocale: () => void;
}
```

---

## 3. Key Synchronization Model

A node script aligns the locales files structure:
* **Source Files**: `client/app/locales/en.json`, `client/app/locales/vi.json`
* **Sync Rule**: Recursively traverse JSON objects. If `key` is present in `A` but missing in `B`, append `key` to `B` with value from `A` as a draft translation.
