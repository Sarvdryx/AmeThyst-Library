# Implementation Plan: AI Recommendation System Infrastructure & Cloud Deployment Pipeline

**Branch**: `032-deploy-ai-recommendation` | **Date**: 2026-08-17 | **Spec**: [spec.md](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/032-deploy-ai-recommendation/spec.md)

**Input**: Feature specification from [`/specs/032-deploy-ai-recommendation/spec.md`](file:///C:/Local_D/HCMUS/SE2/AmeThyst-Library/src/specs/032-deploy-ai-recommendation/spec.md)

## Summary

This plan details the implementation roadmap to integrate the **GraphSAGE + LightGBM** architecture (without external Redis dependencies) into the **AmeThyst-Library** ecosystem and automated **GitHub Actions** pipeline. Retrained GraphSAGE user and item embeddings are managed directly on Memgraph node properties and cached in the Python prediction server's process memory, enabling sub-50ms online recommendation scoring in Node.js while keeping graph topology synchronized.

---

## Technical Context

**Language/Version**: Python 3.10+, Node.js 18+ (ES Modules `.mjs`)

**Primary Dependencies**: `neo4j`, `numpy`, `lightgbm`, `sentence-transformers`, `express`, `neo4j-driver`

**Storage**: PostgreSQL (Supabase / Local), Memgraph (Graph DB with Node Property Embeddings)

**Testing**: Vitest (`npm run test:recommendation`), pytest / standalone Python diagnostics

**Target Platform**: Linux Server / Node.js Express API, GitHub Actions CI/CD runners

**Project Type**: Web Service / Data Pipeline / Machine Learning Infrastructure

**Performance Goals**: < 15ms socket scoring latency, < 50ms end-to-end API response time, < 15 minute CI/CD retraining workflow duration

**Constraints**: Low memory overhead, transactional graph writes, zero external caching infrastructure (Redis-free)

**Scale/Scope**: ~10k+ books, ~1k+ active users, 384-dimensional vector embeddings

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Component-Driven & Reusability)**: N/A for backend data pipeline; UI components use standard atomic recommendation cards.
- **Principle II (State Management & Data Fetching)**: Express controllers invoke services via modular layer chain (`Route -> Middleware -> Controller -> Service -> Model`).
- **Principle VII (Modular & Abstract Architecture - Backend)**: Strict separation between `memgraphSync.services.mjs`, `recommendation.services.mjs`, and Python inference socket server.
- **Principle IX (Light/Dark & Localization)**: N/A for backend pipeline; UI displays localization keys `en.json`/`vi.json` for recommendation section headers.

*GATE PASSED: All architectural principles compliant.*

---

## Project Structure

### Documentation (this feature)

```text
specs/032-deploy-ai-recommendation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── recommendation-serving-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
database/
├── docker-compose.yml                       # Docker services (Postgres, Memgraph)
└── Init_data/
    ├── Embedding.py                         # Native text vectorization in Postgres
    ├── Init_graph.py                        # Sync Postgres metadata to Memgraph
    ├── GraphSAGE.py                         # Multi-relational weighted GraphSAGE training
    ├── LightGBM.py                          # GBDT Micro-ranker model training
    └── Model_snapshot.py                    # Memgraph snapshot export & backup
server/
└── src/
    ├── config/
    │   └── memgraph.config.mjs              # Memgraph connection session pool
    ├── recommendation/
    │   └── predict_server.py                # Persistent socket server with In-Memory cache & LightGBM
    ├── services/
    │   ├── memgraphSync.services.mjs        # Async sync for wishlist/clicks
    │   ├── recommendation.services.mjs      # Candidate retrieval & socket IPC scoring
    │   └── scheduler.services.mjs           # Background recommendation renewal cron
    └── routes/
        └── recommendation.routes.mjs        # Recommendation API endpoints

.github/
└── workflows/
    └── action-retrain.yml                   # CI/CD retrain & deployment workflow
```

**Structure Decision**: Multi-tiered Web Service + ML Pipeline architecture maintaining strict separation between Node.js API services, Python ML pipelines, and Memgraph database storage.

---

## Complexity Tracking

> **No violations. Standard modular architecture without Redis dependency.**
