# Tasks: Global Theme and Localization Toggles

**Input**: Design documents from `/specs/008-theme-localization-toggles/`

**Prerequisites**: plan.md (required), spec.md (required)

**Organization**: Tasks are grouped by setup, foundation, user story, and polish phases to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize folder structure and localization assets

- [X] T001 Create folders and initialize boilerplate `client/app/locales/en.json` and `client/app/locales/vi.json` with initial empty structures

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core state context providers and root layout integration

- [X] T002 Implement `ThemeProvider` in `client/app/providers/ThemeProvider.tsx` to handle light/dark mode transitions, operating system preference resolution, and LocalStorage persistence
- [X] T003 Implement `I18nProvider` in `client/app/providers/I18nProvider.tsx` to manage language state, load dictionaries, and define the translation lookup method `t(key)` supporting nested properties and fallback logic
- [X] T004 Wrap `RootLayout` inside `client/app/layout.js` with the global `ThemeProvider` and `I18nProvider` wrappers so that theme and localization states are inherited globally

---

## Phase 3: User Story 1 - Global Theme Toggle (Priority: P1)

**Goal**: User can toggle between light and dark modes via an icon-only button on the NavBar

**Independent Test**: Click theme toggle in the NavBar; check that document classes/styles transition correctly and LocalStorage updates

- [X] T005 [P] [US1] Create the `ThemeToggle` component at `client/app/components/atoms/ThemeToggle.tsx` rendering a Sun icon in dark mode and Moon icon in light mode
- [X] T006 [P] [US1] Define dark mode root variables and smooth transition styles inside `client/app/globals.css`
- [X] T007 [US1] Integrate `ThemeToggle` component into `client/app/components/organisms/NavBar.tsx` and verify layout responsiveness

---

## Phase 4: User Story 2 - Instant Language Switching (Priority: P1)

**Goal**: User can switch the language instantly between English and Vietnamese without a page reload

**Independent Test**: Click language toggle in the NavBar; check that all text translations render instantly and tooltips translate correctly

- [X] T008 [P] [US2] Create the `LanguageToggle` component at `client/app/components/atoms/LanguageToggle.tsx` displaying the current active language (EN/VI) as a minimalist text button
- [X] T009 [P] [US2] Update `client/app/locales/en.json` and `client/app/locales/vi.json` to include translation values for all NavBar links, tooltips, and button labels
- [X] T010 [US2] Refactor `client/app/components/organisms/NavBar.tsx` links, Join Now button, tooltips, and accessibility labels to fetch translations using the i18n hook
- [X] T011 [US2] Integrate `LanguageToggle` component into the far right side of `client/app/components/organisms/NavBar.tsx` next to the theme toggle

---

## Phase 5: User Story 3 - Provider Registration & Translation Automation (Priority: P2)

**Goal**: Automatically align translation dictionary keys to prevent missing translations

**Independent Test**: Add a test translation key in `en.json`, run sync, verify it appends structurally to `vi.json`

- [X] T012 [US3] Implement the synchronization script at `client/scripts/sync-locales.mjs` to compare and automatically append missing translation keys between `locales/en.json` and `locales/vi.json`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final builds, validation checks, and script integration

- [X] T013 Update `client/package.json` script block to execute `sync-locales.mjs` automatically as a pre-build step
- [X] T014 Run validation scenarios detailed in `specs/008-theme-localization-toggles/quickstart.md` to ensure correct rendering, transition times, and persistence behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks all user story tasks.
- **User Story 1 (Phase 3)**: Depends on Phase 2. Can be worked on in parallel with User Story 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2. Can be worked on in parallel with User Story 1.
- **User Story 3 (Phase 5)**: Depends on Phase 4 key definitions.
- **Polish (Phase 6)**: Depends on completion of all implementation phases.

### Parallel Opportunities

- T005 (`ThemeToggle` creation) and T006 (`globals.css` transition setup) can be implemented in parallel.
- T008 (`LanguageToggle` creation) and T009 (`locales/` updates) can be implemented in parallel.
- Once Phase 2 is complete, work on User Story 1 (Phase 3) and User Story 2 (Phase 4) can proceed concurrently.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Setup and Foundational contexts (Phase 1 & 2).
2. Implement and test User Story 1 (Theme Toggle).
3. Implement and test User Story 2 (Localization Toggle).
4. Run independent verification tests.
5. Deploy MVP UI changes to dev branch.
