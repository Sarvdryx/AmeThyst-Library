# Phase 0 Research: Announcement & Notification Unification

This document details findings from inspecting the baseline codebase to resolve structural, behavior, and environment states for implementing past expiry date validation, republished notification dot handling, and notification bell unification.

---

## 1. Existing `lastSeenId` Algorithm

The client-side `lastSeenId` algorithm is defined in the hook:
* File path: [`src/client/app/hooks/useAnnouncementBell.ts`](../../../src/client/app/hooks/useAnnouncementBell.ts)
* Functions:
  - `readLastSeenId(userId)`: Reads from `window.localStorage` using key `"amethyst:announcements:lastSeenId:${userId}"`.
  - `writeLastSeenId(id, userId)`: Writes the ID of the newest announcement into localStorage under key `"amethyst:announcements:lastSeenId:${userId}"`.
  - `fetchAnnouncements()`: Fetches list from `/api/announcements`. Calculates the unread status as:
    ```typescript
    const newestId = res.data[0]?.announceId ?? null;
    const lastSeenId = readLastSeenId(activeUserId);
    setHasUnread(Boolean(newestId) && newestId !== lastSeenId);
    ```
* Limitation: If an announcement is unpublished and later republished, its ID (`announceId`) remains unchanged. Since the user has already opened the bell dropdown for that ID in the past, `lastSeenId` matches the newest `announceId` immediately upon republishing. Consequently, `newestId !== lastSeenId` evaluates to `false`, and the notification dot fails to reappear.

---

## 2. Exact Behavior That Currently Clears the Dot

* File path: [`src/client/app/components/molecules/NotificationBell.tsx`](../../../src/client/app/components/molecules/NotificationBell.tsx)
* Execution path:
  1. The user clicks the button containing the bell icon, which triggers `handleToggle()`.
  2. `handleToggle()` transitions the local dropdown open state (`isOpen`) and calls `markAsSeen()`.
  3. `markAsSeen()` (defined in `useAnnouncementBell.ts` lines 116-122) fetches `announcements[0]?.announceId`.
  4. If a newest ID is present and `userId` is authenticated, it calls `writeLastSeenId(newestId, activeUserId)` to persist it in `localStorage`.
  5. It sets the local state variable `hasUnread` to `false`.
* Consequence: Opening the dropdown marks all current active announcements as seen immediately because the newest announcement's ID is stored as the last seen ID.

---

## 3. Existing Socket Payloads and Event Names

### A. Announcement Sockets
* Emitted from: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
* Event Name: `'announcement:changed'`
* Actions / Payloads:
  - **Create**: `{ action: 'created', announcement: result }`
  - **Status Change**: `{ action: 'status_changed', announcement: updated }`
  - **Edit Details**: `{ action: 'updated', announcement: updated }`
  - **Delete**: `{ action: 'deleted', announcement: { announceId } }`

### B. Study Group Sockets
* Emitted from: [`src/server/src/controllers/study-group.controllers.mjs`](../../../src/server/src/controllers/study-group.controllers.mjs)
* Event Name: `'study-group:changed'`
  - Emitted when study group status or membership changes.
  - Payload: `{ groupId, changeType }`
* Event Name: `'notification:new'`
  - Emitted when a group member receives a new system notification.
  - Payload: `StudyGroupLifecycleNotification` object.

---

## 4. How Previous Status Can Be Obtained Safely Before Update

In [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs), update operations retrieve the current row before performing modifications:
```javascript
export const updateAnnouncementStatusService = async (announceId, status) => {
  // ...
  const announcement = await getAnnouncementOrThrow(announceId);
  // ...
```
Because the existing record is loaded into memory as `announcement`, we can retrieve `announcement.status` to capture the previous status. Comparing `announcement.status` (e.g. `'draft'` or `'expired'`) with the incoming status (e.g. `'active'`) allows the backend to definitively flag if the transition represents a publish/republish event.

---

## 5. Existing Expiry Validation and Timezone Handling

* File path: [`src/server/src/services/announcement.services.mjs`](../../../src/server/src/services/announcement.services.mjs)
* Validation helper:
  ```javascript
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const validateExpiredDate = (expiredDate, isActive, errorMessage) => {
    if (expiredDate === null) return;
    // ...
    const today = getToday();
    const expiry = new Date(expiredDate);

    if (isActive && expiry < today) {
      // throw error
    }
  };
  ```
