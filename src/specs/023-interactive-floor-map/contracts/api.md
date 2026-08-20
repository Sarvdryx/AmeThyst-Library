# API Contracts: Interactive Floor Plan Map

This document specifies the communication contract between the Next.js frontend client and the Express.js backend API for the Interactive Floor Map feature.

All endpoints must respond in JSON and use proper HTTP response codes.

---

## 1. Get Room Metadata By Name
Retrieves details of a study room by its visual identifier (which matches the SVG layout `id` attribute).

* **URL**: `/api/rooms/details`
* **Method**: `GET`
* **Query Parameters**:
  * `name` (string, required): The unique room name (e.g. `meetingRoom1`).
  * `branchId` (integer, required): Filter by branch (e.g. `1` for NVC, `2` for LT).

### Response Success (`200 OK`)
```json
{
  "success": true,
  "data": {
    "roomId": 5,
    "branchId": 1,
    "roomName": "meetingRoom1",
    "tvNum": 1,
    "boardNum": 1,
    "socketNum": 4,
    "capacity": 8,
    "description": "Large group study room with projector and whiteboard."
  }
}
```

### Response Error - Not Found (`404 Not Found`)
```json
{
  "success": false,
  "error": "Room not found with the specified name."
}
```

---

## 2. Get Room Availability Calendar
Retrieves all availability slots and booking statuses for a specific room on a selected date.

* **URL**: `/api/rooms/availability`
* **Method**: `GET`
* **Query Parameters**:
  * `roomId` (integer, required): Database room ID.
  * `date` (string, required): Target date format `YYYY-MM-DD`.

### Response Success (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "availId": 12,
      "startTime": "08:00:00",
      "endTime": "10:00:00",
      "status": "free",
      "reserveId": null
    },
    {
      "availId": 13,
      "startTime": "10:00:00",
      "endTime": "12:00:00",
      "status": "reserved",
      "reserveId": "a25e985b-e60d-4fa0-82a1-b841e21b72e5"
    },
    {
      "availId": 14,
      "startTime": "12:00:00",
      "endTime": "14:00:00",
      "status": "pending",
      "reserveId": "c56e012e-da3d-4c38-bd98-7512a843e9a2"
    }
  ]
}
```

### Response Error - Bad Request (`400 Bad Request`)
```json
{
  "success": false,
  "error": "Invalid roomId or date parameter format."
}
```

---

## Client-Side Call Optimization Rules

- **Low Capacity Constraint**: The Next.js frontend client MUST NOT send requests to `/api/rooms/availability` if the room details payload contains `capacity: 1`. This minimizes database query traffic for spaces that cannot be reserved.
- **Guest Restriction**: The Next.js frontend client MUST NOT request `/api/rooms/availability` if the user is not authenticated. It should display the call-to-action login banner instead.
