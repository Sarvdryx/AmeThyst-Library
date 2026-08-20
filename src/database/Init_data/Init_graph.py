import os
import psycopg2
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load configurations
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
ENV_PATH = os.path.join(ROOT_DIR, ".env")
load_dotenv(ENV_PATH)
load_dotenv()  # Fallback to local execution directory

# Database Connection Configurations
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "lib_admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Methyst1306")
DB_NAME = os.getenv("DB_NAME", "postgres")

MEMGRAPH_URI = os.getenv("MEMGRAPH_URI", "bolt://localhost:7687")
MEMGRAPH_USER = os.getenv("MEMGRAPH_USER", "amethyst_admin")
MEMGRAPH_PASSWORD = os.getenv("MEMGRAPH_PASSWORD", "AmethystMG2026")

CONSTRAINTS_AND_CLEANUP = [
    "MATCH (n) DETACH DELETE n;",
    "CREATE CONSTRAINT ON (b:Book) ASSERT b.id IS UNIQUE;",
    "CREATE CONSTRAINT ON (br:Branch) ASSERT br.id IS UNIQUE;",
    "CREATE CONSTRAINT ON (u:User) ASSERT u.id IS UNIQUE;",
    "CREATE CONSTRAINT ON (a:Author) ASSERT a.name IS UNIQUE;",
    "CREATE CONSTRAINT ON (g:Genre) ASSERT g.name IS UNIQUE;"
]

def parse_embedding(val):
    if val is None:
        return None
    if isinstance(val, list):
        return [float(x) for x in val]
    if isinstance(val, str):
        val_str = val.strip('[]')
        if not val_str:
            return []
        return [float(x) for x in val_str.split(',')]
    return val

