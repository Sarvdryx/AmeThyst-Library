# Research Notes: Librarian Announcements Dashboard

## Overview
The feature requires building a UI page for the Librarian Announcements Dashboard. Since this is purely a frontend implementation using mock data to match a specific layout, there are minimal technical unknowns.

## Technical Context Decisions

### Component Design & UI Implementation
- **Decision**: Follow the Atomic Design system as per Constitution Principle I. However, since the feature involves a complex page, the focus will be on the `Organism` (List + Editor) and the `Template/Page` levels. We will use existing atoms if they exist, or standard Tailwind styling otherwise.
- **Rationale**: Ensures compliance with the project's design system and styling standards.

### Theming & Localization
- **Decision**: We must strictly apply `dark:` Tailwind classes for dark mode support and use `useI18n()` hook for text translations.
- **Rationale**: Constitution Principle IX mandates that no hardcoded hex colors or text strings be used. All text must be added to `en.json` and `vi.json`.

### Mock Data Strategy
- **Decision**: Create a `mockData` object directly inside the component or a local file until the backend integration is ready.
- **Rationale**: The user explicitly requested to use mock data for the layout implementation.

## Alternatives Considered
- *Backend Integration*: Skipping mock data and directly connecting to the backend. Rejected because the backend API for this feature is not yet defined, and the user specifically requested a mock data implementation first to finalize the layout.
