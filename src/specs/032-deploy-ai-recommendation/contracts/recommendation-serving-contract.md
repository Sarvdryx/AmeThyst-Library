# Interface Contract: AI Recommendation Serving Protocol (No Redis)

## 1. Node.js Backend <-> Python IPC Socket Scoring Contract

- **Protocol**: Raw TCP Socket
- **Port**: `5001` (configurable via `RECOMMENDATION_PORT`)
- **Host**: `127.0.0.1`

### Request Payload (Node.js -> Python Socket Server)

Sent as a single JSON object terminated by a newline (`\n`):

```json
{
  "user_id": "28e1e0be-7a2b-444f-ab9f-5477109a29e5",
  "candidates": [
    {
      "id": "1020049",
      "session_month": 8,
      "past_impressions_count": 1,
      "is_in_wishlist": 0,
      "global_available_copies": 5,
      "gcn_score": 0.842
    },
    {
      "id": "11253413",
      "session_month": 8,
      "past_impressions_count": 0,
      "is_in_wishlist": 1,
      "global_available_copies": 2,
      "gcn_score": 0.915
    }
  ]
}
```

### Response Payload (Python Socket Server -> Node.js)

Returned as a single JSON line:

```json
{
  "success": true,
  "ranked": [
    {
      "id": "11253413",
      "score": 0.9412
    },
    {
      "id": "1020049",
      "score": 0.7854
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "error": "Failed to retrieve node embeddings or score candidates"
}
```

---

## 2. Embedding Retrieval Protocol (Memgraph & Process Memory)

- **Storage Target**: Memgraph Node Properties (`Book.features`, `User.features`) & In-Memory Dictionary Cache
- **Lookup Method**: Memgraph Cypher query or Python socket memory cache (`predict_server.py`)

### Cypher Candidate Lookup Example

```cypher
MATCH (b:Book) WHERE b.id IN $book_ids 
RETURN b.id AS id, b.features AS embedding;
```

---

## 3. GitHub Actions Retraining Pipeline Environment Contract

The automated retrain pipeline expects the following environment secrets configured in repository secrets:

| Secret Key | Required By | Purpose |
| :--- | :--- | :--- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `Init_graph.py`, `LightGBM.py` | Supabase PostgreSQL relational connection |
| `MEMGRAPH_URI`, `MEMGRAPH_USER`, `MEMGRAPH_PASSWORD` | `GraphSAGE.py`, `Model_snapshot.py` | Memgraph instance connection & snapshot export |
