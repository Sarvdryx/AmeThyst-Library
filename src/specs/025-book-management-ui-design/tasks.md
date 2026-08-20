# Tasks: Book Management UI Design

**Input**: Design documents from `specs/025-book-management-ui-design/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-component-contracts.md

**Tests**: Not requested in spec. All tasks focus on UI implementation with mock data.

**Organization**: Tasks grouped by user story for independent implementation and testing. All paths are relative to `src/client/`.

**Constitution Constraints** (all must be satisfied by every task):
- Atomic Design bottom-up flow (atoms → molecules → organisms → templates)
- No hardcoded colors — use Tailwind `dark:` variants
- No hardcoded text — use `t('librarian.*')` i18n keys
- All components under existing `app/components/` atomic folders
- Responsive with Flexbox/Grid

## Format Legend

- `[P]`: Can run in parallel (different files, no dependencies)
- `[US1]`-`[US5]`: Maps to user story from spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: i18n keys, mock data, and page routing prerequisites

- [ ] T001 Create librarian namespace i18n keys in `src/client/app/locales/en.json` and `src/client/app/locales/vi.json` (subtab labels, table headers, button labels, status labels, placeholder text, KPI labels, inspection condition names)
- [ ] T002 [P] Create mock data file at `src/client/app/data/mockLibraryData.ts` with typed exports: `BookEntry[]`, `PickupEntry[]`, `BorrowEntry[]`, `InspectionEntry`, `ConditionSelection[]`, `KPIMetric[]` (10-12 hand-crafted books, 24 derived pickups, 12 borrows, 1 inspection record)

---

## Phase 2: Foundational (Shared Atoms & Molecules)

**Purpose**: Reusable atomic components shared across multiple tabs

- [ ] T003 [P] Create `KPIProgressBar` atom at `src/client/app/components/atoms/KPIProgressBar.tsx` (value %, color, bgColor, height props; horizontal progress bar with rounded overflow)
- [ ] T004 [P] Create `TrendIndicator` atom at `src/client/app/components/atoms/TrendIndicator.tsx` (text + variant props; positive=green, negative=red, neutral=grey with arrow icon)
- [ ] T005 [P] Create `ConditionCheckbox` atom at `src/client/app/components/atoms/ConditionCheckbox.tsx` (id, label, fee, checked, onChange props; checkbox with label and fee badge, dark mode support)
- [ ] T006 [P] Create `CountdownTimer` atom at `src/client/app/components/atoms/CountdownTimer.tsx` (expiresAt ISO string, onExpire callback, variant default/urgent; displays MM:SS countdown, red when urgent)
- [ ] T007 [P] Create `KPIStatCard` molecule at `src/client/app/components/molecules/KPIStatCard.tsx` (icon, value, label, trend, trendVariant, progress, progressColor, variant props; card with icon header, value, label, trend text, progress bar)
- [ ] T008 [P] Create `FilterDropdown` molecule at `src/client/app/components/molecules/FilterDropdown.tsx` (label, options[], value, onChange props; styled dropdown with chevron icon, dark mode)

---

## Phase 3: User Story 5 — Tab Navigation Dashboard Template (Priority: P3)

**Goal**: Persistent 4-tab dashboard wrapping Book Management, Book Pickup, Book Return, and Inspection panels

**Independent Test**: Navigate to `/dashboard/librarian` and verify 4 tabs render; clicking each tab shows the corresponding content panel; the active tab has a visual indicator

- [ ] T009 [US5] Create `LibrarianBookDashboard` template at `src/client/app/components/templates/LibrarianBookDashboard.tsx` (activeTab, onTabChange, bookManagement, bookPickup, bookReturn, inspection as ReactNode props; renders SubTabBar + conditional tab content panels)
- [ ] T010 [US5] Create stub `BookManagementTab`, `BookPickupTab`, `BookReturnTab`, `InspectionTab` organisms at `src/client/app/components/organisms/` (placeholder divs with tab heading text using i18n keys)
- [ ] T011 [US5] Update `src/client/app/dashboard/librarian/page.tsx` to render `LibrarianBookDashboard` with tab state management and stub tab organisms

---

## Phase 4: User Story 1 — Browse and Manage Book Inventory (Priority: P1) 🎯 MVP

**Goal**: Librarian views full book inventory with search, category filter, pagination, and add/edit/delete actions

**Independent Test**: Load Book Management tab, verify search bar filters by title/author/ISBN, category dropdown narrows results, table shows Cover/Title/Author/ISBN/Category/Availability/Status/Actions columns, edit/delete buttons present, pagination works, "Add Book" button visible

- [ ] T012 [P] [US1] Extend `BookTableHeader` at `src/client/app/components/molecules/BookTableHeader.tsx` to accept optional `columns` prop array for configurable column definitions per tab (default to existing 8 columns)
- [ ] T013 [P] [US1] Extend `BookTableRow` at `src/client/app/components/molecules/BookTableRow.tsx` to accept optional `renderActions` prop slot for per-tab action buttons
- [ ] T014 [US1] Implement `BookManagementTab` organism at `src/client/app/components/organisms/BookManagementTab.tsx` (composes SearchBar, FilterDropdown for category, Button "Add Book", BookTableHeader, BookTableRow list, BookTablePagination, EmptySearchResults; manages search/filter/pagination state with mock data from mockLibraryData.ts)
- [ ] T015 [US1] Wire all i18n keys for Book Management tab: table headers (`librarian.table_cover`, `librarian.table_title`, etc.), search placeholder, category labels, "Add Book" button, "Edit"/"Delete" tooltips, "Page X of Y", "No books found", "Clear All Filters"
- [ ] T016 [US1] Replace stub `BookManagementTab` in `LibrarianBookDashboard` with the full implementation; verify end-to-end rendering

---

## Phase 5: User Story 2 — Manage Book Pickups (Priority: P1)

**Goal**: Librarian monitors pending pickups with KPI stats, search/filter, and action buttons

**Independent Test**: Switch to Book Pickup tab, verify 3 KPI cards (Pending Pickups, Expired Today, Redeemed Today) render with counts/trends/progress bars, pickup table shows Book Details/Student/PIN/Expires In/Status/Actions, search filters by student name/ID/book title, status/category dropdowns filter results

- [ ] T017 [P] [US2] Create `PickupTableRow` molecule at `src/client/app/components/molecules/PickupTableRow.tsx` (pickup: PickupEntry, onExtend, onCancel, hasBorder props; renders book cover+title+ISBN, student avatar+name+ID, masked PIN box, CountdownTimer, StatusBadge, extend/cancel IconButtons)
- [ ] T018 [P] [US2] Create `KPIStatsRow` organism at `src/client/app/components/organisms/KPIStatsRow.tsx` (metrics: KPIStatCardProps[], columns?: 2|3 props; responsive grid of KPIStatCard molecules)
- [ ] T019 [US2] Implement `BookPickupTab` organism at `src/client/app/components/organisms/BookPickupTab.tsx` (composes KPIStatsRow, SearchBar, FilterDropdown for status + category, "Advanced Filters" Button, pickup table header + PickupTableRow list, BookTablePagination, EmptySearchResults; manages pagination + search/filter state)
- [ ] T020 [US2] Wire all i18n keys for Book Pickup tab: KPI labels (`librarian.kpi_pending_pickups` etc.), table headers (`librarian.pickup_book_details`, `librarian.pickup_student`, etc.), status options, "Extend"/"Cancel" tooltips, "Advanced Filters", "All Status", "Category: All"
- [ ] T021 [US2] Replace stub `BookPickupTab` in `LibrarianBookDashboard` with full implementation; verify end-to-end rendering

---

## Phase 6: User Story 3 — Process Book Returns (Priority: P2)

**Goal**: Librarian views active/overdue borrows, filters by status/date/search, and marks items as returned

**Independent Test**: Switch to Book Return tab, verify 3 KPI cards (Active Borrows, Overdue Items, Returns Today) with counts and indicators, return table shows User/Book Title/Borrow Date/Due Date/Status/Fees/Actions, status/date/search filters work, overdue items highlighted in red, "Mark Returned" button present

- [ ] T022 [P] [US3] Create `ReturnTableRow` molecule at `src/client/app/components/molecules/ReturnTableRow.tsx` (borrow: BorrowEntry, onMarkReturned, hasBorder props; renders user avatar+name+ID, book title+call number, borrow date, due date, StatusBadge, fees amount, "Mark Returned" Button; overdue rows get red styling)
- [ ] T023 [US3] Implement `BookReturnTab` organism at `src/client/app/components/organisms/BookReturnTab.tsx` (composes KPIStatsRow, FilterDropdown for status, date range filter display, SearchBar, return table header + ReturnTableRow list, BookTablePagination, EmptySearchResults; manages pagination + filter state)
- [ ] T024 [US3] Wire all i18n keys for Book Return tab: KPI labels (`librarian.kpi_active_borrows` etc.), table headers (`librarian.return_user`, `librarian.return_book_title`, etc.), status filter options, "Mark Returned" button, "All Statuses" placeholder, date range display
- [ ] T025 [US3] Replace stub `BookReturnTab` in `LibrarianBookDashboard` with full implementation; verify end-to-end rendering

---

## Phase 7: User Story 4 — Perform Return Inspection (Priority: P2)

**Goal**: Librarian inspects returned books for damage, selects conditions, adds notes, and views financial summary

**Independent Test**: Switch to Inspection tab, verify page title "Book Return Inspection", two-column layout, 6 selectable condition checkboxes, Inspection Notes textarea, Borrower Information card, Financial Summary card, selecting conditions updates repair fee in real-time

- [ ] T026 [P] [US4] Create `InspectionHeaderCard` molecule at `src/client/app/components/molecules/InspectionHeaderCard.tsx` (borrowerName, borrowerAvatar, bookTitle, bookCover, isbn, borrowDate, dueDate, returnDate, loanDuration props; card with borrower avatar+name, book cover+title+ISBN, date grid with borrow/due/return dates and loan duration)
- [ ] T027 [P] [US4] Create `FinancialSummaryCard` molecule at `src/client/app/components/molecules/FinancialSummaryCard.tsx` (repairFee, latePenalty, finalRefund props; card with three rows: repair fee (red), late penalty (red), final refund (green with border-top separator))
- [ ] T028 [US4] Implement `InspectionTab` organism at `src/client/app/components/organisms/InspectionTab.tsx` (inspection: InspectionEntry, conditions: ConditionSelection[], onConditionToggle, onNotesChange, onCompleteInspection, onCancel props; two-column grid layout: left side has "Verify Book Condition" heading + 6 ConditionCheckbox components + Inspection Notes textarea, right side has InspectionHeaderCard + FinancialSummaryCard; repair fee updates in real-time when conditions toggle)
- [ ] T029 [US4] Wire all i18n keys for Inspection tab: page title, section headings ("Verify Book Condition", "Inspection Notes", "Borrower Information", "Financial Summary"), condition names ("Perfect Condition", "Slight Cover Scratches", etc.), field labels ("Borrow Date", "Due Date", etc.), "Repair Fee (Condition)", "Late Return Penalty", "Final Refund", textarea placeholder
- [ ] T030 [US4] Replace stub `InspectionTab` in `LibrarianBookDashboard` with full implementation; verify end-to-end rendering

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Dark mode, i18n completeness, lint/type checking, and final validation

- [ ] T031 [P] Verify dark mode compliance: all new components use `dark:` Tailwind variants and existing theme provider; check every bg, text, border, and hover state
- [ ] T032 [P] Run `npm run lint` in `src/client/` and fix any lint errors
- [ ] T033 [P] Run `npx tsc --noEmit` in `src/client/` and fix any TypeScript errors
- [ ] T034 Verify all component index.ts exports: update `src/client/app/components/atoms/index.ts`, `src/client/app/components/molecules/index.ts`, `src/client/app/components/organisms/index.ts`, `src/client/app/components/templates/index.ts` with new component exports
- [ ] T035 Run quickstart.md validation scenarios end-to-end (tab navigation, book table rendering, KPI cards, inspection panel, dark mode, locale toggle, empty state)

---

## Dependencies & Execution Order

### Phase Dependencies

| From | To | Notes |
|------|-----|-------|
| Phase 1 (Setup) | Phase 2 (Foundational) | i18n keys + mock data needed before component implementation |
| Phase 2 (Foundational) | Phase 3-7 (All User Stories) | Shared atoms/molecules are prerequisites |
| Phase 3 (US5) | Phase 4-7 (US1-US4) | Tab container must exist before tab content can be plugged in |
| Phase 4 (US1) | independent | No cross-story dependencies |
| Phase 5 (US2) | independent | No cross-story dependencies |
| Phase 6 (US3) | independent | No cross-story dependencies |
| Phase 7 (US4) | independent | No cross-story dependencies |
| Phase 3-7 (All US) | Phase 8 (Polish) | All stories must be implemented before final polish |

### User Story Independence

- **US5** (Tab Navigation): Container only — no dependency on tab content; independently testable by verifying tabs render and switch
- **US1** (Book Management): Fully independent — standalone table with search/filter/pagination
- **US2** (Book Pickup): Fully independent — KPI cards + pickup table with own data
- **US3** (Book Return): Fully independent — KPI cards + return table with own data
- **US4** (Inspection): Fully independent — condition selection + financial summary with own data

### Parallel Opportunities

- T002 run in parallel with T001 (Setup)
- T003-T008 all run in parallel (Phase 2 — different atoms/molecules)
- T012-T013 run in parallel (Phase 4 — BookTableHeader + BookTableRow extensions)
- T017-T018 run in parallel (Phase 5 — PickupTableRow + KPIStatsRow)
- T026-T027 run in parallel (Phase 7 — InspectionHeaderCard + FinancialSummaryCard)
- T031-T033 all run in parallel (Phase 8 — dark mode, lint, typecheck)
- Once Phase 3 (US5) completes, all 4 story tabs (US1-US4) can be implemented in parallel

---

## Implementation Strategy

### MVP Scope (User Story 1 Only)

1. Complete Phase 1: Setup (i18n keys + mock data)
2. Complete Phase 2: Foundational atoms/molecules (needed by all tabs but only US1 uses KPI components minimally)
3. Complete Phase 3: US5 (tab container)
4. Complete Phase 4: US1 (Book Management Tab)
5. **STOP and VALIDATE**: Test US1 independently — search, filter, paginate, edit/delete actions, empty state

### Incremental Delivery

| Increment | Content | Value |
|-----------|---------|-------|
| MVP | Setup + Foundational + US5 + US1 | Core book inventory management |
| Increment 2 | US2 (Book Pickup) | Pickup monitoring with KPI cards |
| Increment 3 | US3 (Book Return) | Return processing with overdue tracking |
| Increment 4 | US4 (Inspection) | Return inspection with condition/financial management |
| Polish | Dark mode, i18n, lint, typecheck | Production readiness |

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 + Phase 2 together
2. Developer A: Phase 3 (US5 — tab container) + Phase 4 (US1 — Book Management)
3. Developer B: Phase 5 (US2 — Book Pickup) [can start after Phase 3 container is merged]
4. Developer C: Phase 6 (US3 — Book Return) [can start after Phase 3 container is merged]
5. Developer D: Phase 7 (US4 — Inspection) [can start after Phase 3 container is merged]
6. Any developer: Phase 8 (Polish) after all stories merged

---

## Notes

- `[P]` tasks = different files, no dependencies — safe to parallelize
- `[US1]`-`[US5]` labels map tasks to specific user stories for traceability
- Each user story phase ends with the stub replacement task that integrates into `LibrarianBookDashboard`
- All i18n keys use the `librarian` namespace (e.g., `t('librarian.subtab_book_management')`)
- All components are `"use client"` — they use `useI18n()` and `useTheme()` hooks
- Mock data is static (no API calls in v1) — edit/delete actions manipulate local state only
- Component file paths are relative to `src/client/app/components/` unless otherwise specified
