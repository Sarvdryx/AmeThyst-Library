# Implementation Plan: Real-Time Librarian Room Management Dashboard

**Branch**: `030-room-management-dashboard` | **Date**: 2026-08-01 | **Spec**: [spec.md](specs/030-room-management-dashboard/spec.md)

**Input**: Feature specification from `specs/030-room-management-dashboard/spec.md`

---

## Summary

Implement a **read-only, branch-isolated, real-time** Librarian Room Management Dashboard on top of the existing room-reservation, librarian-dashboard, and socket codebase:

- **Overview statistics**: today's total bookings, currently occupied rooms (occupied/total with capacity bar), and pending check-ins — computed from `reserve_room` / `room_avail` / `study_room`, strictly scoped by the librarian's `users.branch_id` (FR-001..004).
- **Active reservations list**: search by user name / user ID / room number, filter by status, filter by date range, server-side pagination, and read-only row detail (FR-005..009, FR-012).
- **Calendar schedule**: week/day toggle with rooms as rows, days as columns, and reservations rendered as time-positioned blocks (FR-010..011).
- **Live push updates**: a new branch-scoped socket room (`branch:{branchId}`) with a `room-dashboard:changed` event emitted from existing mutation points (reservation create/cancel, PIN generate/cleanup, librarian check-in, user checkout, and the scheduler cleanup/backfill) so the dashboard refreshes within 5 seconds (FR-014).

The dashboard is **read-only by design** (FR-013): no mutation endpoints are exposed. All reads go through the established layered backend (`routes → middlewares → controllers → services → models`, `.mjs`) and the frontend reuses the Atomic Design components already present under `client/app/components` (KPIStatCard, BookPickupTab table pattern, SearchBar, FilterDropdown, CalendarView, useSocket).

No SQL schema changes are required — every query operates on existing columns.

---

## Technical Context

**Language/Version**: JavaScript (Node.js ES Modules `.mjs` backend; React 18 / Next.js App Router frontend)

**Primary Dependencies**: Express.js, Next.js, `pg` (PostgreSQL pool via `config/postgres.mjs`), Socket.IO (existing `config/socket.mjs` + `utils/useSocket.ts` + `app/config/socket.ts`), existing frontend components (`KPIStatCard`, `StatusBadge`, `SearchBar`, `FilterDropdown`, `CalendarView`, `LibrarianDashboardSidebar`)

**Storage**: PostgreSQL — read-only queries over `study_room`, `room_avail`, `reserve_room`, `return_room`, `users`, `branches`. **No schema changes required.**

**Testing**: Vitest (server services & controllers per existing `server/tests/` convention)

**Target Platform**: Web Browsers (Responsive Desktop, Tablet, Mobile)

**Project Type**: Full-Stack Web Application (`client/` + `server/`)

**Performance Goals**: Overview loads within 2 seconds on a standard connection (SC-001); list and calendar data load within 1 second; live updates delivered within 5 seconds of the underlying event (SC-004/SC-006)

**Constraints**: Dashboard is read-only — no mutation endpoints, no in-dashboard edit/cancel (FR-013); strict branch isolation via `users.branch_id` / JWT `branch_id` (FR-001); no DB schema changes; preserve existing status values (`reserved`, `pending`, `used`); all new UI text uses design tokens (light/dark) and i18n keys in both `en.json` and `vi.json`; reuse existing Atomic Design components — no new component folder

**Scale/Scope**: Per-branch room monitoring; branches each have ~5–30 rooms; low concurrent dashboard traffic (a handful of librarians per branch)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post Phase 1 design.*

- [x] **Core Principle I (Component-Driven & Atomic Design)**: Reuses existing atoms (`StatusBadge`, `KPIProgressBar`, `TrendIndicator`, `Skeleton`, `Button`, `Input`, `CustomSelect`), molecules (`KPIStatCard`, `SearchBar`, `FilterDropdown`, `BookTablePagination`, `CalendarView`), and organisms (`LibrarianDashboardSidebar`, `LibrarianBookDashboard` template). No new folder under `client/app/components` — only extend existing atoms/molecules/organisms.
- [x] **Core Principle II (State Management & API Base URL)**: All fetches use `apiFetch` → `NEXT_PUBLIC_API_URL`; explicit `loading` / `error` / `success` states on overview, list, and calendar views.
- [x] **Core Principle III (Responsive Design)**: Overview cards, reservation table, and calendar use existing responsive grid/flexbox layouts.
- [x] **Core Principle IV (Performance)**: Interactive dashboard views are Client Components; data fetching is lightweight and page-local.
- [x] **Core Principle V (Error Handling & Accessibility)**: User-friendly errors for empty branch data and failed loads; meaningful alt text for room images; graceful handling of API failures without crashing.
- [x] **Core Principle VI & VIII (Directory Structure & Import Verification)**: Verified workspace hierarchy (`server/src/{routes,controllers,services,models}/**`, `client/app/components/**`, `client/app/dashboard/librarian/**`); imports follow verified relative paths.
- [x] **Core Principle VII & Backend Conventions**: New read endpoints follow `routes -> middlewares -> controllers -> services -> models` with `.mjs`; query logic stays in models, orchestration in services (fat services), controllers stay thin.
- [x] **Core Principle IX (Theme & Localization)**: New UI text uses design tokens (dark-mode utilities) and i18n keys added to both `en.json` and `vi.json`.

---

## Project Structure

### Documentation (this feature)

```text
specs/030-room-management-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── room-management-dashboard-api.md
└── tasks.md             # Phase 2 output (to be generated by /speckit.tasks)
```

