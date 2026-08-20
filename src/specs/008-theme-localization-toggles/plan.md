# Implementation Plan: Global Theme and Localization Toggles

**Branch**: `008-theme-localization-toggles` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-theme-localization-toggles/spec.md`

**Note**: This plan outlines the technical design, project structure changes, and tasks required to implement the theme and localization toggles.

## Summary
Implement global Theme (Light/Dark mode) and Language (English/Vietnamese) toggles as icon-only buttons on the far right of the NavBar. The state will be managed via React Context Providers registered at the application root layout, ensuring all pages and components inherit them. The theme is initialized from OS preference and stored in LocalStorage, while i18n uses translation hooks and automatically appends any new key definitions to both `en.json` and `vi.json`.

## Technical Context

**Language/Version**: React 19.2.4, Next.js 16.2.6 (App Router), Node.js v20+

**Primary Dependencies**: `lucide-react` (for icons like Sun, Moon, Globe), standard React Context (no complex external state manager needed)

**Storage**: LocalStorage (for theme preference persistence)

**Testing**: React Testing Library & Jest / Playwright E2E

**Target Platform**: Modern Web Browsers (Chrome, Safari, Firefox, Edge)

**Project Type**: Next.js App Router Web Application

**Performance Goals**: Instant theme toggling (<100ms UI update) and instant language switching (<50ms reload-free translations)

**Constraints**: Strict compliance with SD&D, no hardcoded strings/colors, dynamic translation of all labels/tooltips.

**Scale/Scope**: Entire application frontend UI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Component-Driven & Reusability**: Yes, toggles will be structured as reusable icon-only buttons.
- **State Management & Data Fetching**: Yes, React Context used for global Theme and i18n states.
- **Responsive & Beautiful Design**: Yes, buttons placed in NavBar with subtle hover states, clean spacing, and smooth CSS color transitions.
- **Error Handling & Accessibility**: Alt text and tooltips dynamically fetched using translation hooks.
- **Global Feature Requirements**: Complies fully with Theme System (LocalStorage + OS preference + Tailwind dark support) and Localization System (En/Vi instant reload-free switching, no hardcoded text, auto key append).

## Project Structure

### Documentation (this feature)

```text
specs/008-theme-localization-toggles/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    └── ui-contract.md   # UI & State hook contract definition
```

### Source Code (repository root)

```text
client/
├── app/
│   ├── components/
│   │   ├── atoms/
│   │   │   ├── ThemeToggle.tsx       # Sun/Moon toggle button
│   │   │   └── LanguageToggle.tsx    # Globe/Text language toggle button
│   │   └── organisms/
│   │       └── NavBar.tsx            # Updated to place buttons on the far right
│   ├── providers/
│   │   ├── ThemeProvider.tsx         # Global theme provider & hook
│   │   └── I18nProvider.tsx          # Global translation provider & hook
│   ├── locales/
│   │   ├── en.json                   # English localizations
│   │   └── vi.json                   # Vietnamese localizations
│   ├── globals.css                   # Added Tailwind 4 dark mode overrides
│   └── layout.js                     # Root layout wrapping providers
```

**Structure Decision**: Web application component separation using React Context Providers inside a `client/app/providers` folder, with custom components in `client/app/components/atoms`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |
