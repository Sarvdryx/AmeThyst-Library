# Research: Room Check-In & Check-Out

**Feature**: Room Reservation, Check-In, and Check-Out
**Date**: 2026-07-31

---

## R1: Room PIN Lifecycle (Mirroring Book Borrowing)

### Decision
Create room-specific PIN generation logic that mirrors `generatePickupPin` (`dashboard.user.services.mjs:4`), but operating on `reserve_room` instead of `borrow_book`. The room flow uses the same 6-digit numeric PIN, uniqueness retry loop, and expiry model, with the existing status values already allowed by the `reserve_room` CHECK constraint: `reserved`, `pending`, `used`.

### Rationale
- The existing `reserve_room` table already contains `pin`, `expired_at`, `status`, and `checkin_time` columns (see `05_init_rest.sql:215-226`) — **no schema change is required**.
- The spec (`checkin_room.md`) explicitly states the mechanism "mirrors the existing library book-borrowing workflow" and mandates that PIN generation, expiry countdown, and cleanup "reuse or extend the existing modular codebase".
- The book flow hardcodes table/column names; the cleanest path that respects the "minimize code duplication" requirement is to extract a shared PIN-generation utility parameterized by entity (table + status mapping), OR add a parallel room implementation reusing the same pattern. Given the two tables differ structurally (`borrow_book` uses `borrow_id`, `reserve_room` uses `reserve_id`), a shared service that accepts the target table, id column, and status values is preferred.

### Alternatives Considered
- Reusing `generatePickupPin` directly with a table switch parameter — rejected because the query column names (`borrow_id` vs `reserve_id`) and status values differ, making the shared function awkward with string-switched SQL.
- Implementing a fully separate room PIN service duplicating the retry loop — rejected as it violates the "minimize code duplication" requirement.

### Decisions
- PIN value: 6-digit numeric, unique across all non-cleared records (the `reserve_room_pin_key` UNIQUE constraint on `pin` already exists — `05_init_rest.sql:537`).
- Expiry: exactly 3 minutes from generation (matches spec §3.1).
- On generation: set `pin`, set `expired_at = NOW() + 3 min`, transition `status = 'pending'`.
- If a valid (non-expired) PIN already exists, return the existing PIN rather than generating a new one (same behavior as book flow).
- The user's room card shows "Create PIN" only for `reserved`/`pending` reservations; after check-in the card switches to "Checkout Confirm".

## R2: Expiry Cleanup Extension

### Decision
Extend `cleanupExpiredPins` and `clearAllPins` in `library.services.mjs` (lines 404 and 427) to additionally process `reserve_room`:
- `cleanupExpiredPins`: `UPDATE reserve_room SET pin = NULL, expired_at = NULL, status = 'reserved' WHERE status = 'pending' AND expired_at IS NOT NULL AND expired_at <= NOW()`.
- `clearAllPins` (startup flush): same update without the expiry filter.

### Rationale
- The existing scheduler (`pinScheduler.mjs`) already invokes `cleanupExpiredPins` + `cleanupExpiredReservations` on startup and every 60 seconds. Extending these two functions lets room PIN cleanup ride the existing periodic and startup jobs with no new scheduler wiring.
- The two functions currently target only `borrow_book`; adding a second targeted `UPDATE` for `reserve_room` is additive and cannot regress the book flow.

### Alternatives Considered
- A separate `cleanupExpiredRoomPins` function wired into `pinScheduler.mjs` — valid, but the spec's reusability requirement favors extending the existing functions; a small internal helper used by both keeps it clean.

### Decision (implementation guidance)
- Refactor the two functions to run both the existing `borrow_book` update and a new `reserve_room` update, returning the combined row count.

## R3: Librarian Room PIN Verification & Check-In

### Decision
Add `verifyRoomPin(pin)` and `confirmRoomCheckin(reserveId)` services mirroring `verifyReturnPin` (`dashboard.librarian.services.mjs:9`) and `confirmReturn`. 
- `verifyRoomPin` queries `reserve_room` where `status = 'pending'` and `pin = $1 AND expired_at > NOW()`, joining `users` and (via `avail_id` → `room_avail` → `study_room`) to return reservation, user, and room details.
- `confirmRoomCheckin` (transactional): set `checkin_time = NOW()`, null `pin`/`expired_at`, set `status = 'used'`.

### Rationale
- The spec §4.1 defines verification as querying `reserve_room` for `status = 'pending'` matching the entered PIN — no branch filter is specified, mirroring the return flow (spec `026` removed branch filtering for returns). Room reservations are per-branch via `study_room.branch_id`, but the spec does not require a librarian branch check for room check-in.
- The transaction pattern follows `confirmReturn` / `confirmBorrowing` (`pool.connect()` + `BEGIN/COMMIT/ROLLBACK`).

### Decisions
- Error on no match / expired: "The PIN has expired or does not exist." (consistent with book flow messaging).
- On success, return `{ reserveId, reservation, user: {username, email, phone_number}, room: {roomName, imgUrl, startTime, endTime} }`.

## R4: Check-Out Confirmation & Defaulting

