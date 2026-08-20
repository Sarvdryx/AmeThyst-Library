# Feature Specification: Authorization & Role Management

**Feature Branch**: `029-authorization-role-management`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "Build the Authorization & Role Management module on the authorization tab of the admin dashboard (source description: `.specify/template/authorization.md`). It must support safe role promotions/demotions across three isolated roles (USER, LIBRARIAN, ADMIN), immediate access termination on role changes, strict security guardrails for ADMIN accounts, full audit logging of every authorization modification, and an admin dashboard UI featuring a real-time authorization history log. Before any role change, the target account's status must be verified as active."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Promote a User to Librarian or Admin (Priority: P1)

As an administrator, I want to promote active library users to higher roles (Librarian or Admin) so that trusted staff gain the permissions they need to manage library operations.

**Why this priority**: This is the core day-to-day capability of the module and the primary reason an admin opens the authorization tab. Without it the module delivers no value.

**Independent Test**: An admin selects an active user who has no unreturned books and no outstanding fines, then promotes them to Librarian. The system updates the role, records the change in the authorization history, and the user's next session reflects the new role. The same flow with a user who has pending liabilities must be blocked with a clear error message.

**Acceptance Scenarios**:

1. **Given** an admin is on the authorization tab and selects an active user with no unreturned books and no unpaid fines, **When** they promote the user to LIBRARIAN or ADMIN, **Then** the user's role is updated, the change is recorded in the authorization history, and the user's next login reflects the new role.
2. **Given** the selected user currently has unreturned books or outstanding overdue fines, **When** the admin attempts to promote them, **Then** the action is blocked with an explicit error message explaining the pending liabilities, and the role remains unchanged.
3. **Given** the selected user's account status is not active (suspended), **When** the admin attempts any role change on that account, **Then** the action is blocked with an explicit error message.

---

### User Story 2 - Demote a Librarian Back to User (Priority: P1)

As an administrator, I want to demote librarians back to regular users so that librarian tool access is revoked immediately when staff responsibilities end.

**Why this priority**: Security-critical. Revoking privileges must take effect immediately to prevent a former librarian from continuing to use librarian-only functions.

**Independent Test**: An admin demotes a librarian to USER. The system updates the role and immediately invalidates all active sessions/tokens for that account, forcing the user to re-authenticate with the restricted role before accessing protected functions.

**Acceptance Scenarios**:

1. **Given** an active librarian account, **When** the admin demotes them to USER, **Then** the role is updated and all active sessions/tokens for that account are immediately invalidated.
2. **Given** a user whose librarian access was just revoked, **When** they attempt to access librarian-only functions with their previous session, **Then** access is denied and they are forced to re-authenticate before using the system with the restricted role.

---

### User Story 3 - Add a New Administrator (Email Invite) (Priority: P1)

As an administrator, I want to create a new admin account by inviting a person via email so that new administrators can be onboarded even if they do not yet have an account.

**Why this priority**: Guarantees the library can always maintain sufficient administrators, including cases where the person has no existing account.

**Independent Test**: An admin re-enters their current password (sudo confirmation), provides an email address, and the system creates a new admin account with a generated temporary password that is emailed to the invitee. The invitee logs in with the temporary password and is forced to set a new password before continuing.

**Acceptance Scenarios**:

1. **Given** an admin has re-authenticated with their current password, **When** they submit an email invite to create a new admin account, **Then** an account is created with a generated temporary password, the temporary password is delivered to the invitee by email, and the action is recorded in the authorization history.
2. **Given** the invitee logs in using the temporary password, **When** they authenticate for the first time, **Then** they are required to set a new personal password before using the account.
3. **Given** an email address that already belongs to an existing account, **When** the admin attempts to invite it, **Then** the action is blocked with a clear error message and no duplicate account is created.
4. **Given** the invite email cannot be delivered, **When** the system attempts to create the account, **Then** no partial account is left behind and the admin receives a clear error message.

---

### User Story 4 - Demote or Remove an Administrator (Priority: P1)

As an administrator, I want to demote other administrators down to Librarian or User so that admin privileges can be revoked safely, while guaranteeing the system never loses its last administrator.

**Why this priority**: Contains the highest-risk operations and the mandatory security guardrails (self-action restriction, last-admin protection, sudo re-authentication). These rules are what make the module safe to operate.

