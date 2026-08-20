import psycopg2
from psycopg2.extras import execute_values
import random
import time
from dotenv import load_dotenv
import os

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

BATCH_SIZE = 2000

def seed_all_branches_fully():
    print("==================================================")
    print("   SEEDING PHYSICAL CAMPUS INVENTORY MATRIX       ")
    print("==================================================")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        print("[1/3] Reading cleaned book metadata from PostgreSQL...")
        cursor.execute("SELECT book_id, title FROM books;")
        books = cursor.fetchall()
        print(f" -> Successfully loaded {len(books):,} titles from 'books'.")
        
        if not books:
            print("[ERROR] No books found in the 'books' table.")
            return

        cursor.execute("""
            SELECT branch_id, name_short 
            FROM branches 
            WHERE name_short IN ('NVC', 'LT');
        """)
        target_branches = cursor.fetchall()
        print(f" -> Targeting campus branches: {[b[1] for b in target_branches]}")
        
        if not target_branches:
            print("[ERROR] Physical branches (NVC, LT) not found in 'branches' table.")
            return

        print("\n[2/3] Generating physical library stock rows...")
        
        insert_query = """
            INSERT INTO library (book_id, branch_id, quantity, available_quantity, shelf)
            VALUES %s
            ON CONFLICT (book_id, branch_id) 
            DO UPDATE SET 
                quantity = EXCLUDED.quantity,
                available_quantity = EXCLUDED.available_quantity,
                shelf = EXCLUDED.shelf;
        """

        library_batch = []
        total_records_created = 0
        start_time = time.time()
        
        for book_id, title in books:
            for branch_id, name_short in target_branches:
                first_char = "X"
                if title:
                    cleaned_title = title.strip().upper()
                    if cleaned_title and cleaned_title[0].isalpha():
                        first_char = cleaned_title[0]
                
                # Total physical books on hand
                total_qty = random.randint(1, 20)
                
                # 🟩 Safety Check Rule applied: available_quantity <= quantity
                available_qty = max(0, total_qty - random.randint(1, min(4, total_qty)))
                
                random_shelf_num = f"{random.randint(1, 99):02d}"
                shelf_string = f"{name_short}.{first_char}{random_shelf_num}"
                
                library_batch.append((book_id, branch_id, total_qty, available_qty, shelf_string))
                total_records_created += 1
                
            if len(library_batch) >= BATCH_SIZE:
                execute_values(cursor, insert_query, library_batch)
                conn.commit()
                print(f" -> Allocated {total_records_created:,} slots across campus networks...")
                library_batch = []
                
        if library_batch:
            execute_values(cursor, insert_query, library_batch)
            conn.commit()
            
        print(f"\n[3/3] Finalizing structural updates...")
        print(f"[SUCCESS] Script executed in {(time.time() - start_time):.2f} seconds!")
        print(f"Total entries mapped in 'library' table: {total_records_created:,}")

    except Exception as e:
        conn.rollback()
        print(f"\n[CRITICAL RUNTIME ERROR] Seeding rolled back: {e}")
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_all_branches_fully()