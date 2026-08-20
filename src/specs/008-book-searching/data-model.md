# Data Model: Hybrid Book Searching

## Entities

### Book
Represents bibliographic records for library catalog books. Stored in PostgreSQL with pg_trgm indices on text columns and a pgvector HNSW index on the embedding vector column.

| Field | SQL Type | Description |
|-------|----------|-------------|
| id | UUID / serial | Unique identifier for the book (`book_id`) |
| title | VARCHAR(255) | Title of the book (Indexed with pg_trgm GIN) |
| author | VARCHAR(255)[] | List of author names (Indexed with pg_trgm GIN) |
| description | TEXT | Synopsis of the book content |
| genres | VARCHAR(100)[] | List of categories/genres |
| isbn | VARCHAR(20) | International Standard Book Number |
| publisher | VARCHAR(255) | Name of the publisher |
| publicationDate | TIMESTAMP | The date when the book was published (`publication_date`) |
| pageCount | INTEGER | Total page count (`num_pages`) |
| language | VARCHAR(10) | Language code (`language_code`, e.g., "en", "vi") |
| coverImage | VARCHAR(512) | Image URL (`image_url`) |
| embedding | vector(384) | 384-dimensional vector representation of description (HNSW indexed) |

### SearchHistory
Logs search executions for authenticated users. The search query is saved directly in `search_content` and filters are stored in `filters`.

| Field | SQL Type | Description |
|-------|----------|-------------|
| id | SERIAL / UUID | Unique log entry ID |
| userId | UUID / INTEGER | Reference to User.id (logged-in user) |
| searchContent | TEXT | Raw input search query text only |
| filters | JSONB | JSON object of applied filters (genres, publicationDate, language, pageCount) |
| clickedBookIds | VARCHAR(50)[] | Array of Book IDs clicked by the user from these search results |
| timestamp | TIMESTAMP | Time of search execution |

## Database Indices

```sql
-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgvector;

-- pg_trgm GIN Indices for Lexical Path
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_publisher_trgm ON books USING gin (publisher gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON books USING gin (array_to_string(author, ' ') gin_trgm_ops);

-- HNSW Vector Index for Semantic Path (Cosine Distance)
-- M=16, ef_construction=64 are suitable configuration values for moderate size datasets
CREATE INDEX IF NOT EXISTS idx_books_embedding_hnsw ON books USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```

## Relationships
- **User (1) -> (N) SearchHistory**: A logged-in user can have multiple search history log entries. Guest users have none.
- **Book (1) -> (1) Embedding**: Each Book has an associated vector embedding column in PostgreSQL.
- **SearchHistory (N) -> (N) Book**: A search history record links to clicked book IDs (`clickedBookIds`) indicating intent clicks.
