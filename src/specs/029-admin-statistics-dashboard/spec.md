# Feature Specification: Admin Statistics Dashboard Tab

**Feature Branch**: `029-admin-statistics-dashboard`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "read @[style1_statistic.css] and @[style2_statistic.css] They are css style that i want to apply for the admin dashboard tab statistics UI. As the admin, i want to view the visual chart reporting about the top ten categories of the week/month showing borrow turns as a bar chart, top borrowed book and top reserved room (along with exact turns at each branch.) the figure i may care are the total users, total book borrow, overdue books and the total late fee. Adapt the current layout of admin dashboard too, do not break the working component. And this function is available for admin role only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executive Summary Metrics & Global Filtering (Priority: P1)

As a library administrator, I want to view high-level metric KPI cards (Total Users, Total Book Borrows, Overdue Books, and Total Late Fees) and filter all dashboard data by time horizon (This Week vs. This Month) and library branch within the existing Admin Dashboard layout, so that I can instantly evaluate library operations across locations without disrupting other admin tools.

**Why this priority**: Core executive KPI metrics provide immediate visibility into overall library operations and financial status, forming the fundamental slice of analytical value for administrators.

**Independent Test**: Can be fully tested by logging in as an administrator, navigating to `/dashboard/admin/statistics`, verifying the four primary metric cards (Total Users, Active/Total Borrows, Overdue Books, Total Late Fees), toggling between "This Week" and "This Month", and selecting specific library branches from the filter dropdown.

**Acceptance Scenarios**:

1. **Given** an authenticated admin viewing the Statistics tab at `/dashboard/admin/statistics`, **When** the page loads, **Then** four KPI cards display aggregated figures for Total Users (with growth rate indicator), Active/Total Book Borrows (with progress indicator), Overdue Books (styled with urgent red alert highlight), and Total Late Fees collected for the default timeframe ("This Week").
2. **Given** the statistics dashboard view within the existing admin layout, **When** the admin selects the "This Month" filter button, **Then** all summary metrics, growth percentages, and chart visualizations recalculate to reflect data for the current month.
3. **Given** a non-admin user (e.g. regular user or librarian), **When** attempting to access the statistics API endpoint or `/dashboard/admin/statistics` route, **Then** access is denied with a 403 Forbidden / Unauthorized error or redirect.

---

### User Story 2 - Top 10 Book Categories Borrow Turns Bar Charting (Priority: P2)

As a library administrator, I want to view a visual bar chart displaying the top ten book categories filtered by the selected timeframe (This Week or This Month) and their total borrow turns, so that I can quickly identify which subject areas and genres are in highest demand among readers.

**Why this priority**: Category-level borrowing demand visualizes reading trends, enabling administrators and librarians to allocate acquisition budgets and stock popular genres effectively.

**Independent Test**: Can be fully tested by selecting time toggles ("This Week" / "This Month") or branch filters and verifying that a bar chart accurately renders the top 10 book categories along the category axis with bar lengths corresponding to total borrow turns and interactive hover tooltips.

**Acceptance Scenarios**:

1. **Given** the weekly time filter is selected, **When** the admin inspects the Top Categories bar chart, **Then** the chart displays the top 10 book categories ranked by total borrow turns during the current week.
2. **Given** the monthly time filter is selected, **When** the admin inspects the Top Categories bar chart, **Then** the chart updates to render the top 10 book categories ranked by total borrow turns during the current month.
3. **Given** the Top Categories bar chart, **When** the admin hovers over any category bar, **Then** a detailed tooltip displays the exact category name and total borrow turn count for that period.

---

### User Story 3 - Top Borrowed Books & Top Reserved Rooms by Branch (Priority: P3)

As a library administrator, I want to see ranked visualizations of top borrowed books and top reserved study rooms along with exact turn counts at each branch, so that I can manage item demand and study room utilization effectively.

**Why this priority**: Item-level and room-level breakdown gives granular operational insights to optimize book acquisitions and room scheduling policies per branch location.

**Independent Test**: Can be fully tested by navigating to the Top Borrowed Books and Top Reserved Rooms panels and confirming that ranked lists display book thumbnails, titles, total borrow counts, room names, and exact reservation turns broken down by branch.

**Acceptance Scenarios**:

1. **Given** the Statistics tab, **When** the admin views the Top Borrowed Books panel, **Then** a ranked list presents top items with book cover thumbnails, titles, progress bar indicators, and total borrow counts.
2. **Given** the Statistics tab, **When** the admin views the Top Reserved Rooms panel, **Then** the system presents top study rooms alongside exact reservation turns recorded for each individual library branch location.
3. **Given** an administrative user viewing room reservation stats, **When** filtering by a specific branch from the dropdown selector, **Then** the top reserved rooms list updates to display exact turn numbers exclusively for that branch.

