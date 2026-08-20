# Quickstart Validation Guide: Announcement Management Backend

This document details the step-by-step instructions to run, validate, and verify the Announcement Management backend functionality.

## 1. Setup and Migration

Before running the server, apply the database migration.

### Database Setup
Run the migration query located in `src/database/init_db/postgres/07_announcement_alter.sql` against the database container:
```bash
docker exec -i library_postgres psql -U lib_admin -d postgres < src/database/init_db/postgres/07_announcement_alter.sql
```

Verify that the column was successfully added:
```bash
docker exec -it library_postgres psql -U lib_admin -d postgres -c "\d announcements"
```

---

## 2. Running Service Unit Tests

Run the newly created unit tests to ensure services and models behave as expected:
```bash
cd src/server
npm run test tests/services/announcement.service.spec.mjs
```

---

## 3. End-to-End API Validation Scenarios

You can run these curl commands to test the backend endpoints. Make sure the backend server is running on `http://localhost:5000`.

### Step 1: Login as a Librarian to obtain a JWT Token
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "librarian1.library@gmail.com", "password": "librarian1_password"}'
```
*Note the returned JWT token in the response and export it:*
```bash
export LIBRARIAN_TOKEN="<JWT_TOKEN_FROM_RESPONSE>"
```

### Step 2: Create a New Announcement (Draft)
```bash
curl -X POST http://localhost:5000/dashboard/librarian/announcements \
  -H "Authorization: Bearer $LIBRARIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "LIMA Grand Opening", "content": "Welcome to the new digital LIMA library system!", "expired_date": "2026-12-31"}'
```
*Note the returned `announceId` from the response (e.g. `abc-123`):*
```bash
export ANNOUNCE_ID="<announceId>"
```

### Step 3: View Announcements in Management (Drafts and Active)
```bash
curl -X GET "http://localhost:5000/dashboard/librarian/announcements?page=1&limit=5" \
  -H "Authorization: Bearer $LIBRARIAN_TOKEN"
```

### Step 4: Verify the Public Endpoint DOES NOT Return Drafts
```bash
curl -X GET http://localhost:5000/api/announcements
```
*Expected: The draft announcement created in Step 2 is not present in the returned list.*

### Step 5: Publish the Announcement (Draft -> Active)
```bash
curl -X PATCH "http://localhost:5000/dashboard/librarian/announcements/$ANNOUNCE_ID/status" \
  -H "Authorization: Bearer $LIBRARIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### Step 6: Verify the Public Endpoint DOES Return the Published Announcement
```bash
curl -X GET http://localhost:5000/api/announcements
```
*Expected: The announcement is now returned in the active announcements list.*

### Step 7: Edit the Announcement Title and Content
```bash
curl -X PUT "http://localhost:5000/dashboard/librarian/announcements/$ANNOUNCE_ID" \
  -H "Authorization: Bearer $LIBRARIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "LIMA Grand Opening (Updated)", "content": "Welcome! Free membership registrations are open.", "expired_date": "2026-12-31"}'
```

### Step 8: Delete the Announcement
```bash
curl -X DELETE "http://localhost:5000/dashboard/librarian/announcements/$ANNOUNCE_ID" \
  -H "Authorization: Bearer $LIBRARIAN_TOKEN"
```