**Independent Test**: A re-authenticated admin demotes another admin to LIBRARIAN. The system updates the role, immediately invalidates the demoted admin's sessions, and the demoted admin loses access to admin-only endpoints. Attempts to demote one's own role or the sole remaining admin are rejected with clear errors.

**Acceptance Scenarios**:

1. **Given** an admin has re-entered their current password, **When** they demote another admin to LIBRARIAN or USER, **Then** the target's role is updated, their active sessions/tokens are immediately invalidated, and they can no longer access admin-only endpoints.
2. **Given** an admin attempts to demote, delete, or otherwise modify their own role, **When** they submit the action, **Then** it is blocked with an explicit error message.
3. **Given** only one active admin remains in the system, **When** anyone attempts to demote or remove that last admin, **Then** the action is blocked so the system always retains at least one active admin.
4. **Given** an admin attempts a high-risk action (creating a new admin or demoting an existing admin) without first re-entering their current password, **When** they submit the action, **Then** the action is blocked until the admin re-authenticates.

---

### User Story 5 - View the Authorization History Log (Priority: P2)

As an administrator, I want to see a real-time log of every role change so that authorization activity is transparent and auditable.

**Why this priority**: Enables auditability and accountability after the core role-change workflows are working; valuable but not required for the module to function.

**Independent Test**: After a role change, the authorization history section displays a new entry showing who made the change, which account was affected, and when it happened. New entries appear in real time while the admin is viewing the log, without a full page reload.

**Acceptance Scenarios**:

1. **Given** a role change has occurred, **When** the admin opens the authorization history log, **Then** an entry appears showing the actor, the affected account, and the timestamp of the change.
2. **Given** a new role change occurs while the admin is viewing the log, **When** the log refreshes, **Then** the new entry appears in real time without requiring a full page reload.

---

### Edge Cases

- **Promotion with pending liabilities**: A user with unreturned books or unpaid fines cannot be promoted; the action must be blocked with an explicit explanation.
- **Non-active accounts**: No role change is permitted for an account whose status is not active.
- **Self-action attempt**: An admin attempting to modify their own role must always be rejected.
- **Last admin attempt**: Demoting or removing the sole remaining active admin must always be rejected, even if the actor is that admin themselves.
- **Sudo re-authentication failure**: If the admin enters an incorrect current password, the high-risk action must be blocked with a clear error and no change applied.
- **Duplicate invite email**: Inviting an email that already belongs to an existing account must not create a duplicate or conflicting account.
- **Email delivery failure**: If the invite/temporary-password email fails to send, the system must not leave behind a half-created account or a silently unreported failure.
- **Stale session after demotion**: A demoted user (or demoted admin) must not be able to reach protected endpoints using a previously issued session or token.
- **Race condition on last admin**: Concurrent demotion attempts must not be able to reduce the active admin count to zero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Admin-Only Module Access)**: Access to the Authorization & Role Management module, its pages, and its functions MUST be restricted to users with the `admin` role.
- **FR-002 (Active Account Pre-Check)**: Before applying any role change, the system MUST verify that the target account's status is `active`. Role changes MUST be blocked for accounts whose status is not active.
- **FR-003 (Promotion Liability Guard)**: Before promoting a `USER` to `LIBRARIAN` or `ADMIN`, the system MUST check whether the user has unreturned books or outstanding unpaid fines. If pending liabilities exist, the promotion MUST be blocked with an explicit error message.
- **FR-004 (Promote User)**: The system MUST support promoting an existing active `USER` to `LIBRARIAN` or `ADMIN`.
- **FR-005 (Demote Librarian)**: The system MUST support demoting a `LIBRARIAN` to `USER`, and MUST immediately invalidate all active sessions and tokens for that account so the user must re-authenticate with the restricted role.
- **FR-006 (Add Admin via Email Invite)**: The system MUST support creating a new `ADMIN` account by email invite: generate a temporary password, deliver it to the invitee by email, and force the invitee to set a new password on first login.
- **FR-007 (Demote Admin)**: The system MUST support demoting an `ADMIN` to `LIBRARIAN` or `USER`, and MUST immediately invalidate the target's active sessions and tokens so access to admin-only endpoints is blocked.
- **FR-008 (Self-Action Restriction)**: An acting `ADMIN` MUST NOT be able to demote, delete, or otherwise modify their own role.
- **FR-009 (Last Admin Protection)**: If the number of active admins is 1 or fewer, the system MUST block any attempt to demote or remove the sole remaining admin.
- **FR-010 (Sudo Re-Authentication)**: Creating a new admin and demoting an existing admin MUST require the acting admin to re-enter their current password before the action is executed.
- **FR-011 (Audit Trail)**: Every authorization modification MUST be recorded in the authorization history (`authorize_history`), capturing the actor, the affected account, and the timestamp, and MUST never be silently omitted.
- **FR-012 (Real-Time Authorization History)**: The admin dashboard authorization tab MUST display an authorization history log that reflects role changes in real time (a new entry appears within 2 seconds of the change without a full page reload).
- **FR-013 (Immediate Access Termination)**: Upon demotion, the affected account's active sessions and tokens MUST be invalidated immediately, so the account's previous session is rejected on its next request to protected endpoints.
- **FR-014 (Authorization Tab UI)**: The admin dashboard authorization tab MUST present a management screen (replacing the current placeholder) organized into a Role Management panel and an Authorization History panel, following the existing admin dashboard design system (layout shell, typography, color/theme tokens, tables, modals, and toasts).
- **FR-015 (Account Table & Filters)**: The Role Management panel MUST list accounts (avatar, display name, email, current role, status, branch) with search by name/email and filters by role and status, and MUST provide per-row actions appropriate to each account's current role.
- **FR-016 (Role Change Modals)**: Promoting and demoting MUST be performed through confirmation modals that show the target account, the chosen role, and — for demotions — a clear warning that all active sessions will be terminated and the user must re-authenticate.
- **FR-017 (Sudo Confirmation in UI)**: High-risk actions MUST present an inline re-authentication step (current-password field) inside the flow; an incorrect password MUST block the action with a clear error.
- **FR-018 (Invite Admin Form UI)**: The UI MUST provide an invite-admin form (email input) that submits through the sudo step and reports success or failure with clear messages.
- **FR-019 (History Log Panel UI)**: The Authorization History panel MUST render a table (actor, target account, change, timestamp) that updates live, briefly highlights new entries, and supports filtering by change type.
- **FR-020 (States, Responsiveness, Accessibility)**: Every panel MUST show explicit loading, error, and empty states; the module MUST be responsive on desktop, tablet, and mobile, keyboard-accessible, and compliant with the global light/dark theme and English/Vietnamese localization requirements.

