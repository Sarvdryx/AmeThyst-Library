# Research: Book Wishlist and Dashboard Integration

## Introduction

This document details the architectural decisions, design patterns, and research findings for implementing the user wishlist feature, Postgres-to-Memgraph synchronization, and dashboard integration.

## Design Decisions & Rationale

### 1. Wishlist Authorization Boundaries
- **Decision**: Restrict all wishlist CRUD and fetch endpoints to authenticated users possessing the `user` role only.
- **Rationale**: The user explicitly requested to make the feature available to regular logged-in users only. Librarians and admins have distinct administrative tasks and do not interact with book borrowing or personal wishlists. Enforced via Express middlewares:
  ```javascript
  import { verifyToken } from '../middlewares/auth.middleware.mjs';
  import { authorizeRole } from '../middlewares/role.middleware.mjs';
  
  router.post('/:bookId', verifyToken, authorizeRole('user'), addWishlist);
  ```
- **Alternatives Considered**: 
  - Allowing any authenticated role to have a wishlist. *Rejected* because admins/librarians do not have dashboard borrowing profiles or recommendation feeds, making wishlists irrelevant for them.

### 2. Memgraph Synchronization Design Pattern
- **Decision**: Perform real-time, non-blocking synchronization from the backend service layer (`wishlist.services.mjs` calling `memgraphSync.services.mjs`).
- **Rationale**: Graph-based recommendations need to reflect immediate changes in user preferences. Running the sync asynchronously (without awaiting it before returning the API response) ensures a responsive user interface (<300ms latency) while keeping Memgraph up to date. Any connection issues to Memgraph are caught and logged without failing the main transaction.
- **Alternatives Considered**:
  - Out-of-band background worker scanning Postgres WAL/change data capture. *Rejected* due to complexity and lack of infrastructure support in the current workspace.
  - Blocking sync (awaiting Memgraph write before responding). *Rejected* because Memgraph connection drops would cause library details or wishlist additions to fail for users.

### 3. Idempotent Graph Operations
- **Decision**: Use Cypher `MERGE` query patterns in Memgraph synchronization:
  - **Adding**:
    ```cypher
    MERGE (u:User {id: $userId})
    MERGE (b:Book {id: $bookId})
    MERGE (u)-[r:WISHLISTED]->(b)
    ON CREATE SET r.added_at = $addedAt
    ```
  - **Removing**:
    ```cypher
    MATCH (u:User {id: $userId})-[r:WISHLISTED]->(b:Book {id: $bookId})
    DELETE r
    ```
- **Rationale**: Prevents duplicate relationships or orphaned edges in case of client double-clicks or retried sync queries.
- **Alternatives Considered**: 
  - Using `CREATE` statement. *Rejected* because it creates multiple duplicate `WISHLISTED` relationships between the same user and book.

### 4. User Dashboard Layout Adaptation
- **Decision**: Modify `/dashboard/user/recommendations` page to display:
  - **Upper Row**: "Based on your reading history" (consolidated recommendations carousel).
  - **Lower Row**: "My Wishlist" (new wishlist carousel).
- **Rationale**: Reserves the upper row for recommendations and places the user's wishlist in a clean, scrollable horizontal list on the bottom row, ensuring a balanced, structured dashboard view.
- **Alternatives Considered**:
  - Displaying three rows. *Rejected* to avoid visual clutter and strictly adhere to the user's layout constraint.
