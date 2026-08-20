# Data Model: Room Reservation, Check-In, and Check-Out

**Feature**: Room Reservation, Check-In, and Check-Out
**Date**: 2026-07-31

> **Schema change status: NONE.** This feature operates entirely on existing columns in `reserve_room`, `return_room`, and `room_avail`. No `database/init_db/postgres/*.sql` files are modified.

## Entities

### 1. `reserve_room` — Room reservation / check-in source

| Column | Type | Purpose in this feature |
|--------|------|-------------------------|
| `reserve_id` | uuid (PK, default `gen_random_uuid()`) | Reservation identity; referenced by `return_room.reserve_id` |
| `user_id` | uuid (FK → `users.user_id`) | Owning user |
| `avail_id` | int (FK → `room_avail.avail_id`) | Links to the time slot; used to resolve room + `end_time` for checkout defaulting |
| `start_date` | date | Reservation day; used for history date filters and elapsed-time checks |
| `created_at` | timestamp (default now) | Creation time |
| `checkin_time` | timestamp (nullable) | Recorded on librarian PIN verification (§4.1) |
| `pin` | varchar(10), UNIQUE (nullable) | Generated PIN; cleared on check-in, expiry, or checkout |
| `expired_at` | timestamp (nullable) | PIN expiry (`generation + 3 min`) |
| `status` | varchar(20) CHECK (`pending`, `reserved`, `used`) | Lifecycle state |

**Status lifecycle**

```text
reserved ──(create PIN)──▶ pending ──(librarian verifies)──▶ used
     ▲                        │
     └────(PIN expired/cleaned)─┘
```

- `reserved`: initial state after booking; "Create PIN" visible.
- `pending`: PIN generated, awaiting librarian verification; PIN + `expired_at` populated.
- `used`: checked in by librarian; `checkin_time` set, `pin`/`expired_at` cleared; card shows "Checkout Confirm".

**Validation / invariants**
- PIN is 6-digit numeric and unique across all rows (`reserve_room_pin_key`).
- `expired_at` = `pin` generation time + exactly 3 minutes.
- No duplicate active reservation per slot/date (`uq_reserve_room_active_slot` unique index on `(avail_id, start_date)` where status in `('pending','reserved','used')`).
- A reservation transitions to `used` only once; re-verification of a `used` reservation is rejected.

### 2. `return_room` — Check-out record

| Column | Type | Purpose |
|--------|------|---------|
| `return_id` | uuid (PK, default `gen_random_uuid()`) | Check-out identity (same generation logic as `return_book`) |
| `reserve_id` | uuid (FK → `reserve_room.reserve_id`, ON DELETE CASCADE) | Referenced reservation |
| `checkout_time` | timestamp (default now) | Confirmation timestamp, or defaulted `end_time` on the reservation date |

**Invariants**
- Exactly one `return_room` row per reservation (SC-006) — enforced via application-level idempotency and scheduler `WHERE NOT EXISTS`.
- `checkout_time` is either the user's confirmation timestamp or the slot's `end_time` on `start_date` (fallback).

### 3. `room_avail` — Time slot (read-only reference)

| Column | Type | Purpose |
|--------|------|---------|
| `avail_id` | int (PK) | Joined from `reserve_room.avail_id` |
| `room_id` | int (FK → `study_room.room_id`) | Resolves room details for librarian verification |
| `start_time` | time | Slot start |
| `end_time` | time | Slot end — used as default `checkout_time` fallback |

## Relationships

```text
users ──< reserve_room >── room_avail ──> study_room
         │
         └──< return_room (reserve_id, 1:1 max)
```

- `reserve_room.user_id` → `users.user_id`
- `reserve_room.avail_id` → `room_avail.avail_id`
- `room_avail.room_id` → `study_room.room_id`
- `return_room.reserve_id` → `reserve_room.reserve_id` (0..1 per reservation)

### `users` — reservation counter

| Column | Type | Purpose in this feature |
|--------|------|-------------------------|
| `reserve_num` | int (NOT NULL, DEFAULT 0) | Number of active room reservations for the user. Incremented on reservation creation; decremented (floor 0) on cancel and on checkout. Mirrors the `borrow_num` pattern for books. Also serves as the guard for the per-user limit: `createReservation` rejects with `ROOM_RESERVE_LIMIT_EXCEEDED` when `reserve_num >= MAX_ROOM_RESERVE_LIMIT` (5, mirrors `MAX_BORROW_LIMIT`). |

## Time semantics

| Concept | Source | Notes |
|---------|--------|-------|
| PIN expiry | `reserve_room.expired_at` | `NOW() + interval '3 minutes'` at generation |
| Check-in time | `reserve_room.checkin_time` | Exact timestamp of librarian PIN entry |
| Check-out time | `return_room.checkout_time` | Confirmation timestamp or defaulted slot `end_time` |
| Slot elapsed | `start_date + end_time` | Used to determine when "Checkout Confirm" becomes available and when backfill applies |