### Key Entities *(include if feature involves data)*

- **User Account (`public.users`)**: `user_id` (PK), `email`, `username`, `role` (`admin` | `librarian` | `user`), `status` (`active` | `suspended`), `branch_id`. The subject of every role change.
- **Authorization History (`public.authorize_history`)**: `authorize_id` (PK), `modified_at` (timestamp), `modified_by` (acting admin), `modified_to` (affected account). Persists the audit trail for every role change.
- **Borrow Record (`public.borrow_book`)**: `user_id`, `status` (`reserved` | `pending` | `borrowed` | `pending_return`). Used by the promotion liability pre-check to detect unreturned books.
- **Penalty Record (`public.book_penalty`)**: `user_id`, `issue`, `is_paid`. Used by the promotion liability pre-check to detect outstanding unpaid fines.

## UI Design *(frontend coverage)*

This section describes the user-facing experience of the module. It reuses the existing admin dashboard visual language and interaction patterns; no new design system is introduced.

### A. Page Structure (Authorization Tab)

- The page replaces the current placeholder under the "Roles & Permissions" sidebar item while keeping the existing admin dashboard shell (top navigation bar, sidebar, footer).
- Page header: a prominent "Authorization & Role Management" title with a one-line description.
- Content is a single scrolling page with two stacked panels:
  1. **Role Management** panel (primary).
  2. **Authorization History** panel.

### B. Role Management Panel

- **Toolbar**: a text search (by name or email), a role filter (All / User / Librarian / Admin), a status filter (Active / Suspended), and a primary "Invite Admin" action button aligned to the right.
- **Accounts table** columns: User (avatar + display name + email), Current Role (badge), Status (badge), Branch, and Actions.
- **Per-row actions** by current role:
  - USER rows: "Promote" menu with targets Librarian and Admin.
  - LIBRARIAN rows: "Promote to Admin" and "Demote to User".
  - ADMIN rows (other admins only): "Demote" menu with targets Librarian and User.
  - The acting admin's own row: actions hidden or disabled with the note "You cannot change your own role".
  - The last remaining admin's row: demote disabled with the note "At least one admin must remain".
