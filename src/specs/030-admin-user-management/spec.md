# Feature Specification: Admin User Management

**Feature Identifier**: `030-admin-user-management`

**Created**: 2026-07-31

**Status**: Draft

**Input**: Create an Admin-only User Management interface and backend APIs. The user interface must preserve the visual structure and hierarchy of the provided TSX prototype and the visual acceptance reference, adapting hardcoded/absolute coordinates to responsive grid/flexbox layouts. Business data must not remain hardcoded and must connect to secure, authorized PostgreSQL-backed APIs.

---

## User Scenarios & Testing

### User Story 1 - Administrative User Directory & Stats Dashboard (Priority: P1)
As an authenticated administrator, I want to view a dashboard showing user metrics (Total Users, Active Users, Suspended Users, and Librarians Count) and a paginated list of all library users with their avatars, roles, statuses, and login/access timestamps, so that I can monitor the system's user base.

**Why this priority**: Core administrative requirement. This is the entry point for all administrative workflows and provides immediate overview statistics of the user population.

**Independent Test**:
1. Log in as an Administrator (`admin.library@gmail.com`).
2. Navigate to the Admin Dashboard page at `/dashboard/admin`.
3. Verify the page heading reads "User Management" and that the color scheme shows a beige content background (`#F8EFE6` or theme-equivalent), the existing black global navigation, and the white Admin sidebar.
4. Verify four KPI cards are visible: Total Users, Active Users, Suspended Users (red emphasis text), and Librarians Count.
5. Verify the user list displays in a bordered white table, containing columns for User Identity (Avatar, Name, UID), Contact (Email, Phone), Role, Status, and Access Timeline.
6. Verify pagination controls display in the bottom-right corner and that navigating pages fetches the next/previous page of users correctly.

**Acceptance Scenarios**:
1. **Given** a user is logged in as an Admin, **When** they load `/dashboard/admin`, **Then** the page retrieves user count stats from `/api/admin/users/stats` and displays them in the four KPI cards.
2. **Given** the KPI statistics are retrieved, **When** the page renders, **Then** "Suspended Users" displays with red text highlight (`#BA1A1A`) and a "Requires Review" label as a visual warning.
3. **Given** the user table loads, **When** data is fetched, **Then** the table displays a maximum of 10 users per page (default) showing safe fields (e.g. joined date, last login, role, status) and never exposes sensitive credentials.
4. **Given** the table renders, **When** a user has a status of `'suspended'`, **Then** their row displays with a red status dot and a red label, and their avatar is shown at a reduced opacity (50%).
5. **Given** the table renders, **When** a user has a status of `'active'`, **Then** their row displays with an emerald/teal status dot (`#5EEAD4` or theme-equivalent) and an active label.

---

### User Story 2 - Advanced Search & Composite Filtering (Priority: P1)
As an authenticated administrator, I want to search users by name/username or email, and filter them by roles and statuses, so that I can quickly locate specific accounts.

**Why this priority**: Necessary for directory navigation. Administrators must be able to target specific users in a system with thousands of accounts without paging manually.

**Independent Test**:
1. Go to the User Management page.
2. Enter a partial name or email (e.g. "Sarah" or "@amethyst.lib") into the search box. Verify that the table updates with matching results.
3. Select "Librarian" from the Role dropdown and verify that only librarians are displayed.
4. Select "Suspended" from the Status dropdown and verify that only suspended users are displayed.
5. Combine search queries and dropdown filters (e.g. search "r.kane" + status "Suspended"). Verify the query composes correctly.
6. Change filters or search terms and verify that the page resets back to page 1.

**Acceptance Scenarios**:
1. **Given** the administrator enters text in the search input, **When** they type or press Enter, **Then** the query is trimmed of leading/trailing whitespace and filters results on both username/name and email.
2. **Given** search input containing Vietnamese text with accents (e.g., "Nguyễn"), **When** query is sent, **Then** the backend supports accents and Unicode matching, returning matching rows.
3. **Given** the administrator updates search or filter dropdown values, **When** criteria changes, **Then** the active page number resets back to page 1 to prevent requesting page indexes that no longer exist for the filtered set.
4. **Given** the query returns no matching users, **When** the table renders, **Then** it shows a "No results found" placeholder matching the visual palette, rather than an empty table or error.

