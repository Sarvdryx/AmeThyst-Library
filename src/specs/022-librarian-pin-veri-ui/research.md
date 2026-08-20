# Research: Librarian PIN Verification UI

**Phase**: 0 — Architecture & Design Research
**Date**: 2026-06-29

## Decision Log

### Decision 1: Dashboard Layout Inheritance

- **Decision**: Mirror the existing `dashboard/user/` route structure under a new `dashboard/librarian/` route, reusing the `NavBar` + `DashboardSidebar` + `Footer` layout pattern.
- **Rationale**: The existing user dashboard provides a proven layout architecture (auth-guarded `dashboard/layout.tsx` wrapper, `dashboard/user/layout.tsx` with sidebar + navbar + footer, and child pages for each tab). Creating a parallel structure for librarians avoids modifying the user dashboard code and allows independent iteration.
- **Alternatives considered**: Adding librarian tabs directly into the user dashboard with role-based filtering. Rejected because the librarian sidebar items are completely different from user items, and mixing them would create unnecessary complexity.
- **Evidence**: `dashboard/layout.tsx` (auth guard), `dashboard/user/layout.tsx` (NavBar + DashboardSidebar + Footer), `DashboardSidebar.tsx` (6 hardcoded nav items).

### Decision 2: Sidebar Component — Create New vs. Reuse

- **Decision**: Create a new `LibrarianDashboardSidebar` organism component rather than parameterizing the existing `DashboardSidebar`.
- **Rationale**: The librarian sidebar has fundamentally different nav items (Calendar View, Book Loan Confirmation + future placeholders) compared to user items (Overview, Borrowed, Study Groups, etc.). The existing component has hardcoded icon-content pairs. Creating a new component is cleaner and avoids complex conditional rendering.
- **Alternatives considered**: Adding a `variant='librarian'` or `navItems` prop to `DashboardSidebar`. Rejected because the icon set and content are completely different (no overlap).
- **Evidence**: `DashboardSidebar.tsx` — 6 hardcoded nav items with inline SVG icons and `usePathname()` highlight.

### Decision 3: PIN Verification Modal Design

- **Decision**: Build a new `VerificationModal` organism (not reuse `PinModal`).
- **Rationale**: `PinModal` is a display-only component (shows an already-generated PIN with a countdown). The verification modal needs: PIN input (6 OTP-style slots), async validation, borrower profile overlay, and confirm/cancel actions. These are completely different responsibilities.
- **Alternatives considered**: Extending `PinModal` with input fields. Rejected because it would violate the Single Responsibility Principle and create a bloated component.
- **Evidence**: `PinModal.tsx` (53 lines, display-only, countdown timer, close button).

### Decision 4: OTP PIN Input — New Atom Component

- **Decision**: Create a new `OTPInput` atom component for the 6-digit PIN input with auto-focus, masking, and auto-advance.
- **Rationale**: No OTP/PIN input component exists in the codebase. The forgot-password flow uses a standard text `Input` for OTP. The spec requires discrete digit slots with masking and auto-advance, which warrants a dedicated atom.
- **Alternatives considered**: Using a single masked input field. Rejected because the spec explicitly requires 6 discrete individual digit character blocks with auto-focus on the first slot.
- **Evidence**: No OTP input component exists; forgot password uses standard `<Input>` text field.

### Decision 5: Keyboard Shortcuts — useEffect keydown on Modal Mount

- **Decision**: Implement keyboard shortcuts via `useEffect` adding a `keydown` event listener on `document` when the modal mounts, cleaned up on unmount.
- **Rationale**: The codebase has no existing keyboard shortcut system or custom hook. A targeted `keydown` listener scoped to the modal's lifecycle is the simplest approach that matches the spec requirements (Esc closes, Enter validates PIN, F8/Ctrl+Enter confirms). Using `e.preventDefault()` for F8 prevents browser devtools from opening.
- **Alternatives considered**: Creating a global `useKeyboard` hook. Overkill for a single modal; can be extracted later if more shortcuts are needed.
- **Evidence**: No `useKey`/`useKeyboard` hooks exist; only basic `onKeyDown` on specific input elements.

