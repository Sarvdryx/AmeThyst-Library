# Research Notes: Interactive Floor Plan Map

This document outlines design decisions, technical research, and solutions for key unknowns associated with the Interactive Floor Plan Map feature.

## Decision 1: Responsive SVG & 2D Image Overlay Alignment

### The Problem
How to position the interactive SVG layer over the aesthetic 2D PNG floor plan image so that the shapes align perfectly across all viewport sizes (mobile, tablet, desktop) without breaking event handling.

### Selected Decision
Use a wrapper `div` with `position: relative` and matching aspect ratio.
- Render the base 2D layout image (`mapCS1.png` or `map_cs2.png`) inside this wrapper from `client/app/assets/MapImages/` using Next.js `<Image>` with `width: 100%` and `height: auto`.
- Overlay the interactive SVG file using absolute positioning: `position: absolute; top: 0; left: 0; width: 100%; height: 100%;`.
- Configure the SVG element with its native `viewBox` matching the original image dimensions (Map 1: `0 0 1177 757`, Map 2: `0 0 933 807`), setting `preserveAspectRatio="xMidYMid meet"`.
- Set `pointer-events: none` on the main `<svg>` container and `pointer-events: auto` on the interactive `<rect>` and `<path>` shapes representing study rooms/zones.

### Rationale
Setting matching aspect ratios and identical `viewBox` parameters ensures that the browser's graphics engine performs scaling calculations automatically. Combining `pointer-events: none` on the container with `pointer-events: auto` on interactive shapes ensures that background spaces remain transparent to mouse clicks while room areas correctly capture hover and click events.

### Alternatives Considered
- **SVG `<image>` tag:** Embed the PNG directly inside the SVG file. Rejected because it bypasses Next.js image loading optimizations and lazy loading.
- **Client-side coordinate scaling (Canvas):** Track coordinate percentages on click. Rejected as it is highly complex and fails to provide native CSS hover states easily.

---

## Decision 2: SVG IDs to Database Mapping

### The Problem
How to map the SVG shape identifiers (e.g. `meetingRoom1`, `locker`, etc.) to the relational PostgreSQL database tables.

### Selected Decision
Directly map SVG element `id` attributes to the unique `room_name` column in the `study_room` table.
- When an interactive shape is clicked, retrieve its `id` attribute in React.
- Dispatch an API fetch request to the backend: `/api/rooms/details?name=${roomId}`.
- The backend service queries the database using:
  ```sql
  SELECT * FROM study_room WHERE room_name = $1;
  ```

### Rationale
Simplifies mapping to 1-to-1 matching names, avoiding hardcoded conversion tables on the client or server. Leverages the database unique constraint on `room_name` while keeping database queries index-friendly.

### Alternatives Considered
- **Metadata Attributes:** Use custom attributes like `data-room-id` in the SVG files. Rejected because the SVGs are pre-built static assets and modifying their internal structure dynamically is harder than relying on standard IDs.

---

## Decision 3: Availability Verification Algorithm

### The Problem
How to calculate availability slots for a room on a given day.

### Selected Decision
Backend endpoint `/api/rooms/availability?roomId=${roomId}&date=${date}` will execute a query joining `room_avail` and `reserve_room` tables:
- Query `room_avail` to get all predefined slots for the room.
- LEFT JOIN `reserve_room` on `avail_id` matching the requested `date`.
- Map the output: if there is a matching reservation with status `reserved` or `pending`, mark that slot as booked. Otherwise, mark it as free.

---

## Decision 4: Details Panel Render Logic by Space Capacity and User Authentication

### The Problem
How to handle the user interface layout of the details panel based on capacity (capacity = 1 vs. capacity > 1) and user authentication status (logged-in vs. guest), and load the correct 3D visual preview.

### Selected Decision
Implement conditional branch rendering directly in the React `<RoomDetailPanel />` component:
1. **Low Capacity Rule (`capacity === 1`)**:
   - If the room data fetched from the API has `capacity === 1`, render only the name, the 3D preview image (`room_${roomId}.png`), and the description.
   - Entirely bypass rendering of other attributes (capacity count, TV screens, whiteboard counts, sockets) and completely hide the calendar availability slots and the booking CTA redirect button.
2. **Standard Group Room Rule (`capacity > 1`)**:
   - If `capacity > 1`, display all room detail descriptors (Capacity, TVs, Sockets, and Whiteboards).
   - **Authentication Check**:
     - Check the global authentication context (e.g. `const { user } = useAuth()`).
     - If the user is authenticated (`user !== null`), fetch the availability slots from the API, render the calendar list, and display the clickable "Book Room" redirect button.
     - If the user is unauthenticated (guest, `user === null`), render a localized notification banner: "Please log in to book this room." and hide all reservation slots and booking buttons.
3. **3D Image Preview Mapping**:
   - Load the image dynamically from `/assets/MapImages/3D/room_${roomId}.png` where `roomId` is the database primary key ID of the study room (1 to 23). This decouples image naming from string layout IDs and keeps them in a single indexable flat folder.

### Rationale
Provides a streamlined experience for informational-only spaces (like lockers or bookshelves) by hiding redundant field keys, and prevents unauthenticated requests from trying to load reservation pages, while offering a clear call-to-action login link inside the drawer. Uses primary key IDs for image files to ensure simple static routing without client-side mapping dicts.
