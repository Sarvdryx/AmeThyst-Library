# Feature Specification: Book Filter Panel

**Feature Branch**: `009-book-filter-panel`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "i want to build a filter layer triggered when users click on Filter button: it pop out a panel (which can be hidden to keep smooth experience of surfing). this filter panel will allow users to specify the genres (the results book will match 1 or multiple genres: the genres tag should include mathematics, physics, biology, computer science, fiction, non-fiction, philosophy, psychology, literature, others(just a fallback when the genres not fit with any of before); filter book by publication time, filter by branches, and the filter to show the available book only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Genre and Availability Filtering (Priority: P1)

Users want to filter the catalog using multiple genres and check copies' availability, allowing them to instantly discover book lists matching specific criteria and verify if they are ready for checkout.

**Why this priority**: Core value of the book filter feature. Users need to filter books by topic and availability to locate active items of interest.

**Independent Test**: Select "Mathematics" and "Physics" from genres, toggle "Show Available Only". The book listing displays only available items matching either of these subjects.

**Acceptance Scenarios**:

1. **Given** the user is viewing the library book catalog page with the filter panel open, **When** the user checks "Mathematics" and "Physics" from the subject tags, **Then** the results are instantly updated to display books associated with "Mathematics" or "Physics".
2. **Given** the user has subject filters active, **When** the user toggles the "Show Available Only" option on, **Then** the catalog filters out any books that have 0 available copies.

---

### User Story 2 - Dismissible Filter Panel (Priority: P2)

Users can open the filter options using a "Filter" toggle button and hide it at any time to preserve screen real estate for clean book surfing.

**Why this priority**: High UX value. Providing a toggleable panel prevents UI clutter on smaller screens and ensures focus on content.

**Independent Test**: Click the "Filter" button to expand the panel, verify it pops out smoothly. Click the close button within the panel or click the main canvas area, verify the panel transitions back into hiding.

**Acceptance Scenarios**:

1. **Given** the library catalog page is loaded, **When** the user clicks the "Filter" button, **Then** the filter panel transitions smoothly into view from the side (or top).
2. **Given** the filter panel is open, **When** the user clicks the close icon or clicks outside the panel boundaries, **Then** the filter panel slides back out of view without resetting current filter selections.

---

### User Story 3 - Location and Publication Year Filtering (Priority: P3)

Users can narrow down results based on specific physical library branches and/or the publication year to locate newer editions or physically accessible books.

**Why this priority**: Secondary value. Helps users find books located physically close to them or filter out outdated publications.

**Independent Test**: Select a specific library branch and custom start year "2020", verify results display books from that branch published from 2020 onwards.

**Acceptance Scenarios**:

1. **Given** the filter panel is open, **When** the user selects the "Central Branch" from the location list, **Then** the display updates to show only books belonging to that library branch.
2. **Given** the filter panel is open, **When** the user selects "Last 5 Years" or inputs a custom publication year range (e.g. 2018 to 2024), **Then** only books published within that date range are shown in the catalog.

---

### Edge Cases

- **No Matching Results**: When active filters yield zero books, the system must show a "No books found matching these filters" message with a "Clear All Filters" button.
- **Illogical Date Ranges**: If the user inputs a custom start year greater than the end year, the UI must prevent execution or show an inline warning.
- **Multiple Rapid Clicks**: Rapid selection of multiple tags should use a client-side debounce (e.g., 300ms) before hitting the API, ensuring a smooth interface and reducing backend load.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support toggling a responsive panel (show/hide) when the user clicks the "Filter" button, using smooth css transitions.
- **FR-002**: The system MUST allow users to select multiple genres simultaneously.
- **FR-003**: The standard genre options MUST include: Mathematics, Physics, Biology, Computer Science, Fiction, Non-Fiction, Philosophy, Psychology, Literature, and Others.
- **FR-004**: The system MUST automatically assign books that do not fit into the standard categories to the "Others" fallback tag for filtering.
- **FR-005**: The system MUST support filtering books by library branch locations.
- **FR-006**: The system MUST support filtering books by publication date/year (both predefined ranges and custom range inputs).
- **FR-007**: The system MUST support showing only available books (where available copies count > 0).
- **FR-008**: The filter criteria MUST apply automatically with a subtle debounce delay, updating the list dynamically without reloading the entire page.
- **FR-009**: The system MUST serialize the active filter state into the URL query parameters (e.g. `?genres=physics,math&available=true`) to enable copying, sharing, and bookmarking of filtered catalog views, and to ensure browser navigation (back/forward) operates correctly.
- **FR-010**: The filter must allow users to delete all the applied filter in one click (in case they do not need the filter result anymore). 
- 
### Key Entities *(include if feature involves data)*

- **Book**: A cataloged publication. Attributes include title, author, genres (array of strings), publication year, branch location ID, and quantity of available copies.
- **Branch**: A physical library location hosting books. Attributes include branch ID, name, and address.
- **FilterCriteria**: The user's active filter configuration. Attributes include genres (list), publication year range (start, end), branches (list), and availability (boolean).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The filter panel opens/closes within 200ms using smooth animation transitions.
- **SC-002**: Search results update dynamically in under 500ms after a filter criteria is changed.
- **SC-003**: 95% of users can apply filters and locate a book of a specific genre within 3 clicks.
- **SC-004**: Users are able to clear all active filters with a single click of the "Reset Filters" button.

## Assumptions

- The backend APIs are capable of querying books by multiple subject tags, branches, availability status, and publication years.
- Books are already assigned branch locations and publication years in the database.
- The UI will be responsive, adapting the panel format for smaller (mobile) viewports.
