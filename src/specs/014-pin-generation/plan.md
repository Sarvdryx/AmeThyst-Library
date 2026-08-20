# Implementation Plan: PIN Generation for Book Pickup

**Branch**: `014-pin-generation` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-pin-generation/spec.md`

## Summary

Add a 6-digit PIN generation system for verifying physical book pickup at the library counter. When a user with a reserved book clicks "View PIN", the backend generates a unique 6-digit PIN stored in the existing `borrow_book.pin` column with a 5-minute expiration (`expired_at`). The frontend displays the PIN in a modal with a countdown timer. Expired PINs are cleaned up via a periodic server job and a server startup flush. Additionally, the existing cancel reservation endpoint is modified to allow cancellation of reservations in both "reserved" and "pending" status (previously only "pending" was allowed), deleting the `borrow_book` row entirely.

## Technical Context

**Language/Version**: JavaScript (ES Modules `.mjs`) — Backend: Node.js/Express.js; Frontend: Next.js (React 18+, TypeScript)

**Primary Dependencies**: Express.js, Next.js, PostgreSQL (via `pg` pool), Tailwind CSS, i18n (en/vi)

**Storage**: PostgreSQL — `borrow_book` table already has `pin` (VARCHAR) and `expired_at` (TIMESTAMP) nullable columns with a UNIQUE constraint on `pin`

**Testing**: Manual validation via quickstart guide (no test framework currently configured)

**Target Platform**: Web — responsive desktop/mobile browser; Backend on `localhost:5000`, Frontend on `localhost:3000`

**Project Type**: Web application (Next.js frontend + Express.js backend)

**Performance Goals**: PIN generation response under 3 seconds; startup cleanup under 5 seconds

**Constraints**: Must not modify existing borrowing/return workflows; PIN feature is an add-on layer via "pending" status; cancel endpoint modified to support both "reserved" and "pending"

**Scale/Scope**: Single library system with 2 branches, ~2000 books, ~100 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-Driven & Reusability | ✅ PASS | New PIN Modal follows Atomic Design; placed in `organisms/` |
| II. State Management & Data Fetching | ✅ PASS | Uses `NEXT_PUBLIC_API_URL`; handles loading/error/success states |
| III. Responsive & Beautiful Design | ✅ PASS | Modal uses Tailwind responsive utilities; dark mode support |
| IV. Performance Optimization | ✅ PASS | Client Component for interactive modal; no layout shift |
| V. Error Handling & Accessibility | ✅ PASS | Frontend validation; user-friendly error messages; accessible modal |
| VI. Directory Structure | ✅ PASS | Follows existing `server/src/` and `client/app/` conventions |
| VII. Modular Architecture (Backend) | ✅ PASS | Layered: Route → Controller → Service; no business logic in routes |
| VIII. Import Path Verification | ✅ PASS | All imports will use verified relative paths |
| IX. Theme & Localization | ✅ PASS | Dark mode via Tailwind `dark:` classes; all text via i18n `t()` |

**No violations detected. Gate passes.**

## Project Structure

### Documentation (this feature)

```text
specs/014-pin-generation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── server/src/
│   ├── config/
│   │   └── postgres.mjs              # Existing — no changes
│   ├── controllers/
│   │   └── library.controller.mjs    # MODIFY — add generatePickupPin handler
│   ├── middlewares/
│   │   └── auth.middleware.mjs       # Existing — no changes
│   ├── routes/
│   │   └── library.mjs              # MODIFY — add POST /reserve/:id/pin route
│   ├── services/
│   │   └── library.services.mjs     # MODIFY — add generatePickupPin, cleanupExpiredPins, clearAllPins; modify cancelReservationById to allow both reserved+pending
│   └── server.mjs                   # MODIFY — add startup PIN cleanup
│
├── client/app/
│   ├── components/
│   │   ├── atoms/
│   │   │   └── index.ts             # MODIFY — export PinCountdown
│   │   ├── molecules/
│   │   │   └── BorrowedBookCard.tsx  # MODIFY — add "View PIN" button + onViewPin prop; keep Cancel button for both reserved+pending
│   │   └── organisms/
│   │       ├── index.ts             # MODIFY — export PinModal
│   │       └── PinModal.tsx         # CREATE — PIN display modal with countdown
│   ├── dashboard/user/borrowed/
│   │   └── page.tsx                 # MODIFY — wire up PIN modal state + onViewPin handler
│   └── locales/
│       ├── en.json                  # MODIFY — add PIN-related i18n keys
│       └── vi.json                  # MODIFY — add PIN-related i18n keys
```

**Structure Decision**: Option 2 (Web application) — existing frontend/backend split preserved. No new directories created; new file `PinModal.tsx` placed in existing `organisms/` per Atomic Design.

## Complexity Tracking

No constitution violations — no complexity tracking needed.
