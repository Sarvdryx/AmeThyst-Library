# Feature Specification: Production Reliability for Authentication, Email Delivery, and Cross-Device Notifications

## 1. Problem Statement
The application currently faces three interconnected production and demo reliability challenges:
1. The client build can be blocked by malformed or duplicated authentication-page code. Furthermore, suspended users do not consistently receive clear suspension feedback across various connection states (active, idle, refreshing, reconnecting, logging in).
2. Registration and email-dependent workflows (verification, password recovery, invitations) are unreliable in the deployed demo environment. Email delivery failures leave persistent records in an unrecoverable state, preventing user onboarding.
3. Notification state is inconsistently synchronized across devices. Because read/unread markers are heavily reliant on browser-local storage and are only delivered during active connections, users experience diverging unread indicators, lost offline notifications, and inconsistent inbox states.

## 2. Target Users and Actors
* **Guest:** Registering a new account.
* **Pending User:** Verifying an email address.
* **Authenticated User:** Utilizing the platform, sending/receiving study group invitations.
* **Suspended User:** Attempting to access or currently accessing the system while suspended.
* **Administrator:** Suspending or restoring an account; publishing announcements; sending administrator invitations.
* **Study-group Member:** Receiving invitations or lifecycle notifications.
* **Librarian:** Publishing announcements.
* **System Operator:** Deploying and demonstrating the application locally and in production.

## 3. Scope

### 3.1. In Scope
* Resolving client validation/build blockers that affect authentication components.
* Ensuring consistent, clear account suspension messaging across active, idle, reload, reconnect, and login scenarios.
* Safely invalidating suspended users’ authenticated sessions and realtime connections.
* Enabling production email delivery compatibility with the deployed demo environment.
* Making failed email-dependent operations recoverable.
* Preserving existing email-sender caller behavior where practical.
* Persisting per-user notification content and read/unread state on the server.
* Providing centralized notification history retrieval and unread-count capabilities.
* Supporting "mark-one-as-read" and "mark-all-as-read" operations.
* Synchronizing new notifications and read-state changes across all active devices for a user.
* Safely transitioning away from browser-only notification states.
* Preserving existing English/Vietnamese localization, light/dark themes, responsive behavior, and accessibility standards.

### 3.2. Out of Scope
* Redesigning the notification bell, inbox UI, or authentication UI layout.
* Implementing mobile push notifications, SMS notifications, or desktop operating-system native notifications.
* Rebuilding or restructuring the entire authentication architecture.
* Modifying unrelated authorization rules or permissions.
* Reconstructing lifecycle notifications that were lost before this feature's deployment.
* Adding analytic tracking for notification interactions.
* Introducing new notification retention or automatic-deletion policies.
* Exposing raw, internal, administrative suspension notes to end-users.
* Refactoring unrelated client or server modules.

## 4. Business Rules
* **Authoritative Source:** The server-side account status is strictly authoritative. The server is authoritative for notification ownership, content, and read state.
* **Suspension Enforcement:** A suspended account must not retain authenticated access under any circumstance.
* **Consistent Feedback:** Every suspension entry path must lead to the same understandable user outcome. Public suspension messages must not expose internal-only administrative information.
* **Email Safety:** Email delivery failures must not silently create unrecoverable workflows. Anti-enumeration protections for registration and password recovery must be preserved.
* **Notification Access:** Users may access, retrieve, and mutate only their own notification state.
* **Idempotency:** Notification creation and read-state updates must be idempotent operations.
* **Migration Restrictions:** Valid browser-local read markers may only be used as migration hints and must be thoroughly verified by the server before acceptance.
* **Stability:** Existing unrelated behavior, user data, and functionality must remain intact.

## 5. Assumptions and Dependencies
* **Dependencies:**
  * Administrator panel functionality for suspending/restoring users is operational.
  * Realtime transport (socket) architecture is available.
  * Email sending infrastructure exists (even if failing).
* **Assumptions:**
  * Realtime events can be intercepted or broadcast specifically to connected user sessions.
  * Local read-state migration logic only needs to process valid server-recognized sources.
  * The demo environment has network constraints or configuration limitations that necessitate a more robust/compatible email delivery mechanism.

## 6. User Stories