---

### User Story 3 - Role & Status Management Actions (Priority: P1)
As an authenticated administrator, I want to change a user's system role or toggle their suspension state (supplying a reason for suspension), so that I can manage staff privileges and enforce account restrictions.

**Why this priority**: Crucial for security and system governance. Admins must have the power to elevate users to librarians or revoke access for non-compliant accounts.

**Independent Test**:
1. Locate a user row in the table (e.g., Sarah Miller). Click the "Role/Status Management" action icon.
2. Verify that a modal opens showing the user's current role and status.
3. Select a new role (e.g., change User to Librarian) and click "Confirm". Verify that the modal closes, a success toast appears, the list updates, and the "Librarians Count" card increments by 1.
4. Open the modal for an active user and change status to "Suspended". Verify that a "Reason" field becomes visible and is marked as mandatory.
5. Attempt to save without a reason and verify that validation stops the submission. Enter a reason (e.g., "Violation of borrowing policy") and confirm. Verify the user status displays as suspended.
6. Open the modal for the logged-in administrator's own account. Verify that role and status change actions are disabled to prevent self-lockout/self-demotion.

**Acceptance Scenarios**:
1. **Given** the Admin changes a user's status to "Suspended", **When** they submit, **Then** the backend enforces that a non-empty `suspended_reason` string is saved.
2. **Given** an administrator attempts to change their own role or suspend their own account, **When** the modal renders or when the API is hit, **Then** the operation is rejected with a clear validation error.
3. **Given** only one active Admin exists in the database, **When** that Admin is targeted for demotion (role change) or suspension, **Then** the system rejects the operation to prevent locking the database out of administrative access.
4. **Given** a user is suspended, **When** they attempt to login or execute a protected API request using a previously issued JWT token, **Then** the authentication middleware rejects the token with a `401 Unauthorized` and error code `USER_SUSPENDED`.

---

### User Story 4 - Complete Filtered Data Export to CSV (Priority: P2)
As an authenticated administrator, I want to export the complete filtered set of users to a UTF-8 CSV file, so that I can download and analyze user accounts in external spreadsheet software.

**Why this priority**: Essential for reporting and external auditing. The export must contain all matching rows across pagination boundaries and be safe from spreadsheet injection vulnerabilities.

**Independent Test**:
1. Filter the user list to show only "Librarians".
2. Click the "Export CSV" button.
3. Verify that a `.csv` file download begins.
4. Open the CSV file and verify it contains all matching librarians, not just those visible on the current page.
5. Verify columns match a safe administrative schema: `user_id`, `username`, `email`, `phone_number`, `role`, `status`, `created_at`, `last_login_at`.
6. Inspect the CSV file content using a text editor. Verify that any user fields starting with `=`, `+`, `-`, or `@` have been prepended with a single quote (`'`) to neutralize formula injection.

**Acceptance Scenarios**:
1. **Given** the Admin clicks "Export CSV", **When** the request is sent, **Then** the server compiles the entire filtered list of users matching the search/filters (bypassing pagination limit boundaries).
2. **Given** the export matches some users whose fields start with formula characters (e.g. username starting with `@`), **When** CSV lines are formatted, **Then** the server prepends a single quote `'` to the value to prevent spreadsheet software from executing arbitrary code.
3. **Given** user values contain quotes, commas, or line breaks, **When** written to CSV, **Then** the values are wrapped in double quotes, and internal quotes are doubled according to RFC 4180.

---

### User Story 5 - Administrative Audit Logs (Priority: P2)
As an administrator, I want the system to log all role elevations/demotions and account suspensions/unsuspensions, so that we have an immutable history of administrative actions for compliance and accountability.

**Why this priority**: Essential compliance requirement. Administrators must not be able to perform critical mutations in secret.

**Independent Test**:
1. Elevate a user (e.g., Julian Thorne) to "Admin" role.
2. Suspend a user (e.g., Robert Kane) with the reason "Overdue books".
3. Check the database `admin_audit_logs` table (or administration log files).
4. Verify that two entries are recorded containing:
   - Action (e.g., `ROLE_CHANGE`, `ACCOUNT_SUSPENSION`)
   - Actor Admin UUID
   - Target User UUID
   - Previous Value and New Value
   - Suspension Reason
   - Exact Timestamp

