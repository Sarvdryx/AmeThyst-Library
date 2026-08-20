# Feature Specification: PIN Generation for Book Pickup

**Feature Branch**: `014-pin-generation`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "PIN Generation Workflow for Book Pickup — a 6-digit PIN system for verifying physical book pickup at the library counter, with 5-minute expiration and automated cleanup."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Pickup PIN (Priority: P1)

As a library member with a pending reservation, I want to generate a 6-digit PIN at the library counter so that the staff can verify my identity and release the book for pickup.

**Why this priority**: This is the core functionality of the feature. Without PIN generation, the pickup verification workflow cannot exist.

**Independent Test**: Can be fully tested by navigating to the "Currently Borrowing" tab, clicking the PIN generation button on a reserved book card, and verifying a 6-digit PIN is displayed in a modal with a 5-minute countdown timer.

**Acceptance Scenarios**:

1. **Given** a user has a book reservation with status "reserved", **When** the user clicks the "View PIN" button on that book card, **Then** the system generates a unique 6-digit PIN, changes the reservation status to "pending", and displays the PIN in a modal with a countdown timer showing remaining time until expiration.
2. **Given** a user has an active PIN (status is "pending"), **When** the user closes the PIN modal and clicks the "View PIN" button again, **Then** the system displays the same active PIN with its ongoing countdown (not a new PIN).
3. **Given** a user has a book reservation with status "reserved", **When** the user clicks the "View PIN" button, **Then** the PIN modal appears overlaying the current page without navigating away.

---

### User Story 2 - PIN Expiration & Cleanup (Priority: P2)

As a library system, I want expired PINs to be automatically cleaned up so that the database remains accurate and security is maintained.

**Why this priority**: Expired PINs must be cleared to prevent reuse and to allow the reservation to revert to "reserved" status for re-generation.

**Independent Test**: Can be tested by generating a PIN, waiting 5 minutes (or mocking time), and verifying the PIN data is cleared from the database and the reservation status reverts to "reserved".

**Acceptance Scenarios**:

1. **Given** a user has an active PIN (status "pending"), **When** 5 minutes elapse from the generation time, **Then** the PIN and expiration data are cleared (set to NULL), the reservation status reverts to "reserved", and the UI button resets to its original state.
2. **Given** the server restarts, **When** the server boots up, **Then** all existing PIN data across all reservations is cleared (set to NULL) and any "pending" statuses revert to "reserved".
3. **Given** a user has an expired PIN, **When** the user views the book card in the "Currently Borrowing" tab, **Then** the PIN generation button is available again (not stuck in a "pending" state).

---

### User Story 3 - PIN Display Persistence (Priority: P3)

As a library member, I want to be able to close and reopen the PIN modal during the 5-minute window so that I can show the PIN to staff at my own pace without losing the active PIN.

**Why this priority**: This improves usability by allowing the user to manage the modal without penalty.

**Independent Test**: Can be tested by generating a PIN, closing the modal, reopening it, and confirming the same PIN and updated countdown are displayed.

**Acceptance Scenarios**:

1. **Given** a user has an active PIN displayed in a modal, **When** the user closes the modal (via close button or clicking outside), **Then** the PIN data remains active in the system.
2. **Given** a user closed the PIN modal with an active PIN, **When** the user clicks the "View PIN" button again before expiration, **Then** the same PIN is displayed with the correct remaining time on the countdown.
3. **Given** a user has an active PIN, **When** the countdown reaches zero while the modal is open, **Then** the modal updates to inform the user that the PIN has expired and prompts them to generate a new one.

---

### User Story 4 - Cancel Reservation (Priority: P1)

As a library member, I want to cancel my reservation (whether it is in "reserved" or "pending" status) so that the book becomes available for others and my borrow count is freed.

**Why this priority**: This is a core usability requirement. Users must be able to cancel reservations at any point before physical checkout, regardless of whether a PIN has been generated.

**Independent Test**: Can be tested by navigating to the "Currently Borrowing" tab, clicking the "Cancel" button on a reserved or pending book card, and verifying the row is deleted from the database and the book's available quantity is restored.

**Acceptance Scenarios**:

1. **Given** a user has a reservation with status "reserved", **When** the user clicks the "Cancel" button on that book card, **Then** the reservation row is deleted from `borrow_book`, the book's available quantity is incremented, and the user's `borrow_num` is decremented.
2. **Given** a user has a reservation with status "pending" (active PIN), **When** the user clicks the "Cancel" button on that book card, **Then** the reservation row is deleted from `borrow_book` (including the active PIN), the book's available quantity is incremented, and the user's `borrow_num` is decremented.
3. **Given** a user has a reservation with status "reserved" or "pending", **When** the cancellation succeeds, **Then** the book card is removed from the "Currently Borrowing" tab and a success toast is displayed.

