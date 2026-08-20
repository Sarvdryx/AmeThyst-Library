# Implementation Plan: Room Reservation, Check-In, and Check-Out

**Branch**: `029-room-checkin-checkout` | **Date**: 2026-07-31 | **Spec**: [spec.md](specs/029-room-checkin-checkout/spec.md)

**Input**: Feature specification from `specs/029-room-checkin-checkout/spec.md`

---

## Summary

Implement the end-to-end room reservation lifecycle on top of the existing freely-room-reservation and book-borrowing codebase:
- **User PIN generation**: The "Create PIN" button on the user's upcoming reservation card generates a 6-digit PIN, sets a 3-minute expiry, and transitions the reservation to `pending`.
- **Automatic PIN cleanup**: Extend the existing PIN scheduler so expired room PINs revert `pending` → `reserved` and clear PIN data (both periodically and on startup).
- **Librarian check-in**: A new "Confirm Room Check-in" tab on the librarian dashboard verifies a pending room PIN, records `checkin_time`, clears PIN data, and sets status `used`.
- **User check-out**: Once the reservation's active time has elapsed, the room card swaps to a "Checkout Confirm" button that creates a `return_room` record with the exact checkout timestamp; if the user never confirms, a background job defaults `checkout_time` to the slot's `end_time`.
- **Reservation history**: The room reservation history view gains date-based filtering plus `checkin_time` (from `reserve_room`) and `checkout_time` (from `return_room`).
- **Per-user reservation count**: Manage the dormant `users.reserve_num` column to mirror the `borrow_num` pattern — increment when a room reservation is created, decrement (floor 0) when a reservation is cancelled or checked out, and **enforce a per-user limit** (`MAX_ROOM_RESERVE_LIMIT`) that rejects new reservations once the user holds the maximum number of active room reservations (mirrors `MAX_BORROW_LIMIT` / `BORROW_LIMIT_EXCEEDED` for books).

All flows reuse the modular book-borrowing patterns (`generatePickupPin`, `findBorrowRecordByPin`, `cleanupExpiredPins`, `clearAllPins`) refactored for multi-entity (book + room) handling to minimize code duplication.

---

## Technical Context

**Language/Version**: JavaScript (Node.js ES Modules `.mjs` backend; React 18 / Next.js App Router frontend)

**Primary Dependencies**: Express.js, Next.js, `pg` (PostgreSQL pool), existing `pinScheduler.mjs` / `useCountdownFromDate` / `PinModal` / `OTPInput` components

**Storage**: PostgreSQL — `reserve_room` (PIN, expiry, check-in, status), `return_room` (check-out records), `room_avail` (slot end-time for checkout defaulting). **No schema changes required** — all columns already exist.

**Testing**: Vitest (server services & controllers per existing `server/tests/` convention)

**Target Platform**: Web Browsers (Responsive Desktop, Tablet, Mobile)

**Project Type**: Full-Stack Web Application (`client/` + `server/`)

**Performance Goals**: PIN generation and verification return within 1 second; expiry cleanup runs within the existing 60-second periodic interval

**Constraints**: Mirror the book borrowing workflow for consistency; no DB schema changes; preserve existing status CHECK constraint values (`reserved`, `pending`, `used`); PINs remain 6-digit numeric and unique across active records; `users.reserve_num` is incremented on reservation creation and decremented (never below 0) on cancel and checkout; a new per-user constant `MAX_ROOM_RESERVE_LIMIT` (mirrors `MAX_BORROW_LIMIT = 5`) caps active room reservations — creation is rejected with `ROOM_RESERVE_LIMIT_EXCEEDED` (HTTP 400) when `users.reserve_num` reaches the limit

**Scale/Scope**: Per-user room reservations across library branches; single active PIN per reservation

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post Phase 1 design.*

- [x] **Core Principle I (Component-Driven & Atomic Design)**: Reuses `PinModal` (organism), `OTPInput`/buttons (atoms), `ReservationCard` (molecule), and the `InlinePinVerification` interaction pattern for the librarian check-in tab. No new folder under `client/app/components` — only extend existing atoms/molecules/organisms.
- [x] **Core Principle II (State Management & API Base URL)**: All fetches use `apiFetch` → `NEXT_PUBLIC_API_URL`; loading/error/success states handled explicitly on card actions and the librarian tab.
- [x] **Core Principle III (Responsive Design)**: Room cards and history use existing responsive grid/flexbox layouts.
- [x] **Core Principle V (Error Handling & Accessibility)**: User-friendly errors for expired/invalid PIN, forbidden re-generation, and checkout failures; OTP inputs retain existing keyboard/paste/aria-label handling.
- [x] **Core Principle VI & VIII (Directory Structure & Import Verification)**: Verified workspace hierarchy (`client/app/components/**`, `server/src/{routes,controllers,services,models}/**`); imports follow verified relative paths.
- [x] **Core Principle VII & Backend Conventions**: New endpoints follow `routes -> middlewares -> controllers -> services -> models` with `.mjs`; business logic stays in services (fat services) with transaction-safe mutations.
- [x] **Core Principle IX (Theme & Localization)**: New UI text uses design tokens (dark-mode utilities) and i18n keys added to both `en.json` and `vi.json`.