**Acceptance Scenarios**:
1. **Given** an administrative mutation (role modification, suspension, unsuspension) is successfully processed, **When** the database transaction completes, **Then** an entry in the `admin_audit_logs` table is written within the same database transaction context.
2. **Given** an audit log is created, **When** recorded, **Then** it captures the exact current timestamp, the logged-in administrator's `user_id`, the target `user_id`, and details of the modified field.

---

## Negative & Security Scenarios

1. **Direct API Bypass**:
   - **Scenario**: An authenticated non-admin user (e.g., standard member or librarian) directly hits `GET /api/admin/users` or `PUT /api/admin/users/:id/role` using `curl` or Postman.
   - **Expected**: The backend middleware blocks access, returning `403 Forbidden` with `{ "error": "Forbidden: insufficient permissions" }`. It must not rely on frontend component hiding.
2. **Suspended Account Immediate Token Invalidation**:
   - **Scenario**: A user has an active JWT token that expires in 12 hours. At hour 1, an admin suspends their account. At hour 2, the user attempts to fetch library resources using the token.
   - **Expected**: The authentication middleware checks user status in the database on every request. It finds the user status is `'suspended'`, immediately rejects the token, and returns a `401 Unauthorized` with `{ "error": { "code": "USER_SUSPENDED", "message": "Your account has been suspended." } }`.
3. **Self-Mutation Request**:
   - **Scenario**: Admin attempts to demote their own role to 'user' or suspend themselves by sending a direct HTTP request to the backend.
   - **Expected**: The backend service checks target `user_id` against `req.user.userId`. If they match, it returns a `400 Bad Request` with `{ "error": "You cannot change your own role or status." }`.
4. **Final Admin Safeguard**:
   - **Scenario**: Only one administrator is registered or active. An admin attempts to change this final admin's role to librarian.
   - **Expected**: The backend counts active users with role `'admin'` and status `'active'`. Finding the count is 1, it blocks the operation, returning a `400 Bad Request` with `{ "error": "The final active administrator cannot be demoted or suspended." }`.
5. **CSV Formula Injection**:
   - **Scenario**: A malicious user registers with username `=cmd|' /C calc'!A1` or `@malicious`. An admin exports user data to CSV.
   - **Expected**: The export parser escapes the value as `'=cmd|' /C calc'!A1` and `'@malicious`, neutralizing execution on opening in Microsoft Excel or Google Sheets.

---

## Edge Cases

- **Search Query Special Characters**: Search query strings containing SQL wildcards (`%`, `_`) must be escaped properly in database queries (e.g. `LIKE` clauses) to prevent full-table leakage or performance degradation.
- **Vietnamese Accent Normalization**: Search must be accent-insensitive or robustly match accented inputs (e.g., typing "Tuan" can match "Tuấn", and "Tuấn" matches "Tuấn") using PostgreSQL text search or case-insensitive accent-insensitive collation/matching.
- **Page Overflow**: If pagination index requests a page higher than the total pages available (e.g., user is on page 10 and updates filter criteria so only 2 pages are returned), the system must fallback and return the last valid page or page 1 instead of throwing an empty-array error or crash.
- **Stale Active Token Roles**: When a user's role is updated (e.g., User is promoted to Librarian), their active JWT token will have the old role. Since the `auth.middleware.mjs` queries user database state on every request and assigns database fields directly to `req.user`, their active session is updated instantly without requiring them to log out and log in again.
- **Null Fields handling**: Users without a phone number or last login time must display a clean empty state indicator (e.g., `-`) rather than blank entries or throwing runtime exceptions.

---

## Requirements

### 1. Database Migrations & Entities

- **REQ-001**: Add the following fields to the `users` table:
  - `status` (VARCHAR(20) NOT NULL DEFAULT 'active' with constraint check `status IN ('active', 'suspended')`).
  - `suspended_reason` (TEXT DEFAULT NULL).
  - `last_login_at` (TIMESTAMP DEFAULT NULL).
  - `created_at` (TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP). (Note: Verify if a registration timestamp exists; if not, add it as a joined date field).
