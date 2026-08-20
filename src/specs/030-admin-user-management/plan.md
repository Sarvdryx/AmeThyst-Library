# Implementation Plan: Admin User Management

**Feature Identifier**: `030-admin-user-management`

---

## Architectural Mapping & Prototype Adaptation

The future production implementation must adapt the prototype TSX (`references/user-management-prototype.tsx`) into the repository’s modular architecture, mapping components as follows:

| Prototype section | Existing component/layout | Reuse approach | Adaptation required | Real data source |
| :--- | :--- | :--- | :--- | :--- |
| **Navbar** | `NavBar` (organisms) | Reused from layout shell. | Replaced by Next.js layout. Do not duplicate. | None (Session info). |
| **Sidebar** | `AdminDashboardSidebar` (organisms) | Reused from layout shell. | Replaced by Next.js layout. Do not duplicate. | None. |
| **Workspace** | Page container | Next.js Page router container. | Remove absolute coordinates (`h-[1463px]`, `w-[1522px]`). Replace with relative fluid width `w-full`. | None. |
| **Heading** | "User Management" text | Text element. | Bind to localization key: `t('admin.page_title')`. Add dark mode class. | Localization. |
| **KPI row** | Stat Cards wrapper | Custom container. | Convert absolute layout to CSS Grid `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`. | `/api/admin/users/stats` |
| **Toolbar** | Elevated white panel | Toolbar component | Convert absolute bounds to responsive flex wrapper `flex flex-col md:flex-row gap-4 justify-between`. | None. |
| **Search** | "Search by name..." input | Controlled `<input>` | Connect search query state. Localize placeholder key. Add debouncing (300ms) before request. | State query value. |
| **Filters** | Roles/Statuses dropdowns | Select atomic controls | Replace mock buttons with custom dropdown select controls, localize options. | Selected dropdown value. |
| **CSV button** | "Export CSV" panel | Custom Button | Triggers `/api/admin/users/export` API download query with active search/filters. | Export endpoint trigger. |
| **Table header** | Headers row | `thead` or wrapper row | Convert fixed width layout columns to percentages or use native `table`. | Localization keys. |
| **Table rows** | User list items | Array `.map()` loop | Loop over users list state. Render safe information. Handle null values with default fallback labels. | `/api/admin/users` |
| **Badges** | Role tag elements | Simple conditional badge | Apply specific color classes based on role (Admin = black, Librarian = purple, User = gray). | User `role` column. |
| **Status** | Active/Suspended dots | Status Indicator | Active shows emerald teal dot (`bg-teal-400`); Suspended shows crimson red dot (`bg-red-600`). | User `status` column. |
| **Access metadata**| Joined / Last Login text | Formatted labels | Parse timestamps to human-readable date formats. Localize labels. | User `created_at`/`last_login_at` |
| **Actions** | Eye / Swap SVGs | Action buttons | Bind click actions to trigger View Details or Management dialog modals. | Target user ID. |
| **Pagination** | Numeric page buttons | Pagination control | Dynamically render page buttons, dots, active page indicators. Trigger state page changes. | Pagination meta response. |
| **Footer** | `Footer` (organisms) | Reused from layout shell. | Replaced by Next.js layout. Do not duplicate. | None. |

---

## Implementation Phases

### Phase 1: Database Migration
1. Apply PostgreSQL migration scripts (`data-model.md`):
   - Extend `users` table with: `status`, `suspended_reason`, `last_login_at`, and `created_at` columns.
   - Set up the check constraint `chk_status`.
   - Create `admin_audit_logs` table.
   - Configure indexing on `users` (search columns) and `admin_audit_logs` (sorting column).
2. Execute data backfill scripts to set default states (`status = 'active'`) and baseline creation dates for existing users.

### Phase 2: Backend Middlewares & APIs
1. Update `auth.middleware.mjs` to retrieve account `status`. If the user is `'suspended'`, reject the request, throwing an error (`USER_SUSPENDED`).
2. Update `loginUser` service in `auth.services.mjs` to check if a user is suspended during authentication, returning an authentication error message.
3. Build the administrative router file `admin.routes.mjs` and mount it under `/api/admin` in `server.mjs`. Configure it to enforce authorization via `verifyToken` and `authorizeRole('admin')`.
4. Create the service `admin.services.mjs` and controller `admin.controllers.mjs` to support:
   - Paginated user list querying (`GET /api/admin/users`), escaping wildcard inputs.
   - Count statistics querying (`GET /api/admin/users/stats`).
   - Role updates (`PUT /api/admin/users/:userId/role`).
   - Suspension toggles (`PUT /api/admin/users/:userId/suspend` and `unsuspend`).
   - Audit logs lookup querying (`GET /api/admin/users/audit-logs`).
5. Enforce administrative invariants inside update transactions:
   - Block self-modifications by asserting `actor_id !== target_id`.
   - Check active admin count before allowing role demotion or suspension on admin accounts.
   - Write structured rows into `admin_audit_logs` for every successful mutation.
6. Build CSV export (`GET /api/admin/users/export`). Query matching list bypassing page limits, write values escaping internal quotes/commas, and prepend single quotes `'` if cell values start with `=`, `+`, `-`, or `@` to neutralize formula injection.

### Phase 3: Frontend Client Integration
1. Append the new localization keys to English and Vietnamese translation dictionaries (`en.json` and `vi.json`).
2. Add support inside `apiClient.ts` to trigger a client logout event when receiving a 401 response with error code `'USER_SUSPENDED'`.
3. In `src/client/app/dashboard/admin/page.tsx`, import standard providers and configure page states:
   - Directory users array list.
   - Pagination metadata (currentPage, totalPages).
   - Filter criteria (search, role, status).
   - Stats object (totalUsers, activeUsers, suspendedUsers, librariansCount).
   - Selected target user for detail modals.
   - Management modal states.
4. Hook up `useEffect` to fetch list data and statistics concurrently. Set up trigger dependencies to refetch data on page changes, search input, and filter modifications.

### Phase 4: UI Component Integration
1. Replace absolute/fixed coordinates from the prototype with responsive layout classes:
   - KPI Row: uses `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">`.
   - Toolbar wrapper: uses `<div className="flex flex-col md:flex-row gap-4 items-center justify-between">`.
   - Table: uses standard Next/Tailwind table layout with responsive wrapping.
2. Bind the 4 KPI card fields to retrieved stats data. Set up conditional styling highlights (red warning count on Suspended box).
3. Bind user list table rows to mapping database payload items. Set up conditional opacity rules (opacity-60 on suspended user text).
4. Implement standard atomic details modal displaying full profile history.
5. Implement role/status update modal. Validate that reason input is filled before allowing submission on account suspension. Bind confirm submit action to API handlers.
6. Hook up success feedback toasts and trigger state refetches to update dashboard counts instantly upon user updates.

### Phase 5: Verification & Testing
1. Review layout responsiveness on Desktop (1440px), Tablet (768px), and Mobile (375px) viewports.
2. Verify Light and Dark mode appearances, ensuring all labels, borders, and modal text support dark variables (`dark:text-neutral-200`, etc.).
3. Toggle translation switches and confirm all headers, dropdown values, toast text, validation errors, and modal labels translate instantly.
4. Run integration tests executing API endpoint calls directly (using mock admin tokens) to verify authorization middleware guards reject guest/user/librarian roles.
