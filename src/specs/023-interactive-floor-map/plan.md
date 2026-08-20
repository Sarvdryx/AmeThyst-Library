# Implementation Plan: Interactive Floor Plan Map

**Branch**: `023-interactive-floor-map` | **Date**: 2026-07-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/023-interactive-floor-map/spec.md`

## Summary
Implement a fully responsive and interactive library floor map feature supporting multiple maps (Map 1 for NVC branch, Map 2 for Linh Trung branch). The UI combines a 2D floor layout PNG background (`mapCS1.png` or `map_cs2.png`) from `client/app/assets/MapImages/` overlaid with an interactive SVG coordinates layer. Hovering highlights room elements and clicking opens a side drawer details panel displaying database room records, availability, and a 3D visualization preview.

The map route is configured at `/map` in `client/app/map/page.tsx`, directly binding to the navigation bar's LIMA map tab link.

Special layout rules are applied dynamically based on the space's capacity:
- If `capacity = 0`, only the name, description, and 3D preview are shown (no reservation, stats, or other attributes are shown).
- If `capacity > 0`, all room attributes (including projectors) are shown, and reservation/calendar elements are displayed exclusively for logged-in users (guests see a login CTA prompt).

The 3D visualization preview images are loaded from the database's `img_url` column. If null, they fall back to a dynamic Next.js server-side API route `/api/assets/3D/[id]` which reads and streams raw PNG buffers from `client/app/assets/MapImages/3D/room_{room_id}.png` dynamically without file duplication.

---

## Technical Context

**Language/Version**: JavaScript (ES Modules for Node.js backend, ES6+ for React frontend)

**Primary Dependencies**: React 19, Next.js 16, Tailwind CSS v4, Express 5.x, pg 8.x (PostgreSQL client)

**Storage**: PostgreSQL (tables: `study_room`, `room_avail`, `reserve_room`)
- Updated schema: `study_room` table includes `projector_num` (int4, default 0, check >= 0) and `img_url` (text).
- Constraint update: Changed capacity check constraint `chk_capacity_positive` from `>= 1` to `>= 0`.

**Testing**: Jest (for backend API controller, service, and model tests)

**Target Platform**: Modern Desktop and Mobile Web Browsers (Chrome, Safari, Firefox, Edge)

**Project Type**: Web Application (Next.js client + Express backend)

**Performance Goals**:
- Floor map rendering and coordinates overlay setup in < 1 second.
- Toggling between Map 1 and Map 2 layouts under 500 milliseconds.
- Side drawer details panel opening with 3D image preloaded under 300 milliseconds.

**Constraints**:
- Absolute pixel layout alignment must be scaled responsively using responsive SVGs (`viewBox`).
- Interactivity must not be occluded (overlay elements must use `pointer-events: none` container / `pointer-events: auto` shapes).
- Strict adherence to project's Light/Dark mode and localization constraints.
- State tracking and handlers track selected room using numeric `roomId` to match primary key database schemas.
- Visual drawer styles matching `FilterPanel` (absolute top offset `top-[84px] h-[calc(100vh-84px)]` and background `#FFF8EB`).
- Scroll lock on outer document body when sidebar panel is open.

---

## Constitution Check

*Passed. Re-checked post-implementation.*

- **Principle I: Component-Driven & Reusability**: Yes. Interactive map rendered via atomic component `<FloorMap />` and details panel via `<RoomDetailPanel />`, matching `FilterPanel` structures.
- **Principle II: State Management & Data Fetching**: Yes. Selected room tracked via numeric `selectedRoomId`. Details queried from backend by `roomId` (and falls back to `name`).
- **Principle III: Responsive & Beautiful Design**: Yes. Uses Tailwind CSS layout alignment, theme-synchronized backgrounds (`bg-background text-foreground`), and micro-interactions for highlights.
- **Principle V: Error Handling & Accessibility**: Yes. Displays graceful fallbacks for missing 3D images and database connection errors.
- **Principle IX: Light/Dark Mode & Localization (i18n)**: Yes. Styled using Tailwind CSS v4 dark mode utilities. Text strings localized via translation keys in `en.json` and `vi.json` (including the new `projector` count).
- **Backend Architecture & Casing**: Yes. Strictly follows Controller -> Service -> Model layer chain. Filenames use ES Modules `.mjs` naming conventions.

---

## Project Structure

### Documentation (this feature)

```text
specs/023-interactive-floor-map/
├── plan.md              # This file
├── research.md          # Decision log on alignment, mappings, and availability queries
├── data-model.md        # Relational schema structure and SQL seeds script
├── contracts/
│   └── api.md           # API endpoints contracts specifications
├── quickstart.md        # Guide to run database setup, localizations, and verify feature
└── checklists/
    └── requirements.md  # Quality assurance requirements checklist
```

### Source Code Layout

```text
client/
├── app/
│   ├── api/
│   │   └── assets/
│   │       └── 3D/
│   │           └── [id]/
│   │               └── route.ts     # Next.js dynamic API route to stream 3D assets
│   ├── assets/
│   │   └── MapImages/
│   │       ├── 3D/          # Original location of room_1.png to room_23.png
│   │       ├── LayoutCS1.png
│   │       ├── Layout_cs2.png
│   │       ├── mapCS1.png
│   │       ├── map_cs2.png
│   │       ├── map_layout1.svg
│   │       └── Map_layout_2.svg
│   └── map/
│       └── page.tsx         # Next.js floor map page (/map)
└── components/
    └── library/
        ├── FloorMap.tsx     # Map renderer with absolute SVG overlay (numeric IDs click)
        └── RoomDetailPanel.tsx # Side-drawer details slide-out panel (scroll-locked)
 
server/
└── src/
    ├── controllers/
    │   └── room.controllers.mjs
    ├── models/
    │   └── room.models.mjs
    ├── routes/
    │   └── room.routes.mjs
    └── services/
        └── room.services.mjs
```

---

## Completed Implementations & Verification

1. **Backend Rooms REST Schema & API Route**:
   - Created room routes in Express `/api/rooms/details` and `/api/rooms/availability`.
   - Verified that the backend successfully resolves details and booking slots.
   - Tested model, controller, and service layer modules via backend Jest mock tests.

2. **Frontend Routing & Numeric ID State Flow**:
   - Created map tab page `/map`.
   - Configured absolute vector highlighting SVG layers aligned responsively over 2D background PNG images.
   - Wired handlers to pass numeric database primary keys `selectedRoomId` (1 to 24) on space clicks.

3. **Drawer Panel UI & Scroll Lock**:
   - Programmed the side drawer details panel layout to match `FilterPanel` offsets (`top-[84px]`).
   - Added automatic document overflow toggle (`document.body.style.overflow = 'hidden'`) when active.
   - Set up conditional stats and scheduling lists for reservable spaces (`capacity > 0`).

4. **Dynamic 3D Asset Retrival**:
   - Programmed custom API route `/api/assets/3D/[id]` to read and stream original files.
   - Integrated logic to fetch image previews from database `imgUrl` column, falling back to local streamed path.