---

## Project Structure

### Documentation (this feature)

```text
specs/029-room-checkin-checkout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── room-checkin-checkout-api.md
└── tasks.md             # Phase 2 output (to be generated by /speckit.tasks)
```

### Source Code (repository root)

```text
server/src/
├── controllers/
│   ├── room.controllers.mjs          # EXTEND: room PIN, checkout, history controllers
│   └── dashboard.librarian.controllers.mjs  # EXTEND: room PIN verify + check-in confirm
├── models/
│   └── room.models.mjs               # EXTEND: PIN update, return record, history queries, reserve_num lifecycle + limit guard
├── routes/
│   ├── room.routes.mjs               # EXTEND: room PIN + checkout + history endpoints
│   └── dashboard.librarian.routes.mjs # EXTEND: room check-in endpoints
├── services/
│   ├── room.services.mjs             # EXTEND: room PIN lifecycle + checkout + history + reserve_num updates + MAX_ROOM_RESERVE_LIMIT guard
│   ├── library.services.mjs          # EXTEND: cleanupExpiredPins/clearAllPins for reserve_room
│   └── dashboard.librarian.services.mjs # EXTEND: room PIN verify + check-in confirm
└── utils/
    └── pinScheduler.mjs              # EXTEND: room PIN cleanup + checkout defaulting

client/app/
├── components/
│   ├── atoms/                        # reuse OTPInput, existing buttons
│   ├── molecules/
│   │   ├── ReservationCard.tsx       # EXTEND: wire Create PIN, PIN modal, Checkout Confirm
│   │   └── index.ts                  # export additions
│   └── organisms/
│       └── RoomCheckinTab.tsx        # NEW: librarian Confirm Room Check-in tab
├── dashboard/user/reservations/page.tsx   # EXTEND: date filtering + checkin/checkout columns
└── dashboard/librarian/...           # EXTEND: add room check-in tab to dashboard template

server/tests/
├── services/
│   └── room.services.spec.mjs        # NEW: room PIN + checkout service tests
```

**Structure Decision**: The feature extends the existing full-stack web application structure (`server/` + `client/`) using the established layered backend and Atomic-Design frontend conventions. No new top-level directories are introduced.

---

## Phase 0: Research

### Unknowns / Research Tasks

1. **Room PIN lifecycle mirroring** — how to adapt `generatePickupPin`/`generateReturnPin` (currently hardcoded to `borrow_book`) into a reusable PIN service for `reserve_room` with 3-minute expiry and status `pending`.
2. **Expiry cleanup extension** — how `cleanupExpiredPins` and `clearAllPins` in `library.services.mjs` can be extended (without breaking book flows) to also revert `reserve_room` pending PINs to `reserved` and clear PIN/expiry columns.
3. **Librarian room PIN verification** — adapt `findBorrowRecordByPin` / `verifyPin` to query `reserve_room` (status `pending`) and return reservation + user + room details; decide whether branch scoping applies (spec does not require it — mirror the return-flow's no-branch-filter).
4. **Checkout confirmation & defaulting** — design the checkout endpoint (creates `return_room`) and the fallback that defaults `checkout_time` to the slot's `end_time` when the user never confirms, including where that fallback runs (scheduler).
5. **History query with date filter** — extend `findUserReservations` to join `return_room` and expose `checkin_time` / `checkout_time`, plus a date-range filter parameter.

Research findings consolidated in [research.md](research.md).

---

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](data-model.md). No SQL schema changes — the feature operates entirely on existing `reserve_room`, `return_room`, and `room_avail` columns.

### Interface Contracts

See [contracts/room-checkin-checkout-api.md](contracts/room-checkin-checkout-api.md) for endpoint contracts:
- `POST /api/rooms/reserve/:reserveId/pin` (user, auth)
- `POST /api/rooms/reserve/:reserveId/pin/cleanup` (user, auth)
- `POST /api/rooms/reserve/:reserveId/checkout` (user, auth)
- `GET /api/rooms/history?from=&to=` (user, auth) — date-filtered history with check-in/check-out
- `POST /dashboard/librarian/verify-room-pin` (librarian, auth)
- `POST /dashboard/librarian/confirm-room-checkin` (librarian, auth)

### Quickstart Validation Guide

See [quickstart.md](quickstart.md) for end-to-end validation scenarios.

### Agent Context Update

`AGENTS.md` plan reference updated to `specs/029-room-checkin-checkout/plan.md`.

---

## Complexity Tracking

> Not required — the Constitution Check passes without violations. The feature reuses existing entities and adds no new projects, patterns, or top-level structure.
