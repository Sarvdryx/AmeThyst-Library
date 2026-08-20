# Tasks: Admin Statistics Dashboard Tab

**Input**: Design documents from `/specs/029-admin-statistics-dashboard/`

**Prerequisites**: [plan.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/029-admin-statistics-dashboard/plan.md), [spec.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/029-admin-statistics-dashboard/spec.md), [data-model.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/029-admin-statistics-dashboard/data-model.md), [contracts/admin-statistics-api.yaml](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/029-admin-statistics-dashboard/contracts/admin-statistics-api.yaml), [quickstart.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/029-admin-statistics-dashboard/quickstart.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure

- [X] T001 Create Admin Statistics component directory in `client/app/components/admin/statistics/`
- [X] T002 [P] Setup localization key dictionaries for statistics dashboard in `client/app/locales/en.json` and `client/app/locales/vi.json`

---

## Phase 2: Foundational (Blocking Prerequisites & Security)

**Purpose**: Core backend, security, and API infrastructure required before user story development

**⚠️ CRITICAL**: Must be completed before user story implementation

- [X] T003 Ensure admin authorization middleware (`verifyToken` + `authorizeRole('admin')`) is configured for statistics routes in `server/src/middlewares/auth.middleware.mjs` and `server/src/middlewares/role.middleware.mjs`
- [X] T004 [P] Create PostgreSQL database query blueprint functions in `server/src/models/statistics.models.mjs`
- [X] T005 Register `/api/admin/statistics` route handlers with admin role protection in `server/src/routes/statistics.routes.mjs`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Executive Summary Metrics, Global Filtering & Layout Adaptation (Priority: P1) 🎯 MVP

**Goal**: Deliver 4 executive KPI cards (Total Users, Active/Total Borrows, Overdue Books Alert, Total Late Fees) with time horizon (This Week vs. This Month) and branch filtering controls, adapted seamlessly into the existing `AdminDashboardLayout` (`client/app/dashboard/admin/statistics/page.tsx`) for admin role users only, preserving all existing working components.

**Independent Test**: Log in as administrator, navigate to `/dashboard/admin/statistics` within the Admin Dashboard layout, verify 4 summary KPI cards render with accurate figures, toggle time filter between Week/Month, select branch filters, and verify non-admin users are blocked from viewing statistics data.

### Tests for User Story 1

- [X] T006 [P] [US1] Write unit tests for admin role authorization and summary metrics calculation in `server/tests/services/statistics.service.spec.mjs`

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement executive summary metrics query & calculation logic in `server/src/services/statistics.services.mjs`
- [X] T008 [US1] Implement controller request handler with admin authorization validation in `server/src/controllers/statistics.controllers.mjs`
- [X] T009 [P] [US1] Create KpiSummaryRow UI component matching `style1_statistic.css` card layout and overdue red alert styling in `client/app/components/admin/statistics/KpiSummaryRow.jsx`
- [X] T010 [P] [US1] Create StatisticsHeaderFilter UI component for Week/Month pill toggles and Branch selector dropdown in `client/app/components/admin/statistics/StatisticsHeaderFilter.jsx`
- [X] T011 [US1] Adapt `client/app/dashboard/admin/statistics/page.tsx` to render inside existing `AdminDashboardLayout`, enforcing client-side admin role verification and integrating KpiSummaryRow & StatisticsHeaderFilter without breaking existing components.

**Checkpoint**: At this point, User Story 1 is fully functional, secure, and testable independently as MVP.

---

## Phase 4: User Story 2 - Top 10 Book Categories Borrow Turns Bar Charting (Priority: P2)

**Goal**: Render a visual Bar Chart displaying the Top 10 Book Categories ranked by total borrow turns for the selected week or month.

**Independent Test**: Select "This Week" or "This Month" filter and verify the bar chart renders up to 10 top categories ranked by borrow turns with interactive tooltips.

### Tests for User Story 2

- [X] T012 [P] [US2] Write unit tests for Top 10 Categories aggregation logic in `server/tests/services/top_categories.service.spec.mjs`

### Implementation for User Story 2

- [X] T013 [P] [US2] Implement Top 10 Book Categories SQL aggregation query in `server/src/services/statistics.services.mjs`
- [X] T014 [US2] Update controller endpoint payload to include `topCategories` array in `server/src/controllers/statistics.controllers.mjs`
- [X] T015 [P] [US2] Create TopCategoriesBarChart UI component using design tokens and hover tooltips in `client/app/components/admin/statistics/TopCategoriesBarChart.jsx`
- [X] T016 [US2] Integrate TopCategoriesBarChart component into `client/app/dashboard/admin/statistics/page.tsx`

**Checkpoint**: User Stories 1 AND 2 are both independently functional and verified.

---

## Phase 5: User Story 3 - Top Borrowed Books & Top Reserved Rooms by Branch (Priority: P3)

**Goal**: Render ranked Top Borrowed Books list with thumbnails and Top Reserved Rooms panel with exact reservation turns per branch.

**Independent Test**: Confirm Top Borrowed Books card displays book cover images, titles, and borrow counts, and Top Reserved Rooms card displays rooms alongside exact reservation turns per branch location.

### Implementation for User Story 3

- [X] T017 [P] [US3] Implement queries for Top Borrowed Books and Top Reserved Rooms per branch in `server/src/services/statistics.services.mjs`
- [X] T018 [US3] Update controller response payload to include `topBooks` and `topRoomsByBranch` arrays in `server/src/controllers/statistics.controllers.mjs`
- [X] T019 [P] [US3] Create TopBorrowedBooksCard UI component matching `style2_statistic.css` cover thumbnails and bar progress in `client/app/components/admin/statistics/TopBorrowedBooksCard.jsx`
- [X] T020 [P] [US3] Create TopReservedRoomsCard UI component displaying exact branch reservation turns in `client/app/components/admin/statistics/TopReservedRoomsCard.jsx`
- [X] T021 [US3] Integrate TopBorrowedBooksCard and TopReservedRoomsCard components into `client/app/dashboard/admin/statistics/page.tsx`

**Checkpoint**: All user stories are fully implemented and functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance, role security verification, zero-regression check on existing tabs, and full workflow validation

- [X] T022 [P] Verify full English and Vietnamese translation dictionary coverage in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T023 [P] Verify Light and Dark mode contrast compliance for overdue alert card (`#BA1A1A`) and bar charts within `AdminDashboardLayout`
- [X] T024 Verify 0 regression on existing working Admin Dashboard tabs (`/dashboard/admin`, `/dashboard/admin/authorization`, `/dashboard/admin/system`) and execute complete end-to-end verification following `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user story work.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
  - User Story 1 (P1) -> User Story 2 (P2) -> User Story 3 (P3)
- **Polish (Phase 6)**: Depends on all user story phases being completed.

### Parallel Opportunities

- All Setup tasks marked `[P]` can run in parallel.
- Foundational query blueprint (`T004`) and route setup (`T005`) can run in parallel.
- Within User Story 1: Unit tests (`T006`), service logic (`T007`), KPI UI (`T009`), and Header Filter UI (`T010`) can run in parallel.
- Within User Story 2: Service query (`T013`) and Bar Chart UI (`T015`) can run in parallel.
- Within User Story 3: Top Books UI (`T019`) and Top Rooms UI (`T020`) can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational Security).
2. Complete Phase 3 (User Story 1: Executive KPI Summary, Filters, Admin Role Guard & Layout Adaptation).
3. **STOP and VALIDATE**: Verify summary cards, filter toggles, layout integration, and role security.

### Incremental Delivery

1. Foundation -> Complete backend role protection and query models.
2. Deliver MVP -> User Story 1 (Executive KPIs, Filters & Layout Integration).
3. Add User Story 2 -> Top 10 Categories Borrow Turns Bar Chart.
4. Add User Story 3 -> Top Borrowed Books & Top Reserved Rooms by Branch.
5. Polish & Verification -> Verify 0 regression on existing admin tabs and run Quickstart validation.
