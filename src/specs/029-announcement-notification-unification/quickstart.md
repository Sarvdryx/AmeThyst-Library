# Phase 1 Quickstart Guide: Verification Procedures

This guide details steps to manually verify the features and run automated tests.

---

## 1. Local Testing Setup

Follow standard project setup guidelines:
1. Ensure the PostgreSQL database container is running:
   ```bash
   cd src/database
   docker-compose up -d
   ```
2. Start the Backend server (listening on port `5000`):
   ```bash
   cd src/server
   npm run dev
   ```
3. Start the Frontend client (listening on port `3000`):
   ```bash
   cd src/client
   npm run dev
   ```
4. Access the web interface at `http://localhost:3000`.

---

## 2. Manual Validation Scenarios

### Scenario A: Expiry Date Validation
1. **Past Date Rejection**:
   - Log in as a librarian/admin. Navigate to the Announcements Panel.
   - Click "Create New" or edit an existing announcement.
   - Select an `expired_date` corresponding to yesterday or earlier.
   - Click "Save Draft" or "Publish Now".
   - **Expected**: Frontend validation displays an error toast, form submission is blocked. A direct API POST to `/dashboard/librarian/announcements` with a past expiry date must return `400 Bad Request` with `{ "success": false, "message": "Cannot set status to active with an expiration date in the past." }` (or draft equivalent).
2. **Today / Null Expiry Acceptance**:
   - Set the expiry date to today's date and click "Save Draft". **Expected**: Success.
   - Clear the expiry date (null) and click "Publish Now". **Expected**: Success.

### Scenario B: Republish Notification Dot Reappearance
1. **Initial View**:
   - Open a client browser as a regular user. Let the newest announcement load. Click the notification bell dropdown. The dot disappears.
2. **Unpublish**:
   - In another browser tab (logged in as librarian), edit that same announcement and click "Unpublish" (changing status to `DRAFT`).
3. **Republish & Dot Reappearance**:
   - Change status of the announcement back to `ACTIVE` (republish).
   - **Expected**: Backend broadcasts `'announcement:changed'` event with `action: 'republished'`. The reader's browser immediately registers the event and displays the unread dot.
4. **Reload Check (Before Open)**:
    - **Expected**: The dot remains visible because the `announceId` has been removed from `seenIds` in `localStorage` upon receiving the event.
5. **Mark Seen Check (After Open)**:
   - Click the bell dropdown.
   - **Expected**: The dot disappears.
   - Refresh the page.
   - **Expected**: The dot remains hidden.
6. **Integrity Checks**:
   - Verify in the database that `announce_id` and `created_at` for the republished announcement are identical to their values before republishing.

### Scenario C: Unified Notification Bell & Role Behavior
1. **Single Bell Render**:
   - Log in as a regular user. Inspect the navbar header.
   - **Expected**: Exactly one bell is visible. The secondary invitation/system bell next to the profile initials has been removed.
2. **Combined List**:
   - Make sure the user has 1 unread announcement and 1 unread study group invitation.
   - **Expected**: The notification dot is active. The badge display count equals `2`.
   - Open the dropdown. The list displays the announcement and study group invitation sorted chronologically by timestamp (newest first).
3. **Interacting with Invitations**:
   - Click the study group invitation in the dropdown.
   - **Expected**: Open the invitation dialog detailing the request.
   - Click "Accept".
   - **Expected**: User is added to the group and redirected, and the notification is cleared from the list.
4. **Role Isolation**:
   - Log out and log in as an administrator/librarian.
   - **Expected**: Exactly one bell is visible. The dropdown ONLY queries and displays announcements. Inspect the browser console network tab: no requests to `/api/study-groups/invitations` are made.

---

## 3. Automated Test Commands

All test runs must occur within the backend directory:
```bash
cd src/server
```

1. **Run the full test suite**:
   ```bash
   npm test
   ```
2. **Run tests matching specific tags (e.g. for this feature)**:
   ```bash
   npm run test:auth:tag -- "@A_R1"
   ```
3. **Verify specific test projects**:
   ```bash
   npm run test:auth:register
   ```
