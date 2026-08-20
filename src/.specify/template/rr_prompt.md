# Specification: Room Reservation Feature (Freely Mode)

## 1. Feature Overview & Requirements
Implement the "Freely Room Reservation" feature for individual users via the library map, including the backend API logic and the frontend User Dashboard UI update.

### Constraints & Scope:
- Focus ONLY on "Đặt phòng tự do" (Freely Mode). The "Study Group" mode will be implemented later.
- Do NOT alter, modify, or hallucinate any existing database schema properties.
- Strictly adhere to the tables provided in `init_db/postgres/03_datafacility.sql`.
- The flow start at User sidebar with room reservation

---

## 2. Backend Architecture & Codebase Structure

Specify the exact implementation details across the following layers:

### A. Models (Database Layer)
Map and interact with the existing PostgreSQL tables:
- **`study_room`**: Contains `room_id`, `img_url`, etc.
- **`room_avail`**: Contains `avail_id`, `room_id`, `start_time`, `end_time`.
- **`reserve_room`**: Contains `reserve_id`, `user_id`, `avail_id`, `start_date`, `checkin_time`, `pin`, `expired_at`, `status`.

### B. Controllers & Logic Flow
1. **`getAvailableTimeSlots(room_id, date)`**:
   - Step 1: Query `reserve_room` to filter all rows where `start_date` matches the user's selected date.
   - Step 2: Use the `avail_id` from those filtered rows to identify slots that are already booked.
   - Step 3: Query `room_avail` for the specific `room_id`.
   - Step 4: Exclude the booked slots and return/render the remaining available time intervals (`start_time` to `end_time`).

2. **`createReservation(user_id, avail_id, start_date)`**:
   - Save a new record into `reserve_room`.
   - Fields to populate: `reserve_id` (auto/uuid), `user_id`, `avail_id`, `start_date` (selected booking date).
   - Set `status` to `'reserved'`.
   - Leave `checkin_time`, `pin`, and `expired_at` empty/null for now (handled in future tasks).

### C. Routes & Middlewares
- **Routes**: Expose endpoints for fetching available slots (`GET`) and creating a reservation (`POST`).
- **Middlewares**: Ensure standard authentication is applied to extract the logged-in `user_id`.

---

## 3. Frontend & UI Requirements

### A. Booking Flow Interaction
- **Trigger**: User clicks a specific room on the `library map` -> Display 2 mode options: "Đặt phòng tự do" (Freely) and "Đặt phòng study group".
- **Action**: When "Freely" is selected -> Prompt user to select Date/Month/Year -> Render the filtered available time slots for that specific `room_id`.
- **Confirmation**: Clicking confirm triggers the reservation saving logic.

### B. Room Reservations Tab (User Dashboard)
- **Design Base**: Follow `.specify/template/room_reservation_design`.
- **Layout Modification**: Enhance the existing design by embedding the room's image into each cell block.
- **Data Resolution**: To get the image, traverse: `reserve_room.avail_id` -> `room_avail.room_id` -> `study_room.img_url`.
- **Cell Elements**: Each reservation card/cell must display:
  - Date (`start_date`)
  - Time slot (`start_time` - `end_time`)
  - Status (`status`)
  - Room Image (`img_url`)
  - **"Tạo mã PIN" Button** (Pure UI placeholder - logic implemented later)
  - **"Cancel" Button** (Pure UI placeholder - logic implemented later)