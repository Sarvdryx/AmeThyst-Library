# Feature Specification: Freely Room Reservation

**Feature Branch**: `025-freely-room-reservation`

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: "read the .specify/template/rr_prompt.md and write specification file in specs for me"

## 1. Feature Overview & Requirements

Implement the "Freely Room Reservation" feature for individual users via the library map, including the backend logic and the frontend User Dashboard UI update.

### Constraints & Scope:
- Focus ONLY on "Đặt phòng tự do" (Freely Mode). The "Study Group" mode will be implemented later but its UI option may be shown as disabled.
- Do NOT alter, modify, or hallucinate any existing database schema properties.
- Strictly adhere to the existing tables: `study_room`, `room_avail`, `reserve_room`, `return_room`.
- The reservation flow starts at the User sidebar "Room Reservations" navigation item.
- "Tạo mã PIN" (Create PIN) and "Hủy" (Cancel) buttons are UI placeholders only — their logic is implemented in a future task.
- Backend endpoints required: fetch available time slots (GET) and create a reservation (POST), both protected by authentication.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start from Sidebar and Book a Room via Map (Priority: P1)

A library member enters the reservation flow from their dashboard sidebar. They navigate to the map, select a room, choose "Freely" mode, pick a date, select an available time slot, and confirm the reservation.

**Why this priority**: The template specifies "the flow start at User sidebar with room reservation." This is the entry point and the primary booking journey. Without it, no reservation can be made.

**Independent Test**: Can be tested by logging in, clicking "Room Reservations" in the sidebar, navigating to the map, selecting a room, and completing a booking. Delivers the end-to-end reservation capability.

**Acceptance Scenarios**:

1. **Given** the user is on their dashboard, **When** they click "Room Reservations" in the sidebar, **Then** they are taken to the library map page
2. **Given** the user is on the map page, **When** they click a reservable room zone, **Then** the room detail panel opens showing two mode options: "Đặt phòng tự do" (Freely) and "Đặt phòng study group" (disabled for future implementation)
3. **Given** the room detail panel is open and "Freely" is selected, **When** the user picks a date (day/month/year), **Then** available time slots for that room on that date are displayed
4. **Given** available time slots are shown, **When** the user selects one and confirms, **Then** the reservation is created with status "reserved" and a success confirmation is displayed
5. **Given** the user is not logged in, **When** they attempt to book a room, **Then** they are prompted to log in before proceeding

---

### User Story 2 - View and Manage Room Reservations in Dashboard (Priority: P1)

A library member views all their room reservations from the dashboard. The page shows a "Room Reservations" title, a "New Reservation" action button, an "Upcoming" section with reservation cards, and a "Past Bookings" section with a tabular list.

**Why this priority**: Users need visibility into their bookings immediately after reserving. The dashboard is where they confirm success, track upcoming commitments, and access actions.

**Independent Test**: Can be tested by navigating to the dashboard's "Room Reservations" section after booking. Delivers reservation history visibility.

**Acceptance Scenarios**:

1. **Given** the user navigates to "Room Reservations" in their dashboard sidebar, **When** the page loads, **Then** the following layout is displayed: a "Room Reservations" page title at the top, a "New Reservation" button below the title, pagination arrows at the top-right, an "Upcoming" section with reservation cards, and a "Past Bookings" section with a tabular list below
2. **Given** the "New Reservation" button is visible, **When** the user clicks it, **Then** they are navigated to the library map page to start a new booking
3. **Given** the user has upcoming reservations, **When** viewing the "Upcoming" section, **Then** each reservation card displays: a room icon/placeholder image, a status badge (pill-shaped, color-coded by status), the room name, a room description line (floor, wing, amenities separated by bullets), the date with a calendar icon, the time slot (`start_time` - `end_time`) with a clock icon, a "Tạo mã PIN" button (placeholder), and a "Hủy" button (placeholder)
4. **Given** a reservation card has status "reserved", **When** viewing its status badge, **Then** the badge shows "Confirmed" in teal (`#00A694`) with a light teal background
5. **Given** a reservation card has status "pending" or "in_progress", **When** viewing its status badge, **Then** the badge shows the status text in dark style
6. **Given** the user has past reservations, **When** viewing the "Past Bookings" section, **Then** a table is shown with columns: ROOM NAME, DATE, TIME SLOT, DURATION, and STATUS
7. **Given** the user has no reservations, **When** viewing the page, **Then** an empty state message is shown with a prompt to browse the map