- **REQ-002**: Create the table `admin_audit_logs` to record administrative mutations:
  ```sql
  CREATE TABLE public.admin_audit_logs (
      log_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      actor_id uuid NOT NULL,
      target_id uuid NOT NULL,
      action character varying(50) NOT NULL,
      prev_value text,
      new_value text,
      reason text,
      created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (actor_id) REFERENCES public.users(user_id) ON DELETE RESTRICT,
      FOREIGN KEY (target_id) REFERENCES public.users(user_id) ON DELETE RESTRICT
  );
  ```

### 2. Backend APIs & Services (Node.js/Express)

- **REQ-003**: The backend endpoints must be prefixed with a common route config (e.g. `/api/admin/users`) and be mapped under a dedicated admin router:
  - All admin routes MUST require token authentication and require role check `authorizeRole('admin')`.
- **REQ-004**: Route `GET /api/admin/users` (List Users):
  - Parse query parameters: `search`, `role`, `status`, `page`, `limit`.
  - Perform parameterized SQL queries with pagination using `LIMIT` and `OFFSET`.
  - Apply search constraints safely by escaping SQL special characters.
  - Return only safe user payload fields:
    ```json
    {
      "users": [
        {
          "userId": "uuid",
          "username": "Julian Thorne",
          "email": "j.thorne@amethyst.lib",
          "phoneNumber": "+1 415 555 0122",
          "role": "admin",
          "status": "active",
          "joinedDate": "2023-01-12T00:00:00.000Z",
          "lastLogin": "2026-07-31T20:36:00.000Z",
          "avatar": "/UserAvatar.png"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 129,
        "totalItems": 1284,
        "limit": 10
      }
    }
    ```
- **REQ-005**: Route `GET /api/admin/users/stats` (Admin Stats):
  - Returns counts: `totalUsers`, `activeUsers`, `suspendedUsers`, `librariansCount`.
- **REQ-006**: Route `PUT /api/admin/users/:userId/role` (Change Role):
  - Updates a user's role column.
  - Enforces invariants: target exists, target is not current user, database contains other active admins before demoting.
  - Records a row in `admin_audit_logs` with action `'change_role'`, `prev_value` (old role), `new_value` (new role).
- **REQ-007**: Route `PUT /api/admin/users/:userId/suspend` (Suspend User):
  - Body: `{ reason: "String" }`. Validates reason is non-empty.
  - Updates user status to `'suspended'` and records `suspended_reason`.
  - Enforces invariants: target is not self, database contains other active admins.
  - Records row in `admin_audit_logs` with action `'suspend'`, `new_value` as `'suspended'`, and `reason` field filled.
- **REQ-008**: Route `PUT /api/admin/users/:userId/unsuspend` (Unsuspend User):
  - Updates user status to `'active'` and clears `suspended_reason`.
  - Records row in `admin_audit_logs` with action `'unsuspend'`, `prev_value` as `'suspended'`, `new_value` as `'active'`.
- **REQ-009**: Route `GET /api/admin/users/export` (CSV Export):
  - Compiles the complete matching user list based on search/filters (ignoring pagination limits).
  - Generates a CSV stream with stable headers: `User ID`, `Username`, `Email`, `Phone Number`, `Role`, `Status`, `Joined Date`, `Last Login`.
  - Neutralizes formulas by prepending single quotes `'` if values start with `=`, `+`, `-`, or `@`.
  - Returns response as an attachment: `Content-Disposition: attachment; filename="users_export.csv"`.
- **REQ-010**: Authentication Middleware Updates:
  - Modify `src/server/src/middlewares/auth.middleware.mjs` to retrieve `status` and reject authentication if user status is `'suspended'`. Return code `USER_SUSPENDED`.
  - Modify login logic in `loginUser` to block authenticated login if user status is `'suspended'`, returning a descriptive error.
- **REQ-011**: Code base conventions:
  - All file naming conventions must align with the layered architecture (`user.services.mjs`, `admin.routes.mjs`, `admin.controllers.mjs`, etc.).
  - All keys returned must map snake_case columns (e.g. `last_login_at`) to camelCase (e.g. `lastLogin`).

### 3. Frontend Client (Next.js & React)