### Source Code (repository root)

```text
server/src/
├── config/
│   └── socket.mjs                       # EXTEND: join branch:{branchId} room on connect; add emitRoomDashboardChanged
├── controllers/
│   └── dashboard.librarian.controllers.mjs  # EXTEND: rooms-overview, rooms-reservations, rooms-schedule, rooms-reservation-detail controllers
├── models/
│   ├── room.models.mjs                  # EXTEND: branch-scoped stats + active reservations + schedule + detail queries
│   └── (existing models reused as-is)
├── routes/
│   └── dashboard.librarian.routes.mjs   # EXTEND: GET /rooms-overview, /rooms/reservations, /rooms/schedule, /rooms/reservations/:reserveId
├── services/
│   ├── dashboard.librarian.services.mjs # EXTEND: room dashboard services (stats, list, schedule, detail) with branch guard
│   ├── room.services.mjs                # EXTEND: emit room-dashboard:changed on create/cancel/pin/cleanup/checkout
│   └── scheduler.services.mjs           # EXTEND: (or via pinScheduler) emit on cleanup + checkout backfill
└── utils/
    └── pinScheduler.mjs                 # EXTEND: emit room-dashboard:changed after periodic cleanup / backfill

client/app/
├── components/
│   ├── atoms/                           # reuse StatusBadge, KPIProgressBar, TrendIndicator, Skeleton, etc.
│   ├── molecules/
│   │   ├── index.ts                     # export additions (RoomReservationsTable re-exports as needed)
│   │   └── (reuse KPIStatCard, SearchBar, FilterDropdown, BookTablePagination, CalendarView)
│   └── organisms/
│       └── RoomManagementDashboard.tsx  # NEW: template composing stats, list/calendar toggle, table + calendar
├── dashboard/librarian/
│   ├── layout.tsx                       # (existing) sidebar wiring
│   ├── page.tsx                         # (existing)
│   ├── components/LibrarianDashboardSidebar.tsx  # EXTEND: wire sidebar_rooms href to /dashboard/librarian/rooms
│   └── rooms/
│       └── page.tsx                     # NEW: room management dashboard route
└── locales (en.json / vi.json)          # EXTEND: add dashboard UI keys to both files

server/tests/
├── services/
│   └── dashboard.librarian.rooms.spec.mjs  # NEW: stats, list filters, schedule, detail, branch guard tests
```

**Structure Decision**: The feature extends the existing full-stack web application structure (`server/` + `client/`) using the established layered backend and Atomic-Design frontend conventions. No new top-level directories are introduced; the only new files are the dashboard organism/template and page, plus the backend read endpoints and tests.

---

## Phase 0: Research

### Unknowns / Research Tasks

1. **Statistics definitions** — how to compute today's total bookings, currently occupied rooms (occupied/total), and pending check-ins from `reserve_room` / `room_avail` / `study_room` with branch scoping, respecting the `reserved`/`pending`/`used` status lifecycle and `return_room` for completion.
2. **"Active reservations" scope & status mapping** — which reservations belong in the active list (default range), how the three schema statuses + `return_room` presence map to the design's status chips, and how cancelled reservations (hard-deleted by `cancelReservation`) are represented.
3. **Search & filters** — how to search across user name, user ID, and room number, and combine status + date-range filters with server-side pagination in a single parameterized query.
4. **Calendar schedule query** — how to build the week/day grid payload (rooms as rows, days as columns, reservations as time blocks) for a branch and date range, including time-zone handling (slots are `time` + `start_date`; use existing `VIETNAM_NOW_SQL` conventions).
5. **Branch-scoped live push** — how to extend `config/socket.mjs` with a `branch:{branchId}` room (join on connect using JWT `branch_id`) and a `room-dashboard:changed` emit helper, then emit from every mutation point (user and librarian flows + scheduler cleanup/backfill) without breaking existing announcement/study-group broadcasts.
6. **Frontend wiring** — how to add the `/dashboard/librarian/rooms` page, compose the existing atoms/molecules into the dashboard organism, subscribe to `room-dashboard:changed` via `useSocket`, and wire the placeholder `sidebar_rooms` item.

Research findings consolidated in [research.md](research.md).

---

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](data-model.md). No SQL schema changes — the feature reads only existing `study_room`, `room_avail`, `reserve_room`, `return_room`, `users`, and `branches` columns.

### Interface Contracts

See [contracts/room-management-dashboard-api.md](contracts/room-management-dashboard-api.md) for endpoint contracts:
- `GET /dashboard/librarian/rooms/overview` (librarian, auth) — branch-scoped summary counts
- `GET /dashboard/librarian/rooms/reservations?search=&status=&from=&to=&page=&limit=` (librarian, auth) — paginated active reservations
- `GET /dashboard/librarian/rooms/schedule?from=&to=&view=week|day` (librarian, auth) — calendar schedule
- `GET /dashboard/librarian/rooms/reservations/:reserveId` (librarian, auth) — read-only reservation detail
- Socket event `room-dashboard:changed` (server → `branch:{branchId}` room) — emitted on every room-reservation mutation

### Quickstart Validation Guide

See [quickstart.md](quickstart.md) for end-to-end validation scenarios.

### Agent Context Update

`AGENTS.md` plan reference updated to `specs/030-room-management-dashboard/plan.md`.

---

## Complexity Tracking

> Not required — the Constitution Check passes without violations. The feature reuses existing entities, patterns, and structure and adds no new projects or top-level directories.
