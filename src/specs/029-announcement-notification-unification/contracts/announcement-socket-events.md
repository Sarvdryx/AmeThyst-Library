# Socket.IO Event Contract: Announcement & Notification Events

This document details the Socket.IO event structures, payload payloads, and client handling procedures.

---

## 1. Channels & Events Summary

| Channel | Emit Direction | Authentication Required | Description |
|---|---|---|---|
| `'announcement:changed'` | Server → Client (Broadcast) | No (Anonymous / Readers / Admins) | Broadcasts changes to active announcements |
| `'notification:new'` | Server → Client (Private Room) | Yes (Reader user) | Emits private Study Group lifecycle notifications |
| `'study-group:changed'` | Server → Client (Broadcast) | Yes (Reader user) | Signals group metadata updates |

---

## 2. Event Payloads

### A. Announcement Events (`'announcement:changed'`)
The backend emits this event when announcements are modified. 

#### Event Structure
```typescript
interface AnnouncementChangedPayload {
  action: 'created' | 'updated' | 'status_changed' | 'republished' | 'published' | 'deleted';
  announcement: {
    announceId: string;
    createdAt?: string;
    expiredDate?: string | null;
    title?: string;
    content?: string;
    status?: 'draft' | 'active' | 'expired';
  };
}
```

#### Payload Instances

1. **Republish Event (`action: 'republished'`)**
   * Emitted when status changes: `draft → active` or `expired → active`.
   ```json
   {
     "action": "republished",
     "announcement": {
       "announceId": "2bf5df79-7a5d-4f10-91a5-e3d8393e1b74",
       "createdAt": "2026-07-31T09:42:53.000Z",
       "expiredDate": "2026-08-20",
       "title": "New Features Rolled Out",
       "content": "We have updated our library systems.",
       "status": "active"
     }
   }
   ```
2. **Publish Event (`action: 'published'`)**
   * Emitted when a new announcement is created directly as `active`.
   ```json
   {
     "action": "published",
     "announcement": {
       "announceId": "dca87654-7a5d-4f10-91a5-e3d8393e1b99",
       "createdAt": "2026-07-31T16:49:00.000Z",
       "expiredDate": null,
       "title": "Immediate Library Closure Today",
       "content": "Due to maintenance library will close early.",
       "status": "active"
     }
   }
   ```
3. **Standard Edit (`action: 'updated'`)**
   * Emitted on detail edits when remaining in `active` state.
   ```json
   {
     "action": "updated",
     "announcement": {
       "announceId": "2bf5df79-7a5d-4f10-91a5-e3d8393e1b74",
       "createdAt": "2026-07-31T09:42:53.000Z",
       "expiredDate": "2026-08-20",
       "title": "New Features Rolled Out (Correction)",
       "content": "We have updated our library systems with new corrections.",
       "status": "active"
     }
   }
   ```

---

### B. Study Group Notifications (`'notification:new'`)
Sent to a user's private socket room (`user:${userId}`).

#### Event Payload
```json
{
  "id": "e5c7a521-1234-4bc6-bf7c-67ad5ef8c8a1",
  "type": "member_joined",
  "groupId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdAt": "2026-07-31T16:50:00.000Z",
  "memberName": "Jane Doe",
  "actor": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "username": "Jane Doe",
    "email": "jane@example.com",
    "avatar": null
  },
  "group": {
    "title": "Advanced Physics Study Group",
    "subject": "Physics",
    "currentMembers": 3,
    "capacity": 5,
    "date": "2026-08-05",
    "startTime": "14:00:00",
    "endTime": "16:00:00",
    "roomName": "Group Study Room A",
    "branchName": "Main Branch",
    "roomId": 1,
    "branchId": 101
  }
}
```

---

## 3. Client Idempotency & Cleanup

1. **Idempotency**:
   - Receipt of a `'republished'` or `'published'` event triggers removing the `announceId` from the `amethyst:announcements:seenIds:${userId}` array in `localStorage`.
     Because array filtering is idempotent, duplicate delivery does not cause duplicate indicators or multiple state modifications.
2. **Listener Registrations**:
   - All socket hooks must register listeners inside `useEffect` and return a cleanup function calling `socket.off('eventName')` to prevent memory leaks and duplicate handler execution.
   ```typescript
   useEffect(() => {
     if (!socket) return;
     socket.on('announcement:changed', handleAnnouncementChanged);
     return () => {
       socket.off('announcement:changed', handleAnnouncementChanged);
     };
   }, [socket]);
   ```
