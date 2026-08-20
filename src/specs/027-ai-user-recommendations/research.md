# Research & Architectural Decisions: AI User Recommendations

This document outlines the research findings, design decisions, and training/inference flow modifications for the AI personalized recommendation feature.

## 1. Machine Learning Retraining Workflow

The recommendation system consists of two primary models:
1. **GraphSAGE** (on Memgraph): Learns graph embeddings and computes link prediction scores based on node topology and relationships.
2. **LightGBM** (GBDT Ranker): Takes candidate book lists and ranks them based on user-specific session features (impressions, months, click-through history).

### Retraining Schedule and Automation
- **Schedule**: Retraining will occur on a weekly basis during off-peak hours (e.g., Sunday at 2:00 AM) to minimize database locks and CPU overhead.
- **Automation Service**: A Node.js background scheduler (`scheduler.services.mjs` using `node-cron`) will run inside the backend server container.
- **Retraining Process**:
  1. Trigger GraphSAGE retraining by running `python database/Init_data/GraphSAGE.py`.
  2. Trigger LightGBM retraining by running `python database/Init_data/LightGBM.py`.
  3. Log retraining status to `logs/recommendation_retraining.log`.

---

## 2. Prioritizing User Input Behavior in Training Logic

In the initial `GraphSAGE.py` script, all recommendation edges are treated equally. This creates a feedback loop that reinforces recommended items regardless of actual user interest.

To prioritize user behavior:
- We distinguish between **Active User Input Behaviors** (borrows, returns, wishlists, search clicks, and clicked recommendations) and **Passive System Impressions** (recommended books that the user saw but did NOT click).
- We modify the training edge generation query in `GraphSAGE.py` for recommendations to **only include clicked recommendations** (`is_clicked = true`) in the `INTERACTED` edge construction.

---

## 3. Persistent Socket-Based Inference & Caching Architecture

### The Latency Problem
Spawning a Python process wrapper `predict.py` on every user dashboard load is extremely slow (taking ~2 seconds due to importing libraries like pandas, lightgbm, and loading the model `lightgbm_ranker.txt` from disk).

### The Solution: TCP Socket Server + Bulk Postgres Features + Memory Cache
To achieve low latency (< 100ms), we implement the following:

1. **Persistent Python Socket Server (`predict_server.py`)**:
   - The Python script is started as a persistent daemon listening on TCP port `5001`.
   - It loads the LightGBM Booster model `lightgbm_ranker.txt` **once** at startup.
   - Before executing predictions, it checks `os.path.getmtime(MODEL_PATH)` to automatically hot-reload the model if retraining has compiled a new model, ensuring zero downtime.
   - It communicates with the Node.js server via JSON messages over a TCP socket.

2. **Bulk Postgres Feature Compilation**:
   - Instead of Python querying PostgreSQL for each candidate inside a loop (which causes N database roundtrips), the Node.js Express server queries PostgreSQL in a **single bulk query** using the `pg` pool:
     ```sql
     SELECT 
       b.book_id,
       COALESCE(SUM(l.available_quantity), 0)::integer AS global_available_copies,
       EXISTS(SELECT 1 FROM public.user_wishlist uw WHERE uw.user_id = $1 AND uw.book_id = b.book_id) AS is_in_wishlist,
       (SELECT COUNT(*)::integer FROM public.recommends r WHERE r.user_id = $1 AND r.book_id = b.book_id AND r.is_clicked = FALSE AND r.renewed_at IS NULL) AS past_impressions_count
     FROM 
       public.books b
     LEFT JOIN 
       public.library l ON b.book_id = l.book_id
     WHERE 
       b.book_id = ANY($2)
     GROUP BY 
       b.book_id
     ```
   - This compiled features data is passed as a JSON payload over the TCP socket to Python, completely removing database queries from the Python service.

3. **Node.js Memory Cache**:
   - Recommendations are cached in Node.js memory (`recommendationCache`) mapping `userId -> { recommendations, timestamp }` with a TTL of 5 minutes.
   - The cache is automatically invalidated when user state changes: click logging, manual renewal, adding a book to wishlist (`addToWishlist`), or borrowing a book (`createReservation`).

---

## 4. Refined Renewal Logic (Preventing Repeats)

To ensure users get new recommended books when renewing rather than seeing the same books repeatedly:
- Node.js fetches the list of all books previously recommended to the user:
  ```sql
  SELECT book_id FROM public.recommends WHERE user_id = $1
  ```
- These historical recommendation book IDs are strictly excluded from:
  1. The GraphSAGE candidate query in Memgraph.
  2. The Postgres trending candidate query.
- **Robust Fallback**: If the filtered candidate pool becomes too small (less than 10 books) due to the user's history or a small catalog size, we relax the exclusion rule and allow previously recommended books that were NOT clicked, preventing empty recommendations.

---

## 5. Alternatives Considered

- **Alternative 1: Node.js LightGBM Native Addon**:
  - *Rejected*: Compiling C++ bindings for LightGBM inside Node.js is error-prone, fragile across operating systems, and difficult to maintain.
- **Alternative 2: Spawning python process on every request**:
  - *Rejected*: High overhead (~2.0 seconds latency) violates performance targets.
- **Alternative 3: Complete history exclusion without fallback**:
  - *Rejected*: For users with high active engagement, the candidate pool would eventually be completely exhausted, resulting in an empty dashboard carousel.