### Decision 6: PIN Validation — Mock/Simulated

- **Decision**: The PIN validation in the modal will use a mock/simulated check for this UI-only phase. The UI will transition from Input State to Data Overlay State upon successful entry of any 6-digit PIN (or a specific test PIN). Real API integration is deferred.
- **Rationale**: The spec explicitly states backend integration is out of scope. The existing backend has real PIN generation (`014-pin-generation`) but the librarian-side PIN verification API does not yet exist. A mock implementation allows the frontend UI to be built, tested, and signed off independently.
- **Alternatives considered**: Full backend integration with the existing PIN model. Rejected as out-of-scope for this phase.
- **Evidence**: Spec.md Assumptions: "The PIN verification flow in this spec covers the frontend UI behavior only — backend API integration for real PIN validation and loan processing is out of scope for this phase."

### Decision 7: Calendar View — Reuse DashboardCalendar

- **Decision**: Reuse the existing `DashboardCalendar` molecule component, wrapping it in a `CalendarView` molecule that provides librarian-specific event data.
- **Rationale**: The existing `DashboardCalendar` already supports monthly/weekly views, color-coded events (book_return, reservation_expiry, etc.), click-to-view side panel, and all i18n keys. The librarian calendar just needs different event data sources (overdue returns, upcoming pick-ups from the lending system).
- **Alternatives considered**: Building a new calendar from scratch. Rejected as wasteful when the existing component fully meets the spec requirements.
- **Evidence**: `DashboardCalendar.tsx` (323 lines, 5 event types, month/week/day views, legend, date click side panel).

### Decision 8: Role-Based Access — Extend Dashboard Layout

- **Decision**: Extend the existing `dashboard/layout.tsx` auth guard to accept both `'user'` and `'librarian'` roles, and create a parallel `dashboard/librarian/` route.
- **Rationale**: The current dashboard layout checks `role === 'user'` and redirects others to `/login`. Extending to accept `'librarian'` enables the new route without breaking existing user access.
- **Alternatives considered**: Creating a completely separate auth guard for `/librarian-dashboard`. The existing `dashboard/layout.tsx` already handles auth verification; extending it is less redundant.
- **Evidence**: `dashboard/layout.tsx` — `if (role !== 'user') redirect('/login')`.

### Decision 9: Toast Notifications — Local State Pattern

- **Decision**: Use the existing per-component `Toast` state pattern (not create a global toast system).
- **Rationale**: The codebase manages toast notifications at the component level (e.g., `dashboard/layout.tsx`). Creating a global toast context is a larger architectural change beyond this feature's scope. The verification modal and loan confirmation panel can each manage their own toast state inline.
- **Alternatives considered**: Creating a global `ToastProvider` context. Rejected because it's outside the feature scope and would require changes to existing consumers.
- **Evidence**: Toast usage in `dashboard/layout.tsx` (local `useState<{message, type}>` pattern), `Toast.tsx` atom.

### Decision 10: i18n Namespace — New `librarian.*` Keys

- **Decision**: Add a new `librarian.*` i18n namespace for dashboard-level text (sidebar labels, page titles) and `verification.*` for modal-specific text (PIN input labels, button labels, error messages, toast messages).
- **Rationale**: The existing `pin.*` namespace covers user-side PIN display. Librarian verification workflow has distinct text that doesn't fit existing namespaces. Separating into `librarian.*` and `verification.*` keeps concerns clean.
- **Alternatives considered**: Reusing `pin.*` namespace. Rejected because the user-facing PIN display (`PinModal.tsx`) and librarian-facing PIN verification are different contexts with different terminology.
- **Evidence**: `en.json` has `pin.title: "Pickup PIN"`, `verification.*` would have `verification.modal_title: "Confirm Book Loan"`.
