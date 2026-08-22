# Research: Navigation, Export, and Authentication Reliability

## Decision 1 — Existing CTA Destinations

**Decision**: “Explore Library” targets the catalog/search region already rendered below HeroSection on `/library`. “How It Works” navigates to the existing `/help` route.

**Rationale**: HeroSection is part of `client/app/library/page.tsx`, so routing “Explore Library” back to `/library` would remain a user-visible no-op. HomeLayout renders SearchBar and PopularPublishes immediately below it. The localized Help Center already explains the full product workflow and is linked by the footer, establishing `/help` as the intended explanatory destination.

**Alternatives considered**:

- Route “Explore Library” to `/library`: rejected because the control is already on that route and would not reach the catalog content.
- Create a new homepage section or route: rejected because equivalent content already exists and is out of scope.
- Route “How It Works” to a guessed anchor: rejected because no existing explanatory homepage section was found.

## Decision 2 — CTA Interaction Primitive

**Decision**: Retain the existing native Button controls. Focus and scroll the catalog region for Explore; use the established App Router for Help, with a guard against repeated in-progress route pushes.

**Rationale**: This is the smallest change that preserves exact visual variants, keyboard activation, localization, theme, and responsive layout. Moving focus to a focusable catalog region provides a meaningful keyboard/screen-reader transition.

**Alternatives considered**:

- Wrap Button in a link: rejected because nested interactive controls are invalid.
- Extend the shared Button into a polymorphic component: rejected as unnecessary cross-component scope.
- Duplicate Button classes on a new link: rejected because styling would drift from the existing atom.

## Decision 3 — CSV Authentication

**Decision**: Add `credentials: 'include'` to the existing direct export fetch and make no backend authorization change.

**Rationale**: Shared `apiFetch` already opts into credentials. Production supports a cross-origin client/API configuration, protected access/refresh cookies, credentialed CORS, and cookie lookup in `verifyToken`. The CSV endpoint is already protected by authentication and `authorizeRole('admin')`.

**Alternatives considered**:

- Put a token in the URL or Authorization header: rejected because protected cookie contents are intentionally unavailable to client JavaScript.
- Replace the download flow with shared JSON API handling: rejected because the endpoint returns a CSV blob and the existing blob lifecycle is correct.
- Relax server middleware: rejected as a security regression.

## Decision 4 — Authentication Concurrency Strategy

**Decision**: Serialize browser-side session-changing operations through one promise queue shared by AuthProvider bootstrap/refresh, shared API refresh, email verification, and logout.

**Rationale**: Ordering state updates alone is insufficient. The older `/auth/refresh` response can clear or replace cookies using response headers after verification created a new session. Serial execution prevents both late client state and late cookie mutations, remains compatible with the current Context/fetch design, needs no dependency, and directly defines logout ordering.

**Alternatives considered**:

- Request generation/version guard: useful for React state, but rejected as the sole solution because it cannot stop late response cookies from changing the browser session.
- AbortController: rejected as the sole solution because aborting observation of a request does not provide a sufficient guarantee that the server did not process it or that response cookie effects cannot race.
- Skip AuthProvider bootstrap only on the verification route: rejected because it is route-specific and does not address shared refresh or logout overlap.
- Re-run refresh after verification without coordination: rejected because a stale response can still settle afterward and win.
- Server-wide session architecture replacement: rejected as disproportionate and out of scope.

## Decision 5 — Verification Publication and Redirect

**Decision**: Treat the verified user returned with the newly established server session as authoritative, publish it inside the serialized operation, and start the existing delayed role-based redirect only after the live page subscription receives the result.

**Rationale**: The server creates the session and returns its user payload in one response. Fetch applies response cookies before resolving. Publishing inside the queue prevents a subsequent queued operation from starting before the client state is consistent.

**Alternatives considered**:

- Only call `setCurrentUser` after an uncoordinated verification: rejected because the bootstrap race remains.
- Add a second mandatory session lookup before success: rejected because a transient extra network failure could incorrectly turn a completed verification into an unrecoverable-looking failure.
- Redirect immediately: rejected because the authenticated client state would not be guaranteed before route guards render.

## Decision 6 — Verification Effect Lifecycle

**Decision**: Keep a page-local ref containing the current verification token and its in-flight promise. A setup for the same token reuses that promise; a setup for a different token replaces the pair with a new request. Each effect setup owns a `subscribed` flag and redirect timer, so cleanup deactivates only that observer and React development setup-cleanup-setup can attach a new live observer to the same-token result.

**Rationale**: A one-way `hasVerified` ref prevents a duplicate request but leaves the second Strict Mode effect setup with no result observer after the first setup cleans itself up. A promise-only ref would incorrectly reuse token A for token B. Pairing token and promise preserves same-token request idempotence, starts independent work for genuine token changes, and keeps the page-specific responsibility in the page rather than a shared utility.

**Alternatives considered**:

- One-way `hasVerified` flag: rejected because cleanup disables the only observer and the second setup returns early.
- Promise-only ref: rejected because a surviving component could reuse token A's promise after the URL changes to token B.
- Start a new request on every setup: rejected because development replay would consume the same token twice.
- Module-global permanent token cache: rejected because it would outlive the page mount and retain verification identifiers beyond the required lifecycle.

## Decision 7 — Data Model and Backend Runtime

**Decision**: No data model, migration, backend controller, route, middleware, or service change.

**Rationale**: All three failures arise from missing client behavior or client request/operation ordering. The existing catalog, Help Center, CSV endpoint, administrator checks, verification session creation, and protected cookies already provide the required product behavior.
