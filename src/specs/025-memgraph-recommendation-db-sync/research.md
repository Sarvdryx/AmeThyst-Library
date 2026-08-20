# Research Notes: Memgraph Recommendation DB Synchronization

This document covers research findings and architecture choices for the Memgraph Recommendation DB Synchronization system.

---

## Decision 1: Graph Database Schema Representation for Recommendations

### Choice
We will model User Wishlists, Recommendations, and Search History as property relationships (edges) in the graph, rather than separate node types:
- **User Wishlist**: `(u:User)-[:WISHLISTED {added_at: String}]->(b:Book)`
- **Search History**: `(u:User)-[:SEARCHED {search_id: String, created_at: String, query: String}]->(b:Book)`
- **Recommends**: `(u:User)-[:RECOMMENDED {showed_at: String, is_clicked: Boolean, renewed_at: String}]->(b:Book)`

### Rationale
- In graph databases, relationships between key entities (like `User` and `Book`) are first-class citizens and should carry metadata directly on the edge when the relationship represents a transient state or transaction.
- Using relationships instead of intermediate nodes (e.g., `WishlistNode`, `SearchNode`) reduces the number of node hops, simplifying and speed-optimizing Cypher queries for recommendation engines (e.g., collaborative filtering or graph walks).
- If a user performs a search but does not click a book, it is kept in the primary PostgreSQL database for audit/reporting but is not represented as an edge in the graph, as graph recommendations depend on user-to-item interactions.

### Alternatives Considered
- **Intermediate Action Nodes**: Creating nodes like `(s:SearchHistory)` or `(w:WishlistItem)`. This was rejected because it introduces unnecessary hops and query complexity without providing extra graph traversal value.

---

## Decision 2: Synchronization Strategy (Application-Level vs. DB-Level)

### Choice
We will use application-level service hooks inside the Node.js Express service layer. When database writes succeed in PostgreSQL models/services, we call the corresponding async function in `memgraphSync.services.mjs`.

### Rationale
- **Maintainability & Consistency**: The project constitution enforces a strict layered architecture (`Controller -> Service -> Model`). Triggering graph updates inside the service layer keeps DB logic cohesive and easy to trace.
- **Testing**: Using application-level services allows us to unit-test and integration-test the synchronization handlers using standard Jest mocks.
- **Pre-existing Pattern**: The project already implements this pattern via `syncUserToMemgraph`, `syncBookToMemgraph`, `syncInventoryToMemgraph`, and `syncBorrowToMemgraph` in `memgraphSync.services.mjs`.

### Alternatives Considered
- **PostgreSQL Triggers & pg_notify**: Using database triggers to notify a listener process. Rejected because it adds deployment complexity, requires custom database extensions/listeners, and makes testing and mocking more difficult.

---

## Decision 3: Idempotency and Resilience

### Choice
1. **Idempotency**: All Cypher update queries will utilize `MERGE` and conditional `SET` clauses rather than simple `CREATE` commands.
2. **Resilience**: Graph database synchronization calls will be non-blocking. If a connection to Memgraph fails, the application will catch the error, log it as a warning, and allow the primary user action (PostgreSQL) to proceed uninterrupted.

### Rationale
- Idempotency guarantees that if a sync operation is retried or executed twice due to application-level retry or network jitter, it will not create duplicate edges.
- Since Memgraph is a secondary database for recommendation acceleration, its availability must never compromise core transaction functionality (e.g. users must still be able to borrow books or edit wishlists even if the graph DB is temporarily offline).

### Cypher Ingestion Queries (for automatic startup initialization)

#### Wishlist Baseline Ingestion:
```cypher
LOAD CSV FROM $wishlists_url WITH HEADER AS row
MATCH (u:User { id: row.user_id })
MATCH (b:Book { id: row.book_id })
MERGE (u)-[r:WISHLISTED]->(b)
SET r.added_at = row.added_at;
```

#### Recommendation Baseline Ingestion:
```cypher
LOAD CSV FROM $recommends_url WITH HEADER AS row
MATCH (u:User { id: row.user_id })
MATCH (b:Book { id: row.book_id })
MERGE (u)-[r:RECOMMENDED]->(b)
SET r.showed_at = row.showed_at,
    r.is_clicked = toBoolean(row.is_clicked),
    r.renewed_at = row.renewed_at;
```