def run_graph_initialization():
    print("Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    
    print("Connecting to Memgraph instance...")
    memgraph_driver = GraphDatabase.driver(MEMGRAPH_URI, auth=(MEMGRAPH_USER, MEMGRAPH_PASSWORD))
    
    # 1. Cleanup and Constraints Setup
    with memgraph_driver.session() as session:
        print("Wiping old graph context and establishing unique constraints...")
        for cmd in CONSTRAINTS_AND_CLEANUP:
            try:
                session.run(cmd)
            except Exception as e:
                print(f" Note on constraint/cleanup step: {e}")

    # 2. Sync Branches
    print("Syncing Branches...")
    with pg_conn.cursor() as pg_cursor:
        pg_cursor.execute("SELECT branch_id, name_short, address FROM branches;")
        branches = pg_cursor.fetchall()
        
    branch_batch = []
    for b in branches:
        branch_batch.append({
            "branch_id": int(b[0]),
            "name_short": b[1],
            "address": b[2]
        })
        
    with memgraph_driver.session() as session:
        session.run("""
            UNWIND $batch AS row
            CREATE (:Branch {
              id: row.branch_id,
              name: row.name_short,
              address: row.address
            });
        """, batch=branch_batch)
    print(f"[OK] Synced {len(branch_batch)} branches.")

    # 3. Sync Users
    print("Syncing Users...")
    with pg_conn.cursor() as pg_cursor:
        pg_cursor.execute("SELECT user_id, username, role FROM users;")
        users = pg_cursor.fetchall()
        
    user_batch = []
    for u in users:
        user_batch.append({
            "user_id": str(u[0]),
            "username": u[1],
            "role": u[2]
        })
        
    with memgraph_driver.session() as session:
        session.run("""
            UNWIND $batch AS row
            CREATE (:User {
              id: row.user_id,
              username: row.username,
              role: row.role
            });
        """, batch=user_batch)
    print(f"[OK] Synced {len(user_batch)} users.")

    # 4. Sync Books (along with authors and genres relationships)
    print("Syncing Books, Authors, and Genres...")
    with pg_conn.cursor() as pg_cursor:
        pg_cursor.execute("""
            SELECT book_id, title, description, publication_date, num_pages, rating, language_code, embedding, author, genres
            FROM books;
        """)
        books = pg_cursor.fetchall()
        
    book_batch = []
    for b in books:
        book_batch.append({
            "book_id": b[0],
            "title": b[1],
            "description": b[2] if b[2] else "No description available",
            "publication": b[3].isoformat() if b[3] else "Unknown",
            "num_pages": int(b[4]) if b[4] is not None else 0,
            "rating": float(b[5]) if b[5] is not None else 0.0,
            "language_code": b[6] if b[6] else "en",
            "embedding": parse_embedding(b[7]),
            "authors": [a.strip() for a in b[8] if a and a.strip()] if isinstance(b[8], list) else [],
            "genres": [g.strip() for g in b[9] if g and g.strip()] if isinstance(b[9], list) else []
        })
        
    batch_size = 1000
    with memgraph_driver.session() as session:
        for idx in range(0, len(book_batch), batch_size):
            batch = book_batch[idx : idx + batch_size]
            session.run("""
                UNWIND $batch AS row
                MERGE (b:Book { id: row.book_id })
                SET b.title = row.title,
                    b.description = row.description,
                    b.publication = row.publication,
                    b.num_pages = row.num_pages,
                    b.rating = row.rating,
                    b.language_code = row.language_code,
                    b.embedding = row.embedding
                
                WITH b, row
                UNWIND row.authors AS single_author
                WITH b, row, trim(single_author) AS clean_author
                WHERE clean_author <> ""
                MERGE (a:Author { name: clean_author })
                MERGE (b)-[:WRITTEN_BY]->(a)
                
                WITH b, row
                UNWIND row.genres AS single_genre
                WITH b, trim(single_genre) AS clean_genre
                WHERE clean_genre <> ""
                MERGE (g:Genre { name: clean_genre })
                MERGE (b)-[:HAS_GENRE]->(g);
            """, batch=batch)
    print(f"[OK] Synced {len(book_batch)} books (along with authors and genres).")

    # 5. Sync Library Inventory Relationships
    print("Syncing Library inventory relationships...")
    with pg_conn.cursor() as pg_cursor:
        pg_cursor.execute("SELECT book_id, branch_id, quantity, available_quantity FROM library;")
        library_data = pg_cursor.fetchall()
        
    library_batch = []
    for l in library_data:
        library_batch.append({
            "book_id": l[0],
            "branch_id": int(l[1]),
            "quantity": int(l[2]),
            "available_quantity": int(l[3])
        })
        
    batch_size = 2000
    with memgraph_driver.session() as session:
        for idx in range(0, len(library_batch), batch_size):
            batch = library_batch[idx : idx + batch_size]
            session.run("""
                UNWIND $batch AS row
                MATCH (b:Book { id: row.book_id })
                MATCH (br:Branch { id: row.branch_id })
                CREATE (b)-[:AVAILABLE_AT {
                  quantity: row.quantity,
                  available_quantity: row.available_quantity
                }]->(br);
            """, batch=batch)
    print(f"[OK] Synced {len(library_batch)} library inventory mappings.")

    # 6. Sync Search History (SEARCHED relationships)
    print("Syncing Search History connections...")
    with pg_conn.cursor() as pg_cursor:
        pg_cursor.execute("""
            SELECT search_id, user_id, book_clicked, created_at, search_content
            FROM search_history
            WHERE user_id IS NOT NULL AND book_clicked IS NOT NULL AND book_clicked <> '';
        """)
        searches = pg_cursor.fetchall()
        
    search_batch = []
    for s in searches:
        search_batch.append({
            "search_id": str(s[0]),
            "user_id": str(s[1]),
            "book_clicked": s[2],
            "created_at": s[3].isoformat() if s[3] else None,
            "search_content": s[4] if s[4] else "Raw Navigation Click"
        })
        
    batch_size = 2000
    with memgraph_driver.session() as session:
        for idx in range(0, len(search_batch), batch_size):
            batch = search_batch[idx : idx + batch_size]
            session.run("""
                UNWIND $batch AS row
                MERGE (u:User { id: row.user_id })
                WITH u, row
                MATCH (b:Book { id: row.book_clicked })
                CREATE (u)-[:SEARCHED {
                  search_id: row.search_id,
                  created_at: row.created_at,
                  query: row.search_content
                }]->(b);
            """, batch=batch)
    print(f"[OK] Synced {len(search_batch)} search log connections.")

    # 7. Sync Borrow book transactions
    print("Syncing Borrow book transactions...")
    with pg_conn.cursor() as pg_cursor:
        pg_cursor.execute("""
            SELECT borrow_id, user_id, book_id, branch_id, reserve_date, borrow_date, due_date
            FROM borrow_book;
        """)
        borrows = pg_cursor.fetchall()
        
    borrow_batch = []
    for b in borrows:
        borrow_batch.append({
            "borrow_id": str(b[0]),
            "user_id": str(b[1]),
            "book_id": b[2],
            "branch_id": int(b[3]),
            "reserve_date": b[4].isoformat() if b[4] else None,
            "borrow_date": b[5].isoformat() if b[5] else None,
            "due_date": b[6].isoformat() if b[6] else None
        })
        
    batch_size = 2000
    with memgraph_driver.session() as session:
        for idx in range(0, len(borrow_batch), batch_size):
            batch = borrow_batch[idx : idx + batch_size]
            session.run("""
                UNWIND $batch AS row
                MERGE (u:User { id: row.user_id })
                MERGE (b:Book { id: row.book_id })
                WITH u, b, row
                MATCH (br:Branch { id: row.branch_id })
                CREATE (u)-[:BORROWED {
                  id: row.borrow_id,
                  reserve_date: row.reserve_date,
                  borrow_date: row.borrow_date,
                  due_date: row.due_date
                }]->(b)-[:FROM_BRANCH]->(br);
            """, batch=batch)
    print(f"[OK] Synced {len(borrow_batch)} borrow records.")

    # 8. Sync Return Book transactions
    print("Syncing Return Book transactions...")
    with pg_conn.cursor() as pg_cursor:
        pg_cursor.execute("""
            SELECT r.return_id, b.book_id, b.user_id, r.return_date
            FROM return_book r
            JOIN borrow_book b ON r.borrow_id = b.borrow_id;
        """)
        returns = pg_cursor.fetchall()
        
    return_batch = []
    for r in returns:
        return_batch.append({
            "return_id": str(r[0]),
            "book_id": r[1],
            "user_id": str(r[2]),
            "return_date": r[3].isoformat() if r[3] else None
        })
        
    batch_size = 2000
    with memgraph_driver.session() as session:
        for idx in range(0, len(return_batch), batch_size):
            batch = return_batch[idx : idx + batch_size]
            session.run("""
                UNWIND $batch AS row
                MATCH (b:Book { id: row.book_id })
                MERGE (u:User { id: row.user_id })
                CREATE (u)-[:RETURNED {
                  return_id: row.return_id,
                  return_date: row.return_date
                }]->(b);
            """, batch=batch)
    print(f"[OK] Synced {len(return_batch)} return records.")

    # 9. Sync User Wishlists
    print("Syncing User Wishlists...")
    with pg_conn.cursor() as pg_cursor:
        pg_cursor.execute("""
            SELECT wish_id, user_id, book_id, added_at
            FROM user_wishlist;
        """)
        wishlists = pg_cursor.fetchall()
        
    wishlist_batch = []
    for w in wishlists:
        wishlist_batch.append({
            "wish_id": str(w[0]),
            "user_id": str(w[1]),
            "book_id": w[2],
            "added_at": w[3].isoformat() if w[3] else None
        })
        
    batch_size = 2000
    with memgraph_driver.session() as session:
        for idx in range(0, len(wishlist_batch), batch_size):
            batch = wishlist_batch[idx : idx + batch_size]
            session.run("""
                UNWIND $batch AS row
                MERGE (u:User { id: row.user_id })
                MERGE (b:Book { id: row.book_id })
                CREATE (u)-[:WISHED {
                  wish_id: row.wish_id,
                  added_at: row.added_at
                }]->(b);
            """, batch=batch)
    print(f"[OK] Synced {len(wishlist_batch)} wishlist records.")

    # Cleanup and Close connections
    pg_conn.close()
    memgraph_driver.close()
    print("Graph topology successfully initialized directly from PostgreSQL database!")

if __name__ == "__main__":
    run_graph_initialization()