- **Pagination** and a friendly empty state when no accounts match the current filters.

### C. Role Change Modals & Sudo Confirmation

- **Promote modal**: shows the target account, a role selection, and the result of the liability pre-check (unreturned books / unpaid fines) inline. If liabilities exist, the confirm button is disabled and the reason is shown.
- **Demote modal**: shows the target account, a target-role selector, and a warning that the user's active sessions will be terminated immediately and they must sign in again. The admin must confirm before proceeding.
- **Sudo re-authentication step**: an inline current-password field presented before creating or demoting an admin. A wrong password shows an error and blocks the action.
- All modals follow the existing modal pattern: overlay, close button, loading state while submitting, error message on failure, and a success toast on completion.

### D. Invite Admin Form

- A modal/drawer with an email field, an explanation that a temporary password will be emailed to the invitee, and a submit action routed through the sudo step.
- Success: a toast confirming the invite was sent.
- Errors: duplicate-email and email-delivery failures shown as clear inline or toast messages.

### E. Authorization History Panel

- A live-updating table with columns: Actor (admin who made the change), Target account, Change (e.g., "USER → LIBRARIAN"), and Timestamp.
- New entries appear without a full page reload and are briefly highlighted; the list supports filtering by change type and shows loading, error, and empty states.

### F. Global UI Requirements

- Explicit loading (skeleton/spinner), error (banner/toast), and empty states for all data sections.
- Fully responsive: tables scroll horizontally or reflow on tablet and mobile viewports.
- Light/dark theme via the design tokens; all visible text, placeholders, and messages via the English/Vietnamese localization dictionaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of role changes on accounts whose status is not active are blocked with a clear error message.
- **SC-002**: 100% of promotion attempts for users with unreturned books or unpaid fines are blocked before any role change, with an explicit explanation.
- **SC-003**: 100% of demotions terminate the target's access to protected endpoints immediately — the demoted account's previous session is rejected on its very next request.
- **SC-004**: 100% of attempts by an admin to demote or modify their own role are rejected.
- **SC-005**: 100% of attempts to demote or remove the sole remaining active admin are rejected, including under concurrent attempts.
- **SC-006**: 100% of role changes (promotion, demotion, admin creation) are recorded in the authorization history with actor, target, and timestamp.
- **SC-007**: New authorization history entries appear in the admin dashboard within 2 seconds of the role change without a full page reload.
- **SC-008**: 100% of admin creation attempts via email invite either successfully deliver the temporary password to the invitee or fail gracefully without creating a partial account.
- **SC-009**: The authorization tab renders both panels (Role Management and Authorization History) within 2 seconds of navigation on a standard connection.
- **SC-010**: 100% of promote, demote, invite, and sudo interactions provide clear loading, error, and success feedback and never fail silently or crash the page.
- **SC-011**: The module remains fully usable on desktop, tablet, and mobile viewports and in both light and dark themes.
- **SC-012**: All user-facing text is available in both English and Vietnamese through the localization system.

## Assumptions

- **Existing systems are reused**: The existing account/authentication system and the existing admin dashboard are reused; this module is added under the authorization tab of the admin dashboard, which currently shows a placeholder.
- **Email delivery is available**: Existing email delivery capability is reused for admin invites and temporary-password delivery.
- **Liability definition**: An "unreturned book" is a borrow record with an active status (`reserved`, `pending`, or `borrowed`); an "outstanding overdue fine" is a penalty record where the fine has not been paid.
- **Sudo mode scope**: Re-authentication is a one-time current-password confirmation immediately before the high-risk action, not a timed elevated session. It applies to creating a new admin and to demoting an existing admin (including promoting someone directly to ADMIN, which effectively creates an admin).
- **Demotion target roles**: When demoting an admin, the acting admin chooses the target role (`LIBRARIAN` or `USER`). Assigning a branch when demoting to `LIBRARIAN` is optional.
- **No account deletion**: Deleting user accounts entirely is out of scope; access changes are performed exclusively through promotions and demotions.
- **UI design system**: The frontend reuses the existing admin dashboard visual language (layout shell, sidebar navigation, typography, color/theme tokens, and the established table, filter, modal, and toast components) and complies with the project's mandatory light/dark theme and English/Vietnamese localization requirements; no new visual language is introduced.
