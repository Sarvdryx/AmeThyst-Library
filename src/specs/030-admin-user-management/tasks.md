# Tasks: Admin User Management

**Input**: Feature specifications from `src/specs/030-admin-user-management/spec.md`, `plan.md`, `research.md`, and `data-model.md`.

**Prerequisites**: Core database migration script completed and backend servers running.

---

## Path Conventions
- **Backend Routing & Config**: `src/server/src/routes/`, `src/server/src/server.mjs`
- **Backend Middlewares**: `src/server/src/middlewares/`
- **Backend Business Logic**: `src/server/src/controllers/`, `src/server/src/services/`, `src/server/src/models/`
- **Frontend Pages & Components**: `src/client/app/dashboard/admin/`
- **Frontend Core Utils**: `src/client/app/utils/`
- **Localization Files**: `src/client/app/locales/`

---

## Task Counts and User-Story Coverage

- **Total Tasks**: 27
- **User-Story Coverage**:
  - **US1 (Administrative User Directory & Stats)**: T001, T002, T003, T008, T009, T010, T014, T015, T016, T017, T020, T021, T022, T023.
  - **US2 (Advanced Search & Filters)**: T010, T015, T016, T017, T020.
  - **US3 (Role & Suspension Mutations)**: T001, T002, T005, T006, T007, T011, T012, T013, T018, T019, T020, T021.
  - **US4 (Complete Filtered CSV Export)**: T010, T015, T016, T022.
  - **US5 (Mutations Audit Logs)**: T001, T002, T011, T012, T013, T021, T024.

---

## Phase 1: Documentation and Baseline Gates

**Purpose**: Verification of prerequisites and environment alignment.

- [x] T001 Verify baseline structure of existing user profile files: `src/server/src/models/user.models.mjs`, `src/server/src/controllers/user.controllers.mjs`, `src/server/src/middlewares/auth.middleware.mjs`. Ensure understanding of SQL model field mapping conventions and JWT token verification before modifications.
  - *Completion Criteria*: Core imports/exports, model update methods, and session checks mapped out.
  - *Dependency*: None.
- [x] T002 Verify baseline dashboard layouts: `src/client/app/dashboard/admin/layout.tsx` and `src/client/app/components/organisms/AdminDashboardSidebar.tsx`.
  - *Completion Criteria*: Confirm layouts successfully load and render standard navigation/sidebar headers.
  - *Dependency*: None.

---

## Phase 2: Database Migration and Audit Foundation

**Purpose**: Construct database columns, indices, and audit table schemas.

- [x] T003 [P] Create migration script file `src/database/migrations/030_admin_user_management.sql` executing table modifications:
  - Add status tracking column: `status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'))`.
  - Add suspension reason column: `suspended_reason TEXT DEFAULT NULL`.
  - Add activity timestamps: `last_login_at TIMESTAMP DEFAULT NULL`, `created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`.
  - Create index on user filter fields: `CREATE INDEX idx_users_role_status ON public.users(role, status)`.
  - Create indexes on username and email in lower-case for fast search: `LOWER(username)`, `LOWER(email)`.
  - *Completion Criteria*: DDL executes without errors on the target database, and test schema shows columns added.
  - *Dependency*: T001.
- [x] T004 [P] Create migration script segment inside `030_admin_user_management.sql` creating the audit logs table:
  - Table name: `admin_audit_logs`.
  - Fields: `log_id` (primary key UUID), `actor_id` (not null UUID), `target_id` (not null UUID), `action` (VARCHAR(50) not null), `prev_value` (TEXT), `new_value` (TEXT), `reason` (TEXT), `created_at` (TIMESTAMP default now).
  - Foreign keys: `actor_id` references `users.user_id` on restrict, `target_id` references `users.user_id` on restrict.
  - *Completion Criteria*: Audit table compiles in database schema, and lookup constraints prevent row cascading delete.
  - *Dependency*: T003.
- [x] T005 [P] Implement database data backfill queries inside `030_admin_user_management.sql`:
  - Set all null user states to `'active'`.
  - Seed default historical timestamps to `created_at` for legacy users.
  - *Completion Criteria*: Legacy database rows have status values filled.
  - *Dependency*: T004.

---

## Phase 3: Backend Domain/Authentication Foundation

**Purpose**: Guard security endpoints against unauthorized guests and suspended user sessions.

