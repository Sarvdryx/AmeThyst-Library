# Feature Specification: Interactive Floor Plan Map

**Feature Branch**: `023-interactive-floor-map`

**Created**: 2026-07-01

**Status**: Draft

**Input**: User description: "update for description panel of 023-interactive-floor-map: the input image are in clients/app/assets/MapImages, the interactive space should also show up the corresponding 3D image (png) in 3D folder of MapImages, using syntax room_{room_id}.png, while the svg and aesthetic 2D layer makes up the clickable UI. Constraint: if capacity = 1, show description only, hide other attributes and reserve option. If capacity > 1, show all attributes and reserve option (for logged-in users only). The map page is retrieved at /map (at the same level with library folder in client/app/)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Map Layout Selection & 2D Aesthetic Render (Priority: P1)
As a library user, I want to toggle between different floor maps (Map1 and Map2) and view a high-quality 2D floor plan rendering (e.g., `mapCS1.png` or `map_cs2.png`) with an interactive SVG overlay (`map_layout1.svg` or `Map_layout_2.svg`) at the `/map` page route, so that I can browse different sections of the library.

**Why this priority**: Choosing a map and rendering the base visual layout is the foundation of the interactive map feature.

**Independent Test**: Can be tested by navigating to the `/map` floor plan page, toggling the map selection buttons, and verifying that the correct background PNG and interactive SVG overlay render aligned at matching sizes.

**Acceptance Scenarios**:
1. **Given** a user is on the `/map` floor plan map page, **When** they select "Map 1", **Then** the page renders `mapCS1.png` as the background and overlays `map_layout1.svg` perfectly on top of it.
2. **Given** a user is on the `/map` floor plan map page, **When** they select "Map 2", **Then** the page renders `map_cs2.png` as the background and overlays `Map_layout_2.svg` perfectly on top of it.

---

### User Story 2 - Interactive SVG Room Highlight & Hover Effects (Priority: P1)
As a library user looking at the `/map` floor map, I want to hover my mouse over reservable areas (such as study rooms, meeting rooms, lounges) and see them highlight, and see the cursor change to a pointer, so that I know which areas are interactive.

**Why this priority**: Provides the core interactive visual feedback that enables user exploration.

**Independent Test**: Can be tested by hovering over reservable shapes in the SVG (e.g. `rect` with `id="meetingRoom1"`) on the `/map` page and checking that the fill opacity increases/changes and the cursor changes to pointer, while hovering over bookshelf elements has no effect.

**Acceptance Scenarios**:
1. **Given** a user is viewing the map page, **When** they hover over an interactive area defined in the SVG (like `meetingRoom1` or `studyZone1`), **Then** the area changes its highlight color and opacity, and the cursor changes to pointer.
2. **Given** a user is viewing the map page, **When** they hover over non-interactive areas (such as walls, bookshelves, or background empty space), **Then** no highlight is triggered and the cursor remains standard.

---

### User Story 3 - Details Panel for Low Capacity Spaces (Capacity = 1) (Priority: P2)
As a library user, when I click on a single-capacity space (such as a locker, bookshelf, or reception desk), I want to see a side panel display its name, a 3D visualization, and its description only, with all other attributes and reservation controls hidden, as these spaces cannot be booked.

**Why this priority**: Implements business rules for spaces that are informative but not reservable.

**Independent Test**: Can be tested by clicking on `locker` on Map 1 or Map 2, and verifying that the side panel displays only the 3D image and description, and does not display capacity, TV, socket, or board details, nor does it display the booking calendar or Book Room button.

**Acceptance Scenarios**:
1. **Given** a user clicks on `locker` on Map 1 (room_id = 12), **When** the side panel opens, **Then** it shows the name "locker", the 3D image `/assets/MapImages/3D/room_12.png`, and its description, but suppresses capacity, TV, whiteboard, socket numbers, and all booking details.

---

### User Story 4 - Details Panel for Reservable Rooms (Capacity > 1) (Priority: P2)
As a library user, when I click on a reservable room (capacity > 1), I want to see all its attributes (capacity, TVs, whiteboards, sockets) and its description, and see its booking availability schedule if I am logged in, so that I can proceed to book it.

**Why this priority**: Connects group study rooms to relational data and enables booking schedules for authenticated users.

**Independent Test**: Can be tested by clicking on a room with capacity > 1 (e.g., `meetingRoom1`) while logged in and verifying all details and reservation lists are present. Can be tested while logged out (guest) to verify reservation list is replaced with a login prompt.

**Acceptance Scenarios**:
1. **Given** a logged-in user clicks on `meetingRoom1` on Map 1 (room_id = 1, capacity = 8), **When** the panel opens, **Then** it displays capacity (8), TVs (1), whiteboards (1), sockets (4), description, the 3D image `/assets/MapImages/3D/room_1.png`, the slot availability list, and the "Book Room" redirect button.
2. **Given** a guest (logged-out) user clicks on `meetingRoom1`, **When** the panel opens, **Then** it displays capacity, TVs, whiteboards, sockets, description, and the 3D image, but hides the availability list and "Book Room" button, displaying a message: "Please log in to book this room."

---

### User Story 5 - Redirect to Room Booking Page (Priority: P3)
As a logged-in library user browsing a reservable room's details, I want to click a "Book Room" button to be redirected to the room booking page with the selected room pre-selected, so that I can schedule a booking immediately.

**Why this priority**: Connects the floor map overview to the transactional reservation form.

