# Implementation Plan: Hybrid Book Searching & Analytics Refinement

**Branch**: `feature/DualModeSearching` | **Date**: 2026-06-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-book-searching/spec.md`

## Summary
The goal of this phase is to replace the separate standard and semantic search modes with a single, unified **Hybrid Search** model. When a user queries the library catalog:
1. **Pre-processing / Text Path**: Misspelled or correctly spelled query connector words (e.g. `adn`, `teh`, `orr`, `and`, `or`) are identified via regex, stripped out, and the remaining tokens are queried against postgres metadata fields (title, author, publisher) using `pg_trgm` (trigram spelling overlaps) with a GIN index.
2. **Semantic Path**: The raw search query is converted into a 384-dimensional dense vector using the local transformer model `all-MiniLM-L6-v2` and searched against the `embedding` column using a pgvector HNSW index.
3. **Reranking / Fusion**: Results from the Text Path (trigram) and Semantic Path (pgvector) are merged and reranked using **Reciprocal Rank Fusion (RRF)**.
4. **UI & Logs Refinement**: The search mode toggle is removed from the UI. Results render in-place. Database logging utilizes `logHistory: boolean` to debounce keystroke logs while renaming the history column to `search_content`. Do not log the `search_mode` anymore, remove that column from postgres.
5. Deprecate and Clean Up Outdated Search and Filter Implementations
---

## Technical Context

**Language/Version**: JavaScript (Node.js 20+, React 19)

**Primary Dependencies**: Next.js 16.2.6, Express 5.2.1, pg 8.21.0, `@xenova/transformers` (for local ONNX execution of `all-MiniLM-L6-v2`)

**Storage**: PostgreSQL with `pgvector` and `pg_trgm` extensions enabled.

**Testing**: Manual integration scenarios checking regex pre-processing, trigram match relevance, RRF ranking order, debouncing logger triggers, and intent click-through redirects.

**Target Platform**: Linux / Windows Node.js server, Modern Browsers

**Project Type**: Web Application (Client-Server architecture)

**Performance Goals**: 
- Complete hybrid search (lexical match + local embedding generation + database query + RRF rank fusion) returned in < 900ms.
- Client catalog grid in-place update in < 150ms.

**Constraints**:
- Cosine distance matching for embeddings (`<=>` operator).
- Safe fallback to keyword-based lexical search if local transformer load fails.
- Avoid logging typing keystrokes (`logHistory: false` for debounced fetches).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Atomic Design Compliance**: Components must be structured bottom-up. No new directories; utilize existing folders in `client/app/components/`.
   - *Check*: Modifying existing molecules (`SearchBar.tsx`) and organisms (`FilterPanel.tsx`, `PopularPublishes.tsx`). Passed.
2. **Layered Backend Architecture**: Strict logic flow: `Route -> Middleware -> Controller -> Service -> Model`.
   - *Check*: Logic resides in search controllers/services; DB pools configured in db config. Passed.
3. **Import Path Verification**: Relative path checks must be executed before writing code.
   - *Check*: Checked directory structures to map exact imports. Passed.
4. **Light/Dark Mode & Localization (i18n)**: Hardcoded text strings are prohibited; must update translation dictionaries (`en.json`, `vi.json`) for any new strings.
   - *Check*: Ensure that text keys for hybrid search or no-results views exist in translation files. Passed.

---

## Project Structure

### Documentation (this feature)

```text
specs/008-book-searching/
├── spec.md              # Feature Specification (Hybrid Search Requirements)
├── plan.md              # This file (Implementation Plan)
├── research.md          # Research on trigrams, pgvector, and RRF
├── data-model.md        # Data models and indices schema
├── quickstart.md        # Scenario testing and verification guide
└── contracts/
    └── api-contract.md  # Endpoints JSON schemas and request payloads
```

### Source Code

```text
client/
└── app/
    ├── library/
    │   └── page.tsx                 # Main catalog page; coordinates search states
    └── components/
        ├── organisms/
        │   ├── FilterPanel.tsx      # Slide-out drawer; houses metadata filters (Search Mode toggle removed)
        │   └── PopularPublishes.tsx  # Dynamic catalog list; renders hybrid search results
        └── molecules/
            └── SearchBar.tsx        # Triggers search submissions (Enter / Click search)

server/
└── src/
    ├── controllers/
    │   └── search.controllers.mjs   # Intercepts query, calls service, logs history
    ├── services/
    │   ├── search.services.mjs      # Formulates hybrid query, triggers paths, executes RRF fusion
    │   ├── embedding.services.mjs   # Generates embeddings via all-MiniLM-L6-v2 local model
    │   └── history.services.mjs     # Composes search_content text logging
    └── models/
        └── history.models.mjs       # Database schema integrations
```

**Structure Decision**: Web application layout containing Next.js `client/` and Express `server/` codebase directories.

---

## Complexity Tracking

*No Gate Violations registered.*

---

## Done When

- [ ] Overwrote `spec.md`, `research.md`, `data-model.md`, `contracts/api-contract.md`, and `quickstart.md` to incorporate the single Hybrid Search model.
- [ ] Registered optional/mandatory hooks and updated `AGENTS.md` spec planner reference path.
- [ ] Database migrations executed to verify `pg_trgm` and `pgvector` indexes on title, author, publisher, and embedding columns.
- [ ] Pre-processing regex connectors filtering implemented and verified.
- [ ] Local embedding transformer model service (`all-MiniLM-L6-v2`) set up with graceful mock fallback.
- [ ] pg_trgm trigram search and pgvector search executed concurrently in SQL.
- [ ] Reciprocal Rank Fusion (RRF) algorithm implemented and results merged.
- [ ] Front-end Search Toggle removed from UI; in-place rendering coordinates hybrid query.
- [ ] Conditional logHistory flag debounces live searches and only logs submitted search history.
- [ ] Click-through interaction tracking captures clicked result books in search history logs.