# Feature Specification: AI Recommendation System Infrastructure & Cloud Deployment Pipeline

**Feature Branch**: `032-deploy-ai-recommendation`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "032-deploy-ai-reccommedation, modify the specification to avoid using redis."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Low-Latency Recommendation Serving (Priority: P1)

As a library user, I want instant personalized book recommendations on my dashboard so that I can discover relevant books without delay or slow loading times.

**Why this priority**: Delivering low-latency, personalized recommendations directly impacts user engagement and discovery experience on the digital library platform.

**Independent Test**: Can be tested independently by issuing recommendation requests for existing users to the backend recommendation endpoint and verifying response latency (< 50ms) and relevance of returned book candidates.

**Acceptance Scenarios**:

1. **Given** a logged-in library user requesting recommendations, **When** the recommendation engine fetches candidates and scores them, **Then** ranked recommendations are returned within low-latency bounds (< 50ms total response time).
2. **Given** a candidate book that has zero available copies in physical branch inventories, **When** recommendations are generated and scored, **Then** out-of-stock items are filtered out or penalized to ensure only available books are actively recommended.

---

### User Story 2 - Automated Graph & Feature Synchronization (Priority: P2)

As a system administrator or automated CI/CD pipeline, I want retrained GraphSAGE embeddings and graph topology automatically synchronized to the Memgraph database instance, so that online serving always utilizes up-to-date model representations without manual deployment steps.

**Why this priority**: Automated synchronization ensures ML model freshness, eliminates manual error-prone deployment steps, and maintains seamless alignment between relational data and graph models.

**Independent Test**: Can be tested independently by triggering the automated retraining pipeline via workflow dispatch and verifying that updated node embeddings and graph nodes/relationships are refreshed in Memgraph.

**Acceptance Scenarios**:

1. **Given** a scheduled or manually triggered retraining job in GitHub Actions, **When** GraphSAGE representation training completes, **Then** user and item embedding vectors are attached directly to graph nodes in Memgraph and cached in the local prediction server memory.
2. **Given** a validated graph snapshot and retrained model artifacts, **When** the cloud deployment step executes, **Then** the live graph database is updated with transaction safety and memory trimming.

---

### User Story 3 - High-Throughput Micro-Ranking with Dual Feature Integration (Priority: P3)

As an AI scoring service, I want to combine graph node embeddings, real-time dot-product similarity, session metadata, and skip penalties, so that users receive diverse and non-repetitive book suggestions.

**Why this priority**: Enhances recommendation quality by combining deep structural graph embeddings with real-time tabular context and impression history.

**Independent Test**: Can be tested independently by passing candidate feature payloads into the scoring engine and verifying score adjustments based on user-item embedding dot products and impression skip penalties.

**Acceptance Scenarios**:

1. **Given** candidate books retrieved from graph prediction queries, **When** evaluated by the scoring engine alongside user embedding vectors retrieved from graph storage or memory cache, **Then** candidates are ranked based on combined vector similarity, session context, and item availability.
2. **Given** books previously shown to a user but left unclicked across multiple sessions, **When** fresh recommendations are generated, **Then** a progressive skip penalty factor is applied to prevent repetitive recommendations.

---

### Edge Cases

- **Cold-Start User / Missing Embedding**: When a new user has no graph interactions or missing embedding vector, the system MUST fallback gracefully to baseline zero-vector representation combined with catalog popularity and rating metrics without failing the API request.
- **Graph Database Unreachable**: If the Memgraph instance is temporarily offline or unreachable, the scoring engine MUST fall back to local LightGBM model predictions or Postgres trending candidates seamlessly.
- **Pipeline Interruption / Network Timeout**: If a deployment step fails during cloud restoration, the pipeline MUST abort safely without leaving the live graph in a corrupted state, emitting clear diagnostic logs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store and manage embedding vectors for users and items directly on Memgraph node properties or in-memory vector cache within the prediction server, eliminating any external caching/feature store middleware (such as Redis).
- **FR-002**: System MUST provide an automated synchronization flow within `Init_graph.py` and `GraphSAGE.py` to extract PostgreSQL relational data and maintain GraphSAGE node embeddings in Memgraph.
- **FR-003**: Python recommendation scoring engine MUST perform batch vector lookups directly from Memgraph or local memory cache and compute dot-product similarity to construct feature matrices for LightGBM ranking.
- **FR-004**: Automated retraining workflow (`action-retrain.yml`) MUST execute sequential steps: database relational pull, GraphSAGE training, LightGBM ranker training, and Memgraph snapshot restoration.
- **FR-005**: Recommendation backend MUST apply impression skip penalties and inventory availability guards to filter out out-of-stock items and avoid repetitive suggestions.

### Key Entities

- **User Embedding**: Array of float32 values stored on User nodes representing the learned GraphSAGE topological representation of a user.
- **Item Embedding**: Array of float32 values stored on Book nodes representing the GraphSAGE and semantic text representation of a book.
- **Recommendation Candidate Payload**: Structure containing candidate book ID, baseline GCN prediction score, session month, available inventory count, and past impression count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of recommendation scoring requests execute within low latency (< 15ms for Python socket scoring, < 50ms end-to-end API response).
- **SC-002**: Automated retraining and deployment pipeline completes full execution (GraphSAGE training, LightGBM training, Memgraph restoration) in under 15 minutes.
- **SC-003**: 100% uptime for recommendation APIs during background deployment and graph synchronization.
- **SC-004**: Zero unhandled exceptions or 500 internal server errors when node embeddings are missing or cold-start users request recommendations.

## Assumptions

- Environment secrets (`DB_HOST`, `MEMGRAPH_URI`, `MEMGRAPH_URI_SERVER`) are configured in GitHub Repository Secrets and `.env` files.
- The system operates without external Redis dependencies, relying on Memgraph node properties and local process memory for fast vector access.
- Existing TCP socket communication between Node.js server and Python socket script is maintained for low-overhead local IPC.
