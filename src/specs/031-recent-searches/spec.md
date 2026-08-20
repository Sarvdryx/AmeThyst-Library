# Feature Specification: Recent Search History for Logged-In Users

**Feature Branch**: `031-recent-searches`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "update the book-searching to allow login users see their top 5 nearest searches"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Top 5 Recent Searches (Priority: P1)

As an authenticated library user, when I interact with the book search bar, I want to see a drop-down list of my 5 most recent search queries so that I can quickly re-execute past searches without typing them again.

**Why this priority**: Core value of the feature. Provides immediate convenience and reduces friction for returning users who search for similar books or topics frequently.

**Independent Test**: Log in as a user, perform 6 distinct book searches, click on the search input, and verify that only the 5 most recent unique search terms are displayed in chronological order (newest first).

**Acceptance Scenarios**:

1. **Given** a logged-in user with at least 5 previous searches, **When** the user clicks/focuses on the book search input bar, **Then** a dropdown displays the top 5 most recent unique search terms.
2. **Given** a logged-in user with only 2 previous searches, **When** the user focuses on the search bar, **Then** the dropdown displays only those 2 search terms.
3. **Given** a logged-in user with no search history, **When** the user focuses on the search bar, **Then** no search history dropdown is shown (or an empty state message indicates no recent searches).

---

### User Story 2 - One-Click Re-execution of Recent Search (Priority: P2)

As an authenticated library user, when I see my recent search list, I want to click on any search item to instantly populate the search input and view the matching book results.

**Why this priority**: High UX value. Enhances speed and convenience of retrieving previously searched books.

**Independent Test**: Log in, focus search input, click on one of the 5 recent search suggestions, and verify that the search input updates and catalog results refresh automatically for the selected query.

**Acceptance Scenarios**:

1. **Given** the recent search dropdown is displayed, **When** the user clicks on a search term item, **Then** the search input is populated with that term, the dropdown closes, and matching books are fetched and displayed.
2. **Given** a user selects an existing recent search query, **When** the search executes, **Then** the timestamp for that search query is updated so it remains at the top (rank 1) of the recent search list.

---

### User Story 3 - Guest User Search Experience Unaffected (Priority: P3)

As a guest (unauthenticated) visitor, when I use the book search bar, I want normal search functionality without user search history recording or display so that privacy and security are maintained.

**Why this priority**: Ensures separation between authenticated user data and guest interactions without breaking existing guest browsing workflows.

**Independent Test**: Open search as a guest user, perform searches, and verify that no search history dropdown appears and no user search records are created.

**Acceptance Scenarios**:

1. **Given** an unauthenticated guest user, **When** the guest clicks or types in the search bar, **Then** no recent search history panel is displayed.
2. **Given** a guest user submits a search query, **When** results load, **Then** the query is not persisted to any personal search history store.

---

### Edge Cases

- **Duplicate Search Queries**: What happens when a logged-in user searches for a term already in their history? The existing query's timestamp updates to current time, placing it at the top of the list without creating a duplicate row.
- **Long Query Strings**: How does the system handle very long search terms in the dropdown? Text is cleanly truncated with an ellipsis (`...`) to preserve UI layout across desktop and mobile screens.
- **Empty / Whitespace Queries**: What happens when a user submits whitespace or empty searches? Empty/whitespace queries are ignored and not saved to recent search history.
- **Session Logout**: What happens when a user logs out? The recent search history list is cleared from local view state and does not bleed into guest or subsequent user sessions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST record non-empty search queries submitted by authenticated users to their personal search history.
- **FR-002**: System MUST maintain uniqueness per user query string, updating the recency timestamp whenever an existing query is submitted or selected again.
- **FR-003**: System MUST retrieve and display up to the 5 most recent search terms when an authenticated user focuses the book search input.
- **FR-004**: System MUST allow authenticated users to click any recent search item to instantly trigger search results for that query.
- **FR-005**: System MUST NOT save or display recent search items for unauthenticated guest users.
- **FR-006**: System MUST support Light Mode and Dark Mode styling for the recent search dropdown component.
- **FR-007**: System MUST localize text labels (e.g., "Recent Searches") in English and Vietnamese using the global i18n system.

### Key Entities *(include if feature involves data)*

- **Search History Record**: Represents a single search event by a user.
  - Attributes: `search_id`, `user_id`, `search_content`, `created_at`, `filters`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of authenticated users can view their top 5 most recent searches upon focusing the book search input bar.
- **SC-002**: Selecting a recent search item populates results in under 1 second.
- **SC-003**: Re-executing an existing search query updates its recency rank to 1 without introducing duplicate entries.
- **SC-004**: Zero search history entries are exposed or leaked between different user accounts or guest sessions.

## Assumptions

- Authenticated user session state is available via the existing AuthProvider context.
- Backend API `/api/search/history` or database table `public.search_history` exists or will support fetching and updating recent search records.
- Recent search items are stored per user account.