### US1 — Reliable application access and suspended-account handling
* **Priority:** P1
* **Value:** Ensures the application is deployable, properly secures suspended accounts, and gives users clear, consistent feedback regarding their account status without creating infinite loops or exposing sensitive data.
* **Independent Test:** Validate that an administrator can suspend an active user with multiple devices, resulting in immediate, clear feedback on all devices, safe session invalidation, and prevention of any subsequent authenticated actions.
* **Scenarios:**
  * **Given** an active user is connected on multiple devices, **When** an administrator suspends the user, **Then** all active devices receive a clear suspension message within three seconds, and the session is securely invalidated.
  * **Given** a user is idle (backgrounded browser), **When** an administrator suspends them, **Then** the user does not remain in a stale authenticated state indefinitely and is notified upon returning or attempting an action.
  * **Given** a user is suspended, **When** the user attempts to log in via password or third-party provider, or refreshes their token, **Then** they receive the consistent suspension message without infinite redirect loops.
  * **Given** an administrator restores a previously suspended user, **When** the user logs in, **Then** they authenticate normally.

### US2 — Reliable and recoverable email-dependent flows
* **Priority:** P1
* **Value:** Prevents users from being permanently locked out of onboarding or critical workflows due to temporary email delivery failures, especially in demo environments.
* **Independent Test:** Intentionally fail the email delivery service during registration, then ensure the user can retry the verification process successfully once the service is restored, without compromising security.
* **Scenarios:**
  * **Given** the application is deployed in a demo environment, **When** a user registers, **Then** the verification email is successfully delivered using the compatible mechanism.
  * **Given** Brevo fails or times out during registration, **When** the operation concludes, **Then** the pending registration and token remain stored, the API returns `502`, and the user can retry through "Resend Verification Email" without creating a duplicate account.
  * **Given** a pending registration already has a token, **When** resend delivery fails, **Then** the previous token and expiry remain unchanged.
  * **Given** an email delivery fails, **When** an operator reviews the system diagnostics, **Then** the operational failure is recorded sufficiently for troubleshooting without exposing credentials, OTPs, or personal data.
  * **Given** an unauthorized user attempts to probe registered accounts via password recovery, **When** the request is made, **Then** the user-facing responses preserve existing account-enumeration protections regardless of email success/failure.

### US3 — Persistent cross-device notification inbox
* **Priority:** P2
* **Value:** Ensures users do not miss important lifecycle events or announcements when offline, and provides a synchronized, consistent read/unread experience across all their devices.
* **Independent Test:** Trigger an announcement while a user is offline, then have the user log in on two separate devices to verify the notification appears, and marking it as read on one device instantly updates the other.
* **Scenarios:**
  * **Given** a user is offline, **When** a study-group lifecycle notification or announcement is generated, **Then** the notification remains available and appears in the inbox upon their next successful connection.
  * **Given** a user is logged in on a desktop and a mobile device, **When** they mark a notification as read on the desktop, **Then** the mobile device's unread state updates to reflect the read marker within three seconds.
  * **Given** a study group invitation is accepted, denied, cancelled, or expires, **When** the source entity resolves, **Then** the system automatically marks the associated notification as read.
  * **Given** an administrator modifies an existing announcement, **When** they publish the changes, **Then** a new notification is generated (or reset to unread) only if the administrator explicitly chooses to notify users again.
  * **Given** a user has multiple unread notifications, **When** they trigger a mark-all-as-read action, **Then** all their active devices immediately reflect zero unread notifications for those specific items.
  * **Given** a user has a stale browser-local read marker, **When** they connect, **Then** the marker is only migrated if it corresponds to a server-recognized notification source, and arbitrary browser data does not corrupt the permanent inbox.

## 7. Functional Requirements

### Authentication and Suspension (US1)
* **FR-001:** The client application must pass compilation and validation without any blocking errors originating from the authentication provider or login page.
* **FR-002:** The system must intercept requests, realtime events, and token refreshes for suspended accounts, immediately terminating the session.
* **FR-003:** The system must push a suspension event to all active realtime connections belonging to a newly suspended user, causing the client to display a clear suspension message within 3 seconds.
* **FR-004:** The client must consistently handle active, idle, token-refresh, socket reconnect, password login, and third-party login attempts by presenting the same standardized suspension outcome.
* **FR-005:** The client must not enter a redirect loop, refresh loop, modal loop, or infinite socket reconnect loop upon discovering a suspended state.
* **FR-006:** The system must permit previously suspended users to log in normally immediately after an administrator restores their account.
* **FR-007:** The system must securely redact or omit internal administrative suspension notes from the public-facing suspension message.

