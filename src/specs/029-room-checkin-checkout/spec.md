# Feature Specification: Room Reservation, Check-In, and Check-Out

**Feature Branch**: `029-room-checkin-checkout`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "read the checkin_room.md in .specify/template and create a new spec file for me"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Generates a PIN for an Upcoming Reservation (Priority: P1)

A user with an active, upcoming room reservation navigates to the Room Reservation tab on their dashboard and views their room card. They click the **"Create PIN"** button to obtain a verification PIN they can present to library staff. The system generates the PIN, marks the reservation as pending verification, and starts a 3-minute validity window.

**Why this priority**: This is the entry point of the entire workflow — without a PIN, check-in cannot occur. It delivers immediate value as the first independently usable slice.

**Independent Test**: Can be fully tested by logging in as a user with an upcoming reservation, clicking "Create PIN", and verifying that a PIN appears with an active 3-minute countdown.

**Acceptance Scenarios**:

1. **Given** a user has an upcoming room reservation, **When** they click the "Create PIN" button, **Then** a verification PIN is generated, the reservation status becomes pending, and the PIN is set to expire 3 minutes from creation.
2. **Given** the 3-minute PIN window has elapsed without staff verification, **When** the expiration cleanup runs, **Then** the reservation status reverts to reserved and the PIN data is cleared.

---

### User Story 2 - Librarian Verifies the PIN and Checks In the User (Priority: P1)

A user presents their PIN at the library. The librarian opens the **PIN Verification** section → **Confirm Room Check-in** tab on the librarian dashboard and enters the PIN. If valid, the system records the check-in, clears the PIN data, and the user's room card updates to offer the check-out action.

**Why this priority**: This is the core staff-driven action that physically grants room access; it shares equal importance with PIN generation and depends on it.

**Independent Test**: Can be fully tested by entering a valid pending PIN and confirming that check-in is recorded, the PIN is cleared, and the user's card now shows the check-out option.

**Acceptance Scenarios**:

1. **Given** a reservation is in pending status with a valid PIN, **When** the librarian enters the correct PIN, **Then** the check-in time is recorded as the exact time of entry, the PIN and expiry fields are cleared, and the reservation status becomes used.
2. **Given** a reservation is pending, **When** the librarian enters an invalid or expired PIN, **Then** no check-in is recorded and an appropriate error is shown.

---

### User Story 3 - User Confirms Check-Out After the Reservation Ends (Priority: P2)

Once the active reservation time has elapsed, the user's room card replaces the "Create PIN" and "Cancel" buttons with a **"Checkout Confirm"** button. The user clicks it to record the check-out, and a new return record is created with the exact checkout timestamp.

**Why this priority**: This completes the lifecycle and produces the data needed for history and availability tracking. It is valuable but secondary to enabling the room access itself.

**Independent Test**: Can be fully tested by letting a reservation lapse past its end time and confirming that clicking "Checkout Confirm" records an accurate checkout time.

**Acceptance Scenarios**:

1. **Given** the active reservation time has elapsed, **When** the user clicks "Checkout Confirm", **Then** a return record is created with the checkout time equal to the moment of confirmation.
2. **Given** a user never clicks "Checkout Confirm" after the reservation ends, **When** the cleanup/defaulting process runs, **Then** the checkout time defaults to the reservation end time from the availability record.

---

### User Story 4 - User Views Room Reservation History (Priority: P3)

A user opens the room reservation history view on their dashboard and filters records by date. Each record shows the standard reservation details plus the check-in and check-out timestamps.

**Why this priority**: This is a read-only reporting capability that adds transparency after the operational flow is complete.

**Independent Test**: Can be fully tested by viewing the history view, applying a date filter, and confirming the displayed check-in and check-out times match the actual recorded events.

**Acceptance Scenarios**:

1. **Given** a user has past room reservations, **When** they open the history view and apply a date filter, **Then** only reservations within the selected date range are shown.
2. **Given** a reservation has been checked in and out, **When** its history record is viewed, **Then** the check-in time and check-out time fields are populated from the respective records.

