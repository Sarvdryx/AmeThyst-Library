# Tasks: Librarian PIN Verification UI

**Input**: Design documents from `specs/022-librarian-pin-veri-ui/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-interfaces.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `client/app/` — Next.js App Router
- **Components**: `client/app/components/{atoms,molecules,organisms,templates}/`
- **Dashboard routes**: `client/app/dashboard/librarian/`
- **Locales**: `client/app/locales/{en,vi}.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize i18n keys and basic building blocks

- [x] T001 [P] Add `librarian.*` namespace keys to `client/app/locales/en.json` (dashboard_title, sidebar.*, placeholder labels)
- [x] T002 [P] Add `verification.*` namespace keys to `client/app/locales/en.json` (modal_title, pin_label, search_button, cancel_button, confirm_button, borrower_section, books_section, eligibility_*, error_invalid_pin, toast_success, placeholder_empty, phase_*, skeleton_loading, shortcut_*)
- [x] T003 [P] Add all `librarian.*` and `verification.*` keys to `client/app/locales/vi.json` (mirror en.json structure, use Vietnamese translations)
- [x] T004 [P] Create `OTPInput` atom component at `client/app/components/atoms/OTPInput.tsx` — 6 discrete digit slots with auto-focus, masking, auto-advance, paste support, error/disabled states
- [x] T005 [P] Export `OTPInput` from `client/app/components/atoms/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T006 Modify `client/app/dashboard/layout.tsx` to accept both `'user'` and `'librarian'` roles in the auth guard (currently only allows `'user'`)
- [x] T007 Create `LibrarianDashboardSidebar` organism at `client/app/components/organisms/LibrarianDashboardSidebar.tsx` — sidebar with 2 active nav tabs (Calendar View, Book Loan Confirmation) and 2 placeholder items, following the same pattern as `DashboardSidebar.tsx` (SVG icons, `usePathname()` active state, i18n keys, dark mode classes)
- [x] T008 Export `LibrarianDashboardSidebar` from `client/app/components/organisms/index.ts`

**Checkpoint**: Foundation ready — librarian can access dashboard without 403 redirect, sidebar renders with correct tabs.

---

## Phase 3: User Story 1 - Navigate Librarian Dashboard with Two Tabs (Priority: P1) 🎯 MVP

**Goal**: Librarian can log in, see the Librarian Dashboard with sidebar, and switch between Calendar View and Book Loan Confirmation tabs.

**Independent Test**: Load `/dashboard/librarian` — sidebar shows "Librarian Dashboard" header with Calendar View and Book Loan Confirmation tabs. Clicking each tab renders the respective view.

- [x] T009 [P] [US1] Create `dashboard/librarian/` directory and `layout.tsx` at `client/app/dashboard/librarian/layout.tsx` — follows same pattern as `dashboard/user/layout.tsx` (NavBar + LibrarianDashboardSidebar + main content + Footer)
- [x] T010 [US1] Create `dashboard/librarian/page.tsx` — Calendar View tab, renders CalendarView molecule as the default landing page
- [x] T011 [P] [US1] Create `CalendarView` molecule at `client/app/components/molecules/CalendarView.tsx` — wraps the existing `DashboardCalendar` component, passes mock event data for display
- [x] T012 [P] [US1] Export `CalendarView` from `client/app/components/molecules/index.ts`
- [x] T013 [US1] Create `dashboard/librarian/loan-confirmation/` directory and `page.tsx` at `client/app/dashboard/librarian/loan-confirmation/page.tsx`

**Checkpoint**: Navigation works. Librarian can switch between Calendar View (showing existing DashboardCalendar) and Book Loan Confirmation tab (showing empty workspace with trigger button).

---

## Phase 4: User Story 5 - View Calendar (Reused from User Dashboard) (Priority: P3)

**Goal**: Calendar View fully operational using the existing `DashboardCalendar` component with event data.

**Independent Test**: Switch to Calendar View tab — monthly calendar grid renders with color-coded events, month navigation works, clicking a date shows event summaries in side panel.

- [x] T014 [US5] Populate `CalendarView` with realistic mock event data (pickup, overdue, library_event types) — uses existing `DashboardCalendar` `events` prop format `{ date, type, title }[]`
- [x] T015 [US5] Verify the `DashboardCalendar` quick-view side panel opens on date click (behavior inherited from existing component — ensure no CSS/layout regressions)

**Checkpoint**: Calendar View is fully functional with event overlays, navigation, and side panel.

---

## Phase 5: User Story 2 - Verify Book Loan via PIN Modal (Priority: P1)

**Goal**: Librarian can open a verification modal, enter a 6-digit PIN, and view the borrower's profile and registered books after validation.

**Independent Test**: Open Book Loan Confirmation tab, click "Open Confirmation Modal", enter a 6-digit PIN — modal transitions from input phase to data overlay showing borrower info and book list.

### Implementation for User Story 2

- [x] T016 [P] [US2] Create `BorrowerInfoPanel` molecule at `client/app/components/molecules/BorrowerInfoPanel.tsx` — dual-column layout: left column shows borrower profile (name, ID, department, StatusBadge), right column shows scrollable book list (thumbnail placeholder, title, author, book code); supports `isLoading` skeleton state
- [x] T017 [P] [US2] Export `BorrowerInfoPanel` from `client/app/components/molecules/index.ts`
- [x] T018 [US2] Create `VerificationModal` organism at `client/app/components/organisms/VerificationModal.tsx` — full modal with phases: input (OTPInput + Search button), loading (skeleton), data (BorrowerInfoPanel), error; portal-based overlay with backdrop, [X] close button, Cancel + Confirm buttons in footer; body scroll lock
- [x] T019 [P] [US2] Export `VerificationModal` from `client/app/components/organisms/index.ts`
- [x] T020 [US2] Create `BookLoanConfirmationPanel` organism at `client/app/components/organisms/BookLoanConfirmationPanel.tsx` — workspace with descriptive text and "Open Confirmation Modal" button that opens `VerificationModal`; manages `isModalOpen` state; handles confirm callback to show Toast
- [x] T021 [P] [US2] Export `BookLoanConfirmationPanel` from `client/app/components/organisms/index.ts`
- [x] T022 [US2] Implement mock PIN validation logic inside `VerificationModal` — any 6-digit PIN transitions to data overlay phase (simulated 500ms loading delay with skeleton); use hardcoded mock `BorrowerInfo` and `BookInfo[]` data

**Checkpoint**: Full verification workflow works — open modal → enter PIN → view borrower data → ready to confirm or cancel.

---

## Phase 6: User Story 3 - Confirm Loan with Keyboard Shortcuts (Priority: P2)

**Goal**: Librarian can use keyboard shortcuts (Esc, Enter, F8/Ctrl+Enter) throughout the verification workflow, and receive success feedback on confirmation.

**Independent Test**: Open modal, press Esc to close; reopen, type 6 digits, press Enter to validate; press F8 or Ctrl+Enter to confirm loan — toast appears.

- [x] T023 [US3] Add `useEffect` keyboard shortcut handler to `VerificationModal` — Esc closes modal (any phase), Enter triggers PIN validation (input phase only), F8/Ctrl+Enter triggers confirm action (data phase only); use `e.preventDefault()` for F8 to block browser devtools
- [x] T024 [US3] Add success toast notification on loan confirm — use existing `Toast` atom with `type: 'success'`; toast message uses `t('verification.toast_success', { name })`; auto-dismiss after 4 seconds
- [x] T025 [US3] Add keyboard shortcut hint icons/labels in the modal footer (small text showing "Esc: Close", "Enter: Verify", "F8: Confirm") using `verification.shortcut_*` i18n keys

**Checkpoint**: Verification workflow fully keyboard-navigable; confirm action triggers success feedback.

---

## Phase 7: User Story 4 - Handle Invalid PIN and Error States (Priority: P2)

**Goal**: Invalid or expired PIN entry shows clear visual error feedback; errors clear on re-entry.

**Independent Test**: Enter an invalid PIN (e.g., `000000`) — all 6 slots show red borders and error message appears. Clear and re-enter — error clears.

- [x] T026 [US4] Add error state handling to `OTPInput` — `error` prop triggers `border-red-500 dark:border-red-400` styling on all slots; passing a new `value` clears the error state
- [x] T027 [US4] Add invalid PIN error flow to `VerificationModal` — when mock validation fails (specific test PIN `000000` or any non-6-digit input), show error state: red borders on OTPInput + inline error text `t('verification.error_invalid_pin')`; user can re-enter digits to retry
- [x] T028 [US4] Create `EmptyState` handling in `BookLoanConfirmationPanel` — when no pending reservations exist, show placeholder text using `t('verification.placeholder_empty')`

**Checkpoint**: Error states are visually clear and recoverable; empty state handled gracefully.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T029 [P] Ensure all new components support dark mode via Tailwind `dark:` prefix classes — verify no hardcoded color values
- [x] T030 [P] Ensure all new text uses `t('namespace.key')` i18n calls — verify no hardcoded strings in components
- [x] T031 [P] Verify `ThemeToggle` and `LanguageToggle` work correctly on librarian dashboard pages
- [x] T032 Run `quickstart.md` validation scenarios to verify end-to-end functionality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 - Dashboard Navigation (Phase 3)**: Depends on Foundational (Phase 2)
- **US5 - Calendar View (Phase 4)**: Depends on US1 (Phase 3) — the Calendar View page already exists, this phase adds event data
- **US2 - PIN Verification Modal (Phase 5)**: Depends on Foundational (Phase 2) — can be worked in parallel with US1
- **US3 - Keyboard Shortcuts (Phase 6)**: Depends on US2 (Phase 5) — modifies VerificationModal
- **US4 - Error Handling (Phase 7)**: Depends on US2 (Phase 5) — modifies OTPInput and VerificationModal
- **Polish (Phase 8)**: Depends on all user story phases

### Within Each User Story

- Components created bottom-up: atoms → molecules → organisms → pages
- Exports added to barrel files as components are created
- Mock data used in place of backend integration

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel (different locale files, different component files)
- T001/T002/T003 (locale files) can run in parallel
- T004/T005 (OTPInput + export) must be sequential
- US1 (Phase 3) and US2 (Phase 5) can run in parallel after Phase 2 completes
- US3 (Phase 6) and US4 (Phase 7) can run in parallel after US2 completes
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: US1 + US2 (P1 stories in parallel)

```bash
# US1: Dashboard structure (Developer A)
Task: "T009 Create dashboard/librarian/layout.tsx"
Task: "T010 Create dashboard/librarian/page.tsx"
Task: "T011 Create CalendarView molecule"
Task: "T013 Create dashboard/librarian/loan-confirmation/page.tsx"

