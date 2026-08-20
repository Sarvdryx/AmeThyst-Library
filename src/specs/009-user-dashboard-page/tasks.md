# Tasks: User Dashboard Page

**Input**: Design documents from `/specs/009-user-dashboard-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual validation only — no test framework detected in project.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `client/app/` (Next.js App Router)
- **Backend**: `server/src/` (Express.js layered architecture)
- Paths shown reflect the project's actual directory structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create `client/app/dashboard/` directory structure with `layout.tsx` and `user/page.tsx` placeholders
- [x] T002 Create backend file scaffold: `dashboard.routes.mjs`, `dashboard.controllers.mjs`, `dashboard.services.mjs`, `dashboard.models.mjs`
- [x] T003 [P] Register dashboard routes in `server/src/server.mjs` by mounting `/dashboard` route group

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `client/app/components/atoms/Toast.tsx` — notification atom with `message`, `type`, `onDismiss`, `duration` props; fixed top-center positioning; slide-in animation; auto-dismiss
- [x] T005 [P] Add i18n keys for dashboard feature in `client/app/locales/en.json` and `client/app/locales/vi.json` (dashboard greeting, sidebar items, calendar labels, agenda labels, auth notification messages, add task button)
- [x] T006 Update `client/app/components/organisms/NavBar.tsx` dashboard link from `href: '/dashboard'` to `href: '/dashboard/user'`
- [x] T007 [P] Create `server/src/controllers/dashboard.controllers.mjs` with controller functions: `getEvents`, `getAgenda`, `createEvent`
- [x] T008 [P] Create `server/src/services/dashboard.services.mjs` with service functions: `fetchEventsByMonth`, `fetchAgenda`, `createPersonalTask`
- [x] T009 [P] Create `server/src/models/dashboard.models.mjs` with SQL queries: `SELECT events by month + user_id`, `SELECT events by date range + user_id`, `INSERT new event`
- [x] T010 Create `server/src/routes/dashboard.routes.mjs` wiring `verifyToken` middleware + controller functions for `GET /events`, `GET /agenda`, `POST /events`
- [x] T011 Implement `server/src/middlewares/role.middleware.mjs` with `authorizeRole(...roles)` — checks `req.user.role` against allowed roles, returns 403 on mismatch

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - View Personalized Dashboard (Priority: P1) 🎯 MVP

**Goal**: A logged-in user with role "user" can visit `/dashboard/user` and see a welcome greeting with their name, a sidebar navigation, an interactive calendar, and an upcoming agenda panel. Unauthenticated or wrong-role visitors are blocked with a toast notification.

**Independent Test**: Log in as user with role "user", navigate to `/dashboard/user` — verify greeting, sidebar items, calendar renders, agenda panel shows. Log out and access `/dashboard/user` directly — verify toast "This page requires sign in to use" followed by redirect to `/login`.

### Implementation for User Story 1

- [ ] T012 [US1] Create `client/app/dashboard/layout.tsx` — shared dashboard layout with auth guard: check `isLoggedIn()` and user role, show Toast with appropriate message, redirect on failure
- [ ] T013 [P] [US1] Create `client/app/components/organisms/DashboardSidebar.tsx` — sidebar with "USER" branding, navigation items (Profile, Borrowed Books, Your Study Groups, Room Reservations, Loan & Fees, Recommended Books), each with SVG icon + label
- [ ] T014 [P] [US1] Create `client/app/components/molecules/DashboardCalendar.tsx` — initial static calendar: month grid with day headers (MON-SUN), correct day alignment, today highlighted with filled circle, left/right arrow month navigation, Month/Week/Day view toggle buttons, legend
- [ ] T015 [P] [US1] Create `client/app/components/organisms/UpcomingAgenda.tsx` — agenda panel with "UPCOMING AGENDA" header, Today section with event rows (time + color dot + title + location), Tomorrow section, "Add Personal Task" dashed button
- [ ] T016 [US1] Create `client/app/dashboard/user/page.tsx` — compose DashboardSidebar, DashboardCalendar, UpcomingAgenda with welcome greeting "WELCOME BACK, {username}!", fetch events from `GET /dashboard/events` and agenda from `GET /dashboard/agenda` with loading/error states

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 3 - Interactive Calendar Navigation (Priority: P2)

**Goal**: Users can navigate the calendar by switching between Month, Week, and Day views and moving backward/forward through time periods. The calendar always reflects the actual current date.

**Independent Test**: Load dashboard, click left arrow → previous month. Click right arrow → next month. Click "Week" toggle → week view. Click "Month" toggle → month grid view.

### Implementation for User Story 3

- [ ] T017 [P] [US3] Implement `viewDate` state management in `DashboardCalendar.tsx` — track current month/year, handle `onMonthChange` callback
- [ ] T018 [P] [US3] Implement month grid computation in `DashboardCalendar.tsx` — determine first day weekday offset, fill 6-week grid, handle varying month lengths (28-31 days)
- [ ] T019 [US3] Implement view toggle logic in `DashboardCalendar.tsx` — switch between month grid, week row, and single day views with smooth transition
- [ ] T020 [US3] Wire calendar arrows and view toggle buttons to state changes in `DashboardCalendar.tsx`

**Checkpoint**: Users 1 AND 3 should both work independently

---

## Phase 5: User Story 4 - Upcoming Agenda Panel (Priority: P2)

**Goal**: The agenda panel displays today's and tomorrow's scheduled events fetched from the backend, with an "Add Personal Task" button that opens a form to create new events.

**Independent Test**: Log in, navigate to dashboard — verify agenda shows today's and tomorrow's events with correct times/locations. Click "Add Personal Task" — verify form appears and submits successfully.

### Implementation for User Story 4

- [ ] T021 [P] [US4] Implement agenda data fetching in `UpcomingAgenda.tsx` — call `GET /dashboard/agenda` with JWT, handle loading/empty/error states
- [ ] T022 [US4] Implement "Add Personal Task" modal/form in `UpcomingAgenda.tsx` — input fields for title, date, time, location, description; submit via `POST /dashboard/events`; refresh agenda on success
- [ ] T023 [US4] Wire event indicators from fetched data to calendar day cells in `DashboardCalendar.tsx` — show colored dots/labels on days that have events

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T024 Convert hardcoded color values from `UI_des.txt` reference to Tailwind theme utilities (`bg-amber-50`, `bg-white`, `text-gray-900`, etc.) with `dark:` variants
- [ ] T025 Review all DashboardCalendar, DashboardSidebar, UpcomingAgenda, and Toast components for responsive behavior (mobile/tablet/desktop)
- [ ] T026 Run `quickstart.md` validation scenarios end-to-end and fix any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion — MVP delivers auth guard + dashboard page
- **User Story 3 (Phase 4)**: Depends on Phase 3 (US1 calendar needs to exist) — adds calendar interactivity
- **User Story 4 (Phase 5)**: Depends on Phase 3 (US1 agenda needs to exist) — adds live data + create task
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 3 (P2)**: Enhances US1's calendar — calendar must exist first
- **User Story 4 (P2)**: Enhances US1's agenda — agenda must exist first

### Within Each User Story

- Backend model → service → controller → route before frontend integration
- Components built bottom-up: atoms → molecules → organisms → page
- Story complete before moving to next

---

## Parallel Opportunities

| Phase | Parallel Tasks |
|-------|---------------|
| Phase 1 | T001, T002 can run in parallel |
| Phase 2 | T004, T005, T007, T008, T009 can run in parallel |
| Phase 3 | T013, T014, T015 can run in parallel |
| Phase 4 | T017, T018 can run in parallel |
| Phase 5 | T021, T023 can run in parallel |

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch all UI components together:
Task: "Create DashboardSidebar in client/app/components/organisms/DashboardSidebar.tsx"
Task: "Create DashboardCalendar in client/app/components/molecules/DashboardCalendar.tsx"
Task: "Create UpcomingAgenda in client/app/components/organisms/UpcomingAgenda.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (includes auth guard + dashboard page)
4. **STOP and VALIDATE**: Test US1 independently — login, view dashboard, verify auth blocks
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 → Test independently → Deploy/Demo
4. Add User Story 4 → Test independently → Deploy/Demo

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
