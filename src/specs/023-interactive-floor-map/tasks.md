# Tasks: Interactive Floor Plan Map

**Input**: Design documents from `/specs/023-interactive-floor-map/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are optional and are included here for the backend services/controllers to verify the API behavior using Jest.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are project-relative.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project file directories and files for backend room MVC under `server/src/controllers/room.controllers.mjs`, `server/src/models/room.models.mjs`, `server/src/routes/room.routes.mjs`, and `server/src/services/room.services.mjs`
- [X] T002 Create page route and components directories for floor map frontend under `client/app/map/page.tsx`, `client/components/map/FloorMap.tsx`, and `client/components/map/RoomDetailPanel.tsx`
- [X] T003 [P] Add localized key-value translations for floor map selector and details panel in English dictionary `client/app/locales/en.json`
- [X] T004 [P] Add localized key-value translations for floor map selector and details panel in Vietnamese dictionary `client/app/locales/vi.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema seeds and backend Express endpoints setup

- [X] T005 Populate `study_room` and `room_avail` seed records matching NVC (Map 1) and LT (Map 2) layout coordinates in `database/init_db/04_init_rest.sql`
- [X] T006 Implement SQL database queries to retrieve room records by name and availability slots joined with bookings in `server/src/models/room.models.mjs`
- [X] T007 Implement study room business logic and data mappings in service layer `server/src/services/room.services.mjs`
- [X] T008 [P] Implement request parameters handling and JSON payload structure responses in `server/src/controllers/room.controllers.mjs`
- [X] T009 [P] Map endpoints `/api/rooms/details` and `/api/rooms/availability` to controllers inside `server/src/routes/room.routes.mjs`
- [X] T010 Register the new `roomRoutes` router in backend application entrypoint `server/src/server.mjs`
- [X] T011 Create Jest service mock verification unit tests for rooms in `server/tests/services/room.services.test.mjs`

**Checkpoint**: Foundation ready - backend endpoints are fully operational and testable. User story implementation can now begin.

---

## Phase 3: User Story 1 - Multi-Map Layout Selection & 2D Aesthetic Render (Priority: P1) 🎯 MVP

**Goal**: Render the library floor plan page and switch between Map 1 (NVC) and Map 2 (LT) base layouts at path `/map`.

**Independent Test**: Navigate to `/map` (linked via the Map navigation tab), toggle buttons between NVC and LT branches, and verify that the correct base PNG map (`mapCS1.png` or `map_cs2.png`) and its matching SVG coordinates overlay (`map_layout1.svg` or `Map_layout_2.svg`) render aligned.

### Implementation for User Story 1

- [X] T012 [US1] Create the primary entry floor map component layout wrapper in `client/app/map/page.tsx`
- [X] T013 [P] [US1] Build responsive toggle switch header buttons inside `client/app/map/page.tsx` using Tailwind CSS to select branch maps
- [X] T014 [US1] Implement responsive layout container in `client/components/map/FloorMap.tsx` rendering base PNG maps from `client/app/assets/MapImages/`
- [X] T015 [US1] Render the corresponding branch SVG file overlaid absolutely over the base PNG layout inside `client/components/map/FloorMap.tsx`

**Checkpoint**: Base 2D floor plans render aligned and toggle between NVC and LT layouts.

---

## Phase 4: User Story 2 - Interactive SVG Room Highlight & Hover Effects (Priority: P1)

**Goal**: Provide interactive mouse-hover highlights and pointer styling on reservable areas.

**Independent Test**: Hover mouse over reservable areas (such as `meetingRoom1`) in NVC map or LT map on the `/map` page. Verify that the area fill opacity changes, cursor shifts to pointer, and clicking the room updates selected state.

### Implementation for User Story 2

- [X] T016 [US2] Set click-through pointer-events CSS styles on bookshelves and wall groupings while enabling pointer-events on room shapes in `client/components/map/FloorMap.tsx`
- [X] T017 [P] [US2] Add hover style transitions (fill opacity changes, highlight outline glow) to SVG elements on mouseenter/mouseleave inside `client/components/map/FloorMap.tsx`
- [X] T018 [US2] Bind click event listeners to SVG room paths/rects to set active selected state in `client/components/map/FloorMap.tsx`

**Checkpoint**: Interactive rooms respond to hover and register user selections.

---

## Phase 5: User Story 3 - Details Panel for Low Capacity Spaces (Capacity = 1) (Priority: P2)

**Goal**: Display informational-only side panel (description and 3D preview) for spaces with capacity = 1.

**Independent Test**: Click on a bookshelf or locker (e.g. `locker` on Map 1). Verify that the details panel slides open showing only description and the 3D preview image `room_12.png` loaded from `/assets/MapImages/3D/`, with booking components hidden.

### Implementation for User Story 3

