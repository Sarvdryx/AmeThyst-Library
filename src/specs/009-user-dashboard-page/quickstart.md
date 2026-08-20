# Quickstart: User Dashboard Page Validation

## Prerequisites

- Backend server running on `http://localhost:5000`
- Frontend dev server running on `http://localhost:3000`
- PostgreSQL database seeded with test users and events
- A user account with role = `'user'` in the `users` table

## Setup Commands

```bash
# Start backend
cd server && npm start

# Start frontend (separate terminal)
cd client && npm run dev
```

## Validation Scenarios

### Scenario 1: Dashboard loads for authorized user

1. Log in with a user whose role is `'user'` via `/login`
2. Click "Dashboard" in the navbar or navigate to `/dashboard/user`
3. **Expected**: Welcome greeting with your name, calendar showing current month with today highlighted, agenda panel with events, sidebar with navigation items

### Scenario 2: Unauthenticated access blocked

1. Ensure no user is logged in (clear localStorage or use incognito)
2. Navigate directly to `/dashboard/user`
3. **Expected**: A toast notification appears: "This page requires sign in to use" — then redirected to `/login`

### Scenario 3: Wrong role blocked

1. Log in with a user whose role is `'admin'` or `'librarian'`
2. Navigate to `/dashboard/user`
3. **Expected**: A toast notification appears: "You do not have permission to access this page" — then redirected to home `/`

### Scenario 4: Calendar interactivity

1. Log in as a user
2. Navigate to dashboard
3. Click the left arrow — calendar shifts to previous month
4. Click the right arrow — calendar shifts to next month
5. Click "Week" toggle — calendar switches to week view
6. Click "Month" toggle — calendar returns to month grid view

### Scenario 5: Upcoming agenda

1. Log in as a user with upcoming events in the database
2. Navigate to dashboard
3. **Expected**: Agenda panel on the right shows events for today and tomorrow with times and locations

### Scenario 6: Add personal task

1. Log in as a user
2. Click "Add Personal Task" button in the agenda panel
3. **Expected**: A form or prompt appears to create a new personal event

## API Validation

```bash
# Get monthly events (replace with actual JWT)
curl -H "Authorization: Bearer <token>" "http://localhost:5000/dashboard/events?month=6&year=2026"

# Get today's agenda
curl -H "Authorization: Bearer <token>" "http://localhost:5000/dashboard/agenda"

# Create personal task
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Study","date":"2026-06-25","type":"personal_task"}' \
  "http://localhost:5000/dashboard/events"
```

## Related Artifacts

- [API Contract](./contracts/api-contract.md) — endpoint details
- [UI Contract](./contracts/ui-contract.md) — component structure
- [Data Model](./data-model.md) — entity definitions
