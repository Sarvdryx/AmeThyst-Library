# Technical Research: Admin User Management Baseline

**Feature Identifier**: `030-admin-user-management`

---

## Repository Analysis

### 1. Frontend Architecture & Baseline
- **Routing & App Structure**: Built on the Next.js App Router. The admin pages reside under `src/client/app/dashboard/admin`.
- **Layout & Shell Ownership**: 
  - Layout shell is managed by `src/client/app/dashboard/admin/layout.tsx`.
  - It wraps pages with a shared structural layout: `<NavBar variant="admin" />` on top, a flex container enclosing `<AdminDashboardSidebar />` on the left, a `<main>` container wrapper with page content in the middle, and `<Footer />` at the bottom.
  - The main container already has a background of `bg-[#F8F3E9]` (beige-like background) and standard padding of `p-8 pl-10`.
- **Route Protection**:
  - Frontend route access validation is managed via the `useRequireAuth` hook and page layout checks.
  - `PublicPageAdminGuard.tsx` restricts admins from accessing standard reader routes like `/library`, `/study-together`, and `/map`, replacing history with `/dashboard/admin`.
  - Global `dashboard/layout.tsx` checks user roles and enforces that path segments starting with `/dashboard/admin` are restricted to users with `role === 'admin'`.
- **API Client & Networking**:
  - The application uses `apiFetch` in `src/client/app/utils/apiClient.ts` as the standard HTTP request client wrapper.
  - It handles authentication header injection (`Authorization: Bearer <token>`), base URL configuration (`process.env.NEXT_PUBLIC_API_URL`), and automatically parses JSON response models.
  - If a request receives a `401 Unauthorized` with error code `'AUTH_USER_NOT_FOUND'`, it clears the local storage and triggers standard logout redirection. We must extend this event trigger to also process `'USER_SUSPENDED'` as a sign-out mechanism.
- **Localization & Theme System**:
  - Strings are loaded dynamically using `const { t } = useI18n()` hook, fetching from `en.json` and `vi.json`.
  - Support for dark mode is present via Tailwind CSS dark prefix utilities (`dark:bg-slate-900`, etc.). Hardcoded color values should be avoided or adapted to utilize design tokens or explicit class utility checks.

### 2. Backend Architecture & Baseline
- **Router Mounting**:
  - Backend router routes are mounted in `src/server/src/server.mjs`.
  - Routes are separated by resource (e.g. `/auth`, `/user`, `/dashboard/user`, `/dashboard/librarian`).
  - We should mount the new admin routes at `/api/admin` to prevent overlap with standard `/user` profile routes.
- **Middlewares**:
  - `verifyToken` (`src/server/src/middlewares/auth.middleware.mjs`): decodes the incoming JWT, queries the database to retrieve user metadata (`user_id`, `email`, `role`, `branch_id`), and attaches it as `req.user`.
  - `authorizeRole(...allowedRoles)` (`src/server/src/middlewares/role.middleware.mjs`): returns a middleware checker that blocks execution with `403 Forbidden` if `req.user.role` is not contained in the allowed list. We will apply `authorizeRole('admin')` for all administrative routes.
- **Login Flows**:
  - The login pipeline calls `loginUser` service in `src/server/src/services/auth.services.mjs`. It verifies credentials and signs a JWT containing the user id. We must verify account status before signing this token.
- **Response & Exception Standard**:
  - Errors are serialized uniformly as JSON: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "User-friendly description" } }`.
  - Success payloads use the structure: `{ "success": true, "data": { ... } }` or return raw models wrapped in standard fetch helpers.

### 3. Database Architecture & Baseline
- **Current Table Schema**:
  - The PostgreSQL initialization schema is defined in `src/database/init_db/postgres/04_datauser.sql`.
  - The `users` table contains: `user_id` (UUID), `branch_id` (FK), `email`, `password_hash`, `username`, `phone_number`, `avatar`, `gender`, `birth_date`, `hometown`, `occupation`, `description`, `role`, `borrow_num`, and `reserve_num`.
- **Constraints & Checks**:
  - Enforces `chk_role`: `role` must be one of `'admin'`, `'librarian'`, or `'user'`.
  - Enforces `chk_gender`: `gender` must be `'male'`, `'female'`, or `'other'`.
  - Enforces `users_email_key` UNIQUE on `email`.
- **Missing Columns**:
  - The database currently lacks a `status` field to govern suspension, `suspended_reason` to log context, `last_login_at` timestamp metrics, and `created_at` timestamp metrics. These will be added via database migration scripts.

---

## Visual Prototype Breakdown

The supplied reference TSX `references/user-management-prototype.tsx` is a generated mockup containing absolute positioning values and styling definitions:

### 1. Style & Visual Tokens
- **Background Color**: `#F8EFE6` (Cream beige). Used as the canvas background of the page.
- **Global Navbar**: Dark `#000` color bar containing navigation items with white text, icons, and logo typography.
- **Admin Sidebar**: Styled with `#FFF` (white) background, a border divider `border-r-[#C2C9C4]`, and text elements in dark gray `#43474D`.
- **Typography & Font Families**:
  - Core page title: `font-inter text-[32px] font-semibold tracking-[0.125em] text-[#000]`.
  - Subheadings and labels: `font-hankenGrotesk text-xs font-bold tracking-[0.05em] text-[#43474D]`.
  - Identity numbers and detail texts: `font-hankenGrotesk` and `font-manrope`.
