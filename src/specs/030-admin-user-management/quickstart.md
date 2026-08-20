# Quickstart & Verification Guide: Admin User Management

**Feature Identifier**: `030-admin-user-management`

---

## Security Access Control Matrix

Verify access restrictions for each endpoint to confirm backend route guards are working:

| Endpoint Route | HTTP Method | Guest | User | Librarian | Administrator |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/admin/users/stats` | `GET` | ❌ `401` | ❌ `403` | ❌ `403` |  `200 OK` |
| `GET /api/admin/users` | `GET` | ❌ `401` | ❌ `403` | ❌ `403` |  `200 OK` |
| `GET /api/admin/users/:id` | `GET` | ❌ `401` | ❌ `403` | ❌ `403` |  `200 OK` |
| `PUT /api/admin/users/:id/role` | `PUT` | ❌ `401` | ❌ `403` | ❌ `403` |  `200 OK` |
| `PUT /api/admin/users/:id/suspend`| `PUT` | ❌ `401` | ❌ `403` | ❌ `403` |  `200 OK` |
| `PUT /api/admin/users/:id/unsuspend`| `PUT`| ❌ `401` | ❌ `403` | ❌ `403` |  `200 OK` |
| `GET /api/admin/users/export` | `GET` | ❌ `401` | ❌ `403` | ❌ `403` |  `200 OK` |
| `GET /api/admin/audit-logs` | `GET` | ❌ `401` | ❌ `403` | ❌ `403` |  `200 OK` |

---

## Migration & Startup Diagnostics

Prior to executing test workflows:
1. **Database Update**: Execute the SQL commands in `data-model.md` inside your PostgreSQL server console.
2. **Launch Servers**:
   - Backend Server (Port 5000): `npm run dev` or `node src/server.mjs` inside `src/server`.
   - Frontend Client (Port 3000): `npm run dev` inside `src/client`.

---

## Responsive Design Verification (Grid & Flex Layouts)

Ensure the user management dashboard layout renders properly and cleanly across various window sizes without content overlapping or clipping:

### 1. Desktop Viewport (1440px width)
- **Checklist**:
  - The side panel (`AdminDashboardSidebar`) renders at a fixed width of `260px` on the left.
  - The main page workspace renders with `p-8 pl-10` padding.
  - The 4 KPI cards are displayed in a clean 4-column layout (`grid-cols-4`).
  - The search box, role filter dropdown, status filter dropdown, and Export CSV button display in a single horizontal toolbar.
  - Table shows columns spaced correctly.

### 2. Tablet Viewport (768px width)
- **Checklist**:
  - The page must wrap elements gracefully or collapse menus.
  - The 4 KPI cards shift to a 2-column layout (`grid-cols-2`).
  - Toolbar elements wrap into two rows: the search input takes full width on row 1, and filters + CSV button align horizontally on row 2.
  - Table scrolls horizontally (`overflow-x-auto`) to prevent viewport clipping.

### 3. Mobile Viewport (375px width)
- **Checklist**:
  - The 4 KPI cards stack vertically in a 1-column layout (`grid-cols-1`).
  - Toolbar elements stack vertically: search input, role select, status select, and CSV export button each span 100% width.
  - The left sidebar collapses or hides behind a responsive toggle menu (reused from project navbar setup).

---

## Core Visual-Fidelity Audit Checklist

When reviewing the final UI implementation against the reference design blueprint:
- [ ] **Main Background**: Ensure main content background uses `#F8EFE6` (beige/cream).
- [ ] **Table Header**: Confirm header row uses `#F8F3E9` background with bold capitalised text.
- [ ] **Suspended KPI**: Verify Suspended Users count is highlighted in `#BA1A1A` red text.
- [ ] **Role Badges**: Verify Admin is black, Librarian is purple, User is gray.
- [ ] **Suspension Opacity**: Check that rows of suspended users display at 60% opacity.
- [ ] **Status Dot**: Check that active users have a teal dot and suspended have a red dot.

---

## Localization Audit

Toggle languages (English / Vietnamese) using the navbar switch:
1. Verify KPI card labels translate:
   - "TOTAL USERS" ↔ "TỔNG NGƯỜI DÙNG"
   - "ACTIVE USERS" ↔ "NGƯỜI DÙNG HOẠT ĐỘNG"
   - "SUSPENDED USERS" ↔ "TÀI KHOẢN TẠM NGƯNG"
   - "LIBRARIANS COUNT" ↔ "SỐ LƯỢNG THỦ THƯ"
2. Verify table column headers translate:
   - "USER", "CONTACT", "ROLE", "STATUS", "ACCESS TIMELINE" ↔ "NGƯỜI DÙNG", "LIÊN HỆ", "VAI TRÒ", "TRẠNG THÁI", "LỊCH SỬ TRUY CẬP"
3. Verify placeholder inside search input translates:
   - "Search by name or email..." ↔ "Tìm theo tên hoặc email..."
4. Verify dynamic roles within badges:
   - "Admin", "Librarian", "User" ↔ "Quản trị viên", "Thủ thư", "Người đọc"

---

## Rollback & Cleanup Plan

Should the implementation require removal or revert:
1. **Database Schema Rollback**:
   Execute the following SQL commands to drop columns, constraints, and tables:
   ```sql
   ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_status;
   ALTER TABLE public.users DROP COLUMN IF EXISTS status;
   ALTER TABLE public.users DROP COLUMN IF EXISTS suspended_reason;
   ALTER TABLE public.users DROP COLUMN IF EXISTS last_login_at;
   ALTER TABLE public.users DROP COLUMN IF EXISTS created_at;
   DROP TABLE IF EXISTS public.admin_audit_logs;
   ```
2. **API Routes**:
   Remove `admin.routes.mjs`, `admin.controllers.mjs`, and `admin.services.mjs`. Unmount the routes from `server.mjs`.
3. **Frontend Changes**:
   Delete `/dashboard/admin/page.tsx` and revert any layout sidebar links changes.
