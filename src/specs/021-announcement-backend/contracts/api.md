# API Interface Contracts: Announcements

This document outlines the API contracts for the Announcement Management endpoints, detailing paths, HTTP methods, headers, payloads, and response formats.

All responses adhere strictly to the LIMA response envelope structure.

---

## 1. Public Endpoint

### `GET /api/announcements`
Retrieves a list of all currently active and non-expired announcements. Accessible to anyone (guests and registered users).

* **Headers**: None required.
* **Query Parameters**: None.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "announceId": "d3b07384-d113-4c9f-b7a4-7a329d66504a",
        "title": "Summer Library Hours",
        "content": "From June to August, the library will open from 8:00 AM to 9:00 PM.",
        "createdAt": "2026-07-01T08:00:00.000Z",
        "expiredDate": "2026-08-31"
      }
    ],
    "message": "Active announcements retrieved successfully"
  }
  ```

---

## 2. Librarian Management Endpoints

All management endpoints require librarian or admin authentication tokens.

### `POST /dashboard/librarian/announcements`
Creates a new announcement in the database. Defaults to `draft` status.

* **Headers**: 
  * `Authorization`: `Bearer <JWT_TOKEN>`
* **Request Body**:
  ```json
  {
    "title": "LIMA System Maintenance",
    "content": "The system will be offline for 2 hours on Friday at midnight.",
    "expired_date": "2026-07-15"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "announceId": "f78d910a-313d-44aa-b778-9cc009efb456",
      "title": "LIMA System Maintenance",
      "content": "The system will be offline for 2 hours on Friday at midnight.",
      "expiredDate": "2026-07-15",
      "status": "draft",
      "createdAt": "2026-07-09T15:20:00.000Z"
    },
    "message": "Announcement created successfully"
  }
  ```

### `GET /dashboard/librarian/announcements`
Lists all announcements (active, draft, expired) with pagination and optional filtering by status.

* **Headers**:
  * `Authorization`: `Bearer <JWT_TOKEN>`
* **Query Parameters**:
  * `page` (optional): Integer (default `1`)
  * `limit` (optional): Integer (default `10`)
  * `status` (optional): String (`'draft' | 'active' | 'expired'`)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "announcements": [
        {
          "announceId": "f78d910a-313d-44aa-b778-9cc009efb456",
          "title": "LIMA System Maintenance",
          "content": "...",
          "status": "draft",
          "createdAt": "2026-07-09T15:20:00.000Z",
          "expiredDate": "2026-07-15"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    },
    "message": "Announcements retrieved successfully"
  }
  ```

### `PUT /dashboard/librarian/announcements/:id`
Updates the details (title, content, expiration date) of an existing announcement.

* **Headers**:
  * `Authorization`: `Bearer <JWT_TOKEN>`
* **Request Body**:
  ```json
  {
    "title": "Updated LIMA System Maintenance Notice",
    "content": "The system will be offline for 3 hours (extended) on Friday.",
    "expired_date": "2026-07-16"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "announceId": "f78d910a-313d-44aa-b778-9cc009efb456",
      "title": "Updated LIMA System Maintenance Notice",
      "content": "The system will be offline for 3 hours (extended) on Friday.",
      "expiredDate": "2026-07-16",
      "status": "draft",
      "createdAt": "2026-07-09T15:20:00.000Z"
    },
    "message": "Announcement updated successfully"
  }
  ```

### `PATCH /dashboard/librarian/announcements/:id/status`
Updates the status of an announcement (e.g. publishing a draft, unpublishing an active one).

* **Headers**:
  * `Authorization`: `Bearer <JWT_TOKEN>`
* **Request Body**:
  ```json
  {
    "status": "active"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "announceId": "f78d910a-313d-44aa-b778-9cc009efb456",
      "status": "active"
    },
    "message": "Announcement status updated to active successfully"
  }
  ```

### `DELETE /dashboard/librarian/announcements/:id`
Permanently deletes an announcement.

* **Headers**:
  * `Authorization`: `Bearer <JWT_TOKEN>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "Announcement deleted successfully"
  }
  ```

---

## 3. Error Responses

Common error envelopes returned by these endpoints:

### `400 Bad Request`
When title/content is missing, or the expiry date is in the past during publication:
```json
{
  "success": false,
  "data": null,
  "message": "Title and content are required fields."
}
```

### `401 Unauthorized`
When no JWT token is supplied or the token is invalid/expired:
```json
{
  "success": false,
  "data": null,
  "message": "Access denied. No token provided."
}
```

### `403 Forbidden`
When the authenticated user does not have the `librarian` or `admin` role:
```json
{
  "success": false,
  "data": null,
  "message": "Access denied. Unauthorized role."
}
```

### `404 Not Found`
When editing, deleting, or updating status of an announcement ID that does not exist:
```json
{
  "success": false,
  "data": null,
  "message": "Announcement not found."
}
```