---

### Edge Cases

- What happens when a non-administrative user attempts to access `/dashboard/admin/statistics` or call `/api/admin/statistics`?
  - *The backend rejects the request with HTTP 403 Forbidden (`authorizeRole('admin')`), and the frontend route guard redirects or renders an unauthorized access banner.*
- What happens when navigating between existing admin tabs (e.g. User Management, Authorization, System Configuration) and Statistics?
  - *The `AdminDashboardLayout` and `AdminDashboardSidebar` remain active without page reload or state disruption to other tabs.*
- What happens when fewer than 10 book categories have borrow records in a selected week or month?
  - *The bar chart renders all available active categories (e.g., top 4 or top 7) without layout distortion or empty broken bars.*
- How does the layout respond when switching between Light Mode and Dark Mode?
  - *All text contrast, card backgrounds, alert borders, category bar colors, and tooltips dynamically adapt to maintain readability according to the project design token system.*

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate the "Statistics" tab page (`client/app/dashboard/admin/statistics/page.tsx`) seamlessly within the existing `AdminDashboardLayout` and `AdminDashboardSidebar` without altering or breaking existing working components (`UserManagementTab`, `AuthorizationTab`, etc.).
- **FR-002**: System MUST restrict access to the Admin Statistics Dashboard tab and `/api/admin/statistics` API endpoint strictly to authenticated users with the `admin` role (`verifyToken` + `authorizeRole('admin')`).
- **FR-003**: System MUST render 4 primary summary KPI cards at the top of the statistics page:
  - Total Users count (with percentage change indicator vs. previous period).
  - Total Book Borrows count (with visual capacity/progress indicator).
  - Overdue Books count (highlighted with urgent alert color styling e.g., `#BA1A1A` / `#93000A`).
  - Total Late Fee amount collected (formatted currency figure).
- **FR-004**: System MUST provide interactive global filters at the top header:
  - Time Horizon Toggle ("This Week" vs. "This Month").
  - Branch Selector Dropdown (allowing selection of individual branches or "All Branches").
- **FR-005**: System MUST render a visual Bar Chart that displays the Top 10 Book Categories ranked by total borrow turns for the selected timeframe ("This Week" vs. "This Month") and selected branch filter.
- **FR-006**: System MUST present interactive tooltips on each category bar detailing the category name and exact borrow turn count.
- **FR-007**: System MUST present a ranked visualization of Top Borrowed Books, including book cover images, titles, relative popularity bar lengths, and total borrow counts.
- **FR-008**: System MUST present a ranked breakdown of Top Reserved Study Rooms along with exact reservation turn counts recorded at each branch location.
- **FR-009**: System MUST structure and style the Statistics UI adhering to layout, typography, margin, card shadow, and color tokens defined in `style1_statistic.css` and `style2_statistic.css`.
- **FR-010**: System MUST support Light and Dark mode styling and i18n localization (English and Vietnamese dictionaries) for all UI strings.

### Key Entities

- **Admin KPI Summary**: Represents aggregate library statistics across a given time window (Total Users, Total Borrows, Overdue Count, Total Late Fee Amount, Period-over-Period Growth Rate).
- **Top 10 Category Borrow Metric**: Represents ranked book categories (Category ID/Name, Total Borrow Turns, Category Rank 1–10, Percentage Share of Borrows).
- **Top Borrowed Book Item**: Represents a popular library item (Book ID, Title, Cover Image URL, Total Borrow Count, Popularity Percentage).
- **Top Reserved Room Branch Turn**: Represents room usage figures (Room ID/Name, Branch ID/Name, Total Reservation Turns).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can view complete dashboard key metrics and toggle between week/month timeframes or branch filters with responsive UI updates in under 2 seconds.
- **SC-002**: 100% of non-admin access attempts to `/api/admin/statistics` are blocked with HTTP 403 Forbidden responses.
- **SC-003**: 100% of reported figures (total users, total book borrows, overdue count, late fees, top 10 categories borrow turns, top books, top room reservation turns per branch) accurately reflect system data without visual text overflow or alignment breakage.
- **SC-004**: 0 regressions caused to existing Admin Dashboard tabs (`UserManagement`, `Authorization`, `System`).

## Assumptions

- Target users are strictly library administrators with authorized administrative privileges.
- Visual styling, card structures, shadows, border radii, typography (Hanken Grotesk / Manrope / Inter), and spacing strictly adhere to `style1_statistic.css` and `style2_statistic.css` inside `client/app/dashboard/admin/layout.tsx`.
- All UI text strings will be mapped to `en.json` and `vi.json` localization files.