---

### Edge Cases

- What happens when the PIN expires between the user generating it and the librarian entering it?
- How does the system handle a user trying to generate a second PIN while an existing PIN is still pending?
- What happens when the check-out confirmation is clicked after the reservation end time but before any cleanup ran?
- How does the system handle reservations whose end time has passed but the user never interacts with the card?
- What happens when a librarian enters a PIN for a reservation that has already been used or cancelled?
- How does the system display history records where check-out was defaulted rather than user-confirmed?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to generate a verification PIN for an upcoming room reservation from the Room Reservation tab.
- **FR-002**: System MUST store the generated PIN and set its expiry time to 3 minutes from generation.
- **FR-003**: System MUST transition the reservation status to pending upon PIN generation.
- **FR-004**: System MUST revert the reservation status to reserved and clear the PIN data when the 3-minute window expires without verification.
- **FR-005**: System MUST allow a librarian to verify a PIN against pending reservations.
- **FR-006**: System MUST record the check-in time as the exact timestamp of a successful PIN verification.
- **FR-007**: System MUST clear the PIN and expiry fields upon successful verification.
- **FR-008**: System MUST transition the reservation status to used upon successful verification.
- **FR-009**: System MUST replace the "Create PIN" and "Cancel" actions with a "Checkout Confirm" action on the user's room card once the active reservation time has elapsed (or once verified).
- **FR-010**: System MUST create a return record containing the generated return ID, the linked reservation ID, and the checkout time when the user confirms check-out.
- **FR-011**: System MUST default the checkout time to the reservation end time when the user does not confirm check-out.
- **FR-012**: System MUST provide date-based filtering in the room reservation history view.
- **FR-013**: System MUST display check-in time (from the reservation record) and check-out time (from the return record) in each history entry.
- **FR-014**: System MUST reuse or extend the existing PIN, expiry, and cleanup logic from the book borrowing feature to support rooms without duplicating code.
- **FR-015**: System MUST increment the user's `reserve_num` counter when a room reservation is created and decrement it (never below 0) when a reservation is cancelled or checked out.
- **FR-016**: System MUST reject a new room reservation with `ROOM_RESERVE_LIMIT_EXCEEDED` (HTTP 400) when the user already holds `MAX_ROOM_RESERVE_LIMIT` active room reservations, mirroring the book borrowing limit guard.

### Key Entities *(include if feature involves data)*

- **reserve_room**: Represents a user's room reservation; stores the verification PIN, PIN expiry timestamp, reservation status (reserved/pending/used), a reference to the availability slot, and the recorded check-in time.
- **return_room**: Represents the check-out event for a reservation; stores a unique return ID, a reference to the reservation, and the checkout timestamp.
- **room_avail**: Represents a bookable time slot for a room; provides the end time used as the default checkout time when the user does not confirm.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate a PIN for an upcoming reservation in under 1 minute.
- **SC-002**: 100% of generated PINs expire exactly 3 minutes after generation when not verified.
- **SC-003**: Librarians can verify a valid PIN and complete a check-in in under 30 seconds.
- **SC-004**: Every completed reservation results in exactly one return record with a checkout time (either user-confirmed or defaulted to end time).
- **SC-005**: Users can view their reservation history filtered by date with no missing check-in or check-out timestamps for completed reservations.
- **SC-006**: No duplicate return records are created for a single reservation.

## Assumptions

- PIN generation, expiry countdown, and cleanup logic will mirror the existing book borrowing feature to ensure architectural consistency.
- A reservation only ever needs a single active PIN at a time; generating a new PIN is not permitted while a PIN is still pending.
- The 3-minute PIN window is the standard, non-configurable duration for v1.
- Expired pending reservations are handled by an automatic background cleanup mechanism.
- If a user never confirms check-out, the checkout time defaults to the reservation end time.
- Librarians are library staff with access to the librarian dashboard; no additional permission model changes are introduced.