### Decision
- `POST /api/rooms/reserve/:reserveId/checkout`: create a `return_room` row with `return_id` (default UUID), `reserve_id`, and `checkout_time = NOW()`. Only allowed when the reservation is `used` (checked in) or its time slot has elapsed, and no `return_room` row exists yet (SC-006: no duplicate returns). Idempotent — returning the existing record if present.
- **Fallback defaulting**: if the user never confirms, a scheduled job (extending `pinScheduler.mjs`) backfills `return_room` for reservations whose slot time has passed, using `checkout_time` = that day's `end_time` from `room_avail`. A reservation counts as "elapsed" when `start_date` + `end_time` < NOW(). Only reservations with a `checkin_time` (i.e., `used`) are backfilled.

### Rationale
- Spec §3.2 defines checkout_time as the exact confirmation timestamp, with a fallback to the `end_time` from `room_avail` when the user fails to click.
- Reusing the existing periodic scheduler keeps infrastructure consistent with the book cleanup model.

### Decisions
- The scheduler's backfill runs on the same 60-second interval and on startup (idempotent `INSERT ... WHERE NOT EXISTS`).
- UI: the reservation card renders "Checkout Confirm" when `status = 'used'` (replacing Create PIN / Cancel). A successful checkout moves the card to the past/history section.

## R5: History Query with Date Filter

### Decision
Extend `findUserReservations` (`room.models.mjs:133`) to:
- Join `return_room` on `reserve_id` to expose `checkout_time`.
- Expose `checkin_time` directly from `reserve_room`.
- Accept optional `from` / `to` date filters applied to `start_date`.

### Rationale
- Spec §3.3 requires date-based filtering and both `checkin_time` (from `reserve_room`) and `checkout_time` (from `return_room`) in the history view.
- Extending the existing query keeps the frontend history consumption unchanged in shape while adding fields.

### Decisions
- `GET /api/rooms/history?from=YYYY-MM-DD&to=YYYY-MM-DD` returns the user's reservations within the range (inclusive), ordered by `start_date DESC`.
- The existing `GET /api/rooms/user-reservations` response is extended with `checkinTime` / `checkoutTime` fields so the current dashboard cards remain functional.

## R6: Per-User Reservation Count (`users.reserve_num`)

### Decision
Manage the existing but dormant `users.reserve_num` column (`04_datauser.sql:44`, `DEFAULT 0`) to mirror the `borrow_num` pattern for books:
- **Limit guard**: a new constant `MAX_ROOM_RESERVE_LIMIT = 5` (mirrors `MAX_BORROW_LIMIT = 5` in `library.services.mjs:6`) caps active room reservations. Before inserting in `createReservation`, the service reads the user's `reserve_num`; if `reserve_num >= MAX_ROOM_RESERVE_LIMIT` the request is rejected with `ROOM_RESERVE_LIMIT_EXCEEDED` (HTTP 400), mirroring `BORROW_LIMIT_EXCEEDED` (`library.services.mjs:296-306`). The check and the increment run inside the same `createReservation` transaction to avoid races.
- **Increment**: `UPDATE public.users SET reserve_num = reserve_num + 1 WHERE user_id = $1` when a room reservation is created (inside the existing `createReservation` transaction in `room.services.mjs`). Note: study-group reservations also insert into `reserve_room` (`study-group.models.mjs:78`) — keep their flow unchanged (out of scope); only freely-created room reservations managed here.
- **Decrement on cancel**: inside the existing `cancelReservation` path in `room.services.mjs`, `UPDATE public.users SET reserve_num = GREATEST(reserve_num - 1, 0) WHERE user_id = $1`.
- **Decrement on checkout**: inside the new `confirmCheckout` transaction, same decrement as cancel.

### Rationale
- The `users` table already has `reserve_num` — the book flow manages `borrow_num` (`library.services.mjs:364` increment, `dashboard.user.services.mjs:98` / `dashboard.librarian.services.mjs:245` decrement); the room flow should be consistent.
- A per-user limit prevents a single user from hoarding every available slot; `MAX_ROOM_RESERVE_LIMIT = 5` mirrors the book borrow cap and is defined as a single tunable constant.
- Keeps the existing `reserve_room` row intact for history (decrement only the counter, never delete on checkout).

### Alternatives Considered
- Deleting the `reserve_room` row on checkout — rejected; history and `return_room.reserve_id` reference the row.
- Leaving `reserve_num` unused — rejected; the column exists and inconsistent counts would confuse the profile display.
- No limit / relying only on slot conflicts — rejected; a user could occupy every slot in a branch, starving other users. The `borrow_num` pattern already established the limit-guard approach for books.

### Decisions
- All three mutations use `GREATEST(..., 0)` / `+1` guards to keep the counter non-negative.
- The check-and-increment and the checkout decrement run inside transactions with the row mutation (atomicity).
- The limit error code is `ROOM_RESERVE_LIMIT_EXCEEDED` with the message including `MAX_ROOM_RESERVE_LIMIT` (mirrors `BORROW_LIMIT_EXCEEDED`).
