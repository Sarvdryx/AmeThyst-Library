# Contract: Email Verification Session Ordering

## Serialized Operations

The following browser-side operations share one invocation-ordered session boundary:

1. Initial authentication bootstrap and explicit AuthProvider refresh.
2. Shared API session refresh after an authentication failure.
3. Email verification, server-session establishment, and verified-user publication.
4. Explicit logout and final client-session clearing.

Each operation begins only after the previously invoked operation settles. A rejected operation releases the boundary so later recovery can proceed.

## Successful Verification

- The existing verification request establishes the protected server session.
- The returned session user is published to global client authentication state before success navigation is scheduled.
- Earlier bootstrap or refresh work cannot settle afterward and erase or replace the verified state/cookies.
- The existing role-based post-verification destination is preserved.
- Immediate reload restores the session through existing bootstrap behavior.

## Effect Lifecycle Ownership

- The verification page keeps a page-local token/promise pair for its current in-flight verification.
- One page mount shares that request promise only while subsequent effect setups observe the same token.
- React development setup-cleanup-setup for the same token starts the request once.
- Cleanup deactivates the abandoned subscription but does not prevent the next setup from observing the in-flight or settled result.
- Only the live subscription may update verification-page status or schedule navigation.
- A different token replaces the page-local pair and starts an independent verification request; its subscriber never observes the previous token's result.

## Failure and Recovery

- Missing, invalid, expired, used, or failed verification does not publish a user.
- Existing token lifecycle, messages, recovery controls, and anti-enumeration protections remain unchanged.
- Navigating away unsubscribes page-local result delivery and cancels redirect timers; it does not log secrets.
- A failed queued operation does not prevent a later bootstrap, verification, refresh, or logout operation.

## Logout Ordering

- If refresh was invoked before logout, logout executes after it and remains final.
- If logout was invoked before a later refresh, that refresh observes the logged-out server session and cannot restore the old authenticated state.
- No queued operation stores access, refresh, verification, or CSRF token values.
