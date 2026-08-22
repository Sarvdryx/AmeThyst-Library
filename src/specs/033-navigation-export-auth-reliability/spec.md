# Feature Specification: Navigation, Export, and Authentication Reliability

**Feature Branch**: `[033-navigation-export-auth-reliability]`

**Created**: 2026-08-21

**Status**: Implemented - Validation Incomplete

**Input**: Fix three confirmed production-facing defects: inactive homepage calls to action, authenticated administrator CSV export failure, and inconsistent authentication after email verification.

## Problem Statement

Three existing user journeys are unreliable in production. The two primary Library calls to action have no behavior, the administrator CSV request omits the protected session used by the rest of the application, and email verification can establish a valid session while an older authentication operation later makes the client appear logged out. These defects must be corrected without weakening authorization, changing product semantics, or broadening the feature.

## Target Users / Actors

- **Library visitor**: Uses the homepage calls to action with pointer or keyboard input.
- **Authorized administrator**: Downloads the filtered user directory through an existing authenticated session.
- **Unauthenticated or non-administrator user**: Must continue to be denied access to administrator export.
- **Newly registered user**: Opens an email-verification link and expects a consistent authenticated destination.
- **Existing authenticated user**: May refresh or log out while other session work is pending; the final state must remain authoritative.

## Scope

### In Scope

- Connect the existing "Explore Library" control to the catalog already rendered on `/library`.
- Connect the existing "How It Works" control to the established `/help` Help Center.
- Make the existing administrator CSV fetch participate in the protected-cookie session.
- Coordinate browser-side authentication transitions so stale bootstrap or refresh work cannot override later verification or logout.
- Make verification effect ownership safe across React development lifecycle replay and page cleanup.
- Add focused automated regression coverage and record manual acceptance gaps honestly.

### Out of Scope

- Homepage redesign or creation of a new "How It Works" section or page.
- Changes to CSV fields, schema, filtering semantics, filename behavior, or Admin Dashboard design.
- Replacing protected-cookie authentication, redesigning the full authentication architecture, or introducing client-side token storage.
- Database schema changes, migrations, new roles, email-template changes, or registration-policy changes.
- Changes to backend CSV authorization, verification-token lifecycle, registration rules, or role-based destinations.
- Unrelated authentication, navigation, styling, UI cleanup, or artifacts from another specification.

## Business Rules

- Existing product destinations are authoritative: catalog content on `/library` for Explore and `/help` for How It Works.
- The protected server cookie session remains the sole authoritative authentication mechanism for these flows.
- Every CSV request remains subject to existing server authentication and administrator authorization.
- Email verification may publish an authenticated client user only when the server reports successful session establishment.
- Session-changing operations must settle in invocation order so an older result cannot supersede a newer verification or logout transition.
- Post-verification navigation begins only after the verified session user has been published to client authentication state.
- An abandoned verification-page subscription may not update page-local state or perform a delayed redirect.
- No access token, refresh token, verification token, CSRF token, or other session secret may be stored or logged by the fix.

## Assumptions and Dependencies

- The Library catalog/search content already rendered below the calls to action on `/library` is the approved browsing experience.
- The localized Help Center at `/help` is the approved explanatory destination.
- Current credentialed CORS, protected-cookie, session refresh, and server middleware behavior remain available and unchanged.
- The server verification response continues to establish cookies and return the verified user before the client fetch resolves.
- Existing CSV schema, filtering, filename behavior, administrator roles, verification-token lifecycle, email templates, and role-based destinations remain unchanged.
- Browser/database-backed acceptance requires configured administrator, non-administrator, and pending-user fixtures that are not part of this implementation.

## User Stories

### User Story 1 - Functional Homepage Navigation (Priority: P1)

As a visitor browsing the Library homepage, I can activate both prominent calls to action and reach the existing content they describe, so the homepage provides useful entry points instead of controls that appear broken.

**Why this priority**: These controls are primary navigation affordances visible to every Library visitor and currently fail on every activation.

**Independent Test**: Display `/library` and activate each control with pointer and keyboard input. Explore reaches the existing catalog/search content, while How It Works opens the existing Help Center.

### User Story 2 - Authenticated Administrator CSV Export (Priority: P1)

As an authorized administrator, I can export the filtered user directory as CSV through my existing authenticated session, so I can retrieve the intended report without an incorrect authentication failure.

