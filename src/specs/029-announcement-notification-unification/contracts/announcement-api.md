# API Contract: Announcement Management

This document defines the interface and validation contracts for the Announcement REST endpoints.

---

## 1. Endpoints Overview

| Route | Method | Roles | Purpose |
|---|---|---|---|
| `/dashboard/librarian/announcements` | `POST` | `librarian`, `admin` | Create new announcement |
| `/dashboard/librarian/announcements/:id` | `PUT` | `librarian`, `admin` | Update announcement details |
| `/dashboard/librarian/announcements/:id/status` | `PATCH` | `librarian`, `admin` | Transition announcement status |

---

## 2. Request / Response Payloads

### A. Create Announcement (`POST /dashboard/librarian/announcements`)

#### Request Body
```json
{
  "title": "New Features Rolled Out",
  "content": "We have updated our library systems.",
  "expired_date": "2026-08-15",
  "status": "draft"
}
```
* **Validation Rules**:
  * `title`: String, non-empty, max 255 characters.
  * `content`: String, non-empty.
  * `expired_date`: Optional String (`YYYY-MM-DD` or `null`).
  * `status`: Optional String (`draft` or `active`).
  * **Rule (New)**: `expired_date` must not be earlier than the current calendar date in the server's timezone (compared on a date-only string basis). Applies unconditionally to both `draft` and `active` announcements.

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "announceId": "2bf5df79-7a5d-4f10-91a5-e3d8393e1b74",
    "createdAt": "2026-07-31T09:42:53.000Z",
    "expiredDate": "2026-08-15",
    "title": "New Features Rolled Out",
    "content": "We have updated our library systems.",
    "status": "draft"
  },
  "message": "Announcement created successfully."
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "data": null,
  "message": "Cannot set expiration date in the past."
}
```

---

### B. Update Announcement Details (`PUT /dashboard/librarian/announcements/:id`)

#### Request Body
```json
{
  "title": "Updated: New Features Rolled Out",
  "content": "We have updated our library systems with new features.",
  "expired_date": "2026-08-20"
}
```
* **Validation Rules**:
  * **Rule (New)**: `expired_date` must not be earlier than the current calendar date. Applies to both `draft` and `active` announcements.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "announceId": "2bf5df79-7a5d-4f10-91a5-e3d8393e1b74",
    "createdAt": "2026-07-31T09:42:53.000Z",
    "expiredDate": "2026-08-20",
    "title": "Updated: New Features Rolled Out",
    "content": "We have updated our library systems with new features.",
    "status": "draft"
  },
  "message": "Announcement details updated successfully."
}
```

---

### C. Update Status (`PATCH /dashboard/librarian/announcements/:id/status`)

#### Request Body
```json
{
  "status": "active"
}
```
* **Validation Rules**:
  * `status` must be one of: `draft`, `active`, `expired`.
  * **Rule (New)**: If transitioning to `active`, the existing `expired_date` (if any) must not be in the past.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "announceId": "2bf5df79-7a5d-4f10-91a5-e3d8393e1b74",
    "createdAt": "2026-07-31T09:42:53.000Z",
    "expiredDate": "2026-08-20",
    "title": "Updated: New Features Rolled Out",
    "content": "We have updated our library systems with new features.",
    "status": "active"
  },
  "message": "Announcement status updated successfully."
}
```
