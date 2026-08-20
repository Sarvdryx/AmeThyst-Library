# Quickstart Guide: AI Recommendations

This guide provides steps for setting up, configuring, and verifying the AI recommendation feature, including the new persistent Python TCP inference server.

## 1. Prerequisites & Dependencies

### System Requirements
- Node.js v18+
- Python 3.10+
- PostgreSQL v15+ (with `pgvector` extension)
- Memgraph instance (running on Bolt port `7687`)

### Python Packages Installation
Install the required machine learning dependencies inside the python environment:
```bash
pip install psycopg2-binary lightgbm scikit-learn pandas numpy neo4j python-dotenv
```

---

## 2. Database Migration (PostgreSQL)

Execute the following SQL commands to create the `recommends` table and configure optimization indexes:

```sql
CREATE TABLE public.recommends (
    recommend_id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    book_id VARCHAR(20) NOT NULL,
    score REAL NOT NULL,
    showed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_clicked BOOLEAN DEFAULT FALSE NOT NULL,
    renewed_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT recommends_pkey PRIMARY KEY (recommend_id),
    CONSTRAINT fk_recommends_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_recommends_book FOREIGN KEY (book_id) REFERENCES public.books(book_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_active_recommendations ON public.recommends(user_id, book_id) 
WHERE (renewed_at IS NULL);

CREATE INDEX idx_recommends_user_active ON public.recommends(user_id) WHERE (renewed_at IS NULL);
CREATE INDEX idx_recommends_click_features ON public.recommends(user_id, book_id, is_clicked, renewed_at);
```

---

## 3. Environment Variables Configuration

Add the following variables to `server/.env`:

```env
# Recommendation TCP Socket Inference Port
RECOMMENDATION_PORT=5001

# Recommendation Retraining Configuration
RECOMMENDATION_RETRAIN_CRON="0 2 * * 0"  # Every Sunday at 2:00 AM
PYTHON_COMMAND="python"                   # Use "python3" on Linux/macOS
```

---

## 4. Persistent Python Socket Server

Start the persistent socket server to handle LightGBM model inference requests over TCP:
```bash
python server/src/recommendation/predict_server.py
```
*Note: In development, this process should run concurrently with `npm run dev` in the backend.*

---

## 5. Manual Model Retraining & Bootstrap

To bootstrap recommendation logs and pre-train the models before running the NodeJS server:

1. **Populate Memgraph Graph topology**:
   Ensure Memgraph is running, then populate baseline nodes and relationships:
   ```bash
   python database/Init_data/Init_graph.py
   ```

2. **Trigger GraphSAGE Link Prediction Training**:
   Generate embedding representations in Memgraph:
   ```bash
   python database/Init_data/GraphSAGE.py
   ```

3. **Bootstrap and Train LightGBM Ranker**:
   Query PG data, bootstrap mock recommendations if empty, and compile `lightgbm_ranker.txt`:
   ```bash
   python database/Init_data/LightGBM.py
   ```

---

## 6. Verification & Testing

1. **Run Integration Tests**:
   Verify backend endpoint routes and services:
   ```bash
   cd server
   npm run test tests/recommendation.test.mjs
   ```

2. **Verify API Endpoints manually**:
   Send a GET request to retrieve recommendations for a test user:
   ```bash
   curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:5000/api/dashboard/user/recommendations
   ```
