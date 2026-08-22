# Research & Design Decisions: AI Recommendation System Infrastructure (No Redis)

## Feature Context
This feature establishes the end-to-end infrastructure for serving real-time, low-latency (< 50ms) AI book recommendations and automating the CI/CD retraining pipeline connecting PostgreSQL, Memgraph, and GitHub Actions, simplified to operate without external Redis dependencies.

---

## Technical Decisions & Rationale

### 1. Vector Feature Storage Strategy: Memgraph Node Properties & Python Process Memory

- **Decision**: Store GraphSAGE node embeddings directly on Memgraph `Book` and `User` node properties (`n.features` / `n.embedding`) and cache vectors in-memory within the Python socket prediction server (`predict_server.py`).
- **Rationale**:
  - Eliminates the operational complexity, memory overhead, and security maintenance of an external Redis service.
  - Memgraph natively holds node properties in RAM, enabling fast Cypher vector lookups (`MATCH (b:Book) WHERE b.id IN $ids RETURN b.id, b.features`).
  - In-memory vector caching in `predict_server.py` allows sub-10ms scoring for active users and candidates during scoring sessions.
- **Alternatives Considered**:
  - *Cloud Redis Feature Store*: Rejected per user architectural mandate to avoid extra Redis infrastructure.
  - *PostgreSQL pgvector lookups during live scoring*: Evaluated, but direct Memgraph query or in-memory array access delivers lower latency for graph candidate scoring.

---

### 2. Synchronization Pipeline: Direct Memgraph GraphSAGE Training (`GraphSAGE.py`)

- **Decision**: `GraphSAGE.py` trains topological representations directly on the Memgraph graph and attaches feature vectors back to node properties in Memgraph.
- **Rationale**:
  - Keeps graph topology and node embedding features strictly synchronized in a single database.
  - Snapshot export (`Model_snapshot.py`) captures both graph structure and node embeddings seamlessly.
- **Alternatives Considered**:
  - *Exporting embeddings to disk CSV/NPY files*: Evaluated, but storing on graph nodes in Memgraph allows unified database backups and query execution.

---

### 3. Serving Engine Architecture: Persistent TCP Socket Server + LightGBM

- **Decision**: Retain the persistent Python socket server (`predict_server.py`) on port `5001`, fetching candidate embeddings from Memgraph / in-memory cache and evaluating LightGBM ranking.
- **Rationale**:
  - Raw TCP socket IPC between Node.js and Python maintains sub-5ms communication latency.
  - LightGBM booster model (`lgb.Booster`) evaluates candidate feature rows in < 10ms.

---

### 4. Continuous Integration & Deployment: Simplified GitHub Actions Workflow

- **Decision**: Configure `.github/workflows/action-retrain.yml` with sequential deployment stages:
  1. Pull latest relational data from PostgreSQL into local training container.
  2. Execute GraphSAGE training (`GraphSAGE.py`).
  3. Execute LightGBM ranker training (`LightGBM.py`).
  4. Export Memgraph snapshot artifact (`Model_snapshot.py`).
- **Rationale**:
  - Provides atomic deployment without requiring Redis container setup or feature store synchronization scripts.