---

### Edge Cases

- What happens when a user tries to generate a PIN for a reservation that already has an active (non-expired) PIN? The system should display the existing PIN, not generate a new one.
- What happens when two users simultaneously generate PINs for different reservations at the same branch? Each PIN must be unique across all active records.
- What happens when the server crashes mid-operation (between PIN generation and response)? The startup cleanup mechanism ensures no stale PINs persist.
- What happens when a user navigates away from the book detail page while the PIN modal is open? The modal should close, but the PIN remains active for the full 5-minute window.
- What happens when the user's reservation is cancelled while a PIN is active? The entire `borrow_book` row is deleted, including the PIN data. The book's available quantity is restored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a randomly generated 6-digit numeric PIN (000000–999999) for each pickup verification request.
- **FR-002**: System MUST ensure each generated PIN is unique across all active (non-expired) reservation records in the database.
- **FR-003**: System MUST set the PIN expiration time to exactly 5 minutes from the moment of generation.
- **FR-004**: System MUST change the reservation status from "reserved" to "pending" upon successful PIN generation.
- **FR-005**: System MUST display the generated PIN in a modal window with a visible countdown timer showing remaining time before expiration.
- **FR-006**: System MUST allow users to close and reopen the PIN modal to view the same active PIN with its ongoing countdown.
- **FR-007**: System MUST automatically clear PIN data (set pin and expired_at to NULL) and revert reservation status to "reserved" after the 5-minute expiration.
- **FR-008**: System MUST automatically clear all PIN data on server startup to flush any leftover PINs from unexpected crashes.
- **FR-009**: System MUST store PIN data in the existing `borrow_book` table using the `pin` and `expired_at` fields, both configured as nullable to preserve backward compatibility.
- **FR-010**: System MUST allow users to cancel reservations in both "reserved" and "pending" status by deleting the `borrow_book` row, restoring the book's available quantity, and decrementing the user's `borrow_num`.
- **FR-012**: System MUST NOT modify any existing borrowing, returning, or reservation workflows beyond the cancel behavior — the PIN feature operates as an add-on layer via the "pending" status.
- **FR-011**: System MUST clearly differentiate between three independent time markers: PIN expiration (5 minutes), pickup window deadline (7 days from reservation), and return deadline (future feature, inactive).

### Key Entities

- **Reservation (borrow_book)**: Represents a book reservation by a user. Key attributes: reservation ID, user ID, book ID, branch ID, status (reserved/pending/borrowed/expired), PIN, PIN expiration timestamp, reservation date, pickup deadline.
- **PIN**: A 6-digit numeric string associated with a reservation. Key attributes: value (6-digit string), expiration timestamp. Lifecycle: generated → active (5 minutes) → expired/cleared.
- **Branch**: A library location where the book can be picked up. Key attributes: branch ID, name, address.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate and view a pickup PIN within 3 seconds of clicking the generation button.
- **SC-002**: PINs are guaranteed unique — zero collisions across all active reservations at any given time.
- **SC-003**: Expired PINs are automatically cleared within 1 minute of expiration without manual intervention.
- **SC-004**: All leftover PIN data is flushed within 5 seconds of server startup.
- **SC-005**: 100% of existing reservation and borrowing workflows remain unaffected by the PIN feature (no regressions).
- **SC-006**: Users can close and reopen the PIN modal an unlimited number of times within the 5-minute window without losing the active PIN.

## Assumptions

- The `borrow_book` table already contains `pin` (VARCHAR) and `expired_at` (TIMESTAMP) columns that allow NULL values.
- The existing reservation status flow ("reserved" → "pending" → "borrowed") is already implemented and functional.
- The "Currently Borrowing" tab in the user dashboard already displays reserved books with book cards.
- The 5-minute PIN expiration is a business requirement for in-person counter verification — no remote/online pickup is in scope.
- The server cleanup mechanism uses a periodic interval (e.g., every minute) to check and clear expired PINs, not a real-time event-driven system.
- The PIN generation is triggered by the user (not automatically by the system) — the user must be physically at the library counter.
- The feature is web-only (responsive desktop/mobile browser) — no native mobile app considerations.
