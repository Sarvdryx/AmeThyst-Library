# Implementation Plan: AI Recommendation for Login Users

**Branch**: `027-ai-user-recommendations` | **Date**: 2026-07-17 | **Spec**: [/specs/027-ai-user-recommendations/spec.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/027-ai-user-recommendations/spec.md)

**Input**: Feature specification from `/specs/027-ai-user-recommendations/spec.md` and caching/socket requirements to optimize inference latency.

## Summary

The AI Recommendation for Login Users feature implements a personalized recommendation engine. To resolve high latency caused by spawning Python processes on every request, we adopt a **TCP Socket Server** for the Python-based LightGBM inference and a **Node.js Memory Cache** for serving pre-computed recommendations. Furthermore, we refine the "Renew" action to ensure users receive fresh, non-repeating recommendations by querying and excluding historical recommendation logs, with catalog-exhaustion fallbacks.

## Technical Context

**Language/Version**: Node.js v18+ (ES Modules, Express v5.2.1), Python 3.10+ (for ML pipeline and socket inference server).

**Primary Dependencies**:
- Backend (Node.js): `neo4j-driver` (v6.2.0) for Memgraph bolt, `pg` (v8.21.0) for PostgreSQL, `node-cron` (v3.0.3) for retraining schedules, and the native `net` module for TCP socket client.
- ML Pipeline & Inference (Python): `lightgbm` (v4.0.0), `neo4j` (v5.18.0), `psycopg2-binary` (v2.9.9), `scikit-learn` (v1.3.0), `pandas` (v2.1.1), `numpy` (v1.26.0).

**Storage**:
- Primary Database: PostgreSQL (holds users, books, library quantities, wishlists, search history, and recommends log).
- Secondary Graph Database: Memgraph (holds node representations and weighted interaction edges).

**Socket-based Python Inference Server**:
- Port: `5001` (configured via env `RECOMMENDATION_PORT`).
- Protocol: Newline-delimited JSON over TCP.
- Model Reloading: The socket server checks model file modification times (`os.path.getmtime`) and hot-reloads `lightgbm_ranker.txt` automatically when updated.

**Node.js Caching**:
- Caching strategy: In-memory `Map` mapping `userId -> { recommendations, timestamp }`.
- TTL: 5 minutes.
- Invalidation triggers: Click tracking, manual renewal, wishlist addition (`addToWishlist`), and book reservation (`createReservation`).

**Performance Goals**:
- Dashboard recommendation load: `< 100ms` (from memory cache or Postgres) and `< 200ms` for cache-miss generation.
- Spawning overhead: reduced from `~2.0s` to `0s` by using a persistent TCP socket.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Component-Driven & Reusability)**: The Next.js frontend MUST utilize the established `RecommendationCarousel` and `BookCard` components and customize props to support renewal and click actions. (PASSED)
- **Principle II (State Management & Data Fetching)**: All frontend requests must target the base API URL loaded from environment variables and handle load/error/success states. (PASSED)
- **Principle VII (Layered Architecture)**: The Express backend MUST follow `Route -> Middleware -> Controller -> Service -> Model`. The recommendation candidate fetch, click tracking, and renewal logic is isolated in `recommendation.services.mjs` and communicates with the Python socket microservice. (PASSED)
- **Principle IX (Theme & i18n)**: All UI changes must support light/dark tokens and English/Vietnamese language localization keys. (PASSED)

## Project Structure

### Documentation (this feature)

```text
specs/027-ai-user-recommendations/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    └── recommendations-contract.md # API interface contract
```

### Source Code (repository root)

```text
database/
├── Init_data/
│   ├── GraphSAGE.py          # Modified GraphSAGE pipeline prioritizing user actions
│   └── LightGBM.py           # Modified LightGBM training script
server/
├── src/
│   ├── controllers/
│   │   └── recommendation.controllers.mjs    # Coordinates recommendation fetch, click, and renew
│   ├── routes/
│   │   └── recommendation.routes.mjs         # Registers dashboard recommendation API paths
│   ├── services/
│   │   ├── recommendation.services.mjs      # Business logic, cache management, socket communication
│   │   ├── memgraphSync.services.mjs         # Syncs click log updates asynchronously to Memgraph
│   │   └── scheduler.services.mjs            # Schedules automated periodic ML retraining
│   ├── recommendation/
│   │   └── predict_server.py                 # Persistent Python TCP socket inference server
│   └── server.mjs                            # Launches server and bootstraps socket/scheduler services
```

**Structure Decision**: Consolidating Express route, controller, and services in `server/src/` aligning with backend layered design. Modifying the existing Python training scripts inside `database/Init_data/` and running a persistent Python socket service `predict_server.py`.

## Complexity Tracking

*No constitution violations present. No complexity tracking entries required.*
