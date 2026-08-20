# Feature Specification: User Dashboard Recommendation Page

**Feature Branch**: `010-user-dashboard-recommendation`

**Created**: 2026-06-24

**Status**: Draft

**Input**: User description: "Tôi muốn xây dựng một trang để hiển thị sách được đề xuất cho người dùng. Đọc kĩ tài liệu đặc tả 009-user-dashboard-page vì đây là một phần tiếp tục của folder này. Tham khảo layout DashBoardRecommendation-layout.txt nhưng phải đồng bộ với thiết kế của toàn hệ thống hiện tại. Đối với việc hiển thị sách được đề xuất, hãy lấy tạm cách hiển thị ngẫu nhiên sách của phần YOU MAY LIKE trong trang xem thông tin sách (View Book Details) cho cả 2 phần Based on your reading history và Trending this week trong layout tham khảo"

**Route Structure**:

| Role      | Page Path                                | Frontend File                                              |
|-----------|------------------------------------------|------------------------------------------------------------|
| user      | `/dashboard/user/recommendations`        | `client/app/dashboard/user/recommendations/page.tsx`       |

The recommendation page will be accessed via the sidebar navigation on the user dashboard.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Recommended Books (Priority: P1)

A logged-in user navigates to the "Recommended Books" section from their dashboard sidebar. They see two distinct sections: "Based on your reading history" and "Trending this week", both displaying carousels of books designed identically to the "You May Like" section from the book detail page.

**Why this priority**: Displaying personalized and trending recommendations is the primary goal of this feature to increase user engagement and book discovery.

**Independent Test**: Can be tested by navigating to the recommendation page and verifying both carousels are present, contain book cards, and are scrollable using the left/right arrow buttons.

**Acceptance Scenarios**:

1. **Given** a logged-in user with the "user" role is on the dashboard, **When** they click "Recommended Books" in the sidebar, **Then** they are navigated to the recommendation page.
2. **Given** a user is on the recommendation page, **When** the page loads, **Then** they see a section titled "Based on your reading history" containing a carousel of book cards.
3. **Given** a user is on the recommendation page, **When** they scroll down, **Then** they see a section titled "Trending this week" containing a carousel of book cards.
4. **Given** a user is viewing either carousel, **When** they interact with the left/right navigation arrows, **Then** the carousel scrolls smoothly to reveal more books.

---

### User Story 2 - Consistent Layout and Integration (Priority: P1)

The recommendation page seamlessly integrates into the existing dashboard layout, utilizing the standard site-wide navbar, footer, and the dashboard sidebar navigation, ensuring visual consistency.

**Why this priority**: Maintaining a unified user experience across the dashboard is critical for usability.

**Independent Test**: Can be tested by visual inspection of the page to confirm the presence and proper styling of the navbar, footer, and sidebar.

**Acceptance Scenarios**:

1. **Given** a user is on the recommendation page, **When** they view the layout, **Then** the global navbar and footer are visible and functional.
2. **Given** a user is on the recommendation page, **When** they view the left side of the screen, **Then** the dashboard sidebar is present with "Recommended Books" highlighted as the active page.
3. **Given** a user is on the recommendation page, **When** they view the page in dark mode, **Then** the colors, text, and components properly adapt to the dark theme.

---

### Edge Cases

- What happens if the user has no reading history? The "Based on your reading history" section could either be hidden, or display a generic fallback message like "Start reading to get personalized recommendations!".
- What happens if the backend fails to load recommendations? The system should display a user-friendly error message and a retry button instead of a broken layout.
- How does the layout handle a very small number of recommendations (e.g., only 1 or 2 books)? The carousels should not break and the navigation arrows might be disabled or hidden.
- What happens if a non-user or unauthenticated user tries to access `/dashboard/user/recommendations`? They should be redirected identically to the main dashboard page logic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restrict access to the recommendation page to authenticated users with the "user" role.
- **FR-002**: System MUST render the recommendation page within the established dashboard layout, including the global navbar, footer, and dashboard sidebar.
- **FR-003**: System MUST display a section titled "Based on your reading history".
- **FR-004**: System MUST display a section titled "Trending this week".
- **FR-005**: Both recommendation sections MUST use a horizontal scrolling carousel layout matching the "You May Like" component from the Book Detail page, including the specific left/right navigation arrows.
- **FR-006**: System MUST fetch the recommended books data ("Based on your reading history" and "Trending this week") from the backend API, utilizing the existing recommendation endpoint structure similarly to the View Book Details page.
- **FR-007**: System MUST highlight the "Recommended Books" link in the dashboard sidebar as active when the user is on this page.
- **FR-008**: System MUST fully support both light and dark modes, consistent with the rest of the application.

### Key Entities *(include if feature involves data)*

- **Book/Recommendation**: Represents a book object to be displayed in the carousel. Contains ID, title, author, cover image, and category/genre tags.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The recommendation page loads within 2 seconds.
- **SC-002**: The carousels function smoothly without layout breaks on all supported screen sizes (desktop, tablet, mobile).
- **SC-003**: The visual design perfectly matches the referenced "You May Like" component, including arrow button aesthetics and hidden native scrollbars.
- **SC-004**: 100% of unauthorized access attempts to the recommendation route are correctly redirected.

## Assumptions

- The dashboard layout (`client/app/dashboard/layout.tsx`) and sidebar component already exist and can be easily wrapped around this new page.
- The `RecommendationCarousel` or `BookCard` components used in the Book Detail page are reusable and can be imported directly into this new page.
- Existing backend API endpoints for retrieving recommended books are available and can be reused or extended for this dashboard page.
- The route `/dashboard/user/recommendations` is the standard location for this feature.
