# UI & Hook Contracts

This document defines the contracts and interfaces for components, context hooks, and CSS transitions.

## 1. Context Provider Contracts

### Theme Provider (`ThemeProvider`)
* **File**: `client/app/providers/ThemeProvider.tsx`
* **Exports**:
  - `ThemeProvider`: Context Wrapper React Component
  - `useTheme`: Custom React hook yielding `{ theme, toggleTheme }`

### I18n Provider (`I18nProvider`)
* **File**: `client/app/providers/I18nProvider.tsx`
* **Exports**:
  - `I18nProvider`: Context Wrapper React Component
  - `useI18n`: Custom React hook yielding `{ locale, t, toggleLocale }`

---

## 2. Component Contracts

### ThemeToggle Component
* **Path**: `client/app/components/atoms/ThemeToggle.tsx`
* **Props**: None (Internalizes `useTheme` and `useI18n` for tooltip)
* **Contract**:
  - Must render an `<button>` element.
  - Must fetch tooltip and `aria-label` dynamically via `t()`.
  - Must render `Sun` icon when theme is dark.
  - Must render `Moon` icon when theme is light.

### LanguageToggle Component
* **Path**: `client/app/components/atoms/LanguageToggle.tsx`
* **Props**: None (Internalizes `useI18n` for state and tooltip)
* **Contract**:
  - Must render a `<button>` element displaying `EN` or `VI` text (or a Globe icon).
  - Must switch context locale instantly on click.
