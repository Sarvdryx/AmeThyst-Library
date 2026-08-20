# Research: Librarian PIN Verification & Book Borrowing Workflow

## Overview

No NEEDS CLARIFICATION markers were present in the feature spec. The tech stack, architecture patterns, and database conventions are fully documented in the project constitution and existing codebase. This research phase confirms existing decisions.

## Decisions

### 1. Architecture Pattern: Layered (Route → Middleware → Controller → Service → Model)
- **Decision**: Extend existing layered architecture in `server/src/`
- **Rationale**: Constitution Principle VII mandates this pattern for all backend code. Existing `library.services.mjs`, `library.controller.mjs`, and `library.mjs` routes already follow this pattern for the reserve/PIN generation flow.
- **Alternatives considered**: Creating a dedicated `loan-verification.*` file set — rejected because the PIN verification and borrowing workflow is a natural extension of the existing library borrowing domain, not a separate module.

### 2. Transaction Strategy: PostgreSQL Transaction with `pg` pool
- **Decision**: Use `pool.query('BEGIN')` / `COMMIT` / `ROLLBACK` pattern for atomic mutations
- **Rationale**: Existing code in `library.services.mjs` already uses this pattern for reservation PIN generation. The spec (FR-013) requires atomicity for confirm/cancel operations.
- **Alternatives considered**: Using a transaction library — rejected to maintain consistency with existing code patterns.

### 3. Eligibility Check Approach: Query-based check before confirmation
- **Decision**: Query the user's borrow records for overdue books or suspension status before allowing confirmation
- **Rationale**: FR-014 requires eligibility checks. The `borrow_book` table has status fields; a simple query checking for overdue or suspended statuses suffices.
- **Alternatives considered**: A dedicated eligibility service — overkill for a straightforward status check.

### 4. Calendar Event Creation: Insert into existing events table
- **Decision**: Insert a new row into the calendar/events table with the due_date as the event date, user_id as the owner, and type marker
- **Rationale**: The spec (FR-008) requires calendar events on confirmation. The existing dashboard has calendar views with color-coded event types.
- **Alternatives considered**: Using a separate event service — unnecessary complexity for a single-row insert.

### 5. Borrowed Status Computation for `expired_reserve`
- **Decision**: `expired_reserve` is a derived attribute (`reserve_date + 7 days`). On confirmation, set it to NULL rather than deleting the column.
- **Rationale**: FR-009 states "remove or nullify." Nullifying is safer for data integrity and is reversible if needed for auditing.
- **Alternatives considered**: Deleting the row record — unnecessary and destroys audit trail.
