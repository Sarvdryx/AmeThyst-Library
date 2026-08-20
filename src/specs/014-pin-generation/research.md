# Research: PIN Generation for Book Pickup

**Date**: 2026-06-26
**Feature**: 014-pin-generation

## Research Questions

### R1: How to generate a unique 6-digit PIN in PostgreSQL/Node.js?

**Decision**: Use `Math.floor(100000 + Math.random() * 900000)` in the service layer, then check uniqueness via `SELECT pin FROM borrow_book WHERE pin = $1 AND expired_at > NOW()` before inserting. Retry up to 3 times on collision.

**Rationale**: The `borrow_book` table already has a UNIQUE constraint on `pin`, so the database is the final safety net. Application-level check avoids unnecessary constraint violations. Simple random generation is sufficient for a 6-digit space (1M possibilities) with a low collision rate given the small number of active reservations (~<100 at any time).

**Alternatives considered**:
- `crypto.randomInt(100000, 999999)` — cryptographically secure but overkill for a pickup verification PIN. Rejected because the PIN is not a security credential; it's a physical verification aid.
- UUID-based — produces non-user-friendly strings. Rejected per spec requirement for 6-digit numeric PIN.

### R2: How to implement the 5-minute PIN expiration?

**Decision**: Store `expired_at` as `NOW() + INTERVAL '5 minutes'` in PostgreSQL. A periodic `setInterval` job (every 60 seconds) runs `UPDATE borrow_book SET pin = NULL, expired_at = NULL, status = 'reserved' WHERE status = 'pending' AND expired_at < NOW()`.

**Rationale**: The periodic cleanup approach is simple, reliable, and matches the spec's requirement. 60-second intervals ensure PINs are cleared within 1 minute of expiration (meets SC-003). The `expired_at` column already exists and is indexed implicitly via the UNIQUE constraint.

**Alternatives considered**:
- Event-driven (setTimeout per PIN) — fragile on server restart, harder to manage at scale. Rejected per spec's explicit requirement for periodic + startup cleanup.
- PostgreSQL LISTEN/NOTIFY — adds complexity without benefit for this use case.

### R3: How to implement server startup PIN cleanup?

**Decision**: Add a synchronous call at the end of `server.mjs` (after `pool` is initialized) that executes `UPDATE borrow_book SET pin = NULL, expired_at = NULL, status = 'reserved' WHERE status = 'pending'`. This runs before `app.listen()`.

**Rationale**: Ensures all stale PINs from crashes are flushed before the server accepts requests. Simple one-liner that executes once on boot. Meets SC-004 (within 5 seconds).

**Alternatives considered**:
- Migration script — separate process, harder to guarantee execution. Rejected because the spec requires automatic server startup cleanup.

### R4: How to display the PIN modal on the frontend?

**Decision**: Create a new `PinModal` organism component using a React portal (`createPortal`) with a backdrop overlay. The modal receives `pin`, `expiresAt`, and `onClose` as props. A `useEffect` interval updates the countdown every second.

**Rationale**: Follows Atomic Design (organisms for complex UI). Portal ensures modal renders above all content. The countdown is client-side only (derived from `expiresAt`), avoiding unnecessary API calls. Meets FR-005, FR-006.

**Alternatives considered**:
- Inline expansion instead of modal — less standard UX for PIN display; rejected for clarity.
- Toast/notification — too ephemeral for a PIN that needs to be shown to staff.

### R5: What API endpoint design for PIN generation?

**Decision**: `POST /api/library/reserve/:reservationId/pin` — authenticated, returns `{ pin, expiresAt }`. The backend checks ownership, generates PIN if none active, or returns existing active PIN.

**Rationale**: RESTful convention for sub-resource actions. Single endpoint handles both "generate new" and "view existing" per FR-006 and edge case #1. The `reservationId` (borrow_id) uniquely identifies the reservation.

**Alternatives considered**:
- Separate GET + POST endpoints — more RESTful but adds complexity for a simple flow. Rejected because the frontend always needs to "get or create" in one step.
- Query param `?action=generate` — non-standard.

### R6: How to handle the "pending" status lifecycle?

**Decision**: The status transitions are:
- `reserved` → `pending` (on PIN generation)
- `pending` → `reserved` (on PIN expiration or server restart cleanup)
- `pending` → `borrowed` (existing checkout flow — no change)
- `reserved` → `expired` (existing 7-day pickup window — no change)

