# Implementation Plan: Book Wishlist and Dashboard Integration

**Branch**: `026-book-wishlist` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-book-wishlist/spec.md`

## Summary

Add wishlist support (interactive heart icon) to the book details page and integrate it into the user dashboard recommendations page (occupying the lower line, while reserving the upper line for recommendations). Backend changes will persist the wishlist entries in PostgreSQL (`user_wishlist`) and sync them to Memgraph in real-time. Access to the wishlist features will be restricted strictly to logged-in users with the `user` role.

## Technical Context

**Language/Version**: ReactJS/Next.js (v14+ App Router), Node.js (v18+, ES Modules, Express v5.2.1)

**Primary Dependencies**: `lucide-react` (for the heart icon), `pg` (v8.21.0) for PostgreSQL pool queries, `neo4j-driver` (v6.2.0) for Memgraph bolt connections.

**Storage**: PostgreSQL (primary relational store) and Memgraph (secondary property graph database).

**Testing**: Jest (v25.0.0, running with experimental VM modules for ES modules) for backend tests.

**Target Platform**: Web browsers, Node.js server.

**Project Type**: Full-stack web application.

**Performance Goals**: Wishlist toggle click registers and updates UI in <300ms, database sync in <500ms, dashboard recommendations page loads in <1.5s.

**Constraints**:
- Wishlist operations are restricted to logged-in users with `role: 'user'`. Users with roles `admin` and `librarian` are forbidden from using these endpoints.
- Synchronization must be idempotent to prevent duplicate edge generation.
- Memgraph service downtime must not crash the primary API or block PostgreSQL writes.

**Scale/Scope**: Scales to match catalog size and active user sessions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Component-Driven & Reusability**: Checked and passed. The interactive heart icon will be built as an Atomic design component (e.g. `WishlistHeart` under `components/atoms` or `components/molecules`).
- **Principle VII: Layered Architecture**: Checked and passed. Request flows from Route -> Middleware (Auth & Role) -> Controller -> Service -> Model.
- **Principle IX: Theme & i18n Localization**: Checked and passed. Wishlist strings, tooltips, and toast notifications will be added to translation files (`en.json`, `vi.json`). CSS will support light/dark modes utilizing design tokens.

## Project Structure

### Documentation (this feature)

```text
specs/026-book-wishlist/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Specification Quality Checklist
└── contracts/
    └── wishlist-contract.md # API interface contract
```

### Source Code (repository root)

```text
client/
├── app/
│   ├── components/
│   │   ├── atoms/
│   │   │   └── WishlistHeart.tsx       # [NEW] Interactive heart button UI component
│   │   └── organisms/
│   │       └── RecommendationCarousel.tsx # [MODIFIED] Shared carousel to support wishlist context
│   ├── dashboard/
│   │   └── user/
│   │       └── recommendations/
│   │           └── page.tsx            # [MODIFIED] Display upper recommendations row and lower wishlist row
│   └── library/
│       └── [id]/
│           └── page.tsx                # [MODIFIED] Load wishlist status and trigger wishlist operations
server/
├── src/
│   ├── controllers/
│   │   └── wishlist.controllers.mjs    # [NEW] Controllers for wishlist REST endpoints
│   ├── models/
│   │   └── wishlist.models.mjs         # [NEW] Postgres query model for wishlist table
│   ├── routes/
│   │   └── wishlist.routes.mjs         # [NEW] Router exposing wishlist endpoints
│   ├── services/
│   │   ├── memgraphSync.services.mjs   # [MODIFIED] Added syncWishlistAdd/syncWishlistRemove operations
│   │   └── wishlist.services.mjs       # [NEW] Services for wishlist coordination and Memgraph syncing
│   └── server.mjs                      # [MODIFIED] Register wishlist.routes.mjs router
```

**Structure Decision**: Full-stack workspace modifications. The client codebase uses the Next.js App Router and atomic design components. The server codebase uses the established layered Express architecture with `.mjs` ES modules.

## Complexity Tracking

*None*