**Independent Test**: Can be tested by clicking "Book Room" in the details panel and verifying that the browser navigates to the reservation route with `roomId` in the URL query parameter.

**Acceptance Scenarios**:
1. **Given** a details panel is open for a room (capacity > 1) and the user is logged in, **When** the user clicks "Book Room", **Then** they are redirected to `/library/reserve?roomId=[room_id]`.

### Edge Cases

- **Missing 3D Image Asset**: If a room is clicked but its 3D visualization image does not exist in the assets directory (e.g. `room_24.png`), the details panel should display a generic library-themed fallback graphic instead of a broken image icon.
- **Room record not found in Database**: If a room is clicked but does not exist in the database `study_room` table, the side panel should show the room's name from the SVG id, display a message "Availability details currently unavailable", and disable the "Book Room" button.
- **Asset loading failure**: If the SVG layer or the 2D background image fails to load, a user-friendly error message "Failed to load floor plan layout. Please reload the page." should be displayed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render the interactive library map combining the chosen Map layout base 2D image (`mapCS1.png` or `map_cs2.png`) from `client/app/assets/MapImages/` and its matching SVG file (`map_layout1.svg` or `Map_layout_2.svg`).
- **FR-002**: The system MUST provide UI controls (toggles/tabs) for users to switch between "Floor Map 1" and "Floor Map 2".
- **FR-003**: The interactive SVG overlay MUST align perfectly on top of the 2D background image and scale proportionally across mobile, tablet, and desktop viewports.
- **FR-004**: SVG overlay elements (such as `rect`, `path`) MUST utilize CSS/JS configurations (e.g., `pointer-events: auto` on interactive shapes, `pointer-events: none` on others) to ensure hover/click event detection is not blocked by overlay containers.
- **FR-005**: The frontend MUST apply clear highlight transitions (e.g., outline glow, fill color changes, opacity changes) to interactive elements upon hover.
- **FR-006**: When an interactive room is clicked, the system MUST show a side-drawer style panel that slides in from the right edge, sharing at least 90% style parity with the existing `FilterPanel` component.
- **FR-007**: The side panel MUST display a 3D visualization image loaded from the path `client/app/assets/MapImages/3D/room_[room_id].png` corresponding to the database primary key `room_id` of the clicked room.
- **FR-008**: The side panel MUST query and display study room details (capacity, tv_num, board_num, socket_num, and description) by querying the backend API.
- **FR-009**: **Constraint**: If `capacity = 1`, the side panel MUST display the room description only, hiding capacity, tv_num, board_num, socket_num, and all room availability slot schedules and reservation buttons.
- **FR-010**: **Constraint**: If `capacity > 1`:
  - The side panel MUST display all room attributes (capacity, tv_num, board_num, socket_num, and description).
  - The side panel MUST show availability slot lists and the "Book Room" button ONLY for authenticated (logged-in) users.
  - If the user is unauthenticated (guest), the side panel MUST hide availability list and the "Book Room" button, displaying a message instructing them to log in to proceed with booking.
- **FR-011**: The "Book Room" button MUST redirect logged-in users to `/library/reserve?roomId=[room_id]`.
- **FR-012**: The interactive map page MUST be accessible under route `/map` (constructed in directory `client/app/map/page.tsx`) and correspond to the LIMA navbar item configured as `href: '/map'`.

### Key Entities *(include if feature involves data)*

- **StudyRoom**: Represents a study room. Key attributes:
  - `room_id`: Unique identifier (serial).
  - `room_name`: Human-readable name (maps to the SVG element `id`).
  - `tv_num`, `board_num`, `socket_num`: Amenity counts (integers >= 0).
  - `capacity`: Maximum number of people (integer >= 1).
  - `description`: Text details.
- **RoomAvailability**: Defines time slots for a room. Key attributes:
  - `avail_id`: Slot identifier (serial).
  - `room_id`: Reference to `study_room`.
  - `start_time`, `end_time`: Time boundaries (e.g., 08:00 to 10:00).
- **ReserveRoom**: Represents an active reservation. Key attributes:
  - `reserve_id`: Reservation identifier (uuid).
  - `avail_id`: Reference to `room_avail`.
  - `start_date`: Date of reservation.
  - `status`: Status of booking ('reserved', 'pending', 'used').

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The `/map` page loads, renders the 2D map + SVG, and registers event handlers in under 1 second.
- **SC-002**: Toggling between Map1 and Map2 renders the new map and swaps SVG interactive coordinates in under 500ms.
- **SC-003**: The 3D room image is rendered in the detail panel within 300ms of clicking a room area.
- **SC-004**: The user interface matches the project's Light/Dark mode and displays fully translated text (English/Vietnamese) based on the user's localized preference.
- **SC-005**: For rooms with capacity 1, the details panel suppresses amenity lists and reservation forms 100% of the time.
- **SC-006**: For rooms with capacity > 1, unauthenticated users are prevented from seeing booking slots or buttons, receiving the call-to-action login prompt instead.

## Assumptions

- **A-001**: The SVG files `map_layout1.svg` and `Map_layout_2.svg` have `id` attributes on their elements (e.g., `meetingRoom1`, `locker`, `computerArea1`) that exactly match the names stored in the `room_name` column of the `study_room` table.
- **A-002**: The 3D preview PNG filenames under `client/app/assets/MapImages/3D/` match the syntax `room_[room_id].png` using the database key `room_id` (e.g. `room_1.png`).
- **A-003**: A default fallback image is provided at `client/app/assets/default_room_3d.png` to handle cases where a 3D PNG is missing.