---

### User Story 3 - View Past Bookings History (Priority: P2)

A library member wants to review their past room reservations, including the room name, date, time slot, duration, and final status in a structured table format.

**Why this priority**: Provides a historical record of room usage for reference and accountability.

**Independent Test**: Can be tested by checking the "Past Bookings" section after one or more past-dated reservations exist. Delivers historical record visibility.

**Acceptance Scenarios**:

1. **Given** the user has past reservations, **When** viewing the "Past Bookings" table, **Then** each row shows the room name, the date formatted as "Day, DD Mon YYYY", the time slot range, the calculated duration, and the final status label
2. **Given** the table header is visible, **When** inspecting the header row, **Then** the columns are labeled "ROOM NAME", "DATE", "TIME SLOT", "DURATION", and "STATUS" in uppercase bold gray text on a warm beige background

---

### Edge Cases

- **Double-booking conflict**: When two users attempt to book the same time slot simultaneously, only the first succeeds. The second user sees a "Slot no longer available" message with refreshed options.
- **No reservations yet**: Dashboard shows an empty state with guidance to visit the map and make a first booking.
- **No available slots on selected date**: The panel shows "No available slots for this date" and suggests picking another date.
- **Past date selection**: Past dates are not selectable in the date picker.
- **Room with capacity = 0**: Some rooms (lounges, lockers) are not reservable and should not show booking options.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The reservation flow MUST start from the User sidebar "Room Reservations" navigation item
- **FR-002**: Users MUST be able to browse library rooms on an interactive floor map
- **FR-003**: When a user clicks a reservable room on the map, the system MUST display two mode options: "Đặt phòng tự do" (Freely, active) and "Đặt phòng study group" (visible but disabled)
- **FR-004**: Users MUST be able to select a date (day/month/year) when booking in Freely mode
- **FR-005**: System MUST fetch available slots by: (1) Querying `reserve_room` where `start_date` matches the selected date to get a list of booked `avail_id`s. (2) Querying `room_avail` for the target `room_id` and excluding those booked `avail_id`s, then rendering the remaining `start_time` and `end_time` intervals.
- **FR-006**: Users MUST be able to select an available time slot and confirm a reservation
- **FR-007**: Upon confirmation, the system MUST create a reservation with status "reserved" and display a success confirmation
- **FR-008**: System MUST require users to be logged in before creating a reservation
- **FR-009**: Users MUST be able to view their room reservations from the dashboard, with the page displaying: a "Room Reservations" title, a "New Reservation" button, an "Upcoming" section heading, and a "Past Bookings" section heading — matching the layout in `.specify/template/room_reservation_design`
- **FR-010**: The "New Reservation" button MUST be styled as a dark blue (`#03192E`) rounded pill with a white "+" icon and text, and MUST navigate the user to the library map page on click
- **FR-011**: Pagination arrow buttons (left/right circle, border `#C5C6CD`) MUST be displayed at the top-right of the content area for navigating between pages of reservations
- **FR-012**: The "Upcoming" section MUST display reservations in a grid of cards. Each card MUST have: a white background with border `rgba(196,198,205,0.10)`, shadow `0 4px 20px rgba(26,46,68,0.06)`, padding `32px`, and a fixed width of `394px`
- **FR-013**: Each upcoming reservation card MUST contain these elements in order:
  (a) The room's actual photo (`img_url`) displayed in a `48x48` rounded (`8px`) square container. If no image is available, a beige background (`#F8EFE6`) with a room-related SVG icon is shown as fallback
  (b) A status badge — a pill-shaped badge with `8px` horizontal padding, colored background based on status value, and bold uppercase text. Status "reserved" maps to badge text "Confirmed" with teal text (`#00A694`) on light teal background (`rgba(0,166,148,0.10)`)
  (c) Room name — bold `20px` font in dark text (`#03192E`)
  (d) Room description — `14px` text in gray (`#43474D`) showing floor, wing, and amenities separated by bullet characters (e.g. "Floor 2, Wing B • Soundproof • TV Monitor")
  (e) Date row — a calendar SVG icon (gray `#74777D`) followed by the reservation date formatted as "Day, DD Mon YYYY" (e.g. "Mon, 12 Jun 2026")
  (f) Time slot row — a clock SVG icon (gray `#74777D`) followed by the time range formatted as "HH:MM AM/PM - HH:MM AM/PM" (e.g. "10:00 AM - 12:00 PM")
  (g) A "Tạo mã PIN" button and a "Hủy" button as UI placeholders (pure UI, no backend wiring)