- [x] T006 [P] Update authentication helper middleware `src/server/src/middlewares/auth.middleware.mjs`:
  - Modify database user check query inside `authenticate()` helper function to select `status` column.
  - Add status verification rule: if `user.status === 'suspended'`, immediately reject verification by throwing a custom error (`USER_SUSPENDED`).
  - Update `verifyToken` middleware route response handler to catch `'USER_SUSPENDED'`, returning a `401 Unauthorized` with JSON error payload `{ "success": false, "error": { "code": "USER_SUSPENDED", "message": "Your account has been suspended." } }`.
  - *Completion Criteria*: Token validation immediately fails for users with `'suspended'` status, preventing access with old tokens.
  - *Dependency*: T005.
- [x] T007 [P] Update local credentials login logic in `loginUser` service inside `src/server/src/services/auth.services.mjs`:
  - Add query check verifying that target logging-in user possesses `status !== 'suspended'`. If suspended, throw a descriptive error message.
  - *Completion Criteria*: User login attempts fail with clear suspension alert feedback when status is `'suspended'`.
  - *Dependency*: T006.

---

## Phase 4: Statistics/List/Details/Export APIs

**Purpose**: Implement retrieval endpoints.

- [x] T008 [P] Implement administrative user directory queries in `src/server/src/models/user.models.mjs` (or in a new `admin.models.mjs` if created):
  - Paginated user list: returns list matching text wildcard searches (safe parameterized parameters matching `username` and `email` case-insensitively) and filter fields (`role`, `status`), with pagination mapping parameters (`limit` and `offset`).
  - Administrative statistics counts: queries total users, active users, suspended users, and librarians counts.
  - Single user query: returns user details including `suspended_reason` if suspended.
  - *Completion Criteria*: Database queries execute and map database columns to camelCase payload properties.
  - *Dependency*: T005.
- [x] T009 Create service functions `src/server/src/services/admin.services.mjs`:
  - Implement `getUsersListService` calling user list queries.
  - Implement `getUsersStatsService` calling stats count queries.
  - Implement `getUserDetailsService` calling details query.
  - *Completion Criteria*: Clean separation of database logic from controllers, handling empty state bounds.
  - *Dependency*: T008.
- [x] T010 Create controller functions `src/server/src/controllers/admin.controllers.mjs`:
  - Implement `getUsersList` handler mapping req queries to service, returning standardized success JSON payloads.
  - Implement `getUsersStats` handler returning standard success count statistics.
  - Implement `getUserDetails` handler validating UUID parameters, returning details or 404.
  - *Completion Criteria*: Clean controller handling with proper parameter sanitization.
  - *Dependency*: T009.
- [x] T011 Create CSV Export service in `src/server/src/services/admin.services.mjs` and controller in `src/server/src/controllers/admin.controllers.mjs`:
  - Query all matching users (ignoring pagination limits).
  - Format output columns safely escaping commas, double quotes, and line breaks.
  - Prepend a single quote `'` to any values starting with `=`, `+`, `-`, or `@` to prevent CSV formula injection.
  - Stream response output as a UTF-8 attachment using correct response header configurations.
  - *Completion Criteria*: Request returns a downloadable CSV document with escaped cells.
  - *Dependency*: T010.

---

## Phase 5: Role/Suspend/Unsuspend APIs

**Purpose**: Create administrative mutation routes.

- [x] T012 Implement update mutations in services `src/server/src/services/admin.services.mjs`:
  - `updateUserRoleService`: Changes role column.
  - `suspendUserService`: Changes status to `'suspended'`, records `suspended_reason`.
  - `unsuspendUserService`: Changes status to `'active'`, clears `suspended_reason`.
  - *Completion Criteria*: Database mutations execute successfully.
  - *Dependency*: T009.
- [x] T013 Implement mutation protections, validation rules, and logging handlers inside controllers `src/server/src/controllers/admin.controllers.mjs`:
  - Enforce self-mutation restriction check: return `400 Bad Request` if `req.user.userId === targetUserId`.
  - Enforce final active admin checks: query count of active admins before demoting or suspending an admin. If count is 1, reject with `400 Bad Request`.
  - Validate that `reason` body parameter is non-empty on suspensions.
  - Wrap database updates and `admin_audit_logs` inserts in database transactions.
  - *Completion Criteria*: Safe changes processed, blocking illegal updates and writing audit log records.
  - *Dependency*: T012.
