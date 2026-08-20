# Quickstart Guide: Interactive Floor Plan Map

This guide provides steps to initialize, run, and verify the Interactive Floor Plan Map feature.

## Prerequisite Setup

### 1. Database Initialization
Ensure your local PostgreSQL instance is running, and execute the SQL seed scripts defined in [data-model.md](data-model.md):
- Seed the rooms for NVC branch (Map 1) and LT branch (Map 2).
- Generate the availability time blocks using the PL/pgSQL loop.

### 2. Localization Configuration
Ensure the translation keys are updated in both translation dictionaries to support the i18n localization system required by the constitution:

**English: `client/app/locales/en.json`**
```json
{
  "floor_map": {
    "title": "Interactive Floor Map",
    "select_branch": "Select Library Branch",
    "branch_nvc": "Nguyen Van Cu (Branch 1)",
    "branch_lt": "Linh Trung (Branch 2)",
    "panel": {
      "capacity": "Capacity",
      "tv": "TV Screens",
      "whiteboard": "Whiteboards",
      "sockets": "Power Sockets",
      "available_slots": "Today's Availability",
      "book_now": "Book Room",
      "not_available": "Availability details currently unavailable",
      "unavailable_room": "Unreservable / Details Unavailable",
      "please_login": "Please log in to book this room.",
      "people": "people",
      "none": "None"
    }
  }
}
```

**Vietnamese: `client/app/locales/vi.json`**
```json
{
  "floor_map": {
    "title": "Sơ Đồ Phòng Thư Viện",
    "select_branch": "Chọn Chi Nhánh Thư Viện",
    "branch_nvc": "Nguyễn Văn Cừ (Cơ sở 1)",
    "branch_lt": "Linh Trung (Cơ sở 2)",
    "panel": {
      "capacity": "Sức chứa",
      "tv": "Màn hình TV",
      "whiteboard": "Bảng viết",
      "sockets": "Ổ cắm điện",
      "available_slots": "Lịch Trống Hôm Nay",
      "book_now": "Đặt Phòng",
      "not_available": "Chi tiết lịch trống hiện không khả dụng",
      "unavailable_room": "Không thể đặt / Thiếu thông tin",
      "please_login": "Vui lòng đăng nhập để đặt phòng này.",
      "people": "người",
      "none": "Không có"
    }
  }
}
```

---

## Running the Services

### 1. Backend Server
Navigate to the `server/` directory, install dependencies, and run in dev mode:
```bash
cd server
npm install
npm run dev
```
Verify the server starts on `http://localhost:5000`.

### 2. Frontend Client
Navigate to the `client/` directory, install dependencies, and run in dev mode:
```bash
cd client
npm install
npm run dev
```
Verify the client starts on `http://localhost:3000`.

---

## Verifying the Implementation

1. Navigate to `/map` (the floor plan route) in your browser (linked via the "Map" tab on the LIMA navbar).
2. Verify that you can select between the **NVC** and **Linh Trung** branches.
3. Verify that hovering over rooms on the NVC map (Map 1) or Linh Trung map (Map 2) displays the highlight effects.
4. **Verification for Capacity = 1 Rule**:
   - Click on the `locker` on Map 1 or Map 2 (maps to database record with `capacity = 1`).
   - Confirm that the side panel displays only the name, description, and the 3D locker preview image (e.g. `/assets/MapImages/3D/room_12.png`).
   - Verify that capacity numbers, TV screen count, socket count, and board counts are **hidden**.
   - Verify that availability calendar slots and the "Book Room" button are **hidden**.
5. **Verification for Capacity > 1 & Authenticated User Rule**:
   - Log in as a registered user.
   - Click on **meetingRoom1** (maps to database record with `room_id = 1` and `capacity = 8`).
   - Confirm the side panel displays the 3D room image `/assets/MapImages/3D/room_1.png`, capacity, TVs, whiteboards, sockets, the availability slot schedule list, and the active "Book Room" redirect button.
6. **Verification for Capacity > 1 & Guest User Rule**:
   - Log out of your account to browse as a guest.
   - Click on **meetingRoom1**.
   - Confirm the side panel displays the 3D image `/assets/MapImages/3D/room_1.png` and all room descriptors, but the availability slots and the "Book Room" button are replaced by the prompt message: *"Please log in to book this room."*
7. Toggle the application's theme. Verify that both the map container and the details panel render correctly in Dark and Light modes.
