# Interface Contract: Notifications

## 1. Inbox Retrieval API
**Endpoint**: `GET /api/notifications`  
**Auth**: Required (Bearer Token)  
**Behavior**: Returns all notifications for the authenticated user in one response.

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "unread_count": 5,
    "notifications": [
      {
        "notification_id": "uuid",
        "category": "STUDY_GROUP_INVITE",
        "source_ref_id": "invite-req-123",
        "payload": {
          "title": "Math Study Group",
          "actor": "user_id_456"
        },
        "is_read": false,
        "created_at": "2026-08-17T12:00:00Z"
      }
    ]
  }
}
```

## 2. Mark as Read API
**Endpoint**: `PATCH /api/notifications/:id/read`  
**Auth**: Required  
**Response 200 OK**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**Endpoint**: `PATCH /api/notifications/read-all`  
**Auth**: Required  
**Response 200 OK**:
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

## 3. Realtime Synchronization
- **Event Name**: `notification:new`
  - Emitted when a new notification is inserted.
  - Payload: The complete notification object.
- **Event Name**: `notification:read`
  - Emitted when a notification is marked read (either this exact device did it, or another device did).
  - Payload: `{ "notification_id": "uuid" }` or `{ "all": true }`

## 4. Local State Migration (Client-Side)
- The client reads any leftover legacy notifications from `localStorage`.
- It POSTs the known `source_ref_id`s to a server migration endpoint (e.g., `POST /api/notifications/migrate-local-read`).
- The server cryptographically or structurally verifies those IDs (e.g., checking if the announcement exists).
- If valid, the server updates the persistent `notifications` table `is_read = true` for those specific records.
- The client then permanently clears the `localStorage` key.
