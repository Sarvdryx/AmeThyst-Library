import psycopg2
from psycopg2.extras import execute_values
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
import time

# This script initializes PostgreSQL with native vector embeddings

# ==============================================================================
# CONFIGURATION
# ==============================================================================
load_dotenv('src/database/.env')

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dbname": os.getenv("DB_NAME"),
    "port": os.getenv("DB_PORT", "5432"),
    "host": "localhost"
}

# The all-MiniLM-L6-v2 model outputs vectors with exactly 384 dimensions
EMBEDDING_DIMENSION = 384
BATCH_SIZE = 1500  

def initialize_pgvector():
    print("==================================================")
    print("     POSTGRES VECTOR INITIALIZATION INITIATED     ")
    print("==================================================")
    
    # 1. Connect to PostgreSQL
    print("[1/4] Connecting to PostgreSQL...")
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # 2. Activate extension and alter schema
    print("[2/4] Enabling pgvector extension and creating column...")
    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    # Add the embedding column directly to the target table
    cursor.execute(f"ALTER TABLE books ADD COLUMN IF NOT EXISTS embedding vector({EMBEDDING_DIMENSION});")
    conn.commit()
    print(f" -> 'embedding vector({EMBEDDING_DIMENSION})' column is ready.")

    # 3. Pull data to be vectorized
    print("\n[3/4] Loading relational book data from Postgres...")
    cursor.execute("""
        SELECT 
            book_id, 
            title, 
            original_title,
            description, 
            series,
            author, 
            genres, 
            language_code
        FROM books
        WHERE embedding IS NULL; 
    """)
    all_books = cursor.fetchall()
    print(f" -> Found {len(all_books):,} books needing vectorization.")

    if not all_books:
        print("All books already have embeddings! System is optimized.")
        cursor.close()
        conn.close()
        return

    # 4. Load Local Embedding Model
    print("\n[4/4] Loading local Transformer model ('all-MiniLM-L6-v2')...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    updates_batch = []
    processed = 0
    start_time = time.time()
    
    print("\nBuilding semantic context blocks and generating vectors...")
    for row in all_books:
        book_id, title, original_title, desc, series, author_arr, genres_arr, language_code = row
        
        # Structural fallback formatting (matching your exact logic)
        authors_str = ", ".join(author_arr) if author_arr else "Unknown Author"
        genres_str = ", ".join(genres_arr) if genres_arr else "Uncategorized"
        safe_desc = desc if desc else "Description is not available."
        safe_series = series if series else "Standalone Book"
        safe_orig_title = original_title if original_title else ""
        safe_lang = language_code if language_code else "Unknown Language"

        # THE SEMANTIC STRING SUMMARY: Exactly the same context block you designed
        semantic_document = (
            f"Title: {title}. "
            f"Original Title: {safe_orig_title}. "
            f"Authors: {authors_str}. "
            f"Series: {safe_series}. "
            f"Genres: {genres_str}. "
            f"Language: {safe_lang}. "
            f"Summary: {safe_desc}"
        )
        
        # Generate embedding vector using the local model, convert to list
        vector = model.encode(semantic_document).tolist()
        
        updates_batch.append((vector, book_id))
        processed += 1
        
        # Batch upload to Postgres to optimize memory and speed
        if len(updates_batch) >= BATCH_SIZE:
            execute_values(
                cursor,
                "UPDATE books SET embedding = v.emb FROM (VALUES %s) AS v(emb, id) WHERE books.book_id = v.id",
                updates_batch,
                template="(%s::vector, %s)"
            )
            conn.commit()
            print(f" -> Embedded and saved {processed:,} / {len(all_books):,} books...")
            updates_batch = []

    # Process remaining records
    if updates_batch:
        execute_values(
            cursor,
            "UPDATE books SET embedding = v.emb FROM (VALUES %s) AS v(emb, id) WHERE books.book_id = v.id",
            updates_batch,
            template="(%s::vector, %s)"
        )
        conn.commit()
        print(f" -> Embedded and saved {processed:,} / {len(all_books):,} books...")

    cursor.close()
    conn.close()
    
    total_time = (time.time() - start_time) / 60
    print(f"\n[SUCCESS] Vectorization Complete in {total_time:.2f} minutes!")
    print("Your PostgreSQL database is now officially supercharged with native AI semantic search!")

if __name__ == "__main__":
    initialize_pgvector()