- [x] T014 Create routing configuration `src/server/src/routes/admin.routes.mjs` mounting routes:
  - `GET /api/admin/users` (verify token + authorize admin)
  - `GET /api/admin/users/stats` (verify token + authorize admin)
  - `GET /api/admin/users/:userId` (verify token + authorize admin)
  - `PUT /api/admin/users/:userId/role` (verify token + authorize admin)
  - `PUT /api/admin/users/:userId/suspend` (verify token + authorize admin)
  - `PUT /api/admin/users/:userId/unsuspend` (verify token + authorize admin)
  - `GET /api/admin/users/export` (verify token + authorize admin)
  - Mount routing file on `/api/admin` inside `src/server/src/server.mjs`.
  - *Completion Criteria*: Server boots up, and endpoints are bound under authentication guards.
  - *Dependency*: T011, T013.

---

## Phase 6: Prototype TSX UI Integration

**Purpose**: Port visual structure from prototype reference to production dashboard directory.

- [x] T015 Reconstruct visual workspace heading, page outline, and layout integration inside `/dashboard/admin/page.tsx`:
  - *Prototype section*: Main background wrapper, "User Management" heading.
  - *Destination file*: `src/client/app/dashboard/admin/page.tsx`
  - *Existing component reused*: Adapt layout wrapper inside layout schema.
  - *Styling retained*: Beige background `#F8EFE6` theme colors.
  - *Mock data replaced*: Static headings replaced with dynamic i18n text hooks.
  - *Visual acceptance criteria*: Content displays with beige canvas background wrapped under Admin header/sidebar layout panels.
  - *Dependency*: T002, T014.
- [x] T016 Port KPI Row layouts:
  - *Prototype section*: Four KPI metrics cards (Total Users, Active, Suspended, Librarians).
  - *Destination file*: `src/client/app/dashboard/admin/page.tsx`
  - *Existing component reused*: SVG graphics, count labels.
  - *Styling retained*: Red warning highlights for suspended user counts, progress bar ratios for active users.
  - *Mock data replaced*: Hardcoded counts replaced with state counts updated dynamically.
  - *Visual acceptance criteria*: Grid layout adapts to viewports (4-columns on desktop, 2-columns on tablet, stacked on mobile).
  - *Dependency*: T015.
- [x] T017 Port Filters and Search Toolbar:
  - *Prototype section*: Search box filter dropdowns and outlined CSV Export button.
  - *Destination file*: `src/client/app/dashboard/admin/page.tsx`
  - *Existing component reused*: SVGs, double borders outline CSV export styles.
  - *Styling retained*: Elevated toolbar card shadow `shadow-[04px4px0rgba(0,0,0,0.25)]`.
  - *Mock data replaced*: Autocomplete fields, dropdown lists mapped.
  - *Visual acceptance criteria*: Inline search icon fits inside input block, dropdown chevrons align.
  - *Dependency*: T016.
- [x] T018 Port Bordered User Table:
  - *Prototype section*: Main user data table.
  - *Destination file*: `src/client/app/dashboard/admin/page.tsx`
  - *Existing component reused*: Action triggers, circular images frame.
  - *Styling retained*: Outlined black borders, cream header rows, specific colors for role badges, 60% opacity reduction on suspended columns.
  - *Mock data replaced*: Mapped user objects.
  - *Visual acceptance criteria*: Table displays safe detail keys, rendering status light indicators correctly.
  - *Dependency*: T017.
- [x] T019 Port Pagination Controls:
  - *Prototype section*: Page selection numeric button blocks.
  - *Destination file*: `src/client/app/dashboard/admin/page.tsx`
  - *Existing component reused*: Next/Prev arrow SVGs.
  - *Styling retained*: Highlighted black block for active page button index.
  - *Mock data replaced*: Dynamic page count array based on query meta limits.
  - *Visual acceptance criteria*: Controls align horizontally on bottom right.
  - *Dependency*: T018.

---

## Phase 7: Frontend API Integration

**Purpose**: Wire page states to backend REST services.

- [x] T020 Integrate `apiFetch` calls inside `/dashboard/admin/page.tsx`:
  - Connect text search query state (debounced at 300ms) to search parameters.
  - Connect dropdown value states to filter parameters.
  - Query stats and list endpoints concurrently, displaying loading indicator states on request start.
  - Bind "Export CSV" click action to fetch spreadsheet stream.
  - *Completion Criteria*: Changing filters immediately refetches data and resets active page to 1.
  - *Dependency*: T019.
