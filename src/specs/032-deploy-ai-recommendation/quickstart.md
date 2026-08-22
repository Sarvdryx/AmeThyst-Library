# Quickstart Guide: AI Recommendation System Pipeline (Simplified Architecture)

This quickstart guide outlines how to run, verify, and test the simplified AI recommendation pipeline locally and in staging environments.

---

## 1. Prerequisites & Environment Setup

Ensure your local development environment has:
- Python >= 3.10
- Node.js >= 18
- Docker & Docker Compose

### Environment File Configuration (`src/database/.env` & `src/server/.env`)

```ini
# PostgreSQL (Supabase / Local)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=amethyst

# Memgraph Database
MEMGRAPH_HOST=localhost
MEMGRAPH_PORT=7687
MEMGRAPH_URI=bolt://localhost:7687

# Recommendation Socket Server
RECOMMENDATION_PORT=5001
```

---

## 2. Local Container & Infrastructure Execution

Start local PostgreSQL and Memgraph instances:

```bash
cd database
docker compose up -d
```

---

## 3. End-to-End Local Execution Flow

### Step 1: Initialize Database & Vector Embeddings

```bash
# Push text embeddings to Postgres
python src/database/Init_data/Embedding.py

# Sync relational data to local Memgraph container
python src/database/Init_data/Init_graph.py
```

### Step 2: Train GraphSAGE Link Prediction Model

```bash
# Train GraphSAGE weighted topological representations
python src/database/Init_data/GraphSAGE.py
```

---

## 4. Testing Recommendation Scoring Engine

### Run Automated Backend Tests

```bash
cd src/server
npm run test:recommendation
```

### Run Python Scoring Socket Server Directly

```bash
python src/server/src/recommendation/predict_server.py
```

---

## 5. Deployment Verification Checklist

- [ ] Memgraph container operational and listening on port `7687`.
- [ ] `Init_graph.py` and `GraphSAGE.py` execute without errors.
- [ ] Backend `/api/recommendations` endpoint returns ranked recommendation list.
- [ ] GitHub Actions workflow `.github/workflows/action-retrain.yml` passes with green status.