**Why this priority**: The export is an existing administrator capability that is unusable in the production deployment even for a valid administrator.

**Independent Test**: Request export with an administrator session, then repeat with no session, a non-administrator session, an expired session, and forced failures to confirm authorization and feedback remain intact.

### User Story 3 - Reliable Authentication After Email Verification (Priority: P1)

As a newly registered user following a valid email-verification link, I arrive at the appropriate post-verification destination with a consistent authenticated session, so older authentication work cannot make the application appear logged out after verification succeeds.

**Why this priority**: The race breaks the account activation journey at its final step and presents contradictory server and client authentication states.

**Independent Test**: Open a valid verification link under controlled bootstrap, refresh, effect replay, and verification orderings. Verify one request survives setup-cleanup-setup, the live effect receives the result, authenticated state precedes redirect, reload restores the session, and failure paths never falsely authenticate.

## Acceptance Scenarios

### User Story 1 Scenarios

1. **Given** `/library` is displayed, **When** the visitor activates "Explore Library", **Then** focus and viewport reach the existing catalog without a duplicate destination or route transition.
2. **Given** `/library` is displayed, **When** the visitor activates "How It Works", **Then** the existing Help Center is opened.
3. **Given** a keyboard-only visitor has focused either control, **When** the standard keyboard action is used, **Then** the same destination opens as for pointer activation.
4. **Given** either control is activated rapidly more than once, **When** navigation begins, **Then** browser history and the resulting destination remain valid.

### User Story 2 Scenarios

1. **Given** a valid administrator session, **When** CSV export is requested, **Then** the request participates in the protected session and a CSV file is downloaded.
2. **Given** no valid session, **When** CSV export is requested, **Then** access is denied and no file is downloaded.
3. **Given** an authenticated non-administrator, **When** CSV export is requested, **Then** the server rejects it and no file is downloaded.
4. **Given** a valid administrator session, **When** export is performed repeatedly, **Then** every request is independent, every success produces a file, and no application data is modified.
5. **Given** backend or network failure, **When** export is requested, **Then** no invalid file is presented as successful and explicit feedback is shown.
6. **Given** the session expires during export, **When** the server evaluates the request, **Then** existing expired-session behavior applies without weakened authorization.

### User Story 3 Scenarios

1. **Given** a valid verification link and concurrent authentication initialization, **When** verification succeeds, **Then** final client state represents the verified server session and the destination renders authenticated.
2. **Given** older authentication work exists, **When** its unauthenticated result becomes available after verification, **Then** it cannot overwrite the newer authenticated transition.
3. **Given** verification succeeds, **When** the user immediately reloads, **Then** existing session bootstrap restores the verified user.
4. **Given** verification fails without establishing a session, **When** pending work settles, **Then** the client does not present the user as authenticated and preserves the approved recovery path.
5. **Given** verification and session refresh overlap, **When** all work settles, **Then** final state matches the authoritative server session.
6. **Given** authentication initialization finishes before verification, **When** verification later succeeds, **Then** the verified user is final before navigation.
7. **Given** verification is invoked before older initialization would otherwise settle, **When** all work completes, **Then** the earlier work cannot erase or invalidate the verified session.
8. **Given** explicit logout is invoked after older authentication work, **When** all work settles, **Then** the older work cannot restore the logged-out client.
9. **Given** a missing, invalid, expired, or consumed link, **When** verification is requested or repeated, **Then** the existing safe failure response appears without account disclosure.
10. **Given** React replays effect setup-cleanup-setup for one token, **When** verification settles, **Then** one request was started and its result is delivered only to the live effect subscription.
11. **Given** the verification page is left while work is pending, **When** the request settles, **Then** the abandoned subscription performs no page-local update or delayed redirect.

## Functional Requirements