- [x] T021 Update local storage auth invalidation helper inside `src/client/app/utils/apiClient.ts`:
  - Add logic: if API request gets a `401 Unauthorized` with code `'USER_SUSPENDED'`, clear `'token'` and `'user'` from local storage and dispatch the `'user-updated'` event with a null payload.
  - *Completion Criteria*: Suspended users are immediately logged out on subsequent fetch calls.
  - *Dependency*: T006, T020.

---

## Phase 8: Admin Dialogs and Actions

**Purpose**: Build view details and management action modals.

- [x] T022 Implement "View Details" dialog modal:
  - Clicking eye icon inside a row opens the modal.
  - Display user information (joined date, last login timestamp, full contact, bio description, and suspension reason if suspended).
  - *Completion Criteria*: Safe full metadata renders cleanly inside details dialog.
  - *Dependency*: T020.
- [x] T023 Implement "Role & Status Management" dialog modal:
  - Clicking edit swap icon inside row opens the modal.
  - Contains role picker dropdown and status toggle select.
  - Shows mandatory "Suspension Reason" textbox when status is set to `'suspended'`.
  - Submits updates to backend endpoints. Shows success toasts and refetches table rows + statistics counts on successful changes.
  - *Completion Criteria*: Modal mutation updates database and updates dashboard counts.
  - *Dependency*: T022.

---

## Phase 9: Localization, Dark Theme, & Accessibility Polishing

**Purpose**: Standard compliance updates.

- [x] T024 [P] Update translation dictionary files:
  - Add keys listed in specification dictionary to `src/client/app/locales/en.json`.
  - Add keys to `src/client/app/locales/vi.json`.
  - Bind all hardcoded text strings in `/dashboard/admin/page.tsx` and admin dialogs to translation hooks.
  - *Completion Criteria*: All page typography translates when language selection changes.
  - *Dependency*: T020.
- [x] T025 [P] Finalize Dark Mode and Accessibility support:
  - Apply dark mode background and border classes (`dark:bg-slate-900`, `dark:border-neutral-700`).
  - Add `aria-label` properties to icons, inputs, and pagination buttons. Ensure modal focus is managed.
  - *Completion Criteria*: Screen reads correctly and page colors adapt to theme shifts.
  - *Dependency*: T023.

---

## Phase 10: Integration, Regression, & Security Tests

**Purpose**: Audit backend routes security and validation rules.

- [x] T026 Build integration test suite verifying backend route security constraints:
  - Execute API endpoint calls using mock user tokens (with role `'user'` and `'librarian'`). Verify requests are rejected with `403 Forbidden`.
  - Execute role modification and suspension calls on oneself. Verify request is rejected with `400 Bad Request`.
  - Execute role demotion on the single active admin. Verify rejection with `400 Bad Request`.
  - Verify that a suspended account login request is blocked.
  - Verify CSV generation escaping properties.
  - *Completion Criteria*: Test suite executes successfully.
  - *Dependency*: T014.

---

## Phase 11: Final Verification

**Purpose**: Execute end-to-end verification workflows.

- [x] T027 Run E2E user story test scenarios detailed in `spec.md` and verification guidelines in `quickstart.md` across Desktop, Tablet, and Mobile viewports.
  - *Completion Criteria*: 100% of user story checklists are verified successfully.
  - *Dependency*: T025, T026.

---

## MVP Boundary & Parallel Opportunities

- **MVP Target**: Complete Phases 1 through 7 (T001 - T021). At this point, the administrative user directory counts display real stats, users table shows paginated dynamic database records, search filters compose queries, and CSV downloads function.
- **Critical Ordering**: Phase 2 (Database migrations) -> Phase 3 (Middlewares) -> Phase 4/5 (APIs) must complete sequentially before Frontend UI integration work can begin.
- **Parallel Opportunities**:
  - Migration script development (T003, T004, T005) can run in parallel.
  - Middlewares updates (T006, T007) can run in parallel.
  - List statistics lookup APIs (T008, T009, T010, T011) can be developed concurrently.
  - Localization dict additions (T024) and Dark theme polishing (T025) can be completed in parallel.
