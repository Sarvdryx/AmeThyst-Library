# Research: Hybrid Book Searching & Reciprocal Rank Fusion

This document details the architectural decisions and research for implementing a single unified hybrid book search in PostgreSQL.

---

## 1. Query Cleaning and Connector Filtering (Text Path Pre-processing)

### The Issue
Search queries often contain typos in common connectors or stopwords (e.g., "harry potter adn the goblet", "science orr fiction", "the teh hobbit"). If sent directly to exact metadata matches or pg_trgm trigram indices, these typos can distort results or lower query matches.

### The Solution
Implement a lightweight regex-based pre-processing step in the search service.
- **Target Connectors / Stopwords**: `and`, `or`, `not`, `but`, `the`, `a`, `an`.
- **Target Typo Patterns**: `adn`, `orr`, `teh`, `nad`, `fro`, `whith`, `wtih`.
- **Regex Filter**:
  ```javascript
  const connectorRegex = /\b(adn|orr|teh|nad|fro|whith|wtih|and|or|not|but|the|a|an)\b/gi;
  const cleanQuery = rawQuery.replace(connectorRegex, ' ').replace(/\s+/g, ' ').trim();
  ```
- **Parameter Fragmentation**: Split the remaining text into standalone whitespace-delimited words to feed into lexical matching.

---

## 2. Typo-Tolerant Text Searching via pg_trgm (Text Path Database Lookup)

### The Solution
Use the PostgreSQL `pg_trgm` extension.
- **Trigrams**: pg_trgm splits strings into 3-character blocks (e.g., "word" becomes `{"  w"," w","wor","ord","rd "}`).
- **Spelling Similarity**: The similarity is calculated based on the number of shared trigrams.
- **Database Indexing**: Define a GIN (Generalized Inverted Index) index on columns `title`, `author`, `publisher` using `gin_trgm_ops`.
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING gin (title gin_trgm_ops);
  CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON books USING gin (array_to_string(author, ' ') gin_trgm_ops);
  ```
- **Search Query**:
  ```sql
  SELECT *, similarity(title, $1) as title_sim
  FROM books
  WHERE title % $1 OR array_to_string(author, ' ') % $1
  ORDER BY title_sim DESC;
  ```

---

## 3. Semantic Searching via pgvector (Semantic Path)

### Embedding Model
Use the `all-MiniLM-L6-v2` local transformer model. It produces 384-dimensional dense vectors.
- **Local Execution**: Implement local embedding generation using `@xenova/transformers` (or `@huggingface/transformers` in newer versions). If the local model loading fails, fall back gracefully to a mock hash-based deterministic embedding generator.
- **Database Indexing**: Use an HNSW (Hierarchical Navigable Small World) index for fast approximate nearest neighbor search with cosine distance (`<=>`).
  ```sql
  CREATE INDEX IF NOT EXISTS idx_books_embedding_hnsw ON books USING hnsw (embedding vector_cosine_ops);
  ```

---

## 4. Reciprocal Rank Fusion (Reranking)

### The Concept
To merge two different rankings (lexical text match ranks vs. semantic vector distance ranks), standard score normalization is highly brittle because cosine similarity and trigram similarity are calculated on completely different scales.
We use **Reciprocal Rank Fusion (RRF)**. RRF evaluates the rank of each book in both paths:
$$RRF\_Score(b) = \frac{1}{k + r_{text}(b)} + \frac{1}{k + r_{semantic}(b)}$$
where $k$ is a constant (typically 60), $r_{text}(b)$ is the rank of book $b$ in the lexical/trigram search (starting at 1, or $\infty$ if not found), and $r_{semantic}(b)$ is the rank of book $b$ in the semantic search.

### Implementation Workflow
1. Execute Text Path query (exact + pg_trgm) and get up to 100 books, ordered by text similarity.
2. Execute Semantic Path query (pgvector cosine similarity) and get up to 100 books, ordered by closeness.
3. Construct a Map of all unique books. For each book, find its index (rank + 1) in the text results and semantic results.
4. Calculate $RRF\_Score$ for each book.
5. Sort all books by $RRF\_Score$ descending and apply filters.

---

## Decision Log

- **Decision**: Integrate Text and Semantic search into a single Hybrid search.
  - *Rationale*: Removes user confusion around selecting modes, simplifies UI, and leverages RRF to merge keyword precision with semantic depth.
- **Decision**: Use `pg_trgm` GIN indexes for typo tolerance.
  - *Rationale*: Allows native fuzzy matching inside PostgreSQL without external search servers (e.g., Elasticsearch).
- **Decision**: Apply Reciprocal Rank Fusion (RRF) with $k = 60$.
  - *Rationale*: Robustly combines rank orders of keyword matching and semantic vector distance without score-scaling artifacts.