- **REQ-012**: Reconstruct the prototype UI inside `/dashboard/admin/page.tsx` integrating with Next.js router.
  - Integrate it inside the standard `AdminDashboardLayout` layout shell. Do not duplicate global navigation (`NavBar`), sidebar (`AdminDashboardSidebar`), or footer (`Footer`).
  - Adapt the fixed-coordinates/absolute position styling from the static TSX prototype to dynamic flexbox/grid components (e.g., utilizing `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6` for the KPI card layout, and flex layouts for the filter panel/headers).
- **REQ-013**: Stats Cards rendering:
  - Render Total Users, Active Users, Suspended Users (highlighted in red), and Librarians Count.
  - Statistics must dynamically bind to the `/api/admin/users/stats` endpoint. Update stats automatically when user roles or statuses are mutated.
- **REQ-014**: Search & Filter Panel:
  - Text input triggers search queries.
  - Dropdown select controls bind role and status parameters.
  - "Export CSV" button triggers download query to `/api/admin/users/export`.
- **REQ-015**: Paginated User Table:
  - Render users paginated (10 rows per page).
  - Render user avatar, username, UID. Handle fallback image cleanly if avatar is null.
  - Display contact email/phone, role badges (Admin = black/custom, Librarian = purple-ish, User = grey badge), active status green dot/suspended red dot, joined date, and last login time.
- **REQ-016**: User Actions:
  - "View Details" action: Opens a detailed view dialog displaying comprehensive metadata (UID, joined date, last login, full role and status details, and suspension reason if suspended).
  - "Manage User" action: Opens a management dialog allowing changing of role (Admin, Librarian, User) and status (Active, Suspended). If suspended, reveals a mandatory suspension reason textarea.
  - Implement confirmation checks, loading skeletons, and success feedback toasts.
- **REQ-017**: Theme & Localization Compatibility:
  - Enforce full Dark Mode support using Tailwind utility classes (`dark:...`). Do not use hardcoded hex/RGB styles.
  - Localize all text, options, modals, and toasts by updating `en.json` and `vi.json` files and loading them via the global `useI18n` hook.

---

## Localization Keys

### English Dictionary (`en.json`) Additions:
```json
{
  "admin": {
    "dashboard_title": "ADMIN",
    "sidebar_user_management": "User Management",
    "sidebar_roles_permissions": "Roles & Permissions",
    "sidebar_statistics": "Statistics",
    "sidebar_system_configuration": "System Configuration",
    "placeholder_title": "Coming Soon",
    "placeholder_message": "This section is under construction and will be available soon.",
    "page_title": "User Management",
    "stat_total_users": "TOTAL USERS",
    "stat_active_users": "ACTIVE USERS",
    "stat_suspended_users": "SUSPENDED USERS",
    "stat_librarians_count": "LIBRARIANS COUNT",
    "stat_requires_review": "Requires Review",
    "stat_staff_directory": "Staff Directory Access",
    "search_placeholder": "Search by name or email...",
    "filter_all_roles": "All Roles",
    "filter_all_statuses": "All Statuses",
    "button_export_csv": "Export CSV",
    "table_header_user": "USER",
    "table_header_contact": "CONTACT",
    "table_header_role": "ROLE",
    "table_header_status": "STATUS",
    "table_header_access": "ACCESS TIMELINE",
    "table_no_results": "No users found matching the selected criteria.",
    "badge_admin": "Admin",
    "badge_librarian": "Librarian",
    "badge_user": "User",
    "status_active": "Active",
    "status_suspended": "Suspended",
    "joined_date": "Joined: {date}",
    "last_login": "Last Login: {time}",
    "tooltip_view_details": "View Details",
    "tooltip_manage_user": "Manage User",
    "modal_details_title": "User Account Details",
    "modal_manage_title": "Manage User Account",
    "field_select_role": "Change Account Role",
    "field_select_status": "Change Account Status",
    "field_reason_label": "Suspension Reason (Required)",
    "field_reason_placeholder": "Please provide a valid reason for suspension...",
    "error_reason_required": "A suspension reason must be provided to suspend this user.",
    "error_self_mutation": "Action blocked: You cannot modify your own role or suspension status.",
    "error_final_admin": "Action blocked: The final active administrator cannot be demoted or suspended.",
    "toast_role_success": "User role updated successfully.",
    "toast_status_success": "User account status updated successfully.",
    "button_cancel": "Cancel",
    "button_confirm": "Confirm"
  }
}
```