- **FR-014**: The date and time slot rows in each card MUST be separated from the card body above and below by horizontal borders with color `rgba(196,198,205,0.10)`
- **FR-015**: The "Hủy" (Cancel) button MUST be styled with red text (`#BA1A1A`), a red border (`rgba(186,26,26,0.30)`), and a red X-circle SVG icon. The "Tạo mã PIN" button MUST follow the same placeholder-only constraint with no backend routes, controller methods, or active event handlers implemented.
- **FR-016**: The room image for each card MUST be resolved through the data path: `reserve_room.avail_id → room_avail.room_id → study_room.img_url`, and displayed as the room icon placeholder replacing the fallback SVG
- **FR-017**: The "Past Bookings" section MUST display reservations in a table with these columns: ROOM NAME, DATE, TIME SLOT, DURATION, STATUS. The table header MUST have a warm beige background (`#F8F3E9`) with uppercase bold gray (`#74777D`) column labels. Table rows MUST alternate or stack vertically with data cells.
- **FR-018**: System MUST prevent double-booking of the same time slot for the same room
- **FR-019**: System MUST show appropriate empty states when no reservations exist or no slots are available
- **FR-020**: System MUST prevent selection of past dates in the date picker

### Key Entities

- **study_room**: Physical room in the library. Contains room details including name, capacity, amenities, description, and image URL.
- **room_avail**: Predefined availability time windows for each room. Each slot has a start time and end time.
- **reserve_room**: A user's booking record linking a user to a specific availability slot on a specific date, with a current status (reserved/pending/used).
- **return_room**: Check-out record linked to a reservation (out of scope for this feature but table exists).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a room reservation end-to-end in under 3 minutes from the sidebar entry
- **SC-002**: Users can view their reservation history within 2 clicks from the dashboard sidebar
- **SC-003**: System correctly prevents double-booking of the same room and time slot (no duplicate reservations recorded)
- **SC-004**: All reservation cards correctly display the room image resolved through the data chain
- **SC-005**: Reservation status is accurately reflected (upcoming vs past) in the dashboard view
- **SC-006**: Users successfully complete their first reservation without assistance

## Assumptions

- Users have a registered library account and are logged in to make reservations
- The existing floor map, room detail panel, sidebar, and dashboard layout will be reused and extended
- The existing database tables (`study_room`, `room_avail`, `reserve_room`, `return_room`) are used as-is without schema changes
- "Tạo mã PIN" and "Hủy" button logic is out of scope — only UI rendering is required
- "Study Group" booking mode is explicitly out of scope; its UI option may appear but must be non-functional
- Users book individually (group bookings not included)
- Predefined time slots are used (not custom time ranges)
- On-screen confirmation only — no email or SMS notifications in this scope