* Timezone issue: 
  - `expiredDate` is stored as a date-only column in PostgreSQL.
  - `new Date(expiredDate)` (e.g. `'2026-07-31'`) parses the string as UTC midnight: `2026-07-31T00:00:00.000Z`.
  - `getToday()` uses local server time and sets the hours to `00:00:00.000` in the server's local timezone.
  - Comparing a local time Date object and a UTC midnight Date object will yield different outcomes depending on the server's GMT offset, potentially rejecting today's date or accepting past dates near day boundaries.

---

## 6. Existing Study Group Notification Storage and Invitation Actions

* File path: [`src/client/app/components/molecules/AuthActions.tsx`](../../../src/client/app/components/molecules/AuthActions.tsx)
* **Storage Keys**:
  - System Notifications: Key `study-group-system-notifications:${userId}` holds a JSON array of up to 50 `StudyGroupLifecycleNotification` elements. Individually read state is tracked by a `read` boolean attribute on each object.
  - Invitations: Key `study-group-invitation-read:${userId}` holds a JSON array of `requestId` strings that have been viewed by the user.
* **Invitation Actions**:
  - Accept: `acceptStudyGroupInvitation(groupId, requestId)` -> posts to `/api/study-groups/:groupId/invitations/:requestId/accept`.
  - Decline: `denyStudyGroupInvitation(groupId, requestId)` -> posts to `/api/study-groups/:groupId/invitations/:requestId/deny`.
  - On decision success, the item is removed from state, `AuthActions` is closed, and the client redirects.

---

## 7. Which Component Currently Renders Each Bell

1. **Admin/Librarian Navbar Bell**:
   - Renders directly in [`src/client/app/components/organisms/NavBar.tsx`](../../../src/client/app/components/organisms/NavBar.tsx) (lines 80-107) under the admin variant.
   - Code: `<NotificationBell enabled={!!user} locale={locale} t={t} userId={user?.userId} />`
2. **User Navbar Bells (Double Bells)**:
   - Renders in `NavBar.tsx` (lines 137-140) under the default user variant by embedding `<AuthActions />`.
   - Inside [`src/client/app/components/molecules/AuthActions.tsx`](../../../src/client/app/components/molecules/AuthActions.tsx) (lines 304-309):
     - Renders Announcement bell: `<NotificationBell enabled={true} locale={locale} t={t} userId={user?.userId} />`
     - Renders Study Group bell: A custom `<button>` with a bell SVG which controls dropdown visibility and shows a red circle count badge containing:
       ```typescript
       const unreadCount = invitations.filter((item) => !readInvitationIds.includes(item.requestId)).length
         + systemNotifications.filter((item) => !item.read).length;
       ```
* Consolidation Target: Remove the custom `<button>` and dropdown rendering in `AuthActions.tsx` and integrate the study group notification collection and event listeners directly into the `NotificationBell` component/hook so that only one unified bell is rendered.

---

## 8. Socket Cleanup and Reconnect Behavior

* **Announcement Bell Hook**:
  - In `useAnnouncementBell.ts`, subscription is managed within `useEffect`:
    ```typescript
    socket.on('announcement:changed', handleAnnouncementChanged);
    return () => {
      socket.off('announcement:changed', handleAnnouncementChanged);
    };
    ```
* **Study Group Listener**:
  - In `AuthActions.tsx`, subscriptions for `'study-group:changed'` and `'notification:new'` are registered when `socket` becomes available and are successfully cleaned up in the `useEffect` unmount callback using `socket.off()`.
* **Reconnection**:
  - Socket.IO client automatically handles buffer emissions and reconnections. The cleanups prevent event handler accumulation during component re-renders or hot module replacement.

---

## 9. Whether Notification Arrays Already Share Compatible Timestamp Fields

* Announcements: uses `createdAt` (ISO string from Postgres timestamp, e.g. `"2026-07-31T09:42:53.000Z"`).
* Study Group Invitations: uses `invitedAt` (ISO string, e.g. `"2026-07-31T09:42:53.000Z"`).
* Study Group System Notifications: uses `createdAt` (ISO string, e.g. `"2026-07-31T09:42:53.000Z"`).
* Sort capability: Yes, since all timestamps are valid ISO 8601 strings, they are lexicographically sortable in descending order or can be parsed directly using `new Date(timestamp).getTime()`.

---

## 10. Any Effect of Uncommitted Prototype Changes

* Verification: Run `git status` which returned:
  ```text
  On branch dev
  Your branch is up to date with 'origin/dev'.
  Untracked files:
    src/specs.zip
    src/specs/029-announcement-notification-unification/
  nothing added to commit but untracked files present
  ```
* Finding: There are zero uncommitted working-tree changes affecting the backend or frontend source directories. We are operating on a clean commit baseline.
