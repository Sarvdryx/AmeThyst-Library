# Quickstart Validation: Real-Time Librarian Room Management Dashboard

**Feature**: Real-Time Librarian Room Management Dashboard
**Date**: 2026-08-01

End-to-end validation guide. Implementation details live in the [plan](plan.md) and [tasks](../tasks.md); API shapes are in [contracts/room-management-dashboard-api.md](contracts/room-management-dashboard-api.md); data semantics are in [data-model.md](data-model.md).

---

## Prerequisites

- Local PostgreSQL running with the `database/init_db/postgres/*.sql` schema and seed data (branch 1 and branch 2 both have rooms; librarian users exist with `branch_id = 1` and `branch_id = 2`).
- Backend (`server/`) running on `http://localhost:5000` (env: `PORT=5000`, `DATABASE_URL`/`DB_*`).
- Frontend (`client/`) running on `http://localhost:3000` with `NEXT_PUBLIC_API_URL=http://localhost:5000`.
- Logged in as a librarian (e.g., a user with `role = 'librarian'`).

---

## Scenario 1: Branch-Isolated Overview

1. Log in as the branch-1 librarian.
2. Open the Room Management Dashboard (`/dashboard/librarian/rooms`).
3. Verify the three cards render: **Total Bookings (Today)**, **Currently Occupied (X/Y)**, **Pending Check-ins**.
4. Repeat as the branch-2 librarian.
5. **Expected**: Each librarian sees only their own branch's numbers; a reservation created in branch 2 never changes branch 1's counts.

**Verifies**: FR-001 (branch isolation), FR-002..004 (overview counts), SC-002.

---

## Scenario 2: Search, Filter, and Paginate Active Reservations

1. On the dashboard, enter a partial user name, user ID, or room number in the search box.
2. Change the status filter (e.g., `confirmed`, `pending_checkin`, `in_progress`, `completed`) and a date range.
3. Navigate the pagination when the list exceeds one page.
4. **Expected**: The list narrows per search/filters; pagination controls move forward, backward, and to a specific page; the current page indicator matches the API `pagination` object.

**Verifies**: FR-005..009, SC-003.

---

## Scenario 3: Calendar Week/Day Schedule

1. Switch the dashboard to calendar view (default `week`).
2. Confirm rooms appear as rows, days as columns, and reservations as time-positioned blocks on the correct room/day.
3. Toggle to `day` view and back.
4. **Expected**: Blocks land on the correct room row and time; toggling re-renders without data loss; both views match the `/rooms/schedule` payload.

**Verifies**: FR-010..011, SC-006.

---

## Scenario 4: Read-Only Detail (No Mutations)

1. Open a reservation row's detail (view action).
2. **Expected**: Full reservation info is shown (room, user, times, status, check-in/out). Confirm there is **no** edit, cancel, or delete control anywhere on the page.

**Verifies**: FR-012..013.

---

## Scenario 5: Live Push Updates (Real-Time)

1. Keep the dashboard open in the branch-1 librarian browser.
2. In a second browser, as a user of branch 1: create a room reservation, then cancel it; generate a PIN on an upcoming reservation.
3. As the branch-1 librarian, verify a PIN via the existing check-in flow, then have the user confirm check-out.
4. **Expected**: Within ~5 seconds of each action, the open dashboard's overview counts and list update **without** a manual refresh. The branch-2 librarian's open dashboard does **not** update for branch-1 actions.

**Verifies**: FR-014, SC-004, SC-002 (isolation).

---

## Quick Backend Smoke Test

```bash
# from server/
# Overview (requires a librarian token)
curl -H "Authorization: Bearer $LIB1_TOKEN" http://localhost:5000/dashboard/librarian/rooms/overview

# Active reservations, filtered
curl -H "Authorization: Bearer $LIB1_TOKEN" "http://localhost:5000/dashboard/librarian/rooms/reservations?status=pending&page=1&limit=10"

# Calendar week
curl -H "Authorization: Bearer $LIB1_TOKEN" "http://localhost:5000/dashboard/librarian/rooms/schedule?from=2026-07-28&to=2026-08-03&view=week"

# Detail
curl -H "Authorization: Bearer $LIB1_TOKEN" http://localhost:5000/dashboard/librarian/rooms/reservations/8c2a1b3f-0000-0000-0000-000000000000
```

Each response must use the unified envelope `{ success, data, message }` and never include rows from another branch.