- [X] T019 [US3] Build the slide-out drawer panel skeleton matching the project UI layout filter drawer in `client/components/map/RoomDetailPanel.tsx`
- [X] T020 [US3] Implement client-side endpoint fetching from `/api/rooms/details` upon room selection in `client/components/map/RoomDetailPanel.tsx`
- [X] T021 [US3] Implement the capacity check conditional logic: if `capacity === 1`, display only the description and name in `client/components/map/RoomDetailPanel.tsx`
- [X] T022 [P] [US3] Render the dynamic 3D room image `/assets/MapImages/3D/room_${roomId}.png` and hide capacity/amenity/booking sections in `client/components/map/RoomDetailPanel.tsx`

**Checkpoint**: Informational spaces slide open, loading description and 3D previews without booking options.

---

## Phase 6: User Story 4 - Details Panel for Reservable Rooms (Capacity > 1) (Priority: P2)

**Goal**: Display complete details panel (amenities, capacity, booking slots) for reservable rooms (capacity > 1) based on user authentication status.

**Independent Test**: Click on `meetingRoom1` while logged in to view slot lists and booking options. Click it while logged out to verify that slot lists are hidden and replaced with a "Please log in to book this room" prompt.

### Implementation for User Story 4

- [X] T023 [US4] Implement detail list rows rendering capacity, TV count, whiteboard count, and power sockets in `client/components/map/RoomDetailPanel.tsx`
- [X] T024 [US4] Bind React user session context into details panel in `client/components/map/RoomDetailPanel.tsx` to detect auth status
- [X] T025 [US4] Fetch date-specific slots list from `/api/rooms/availability` and render calendar list for authenticated users in `client/components/map/RoomDetailPanel.tsx`
- [X] T026 [P] [US4] Render localized static banner prompt instructing guest users to log in if unauthenticated in `client/components/map/RoomDetailPanel.tsx`

**Checkpoint**: Reservable rooms display complete stats, showing booking slots only to authenticated members.

---

## Phase 7: User Story 5 - Redirect to Room Booking Page (Priority: P3)

**Goal**: Provide a booking CTA button that redirects authenticated users to the reserve room form.

**Independent Test**: Open details for `meetingRoom1` while logged in, click "Book Room", and check that the browser redirects to `/library/reserve?roomId=1`.

### Implementation for User Story 5

- [X] T027 [US5] Render the "Book Room" call-to-action button for authenticated users inside `client/components/map/RoomDetailPanel.tsx`
- [X] T028 [US5] Bind click redirect to nav router, appending roomId parameter in `client/components/map/RoomDetailPanel.tsx`

**Checkpoint**: Clicking booking redirect routes the user with the pre-selected room ID.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Visual optimizations, translation verifications, and cross-story testing

- [X] T029 Create Express controller unit testing suites in `server/tests/controllers/room.controllers.test.mjs`
- [X] T030 [P] Implement default fallback image loading error handling for missing 3D previews in `client/components/map/RoomDetailPanel.tsx`
- [X] T031 Verify SVG overlays scale responsively and align perfectly on top of base PNGs under mobile, tablet, and desktop browser viewports
- [X] T032 Verify light/dark theme colors look beautiful across the map switcher header and the slide-out panel
- [X] T033 Execute the verification steps documented in `quickstart.md` and check off requirements checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (Phase 3) is the absolute prerequisite for subsequent visual stories.
  - User Story 2 (Phase 4) depends on User Story 1.
  - User Story 3 (Phase 5) and User Story 4 (Phase 6) can be built in parallel once User Story 2 completes.
  - User Story 5 (Phase 7) depends on User Story 4.
- **Polish (Phase 8)**: Depends on all user stories being complete.

### Parallel Opportunities

- Phase 1: Setup locales translations T003 and T004 can run in parallel.
- Phase 2: Foundational tests T011 and controller mappings T008, T009 can run in parallel.
- Phase 5: Hiding UI columns (T022) can run in parallel with general data fetching setup (T020).
- Phase 6: Auth state hook setup (T024, T026) can run in parallel with layout drawing (T023).

---

## Parallel Example: Setup & Foundation

```bash
# Register controller endpoint routes:
Task: "Map endpoints in server/src/routes/room.routes.mjs"
Task: "Register the new roomRoutes in server/src/server.mjs"

# Translate localized key/value assets concurrently:
Task: "Add localized keys in client/app/locales/en.json"
Task: "Add localized keys in client/app/locales/vi.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational - seed SQL and Express endpoints).
2. Complete Phase 3 (US1 - map toggle layout and PNG/SVG overlays).
3. Complete Phase 4 (US2 - SVG hover highlights and selections).
4. **STOP and VALIDATE**: Verify that map selector and SVG overlays behave responsively and highlights trigger correctly.

### Incremental Delivery

1. Complete Setup + Foundational -> Core database seeds and Express endpoints operational.
2. Complete US1 + US2 -> Interactive layout alignment MVP.
3. Complete US3 -> Single-capacity space details drawer (locker/bookshelves description-only panels).
4. Complete US4 + US5 -> Group room details with slot scheduler and reservation redirects.
5. Polish, run tests, verify theme/language systems.