### Vietnamese Dictionary (`vi.json`) Additions:
```json
{
  "admin": {
    "dashboard_title": "QUẢN TRỊ",
    "sidebar_user_management": "Quản lý người dùng",
    "sidebar_roles_permissions": "Vai trò & Quyền hạn",
    "sidebar_statistics": "Số liệu thống kê",
    "sidebar_system_configuration": "Cấu hình hệ thống",
    "placeholder_title": "Sắp ra mắt",
    "placeholder_message": "Phần này đang được xây dựng và sẽ sớm khả dụng.",
    "page_title": "Quản lý người dùng",
    "stat_total_users": "TỔNG NGƯỜI DÙNG",
    "stat_active_users": "NGƯỜI DÙNG HOẠT ĐỘNG",
    "stat_suspended_users": "TÀI KHOẢN TẠM NGƯNG",
    "stat_librarians_count": "SỐ LƯỢNG THỦ THƯ",
    "stat_requires_review": "Cần xem xét",
    "stat_staff_directory": "Truy cập danh bạ nhân viên",
    "search_placeholder": "Tìm theo tên hoặc email...",
    "filter_all_roles": "Tất cả vai trò",
    "filter_all_statuses": "Tất cả trạng thái",
    "button_export_csv": "Xuất CSV",
    "table_header_user": "NGƯỜI DÙNG",
    "table_header_contact": "LIÊN HỆ",
    "table_header_role": "VAI TRÒ",
    "table_header_status": "TRẠNG THÁI",
    "table_header_access": "LỊCH SỬ TRUY CẬP",
    "table_no_results": "Không tìm thấy người dùng phù hợp với tiêu chí đã chọn.",
    "badge_admin": "Quản trị viên",
    "badge_librarian": "Thủ thư",
    "badge_user": "Người đọc",
    "status_active": "Hoạt động",
    "status_suspended": "Tạm ngưng",
    "joined_date": "Đã tham gia: {date}",
    "last_login": "Đăng nhập cuối: {time}",
    "tooltip_view_details": "Xem chi tiết",
    "tooltip_manage_user": "Quản lý người dùng",
    "modal_details_title": "Chi tiết tài khoản người dùng",
    "modal_manage_title": "Quản lý tài khoản người dùng",
    "field_select_role": "Thay đổi vai trò tài khoản",
    "field_select_status": "Thay đổi trạng thái tài khoản",
    "field_reason_label": "Lý do đình chỉ (Bắt buộc)",
    "field_reason_placeholder": "Vui lòng cung cấp lý do đình chỉ hợp lệ...",
    "error_reason_required": "Phải cung cấp lý do đình chỉ để tạm ngưng người dùng này.",
    "error_self_mutation": "Hành động bị chặn: Bạn không thể tự thay đổi vai trò hoặc trạng thái đình chỉ của chính mình.",
    "error_final_admin": "Hành động bị chặn: Quản trị viên đang hoạt động duy nhất còn lại không thể bị hạ cấp hoặc tạm ngưng.",
    "toast_role_success": "Cập nhật vai trò người dùng thành công.",
    "toast_status_success": "Cập nhật trạng thái tài khoản người dùng thành công.",
    "button_cancel": "Hủy",
    "button_confirm": "Xác nhận"
  }
}
```

---

## Visual-Fidelity Criteria

The final production implementation of User Management page must match both the provided TSX structure and reference image details as closely as practical, ensuring:

1. **Background Color & Overall Frame**:
   - The outer page container uses a soft beige background (`#F8EFE6` or `bg-[#F8EFE6]`).
   - Standard navigation bar is black (`bg-[#000]`), global sidebar is white (`bg-[#FFF]`), and footer is white (`bg-[#FFF]`) separated by distinct gray dividers.
2. **KPI Cards layout**:
   - Contains four elevated cards arranged horizontally.
   - Total Users card displays the count in large bold type.
   - Active Users card displays progress timeline bar.
   - Suspended Users card displays with prominent red highlight (`#BA1A1A`) and a subtle exclamation indicator in background opacity.
   - Librarians Count card displays stats and a light directory book indicator.
