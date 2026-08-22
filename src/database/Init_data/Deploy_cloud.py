import os
import sys
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load configurations
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
ENV_PATH = os.path.join(ROOT_DIR, ".env")
load_dotenv(ENV_PATH)
load_dotenv()

CYPHER_FILE_PATH = os.path.join(SCRIPT_DIR, "datagraph_backup.cypher")

def split_cypher_statements(script_content):
    """
    Splits a Cypher script into individual statements by semicolon,
    respecting single/double quotes, escape characters, and comments.
    """
    statements = []
    current = []
    in_single_quote = False
    in_double_quote = False
    in_comment = False
    escape = False

    i = 0
    length = len(script_content)

    while i < length:
        char = script_content[i]

        if in_comment:
            if char == '\n':
                in_comment = False
            i += 1
            continue

        if not in_single_quote and not in_double_quote and i + 1 < length and script_content[i:i+2] == '//':
            in_comment = True
            i += 2
            continue

        if escape:
            current.append(char)
            escape = False
            i += 1
            continue

        if char == '\\':
            current.append(char)
            escape = True
            i += 1
            continue

        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
            current.append(char)
            i += 1
            continue

        if char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            current.append(char)
            i += 1
            continue

        if char == ';' and not in_single_quote and not in_double_quote:
            stmt = "".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
            i += 1
            continue

        current.append(char)
        i += 1

    last_stmt = "".join(current).strip()
    if last_stmt:
        statements.append(last_stmt)

    return statements

