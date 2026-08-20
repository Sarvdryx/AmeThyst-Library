# Quickstart: Room Check-In & Check-Out Validation

**Feature**: Room Reservation, Check-In, and Check-Out
**Date**: 2026-07-31

This guide validates the feature end-to-end. API contracts: [contracts/room-checkin-checkout-api.md](contracts/room-checkin-checkout-api.md). Data model: [data-model.md](data-model.md).

---

## Prerequisites

- Backend running: `cd server && npm run dev` (port 5000, env `PORT`).
- Frontend running: `cd client && npm run dev` (port 3000).
- PostgreSQL up (via `database/init_db` schema) with a user account and a librarian account.
- At least one upcoming room reservation for the user (status `reserved`) — create via `POST /api/rooms/reserve` or the map UI.

---

## Scenario 1 — User generates a room check-in PIN

1. Log in as a user; navigate to **Room Reservations** (dashboard → Room Reservations tab).
2. On an upcoming reservation card, click **"Create PIN"**.
3. **Expected**: `POST /api/rooms/reserve/:reserveId/pin` succeeds; a `PinModal` shows the 6-digit PIN with a 3-minute countdown; reservation `status` becomes `pending`.
4. Close and reopen the modal during the countdown: **same PIN** is shown (idempotent).

**Verification query**:

```sql
SELECT reserve_id, pin, expired_at, status
FROM reserve_room
WHERE reserve_id = '<id>';
-- status = 'pending', pin not null, expired_at = generated + 3 min
```

## Scenario 2 — PIN expiry cleanup

1. With a `pending` reservation, wait 3+ minutes (or temporarily shorten the interval / mock time).
2. **Expected**: within the 60-second cleanup interval, `status` reverts to `reserved`, `pin` and `expired_at` become NULL.
3. The card's "Create PIN" button is available again.

**Verification query**:

```sql
SELECT pin, expired_at, status FROM reserve_room WHERE reserve_id = '<id>';
-- pin = NULL, expired_at = NULL, status = 'reserved'
```

## Scenario 3 — Librarian verifies PIN and checks in

1. Log in as a librarian; open **PIN Verification → Confirm Room Check-in** tab.
2. Enter the user's active PIN.
3. **Expected**: `POST /dashboard/librarian/verify-room-pin` returns the reservation, user, and room details.
4. Click **Confirm Check-in**.
5. **Expected**: `POST /dashboard/librarian/confirm-room-checkin` succeeds; `status = 'used'`, `checkin_time` set, `pin`/`expired_at` cleared.
6. **Negative**: enter an invalid/expired PIN → error "The PIN has expired or does not exist." and no record changes.

**Verification query**:

```sql
SELECT status, checkin_time, pin, expired_at FROM reserve_room WHERE reserve_id = '<id>';
-- status = 'used', checkin_time NOT NULL, pin = NULL, expired_at = NULL
```

## Scenario 4 — User confirms check-out

1. As the user, wait until the reservation slot has elapsed (after `start_date + end_time`).
2. On the room card (now in `used` state), the "Create PIN"/"Cancel" buttons are replaced by **"Checkout Confirm"**.
3. Click **"Checkout Confirm"**.
4. **Expected**: `POST /api/rooms/reserve/:reserveId/checkout` creates a `return_room` record with `checkout_time` = confirmation time. Card leaves the upcoming section.
5. Click again (duplicate): idempotent — same `return_id` returned, no second row.

**Verification query**:

```sql
SELECT return_id, reserve_id, checkout_time FROM return_room WHERE reserve_id = '<id>';
-- exactly 1 row; checkout_time ≈ user's confirmation timestamp
```

## Scenario 7 — `reserve_num` lifecycle and per-user limit

1. Note the user's current `users.reserve_num`.
2. Create a room reservation → **Expected**: `reserve_num` incremented by 1.
3. Cancel the reservation → **Expected**: `reserve_num` decremented back (floor 0).
4. Create a second reservation, have it checked in, then check out → **Expected**: `reserve_num` decremented by 1 after checkout.
5. With `reserve_num` at 0, cancel/checkout again → **Expected**: stays at 0 (no negative values).
6. Create reservations until `reserve_num` reaches `MAX_ROOM_RESERVE_LIMIT` (5) → **Expected**: the next creation attempt fails with `ROOM_RESERVE_LIMIT_EXCEEDED` (HTTP 400) and `reserve_num` stays at the limit.
7. Cancel one reservation → **Expected**: creation becomes possible again (`reserve_num` below the limit).

**Verification query**:

```sql
SELECT reserve_num FROM users WHERE user_id = '<id>';
```

**Note**: Study-group reservations (`study-group.models.mjs`) are out of scope and do not modify `reserve_num`.

## Scenario 5 — Check-out defaulted to slot end time (no user confirmation)

1. Create a reservation, have the librarian check it in (`used`).
2. Do NOT click "Checkout Confirm"; wait until the slot end time passes and the cleanup interval runs.
3. **Expected**: a `return_room` row is backfilled with `checkout_time` = that day's `end_time` from `room_avail`.

**Verification query**:

```sql
SELECT rr.return_id, rr.checkout_time, ra.end_time, rr.reserve_id
FROM return_room rr
JOIN reserve_room r ON rr.reserve_id = r.reserve_id
JOIN room_avail ra ON r.avail_id = ra.avail_id
WHERE rr.reserve_id = '<id>';
-- checkout_time matches end_time on start_date
```

## Scenario 6 — Date-filtered history

1. As the user, open the room reservation history view.
2. Apply a date range covering a completed reservation.
3. **Expected**: `GET /api/rooms/history?from=...&to=...` returns only reservations in the range, each showing `checkinTime` and `checkoutTime`.
4. Apply a range with no reservations → empty list.

---

## Automated Tests

Run the server test suite:

```bash
cd server && npm test
```

New tests (see plan) cover: PIN generation idempotency + status transition, expiry cleanup, librarian verify + confirm check-in, checkout creation + idempotency, checkout defaulting, and history date filtering.
