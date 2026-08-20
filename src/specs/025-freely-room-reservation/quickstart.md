# Quickstart: Freely Room Reservation

**Branch**: `025-freely-room-reservation` | **Date**: 2026-07-18

This guide provides validation scenarios to verify the feature works end-to-end. See [data-model.md](./data-model.md) for entity details and [contracts/](./contracts/) for API contracts.

---

## Prerequisites

- Node.js 18+
- PostgreSQL 15 with database initialized (run `database/init_db/postgres/` scripts)
- Backend server configured with `.env` (DB connection, JWT secret)
- Frontend dev server configured with `.env.local`

---

## Setup

```bash
# From repository root

# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Start backend (terminal 1)
cd server
npm run dev

# 3. Start frontend (terminal 2)
cd client
npm run dev
```

---

## Validation Scenarios

### Scenario 1: GET available slots (existing endpoint)

```bash
curl "http://localhost:4000/api/rooms/availability?roomId=1&date=2026-07-20"
```

**Expected**: Returns JSON with `success: true` and an array of availability slots, each with `availId`, `startTime`, `endTime`, `status`, `reserveId`.

---

### Scenario 2: POST create a reservation (new endpoint)

```bash
# First, log in to get a token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use the token to create a reservation
curl -X POST http://localhost:4000/api/rooms/reserve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"availId": 1, "startDate": "2026-07-20"}'
```

**Expected (201)**: Returns JSON with `success: true` and reservation data (`reserveId`, `availId`, `startDate`, `status: "reserved"`).

---

### Scenario 3: Double-booking prevention

Run Scenario 2 twice with the same `availId` and `startDate`.

**Expected**: First request succeeds (201). Second request returns 409 with `"This time slot is no longer available."`.

---

### Scenario 4: Unauthenticated reservation

```bash
curl -X POST http://localhost:4000/api/rooms/reserve \
  -H "Content-Type: application/json" \
  -d '{"availId": 1, "startDate": "2026-07-20"}'
```

**Expected (401)**: Returns JSON with `"No token provided"`.

---

## Running Backend Tests

```bash
cd server
npm test
```

**Expected**: Existing tests pass. New tests for room reservation should be added in `server/tests/` following the patterns in:
- `tests/controllers/register.controller.spec.mjs`
- `tests/services/register.service.spec.mjs`
- `tests/integration/register.api.spec.mjs`

---

## Frontend Validation

1. Navigate to `/map` — click a room zone → room detail panel opens
2. Verify "Đặt phòng tự do" (Freely) option is active, "Đặt phòng study group" is visible but disabled
3. Select a date → available time slots are displayed
4. Click a free slot → confirm → reservation is created
5. Navigate to Dashboard → click "Room Reservations" in sidebar → see "Room Reservations" title, "New Reservation" button, pagination arrows, "Upcoming" section with cards, and "Past Bookings" table
6. Each upcoming card shows: room icon, status badge (teal "Confirmed"), room name, description, date with calendar icon, time slot with clock icon, "Tạo mã PIN" and "Hủy" buttons
7. Verify past bookings appear in the table with columns: ROOM NAME, DATE, TIME SLOT, DURATION, STATUS

---

## Locale Keys

Ensure these i18n keys exist in `client/app/locales/en.json` and `vi.json`:

| Key | EN | VI |
|---|---|---|
| `dashboard.sidebar_room_reservations` | Room Reservations | Đặt phòng |
| `room.freely_mode` | Đặt phòng tự do (Freely) | Đặt phòng tự do |
| `room.study_group_mode` | Đặt phòng study group | Đặt phòng study group |
| `room.reserve_confirm` | Confirm Booking | Xác nhận đặt phòng |
| `room.reserve_success` | Room reserved successfully! | Đặt phòng thành công! |
| `room.slot_unavailable` | This slot is no longer available | Khung giờ này không còn trống |
| `room.no_slots` | No available slots for this date | Không có khung giờ trống |
| `room.create_pin` | Tạo mã PIN | Tạo mã PIN |
| `room.cancel` | Hủy | Hủy |
| `room.upcoming` | Upcoming | Sắp tới |
| `room.past_bookings` | Past Bookings | Lịch sử đặt phòng |
| `room.no_reservations` | No room reservations yet | Chưa có đặt phòng nào |