3. **Filter and Search Toolbar**:
   - Elevates from the content area as a white card with rounded borders and clean shadows.
   - Embeds a search text field with an inline search magnifying glass icon on the left.
   - Embeds custom select controls for All Roles and All Statuses with downward arrow indicators.
   - Embeds an outlined "Export CSV" button with thin black borders, a download tray icon, and bold black typography.
4. **Data Table**:
   - The user list table has a black border outline (`border-[#000]`).
   - The table header row uses a cream/sand highlight background (`bg-[#F8F3E9]`) with uppercase headers.
   - User avatar is circular and aligned on the left.
   - Status indicators render as colored dots: active is bright teal/emerald green, suspended is dark crimson-red.
   - Suspension rows are rendered at a reduced opacity (60%) for body text and email fields.
   - Bottom right contains clean numeric buttons (e.g. 1, 2, 3 ... 129) showing the selected page index in a bold black box with white text.

---

## Key Entities & Data Schema

### 1. Schema Modifications (PostgreSQL)

```sql
-- Migration 030_admin_user_management: Adds user administration columns and audit log table.

-- Add new administration columns to users if they don't already exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_reason TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Enforce constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_status;
ALTER TABLE public.users ADD CONSTRAINT chk_status CHECK (status IN ('active', 'suspended'));

-- Create Admin Audit Log Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    log_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id uuid NOT NULL,
    target_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    prev_value text DEFAULT NULL,
    new_value text DEFAULT NULL,
    reason text DEFAULT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (actor_id) REFERENCES public.users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (target_id) REFERENCES public.users(user_id) ON DELETE RESTRICT
);

-- Indexing for lookup performance
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_username_email ON public.users(username, email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
```

### 2. Audit Actions Schema

Supported values for the `action` field in `admin_audit_logs`:
- `ROLE_CHANGE`: Administrative changes to user role (target role changes e.g. `'user'` -> `'librarian'`).
- `ACCOUNT_SUSPENSION`: Account suspension, requires reason.
- `ACCOUNT_UNSUSPENSION`: Account restoration, active status returned.

---

## Implementation Plan

### Phase 1: Database & Backend Middleware
1. Apply the database migration scripts creating new status columns, timestamp columns, indexes, and the `admin_audit_logs` table.
2. Seed mock users with differing statuses and creation dates to populate initial statistics.
3. Update `auth.middleware.mjs` to retrieve account status from the database. Reject authentication requests if status is `'suspended'`, throwing a validation error.
4. Update login service functions (`loginUser`) in `auth.services.mjs` to throw an error if status is `'suspended'`.

### Phase 2: Administrative API Implementation
1. Create `admin.controllers.mjs` and `admin.services.mjs` under server modules.
2. Implement paginated user retrieval (`GET /api/admin/users`) mapping database columns, searching name/email (trimmed, wildcard-escaped, Unicode-safe), and filtering by status/role.
3. Implement `GET /api/admin/users/stats` collecting active, total, suspended, and librarian counts.
4. Implement PUT endpoints `/api/admin/users/:userId/role` and `/api/admin/users/:userId/suspend` / `unsuspend`. Apply validation policies blocking self-mutations and preventing demotion/suspension of the final active administrator. Record database rows to `admin_audit_logs` during transactions.
5. Implement `/api/admin/users/export` compile results, format columns safely escaping quotes/commas, and prepend single quotes on spreadsheet formula trigger characters (`=`, `+`, `-`, `@`).

### Phase 3: Frontend Client Integration
1. Append localization keys to English and Vietnamese translation JSON dictionaries.
2. In `src/client/app/dashboard/admin/page.tsx`, design the layout connecting states to `/api/admin/users` and `/api/admin/users/stats`.
3. Build search input filters and dropdown components.
4. Implement white elevated filters toolbar and outlined export CSV buttons linking downloads to API route exports.
5. Implement paginated bordered table mapping users list elements: avatars, details modals, management actions modals, and teal/emerald active or crimson-red suspended indicators.
6. Build view details and role/status edit modals. Wire up submitting triggers, toast notifications, loading skeletons, and self-demotion verification blocks.
7. Test visual styling, ensuring responsive adapts on grid layouts and clean aesthetics in Light and Dark mode.