# US2: PIN Verification Modal (Developer B)
Task: "T016 Create BorrowerInfoPanel molecule"
Task: "T018 Create VerificationModal organism"
Task: "T020 Create BookLoanConfirmationPanel organism"
Task: "T022 Implement mock PIN validation"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup — i18n keys + OTPInput atom
2. Complete Phase 2: Foundational — auth guard + sidebar
3. Complete Phase 3: User Story 1 — dashboard navigation + calendar page
4. Complete Phase 5: User Story 2 — PIN verification modal
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Dashboard Navigation) → Test → Deploy (basic dashboard shell)
3. Add US2 (PIN Verification Modal) → Test → Deploy (MVP: core workflow works!)
4. Add US5 (Calendar Enhancements) → Test → Deploy
5. Add US3 + US4 (Shortcuts + Errors) → Test → Deploy (polished UX)

### Parallel Team Strategy

With two developers:
1. Team completes Phase 1 + Phase 2 together
2. Once Foundational is done:
   - Developer A: US1 (Dashboard Navigation + Calendar)
   - Developer B: US2 (PIN Verification Modal)
3. Developer A continues to US5, Developer B continues to US3 + US4

---

## Notes

- [P] tasks = different files, no dependencies
- [US1]–[US5] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- No test tasks generated — feature spec does not request automated tests; validation is browser-based per quickstart.md
- Commit after each logical group of tasks
- Stop at any checkpoint to validate story independently
- All components must follow the existing Atomic Design conventions (no hardcoded text/colors, i18n + Tailwind dark mode)