- **FR-001 [US1]**: The "Explore Library" call to action MUST open the existing Library catalog browsing experience.
- **FR-002 [US1]**: The "How It Works" call to action MUST open the existing Help Center.
- **FR-003 [US1]**: Both homepage calls to action MUST support standard pointer and keyboard activation semantics.
- **FR-004 [US1]**: Each activation MUST produce one valid navigation outcome without a duplicate destination or corrupted browser history.
- **FR-005 [US1]**: The CTA fix MUST preserve labels, localization, styling, responsive layout, and light/dark theme behavior.
- **FR-006 [US2]**: CSV export from a valid administrator session MUST use the same protected session mechanism as other authenticated requests.
- **FR-007 [US2]**: Successful export MUST preserve the intended CSV download and active filters.
- **FR-008 [US2]**: Server authentication and administrator authorization MUST remain enforced for every export.
- **FR-009 [US2]**: Export MUST NOT expose session material, place secrets in a URL, create a second authentication mechanism, or bypass authorization.
- **FR-010 [US2]**: Unauthenticated, unauthorized, expired-session, network, and backend failures MUST remain explicit and MUST NOT appear as successful downloads.
- **FR-011 [US2]**: Repeated exports MUST be independent and MUST NOT modify application data.
- **FR-012 [US3]**: Successful verification MUST establish or retain the authoritative server-side session under existing rules.
- **FR-013 [US3]**: After successful verification, client authentication state MUST converge to the authoritative server-session user.
- **FR-014 [US3]**: Authentication work originating before a newer verification or logout MUST NOT overwrite that newer transition.
- **FR-015 [US3]**: Bootstrap, restoration, refresh, verification, and logout MUST be ordered so stale asynchronous results cannot become final client state.
- **FR-016 [US3]**: Post-verification navigation MUST begin only after authenticated client state is consistent with the established session.
- **FR-017 [US3]**: Immediate reload after successful verification MUST restore the authenticated user under existing session rules.
- **FR-018 [US3]**: Failed, invalid, expired, repeated, or interrupted verification MUST NOT falsely authenticate and MUST preserve recovery and anti-enumeration behavior.
- **FR-019 [US3]**: Authentication processing MUST NOT expose or log access, refresh, verification, or session secrets.
- **FR-020 [US3]**: Effect lifecycle replay MUST retain a live observer for the single verification result, while leaving the page MUST prevent abandoned local updates or redirect.
- **FR-021 [US1, US2, US3]**: The fixes MUST preserve unrelated homepage, Library, auth, protected-route, Admin Dashboard, localization, theme, and responsive behavior.

### Requirement Traceability

| User Story | Functional Requirements | Primary Success Criteria |
|------------|-------------------------|--------------------------|
| US1 | FR-001-FR-005, FR-021 | SC-001, SC-002, SC-008, SC-009 |
| US2 | FR-006-FR-011, FR-021 | SC-003, SC-004, SC-005, SC-008, SC-009 |
| US3 | FR-012-FR-021 | SC-006, SC-007, SC-008, SC-009 |

## Success Criteria

- **SC-001**: In acceptance testing, 100% of pointer and keyboard CTA activations reach the specified existing destination.
- **SC-002**: Across at least three rapid activations per CTA, every completed navigation is valid and no single activation causes a duplicate history transition.
- **SC-003**: With a valid administrator session, at least three consecutive exports each produce a readable filtered CSV with zero data mutations.
- **SC-004**: All tested unauthenticated, non-administrator, expired-session, and invalid-session export cases are denied without a file.
- **SC-005**: All tested backend and network export failures show explicit feedback and never present a failed response as a successful file.
- **SC-006**: Every tested bootstrap, refresh, verification, and effect-replay ordering ends with the authoritative authenticated state; setup-cleanup-setup starts exactly one verification request and delivers its result to the live subscription.
- **SC-007**: Every tested successful verification restores after immediate reload, while failed verification without a valid session never falsely authenticates.
- **SC-008**: Existing automated checks for login, logout, registration, session restoration, refresh, protected routes, administrator authorization, and verification failures complete without a new regression.
- **SC-009**: Relevant builds and automated tests complete successfully, and scope audit identifies zero unrelated feature changes or authentication-secret exposure.

## Edge Cases

- Rapid double-click or repeated keyboard activation of either CTA and browser back/forward navigation afterward.
- Several successful CSV exports with unchanged or changing filters.
- Session expiry, backend error, malformed response, or network interruption during export.
- Verification opened directly in a fresh tab with no prior client state.
- Missing, invalid, expired, consumed, reloaded, or repeatedly activated verification token.
- Bootstrap or refresh completing before or after verification, including late response-cookie transitions.
- React development setup-cleanup-setup replay, token change, actual page unmount, and remount.
- Immediate reload after verification success.
- Multiple concurrent authentication requests and explicit logout while refresh is pending.
- An unrelated authenticated user opening a verification link; final state follows the authoritative server session created by approved verification behavior.