**Rationale**: The existing CHECK constraint already allows `pending` status. The PIN feature only adds the `reserved` ↔ `pending` transitions. The existing `cancelReservation` function already handles `pending` status (deletes reservation). No modification to existing flows needed.

**Alternatives considered**:
- New `pin_active` status — violates FR-010 (no modification to existing workflows). Rejected.

### R7: How to update the BorrowedBookCard for "View PIN" button?

**Decision**: Add an `onViewPin?: (id: string) => void` prop to `BorrowedBookCard`. When `book.status === 'pending'` and `onViewPin` is provided, render a "View PIN" button alongside the existing "Cancel" button. The button calls `onViewPin(book.id)`.

**Rationale**: Follows existing pattern (onReturn, onRenew, onCancel callbacks). Minimal change to existing component. The parent page (`borrowed/page.tsx`) manages the PIN modal state.

**Alternatives considered**:
- Replace Cancel with View PIN — loses cancel functionality. Rejected.
- Separate component — breaks consistency with existing card pattern.

### R8: How to handle the "View PIN" flow when PIN already exists?

**Decision**: The `POST /reserve/:id/pin` endpoint checks if a `pending` reservation with a valid (non-expired) PIN already exists. If so, it returns the existing PIN and `expiresAt` without generating a new one. The frontend modal always displays whatever the backend returns.

**Rationale**: Meets FR-006 (reopen to view same PIN) and edge case #1 (don't generate new PIN if active exists). Simple server-side check avoids duplicate PIN generation.

### R9: How to modify cancel reservation to support both "reserved" and "pending" status?

**Decision**: Modify `cancelReservationById` in `library.services.mjs` to remove the status check at line 314 (`if (reservation.status !== 'pending')`). The function should accept both `reserved` and `pending` statuses, performing the same cleanup: increment available_quantity, delete the `borrow_book` row, and decrement `borrow_num`.

**Rationale**: The existing function already performs all the necessary cleanup steps (restore inventory, delete row, decrement borrow_num). The only change is removing the status guard that restricts cancellation to `pending` only. This is a one-line removal with no new logic needed. The `borrow_book` row deletion inherently clears any active PIN data.

**Alternatives considered**:
- Separate endpoint for reserved vs. pending cancel — unnecessary complexity; the cleanup is identical.
- Soft delete (set status to 'cancelled') — violates the user's requirement to "delete the row from borrow_book".

### R10: How should the "Cancel" button appear on BorrowedBookCard for both statuses?

**Decision**: The "Cancel" button should be rendered for both `reserved` and `pending` status. The existing `onCancel` prop is already wired up in `borrowed/page.tsx`. No change to the button rendering logic is needed — it already shows for `pending` status. The only addition is extending the condition to also show for `reserved` status.

**Rationale**: The BorrowedBookCard currently only shows the Cancel button for `pending` status (line 105-107). By changing the condition to `book.status === 'pending' || book.status === 'reserved'`, the button appears for both statuses with zero additional logic.

**Alternatives considered**:
- Different button styles for reserved vs. pending — unnecessary visual complexity; same action, same button.

## Summary of Decisions

| # | Decision | Key Tradeoff |
|---|----------|-------------|
| R1 | Math.random() + DB uniqueness check | Simplicity vs. cryptographic security (acceptable) |
| R2 | Periodic setInterval (60s) | Reliability vs. real-time precision (acceptable) |
| R3 | Synchronous UPDATE on server boot | Simplicity vs. startup delay (negligible) |
| R4 | React portal modal with countdown | Standard UX vs. inline (modal chosen) |
| R5 | Single POST endpoint (get-or-create) | REST purity vs. simplicity (simplicity chosen) |
| R6 | reserved ↔ pending transitions | Minimal change vs. new status (minimal chosen) |
| R7 | onViewPin callback prop | Consistency with existing pattern |
| R8 | Server-side existing PIN check | Avoids duplicate generation |
| R9 | Remove status guard in cancelReservationById | One-line change vs. separate endpoint (one-line chosen) |
| R10 | Extend Cancel button condition to reserved+pending | Consistency vs. different buttons (same button chosen) |
