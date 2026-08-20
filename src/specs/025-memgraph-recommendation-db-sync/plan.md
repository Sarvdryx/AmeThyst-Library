# Implementation Plan: Memgraph Recommendation DB Synchronization

**Branch**: `024-memgraph-recommendation-db-sync` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-memgraph-recommendation-db-sync/spec.md`

## Summary

The Memgraph Recommendation DB Synchronization feature extends the existing Memgraph-based secondary graph database and synchronization mechanisms. It incorporates new nodes and relationships (User Wishlists, Search History, and Recommendation logs) to feed graph-based recommendation systems. Real-time, non-blocking synchronization functions will be integrated into the Node.js Express service layer (`memgraphSync.services.mjs`), ensuring that changes in the primary PostgreSQL database are immediately reflected in Memgraph.

## Technical Context

**Language/Version**: Node.js v18+ (ES Modules, Express v5.2.1)

**Primary Dependencies**: `neo4j-driver` (v6.2.0) for Memgraph bolt connections, `pg` (v8.21.0) for PostgreSQL pool queries, and `dotenv` (v17.4.2) for config management.

**Storage**: PostgreSQL (primary relational store, source of truth) and Memgraph (secondary property graph database).

**Testing**: Jest (v25.0.0, running with experimental VM modules for ES modules).

**Target Platform**: Linux/Windows Node.js application server container environment.

**Project Type**: Web-service backend API.

**Performance Goals**: Graph database sync operations must be non-blocking (asynchronous) relative to the primary client response and complete in under 500ms under normal operating load.

**Constraints**:
- Synchronization must be idempotent to prevent duplicate edge generation.
- Memgraph service downtime must not crash the primary API or block PostgreSQL writes.
- High consistency must be maintained for user wishlist modifications.

**Scale/Scope**: Scales to match PostgreSQL transactional updates. Automatic Memgraph initialization and baseline seeding occurs on application startup if the graph is empty, loading baseline dataset (thousands of books, users, branches, search log events, and borrowing relationships).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle VI & VIII (Directory Structure & Imports)**: The feature uses existing structure folders `server/src/config`, `server/src/models`, `server/src/services`, `server/src/routes`. Imports must use relative `.mjs` paths. (PASSED)
- **Principle VII (Layered Architecture)**: Requests flow from `Route` -> `Middleware` -> `Controller` -> `Service` -> `Model`. The Memgraph sync triggers will be implemented strictly within the service layers (or model callbacks where appropriate) without leaking DB logic to controllers. (PASSED)
- **Principle IX (i18n & Theme)**: Out of scope as this is a database-level, backend-only feature. (PASSED)

## Project Structure

### Documentation (this feature)

```text
specs/024-memgraph-recommendation-db-sync/
├── plan.md              # This file
├── research.md          # Phase 0 output (Graph schema design, synchronization patterns)
├── data-model.md        # Phase 1 output (Entities, fields, Cypher queries, validation)
├── quickstart.md        # Phase 1 output (How to setup and run)
├── checklists/
│   └── requirements.md  # Specification Quality Checklist
└── contracts/
    └── sync-contract.md # Service-level synchronization contracts
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── config/
│   │   ├── memgraph.mjs                  # Memgraph database driver configuration
│   │   └── postgres.mjs                  # PostgreSQL pool configuration
│   ├── models/
│   │   ├── history.models.mjs            # Postgres queries for search logs
│   │   └── [NEW] wishlist.models.mjs     # Postgres queries for wishlist CRUD
│   ├── services/
│   │   ├── history.services.mjs          # Search services coordinating PG + Memgraph sync
│   │   ├── memgraphSync.services.mjs     # Graph-specific synchronization operations
│   │   └── [NEW] wishlist.services.mjs   # Wishlist services coordinating PG + Memgraph sync
│   └── server.mjs                        # Backend server initialization
└── tests/
    └── [NEW] memgraphSync.test.mjs       # Integration tests for graph sync
```

**Structure Decision**: A single backend-focused directory model matching the established layered Express architecture in `server/src/`. No frontend components are modified.