def deploy_to_memgraph_cloud():
    # 1. Environment Variable Fallback Resolution
    cloud_uri = os.getenv("MEMGRAPH_URI_SERVER") or os.getenv("MEMGRAPH_URI")
    if not cloud_uri and os.getenv("MEMGRAPH_HOST"):
        host = os.getenv("MEMGRAPH_HOST")
        port = os.getenv("MEMGRAPH_PORT") or "7687"
        cloud_uri = f"bolt://{host}:{port}"

    cloud_user = os.getenv("MEMGRAPH_USER_SERVER") or os.getenv("MEMGRAPH_USER")
    cloud_password = os.getenv("MEMGRAPH_PASSWORD")

    if not cloud_uri:
        print("[Error] Neither MEMGRAPH_URI_SERVER nor MEMGRAPH_URI environment variable is configured!")
        sys.exit(1)

    print(f"Connecting to Memgraph Cloud instance at {cloud_uri}...")

    # 2. SSL & Protocol Handshake Configuration
    auth_tuple = (cloud_user, cloud_password) if (cloud_user and cloud_password) else None
    
    driver = None
    connection_errors = []
    
    # 1. Standard driver initialization (natively handles bolt+ssc://, bolt+s://, bolt://, etc.)
    try:
        test_driver = GraphDatabase.driver(cloud_uri, auth=auth_tuple)
        with test_driver.session() as s:
            s.run("RETURN 1")
        driver = test_driver
        print(" -> Connected to Memgraph Cloud successfully.")
    except Exception as conn_err:
        connection_errors.append(f"Standard URI setup ({cloud_uri}): {conn_err}")

    # 2. Fallback for plain unencrypted bolt:// or neo4j:// URIs
    if not driver and (cloud_uri.startswith("bolt://") or cloud_uri.startswith("neo4j://")):
        try:
            test_driver = GraphDatabase.driver(cloud_uri, auth=auth_tuple, encrypted=False)
            with test_driver.session() as s:
                s.run("RETURN 1")
            driver = test_driver
            print(" -> Connected to Memgraph Cloud successfully (encrypted=False).")
        except Exception as conn_err:
            connection_errors.append(f"encrypted=False: {conn_err}")

    if not driver:
        print("[Error] Failed to connect to Memgraph Cloud instance!")
        print("Diagnostic Details:")
        for err in connection_errors:
            print(f"  - {err}")
        print("\nPlease check:")
        print("  1. VPS Firewall / Security Group: Ensure port 7687 is open to inbound traffic.")
        print("  2. Memgraph Config: Ensure --bolt-address=0.0.0.0 in memgraph.conf (not 127.0.0.1).")
        sys.exit(1)

    try:
        with driver.session() as session:
            # 1. Ensure essential unique constraints are active
            essential_constraints = [
                "CREATE CONSTRAINT ON (b:Book) ASSERT b.id IS UNIQUE;",
                "CREATE CONSTRAINT ON (u:User) ASSERT u.id IS UNIQUE;",
                "CREATE CONSTRAINT ON (a:Author) ASSERT a.name IS UNIQUE;",
                "CREATE CONSTRAINT ON (g:Genre) ASSERT g.name IS UNIQUE;",
                "CREATE CONSTRAINT ON (br:Branch) ASSERT br.id IS UNIQUE;"
            ]
            print("Verifying essential schema unique constraints on Memgraph Cloud...")
            for c_stmt in essential_constraints:
                try:
                    session.run(c_stmt)
                except Exception:
                    pass

            print("Rebuilding weighted topological INTERACTED projection edges on Memgraph Cloud...")
            
            # Step A: Delete old temporary INTERACTED projection edges
            session.run("MATCH (u:User)-[r:INTERACTED]->(b:Book) DELETE r;")

            # Step B: Re-generate multi-tiered relational INTERACTED edges directly on Cloud instance
            # Borrows (scale 5)
            session.run("""
                MATCH (u:User)-[b:BORROWED]->(bk:Book)
                WITH u, bk, CASE 
                  WHEN b.borrow_date IS NOT NULL AND b.borrow_date <> "" THEN b.borrow_date
                  WHEN b.reserve_date IS NOT NULL AND b.reserve_date <> "" THEN b.reserve_date
                  ELSE "2026-01-01T00:00:00"
                END AS raw_date
                WITH u, bk, replace(raw_date, " ", "T") AS t_date
                WITH u, bk, CASE WHEN t_date CONTAINS "T" THEN t_date ELSE t_date + "T00:00:00" END AS final_date_str
                WITH u, bk, (timestamp() - timestamp(localDateTime(final_date_str))) / 86400000000.0 AS days_ago
                WITH u, bk, 5.0 * exp(-0.05 * days_ago) AS final_weight
                WITH u, bk, toInteger(ceil(final_weight)) AS edge_count
                UNWIND range(1, edge_count) AS flag
                CREATE (u)-[:INTERACTED]->(bk);
            """)

            # Returns (scale 4)
            session.run("""
                MATCH (u:User)-[r:RETURNED]->(bk:Book)
                WITH u, bk, CASE 
                  WHEN r.return_date IS NOT NULL AND r.return_date <> "" THEN r.return_date
                  ELSE "2026-01-01T00:00:00"
                END AS raw_date
                WITH u, bk, replace(raw_date, " ", "T") AS t_date
                WITH u, bk, CASE WHEN t_date CONTAINS "T" THEN t_date ELSE t_date + "T00:00:00" END AS final_date_str
                WITH u, bk, (timestamp() - timestamp(localDateTime(final_date_str))) / 86400000000.0 AS days_ago
                WITH u, bk, 4.0 * exp(-0.05 * days_ago) AS final_weight
                WITH u, bk, toInteger(ceil(final_weight)) AS edge_count
                UNWIND range(1, edge_count) AS flag
                CREATE (u)-[:INTERACTED]->(bk);
            """)

            # Wishlists (scale 3)
            session.run("""
                MATCH (u:User)-[w:WISHED]->(bk:Book)
                WITH u, bk, CASE 
                  WHEN w.added_at IS NOT NULL AND w.added_at <> "" THEN w.added_at
                  ELSE "2026-01-01T00:00:00"
                END AS raw_date
                WITH u, bk, replace(raw_date, " ", "T") AS t_date
                WITH u, bk, CASE WHEN t_date CONTAINS "T" THEN t_date ELSE t_date + "T00:00:00" END AS final_date_str
                WITH u, bk, (timestamp() - timestamp(localDateTime(final_date_str))) / 86400000000.0 AS days_ago
                WITH u, bk, 3.0 * exp(-0.05 * days_ago) AS final_weight
                WITH u, bk, toInteger(ceil(final_weight)) AS edge_count
                UNWIND range(1, edge_count) AS flag
                CREATE (u)-[:INTERACTED]->(bk);
            """)

            # Searches (scale 1)
            session.run("""
                MATCH (u:User)-[s:SEARCHED]->(bk:Book)
                WITH u, bk, CASE 
                  WHEN s.created_at IS NOT NULL AND s.created_at <> "" THEN s.created_at
                  ELSE "2026-01-01T00:00:00"
                END AS raw_date
                WITH u, bk, replace(raw_date, " ", "T") AS t_date
                WITH u, bk, CASE WHEN t_date CONTAINS "T" THEN t_date ELSE t_date + "T00:00:00" END AS final_date_str
                WITH u, bk, (timestamp() - timestamp(localDateTime(final_date_str))) / 86400000000.0 AS days_ago
                WITH u, bk, 1.0 * exp(-0.05 * days_ago) AS final_weight
                WITH u, bk, toInteger(ceil(final_weight)) AS edge_count
                UNWIND range(1, edge_count) AS flag
                CREATE (u)-[:INTERACTED]->(bk);
            """)

            # Recommended Clicks (scale 3)
            session.run("""
                MATCH (u:User)-[r:RECOMMENDED]->(bk:Book)
                WHERE r.is_clicked = true
                WITH u, bk, CASE 
                  WHEN r.generated_at IS NOT NULL AND r.generated_at <> "" THEN r.generated_at
                  ELSE "2026-01-01T00:00:00"
                END AS raw_date
                WITH u, bk, replace(raw_date, " ", "T") AS t_date
                WITH u, bk, CASE WHEN t_date CONTAINS "T" THEN t_date ELSE t_date + "T00:00:00" END AS final_date_str
                WITH u, bk, (timestamp() - timestamp(localDateTime(final_date_str))) / 86400000000.0 AS days_ago
                WITH u, bk, 3.0 * exp(-0.05 * days_ago) AS final_weight
                WITH u, bk, toInteger(ceil(final_weight)) AS edge_count
                UNWIND range(1, edge_count) AS flag
                CREATE (u)-[:INTERACTED]->(bk);
            """)

            # Step C: Fast sync of updated Book embedding feature vectors
            print("Syncing updated node feature properties...")
            session.run("""
                MATCH (b:Book)
                WHERE b.embedding IS NOT NULL
                SET b.features = b.embedding;
            """)

            try:
                session.run("FREE MEMORY")
            except Exception:
                pass

            res_nodes = session.run("MATCH (n) RETURN count(n) AS total_nodes")
            res_edges = session.run("MATCH ()-[r]->() RETURN count(r) AS total_edges")
            
            total_nodes = res_nodes.single()["total_nodes"]
            total_edges = res_edges.single()["total_edges"]
            print(f" [SUCCESS] Memgraph Cloud deployment complete! Active nodes: {total_nodes} | Active edges: {total_edges}")

    except Exception as e:
        print(f"[Error] Memgraph Cloud deployment failed: {e}")
        sys.exit(1)
    finally:
        driver.close()

if __name__ == "__main__":
    deploy_to_memgraph_cloud()
