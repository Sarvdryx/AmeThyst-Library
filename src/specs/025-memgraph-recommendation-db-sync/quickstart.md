# Quickstart: Memgraph Recommendation DB Synchronization

This guide helps setup, initialize, and verify the Memgraph Recommendation DB Synchronization feature.

---

## 1. Environment Configurations
Ensure your `.env` file in `server/` and `database/` includes the correct credentials for the Memgraph service:
```bash
MEMGRAPH_URI=bolt://localhost:7687
MEMGRAPH_USER=amethyst_user
MEMGRAPH_PASSWORD=amethyst_pass
```

---

## 2. Ingest Baseline Data (Graph DB Initialization)
To wipe the old graph context and perform full ingest of users, books, branch locations, search history logs, user wishlists, and recommendations:

1. Ensure the Memgraph database container is running:
   ```bash
   cd database
   docker-compose up -d memgraph
   ```
2. Place the CSV baseline data in the local directory matching the import settings.
3. The system automatically checks and initializes the Memgraph schema and performs the baseline ingestion from the CSV files on server startup if the graph is empty. Simply booting the backend service triggers this:
   ```bash
   cd server
   npm run dev
   ```

---

## 3. Verify Graph Synchronization in Real-Time
1. Boot the backend server in dev mode:
   ```bash
   cd server
   npm run dev
   ```
2. Use the application API or UI to trigger wishlist additions/removals.
3. Query Memgraph using `mgconsole` or Memgraph Lab (`http://localhost:3000` or port 3000 depending on docker setup) to confirm relationships exist:
   ```cypher
   # Find all wishlisted relationships
   MATCH (u:User)-[r:WISHLISTED]->(b:Book) RETURN u, r, b LIMIT 10;

   # Find recommendation interaction counts
   MATCH (u:User)-[r:RECOMMENDED]->(b:Book)
   RETURN r.is_clicked, count(r);
   ```

---

## 4. Run Sync Integration Tests
To run verification tests for the synchronization services:
```bash
cd server
npm test tests/memgraphSync.test.mjs
```