- **Metric Cards (KPIs)**:
  - Consists of 4 boxes arranged horizontally inside a grid-like panel.
  - *Total Users*: large numbers `text-5xl font-extrabold text-[#1D1C16]`.
  - *Active Users*: Displays `1,102` with a horizontal progress bar (track `#F2EDE3`, filled bar `#000` representing percentage ratio).
  - *Suspended Users*: Highlights count and label in crimson red `text-[#BA1A1A]`, with a "Requires Review" warning.
  - *Librarians Count*: Displays `14` with a "Staff Directory Access" description.
- **Search & Filters Toolbar**:
  - A white panel container using shadow token `shadow-[04px4px0rgba(0,0,0,0.25)]`.
  - Incorporates an outlined text input field with a search placeholder and custom dropdown filters for "All Roles" and "All Statuses".
  - Outlined CSV export button with double border `border-2 border-[#000]` and black typography.
- **Bordered User Table**:
  - Uses border outline `border-[#000]`.
  - Column headers are displayed inside a cream-colored background box (`bg-[#F8F3E9]`).
  - Rows display user avatars, emails, phone numbers, custom role badges, and status lights.
- **Role Badges**:
  - *Admin*: Black background (`bg-[#000]`), white text (`text-[#FFF]`).
  - *Librarian*: Purple background (`bg-[rgba(215,182,254,0.20)]`), purple text (`text-[#6E5191]`).
  - *User*: Grey background (`bg-[#E7E2D8]`), dark grey text (`text-[#43474D]`).
- **Status Indicators**:
  - *Active*: Teal green dot (`bg-[#5EEAD4]`) with black text.
  - *Suspended*: Crimson red dot (`bg-[#BA1A1A]`) with red text.
  - Rows for suspended users have a reduced opacity styling: names are styled with `opacity-60`, emails and details with `opacity-60` or `opacity-50`, and avatar images with `opacity-50`.
- **Pagination**:
  - Bottom-right pagination controls: left arrow (opacity-30 if disabled), page buttons (page 1 active has black bg `#000` and white text, others are transparent), three dots indicator, total page button (e.g. `129`), and right arrow.

### 2. Positioning & Responsive Layout Barriers
- **Fixed Widths & Heights**: 
  - The outer layouts specify explicit dimensions (e.g., `w-[1522px]`, `h-[1463px]`, `h-[1207px]`).
  - These values will overflow and cause horizontal clipping on displays narrower than 1530px, making the layout completely unusable on standard laptop viewports.
- **Absolute Coordinates**:
  - Components utilize `absolute` positioning with hardcoded offsets (e.g., `absolute left-[260px] top-[117px]`, `absolute left-[784px] top-[1175px]`).
  - This prevents normal text wrapping, causes elements to overlap when content length changes, and breaks layout flow on different viewport heights or window sizes.
- **Accessibility Problems**:
  - Text input elements are missing visual label tags (`<label>`) and descriptive `aria-label` properties.
  - Screen readers have no context for search inputs, dropdown chevrons, or action buttons (which are generic SVG containers without text descriptions).
  - Interactivity is simulated via generic `div` panels rather than accessible `button` elements, blocking keyboard tab navigation.
- **Duplicated Layout Shells**:
  - The mockup hardcodes a header navigation bar, a static left sidebar, and a footer block.
  - In production, these elements are already owned by the Next.js `AdminDashboardLayout` layout shell. Duplicating them would cause layout glitches and dual-navigation bugs.
- **Mock Data**:
  - The statistics cards display hardcoded counts (`1,284`, `1,102`, `42`, `14`) and users table rows display mocked accounts (Julian Thorne, Sarah Miller, Robert Kane, Elena Wong) which must be replaced with dynamic database hooks.