### Email Reliability (US2)
* **FR-008:** The system must utilize an email delivery capability that functions correctly in the deployed demo environment for registration, password recovery, and invitations.
* **FR-009:** The system must allow users to re-trigger or retry email-dependent flows (e.g., resend verification, resend invitation) if a previous delivery attempt failed.
* **FR-010:** The system must ensure that a failure in email handoff does not persist the user's workflow record into an unrecoverable state. Initial delivery failure retains the pending registration and token and returns `502`. Failed resend delivery preserves the previous token and expiry. Repeated attempts must not create duplicate accounts while preserving anti-enumeration behavior for unknown addresses.
* **FR-011:** The system must record email delivery errors in operational logs for diagnostic purposes without including user passwords, verification tokens, or OTPs.
* **FR-012:** The system must obscure account existence during email failures, ensuring responses to password recovery or registration do not violate anti-enumeration policies.
* **FR-013:** The local development environment must be capable of exercising email flows without requiring real production delivery credentials.

### Cross-Device Notifications (US3)
* **FR-014:** The system must persist user-specific notifications (announcements, invitations, lifecycle events) on the server.
* **FR-015:** The system must allow authenticated users to retrieve their persistent notification history, including offline events.
* **FR-016:** The system must track notification read/unread state on a per-account basis on the server, rather than relying exclusively on browser-local storage.
* **FR-017:** The system must support idempotent operations to mark a single notification as read, and to mark all accessible notifications as read.
* **FR-018:** The system must broadcast read-state changes to all currently connected devices of the owning user, updating the UI within 3 seconds.
* **FR-019:** The system must reject read/unread updates or retrieval requests for notifications not owned by the requesting user.
* **FR-020:** The system must ignore or filter duplicate realtime notification events generated by socket reconnects or retries, preventing duplicate inbox entries.
* **FR-021:** The system must safely migrate existing local read markers to the server only if the server can cryptographically or structurally verify the notification source.
* **FR-022:** The system must reject arbitrary or unrecognized notification payload data supplied by the browser during state synchronization.
* **FR-023:** The system must automatically mark study group invitation notifications as read when the underlying invitation is accepted, denied, cancelled, or expires.
* **FR-024:** The system must not change the read state of existing announcement notifications when an announcement is updated, unless the administrator explicitly opts to notify users again.

## 8. Success Criteria

* **SC-001:** The client application successfully completes its existing CI/CD build validation with zero blocking compilation errors.
* **SC-002:** In automated or manual tests, a connected user whose account is suspended receives a clear suspension UI message within three seconds (assuming normal network latency), and cannot successfully perform any subsequent authenticated API actions.
* **SC-003:** All supported authentication entry points (reload, reconnect, password, third-party) correctly halt and inform a suspended user without triggering infinite request loops.
* **SC-004:** In the deployed demo environment, 100% of triggered registration verification emails either complete delivery handoff successfully or provide a safe recovery/retry path.
* **SC-005:** Diagnostic logs for simulated email failures contain sufficient context to identify the failure point but contain zero exposed sensitive credentials or tokens.
* **SC-006:** A test user offline during a system announcement or invitation sees the notification appear in their inbox upon their next successful login.
* **SC-007:** Marking a notification as read on Device A causes the unread indicator on Device B to decrement/update within three seconds (assuming normal network latency).
* **SC-008:** Automated security tests confirm that User A cannot retrieve, mark as read, or delete User B's notifications.
* **SC-009:** Manual regression tests confirm that existing app localization, themes, and responsive UI layouts remain intact and functional.

## 9. Edge Cases
* An administrator suspends a user who currently has multiple devices connected, including one device with a spotty connection.
* A user is suspended while their browser tab is completely backgrounded/idle and the socket has gone to sleep.
* A suspension occurs precisely while an API request or token refresh is currently in flight.
* A socket disconnection occurs before the suspension event can be fully delivered to the client.
* A suspended user attempts to open the application in a new incognito window or completely different browser.
* The external email provider accepts the connection but times out or returns an unexpected HTTP 5xx response.
* A user rapidly double-clicks the "Resend Email" button, triggering concurrent retry requests.
* A database transaction commits the newly registered account, but the subsequent email delivery fails immediately, resulting in a recoverable pending/unverified state without application access.
* Two separate devices mark the exact same notification as read at the exact same millisecond.
* A user connects after being offline for weeks and has missed hundreds of notifications.
* The server sends a realtime notification, the connection drops, reconnects, and sends the notification again (duplicate realtime delivery).
* A user's browser-local storage contains a manually manipulated, forged read marker for a non-existent notification ID.
* An administrator modifies or republishes an announcement that some users have already marked as read without opting to notify users again.
* A study group invitation is accepted, denied, cancelled, or expires, and the system must automatically sync its read state.
