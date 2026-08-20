import os
import sys
import subprocess
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load configurations
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
ENV_PATH = os.path.join(ROOT_DIR, ".env")
load_dotenv(ENV_PATH)
load_dotenv()  # Fallback to local directory

mem_host = os.getenv("MEMGRAPH_HOST") or "localhost"
mem_port = os.getenv("MEMGRAPH_PORT") or "7687"
MEMGRAPH_URI = os.getenv("MEMGRAPH_URI") or f"bolt://{mem_host}:{mem_port}"
MEMGRAPH_USER = os.getenv("MEMGRAPH_USER")
MEMGRAPH_PASSWORD = os.getenv("MEMGRAPH_PASSWORD")
CONTAINER_NAME = os.getenv("MEMGRAPH_CONTAINER_NAME")

# Target paths inside the container and host
SNAPSHOT_FILENAME = "amethyst_graph.snapshot"
SNAPSHOT_PATH_CONTAINER = f"/var/lib/memgraph/snapshots/{SNAPSHOT_FILENAME}"

# Host target path inside Init_data
SNAPSHOT_PATH_HOST = os.path.join(SCRIPT_DIR, SNAPSHOT_FILENAME)

def export_snapshot():
    print("Connecting to Memgraph to trigger database snapshot...")
    auth = (MEMGRAPH_USER, MEMGRAPH_PASSWORD) if (MEMGRAPH_USER and MEMGRAPH_PASSWORD) else None
    driver = GraphDatabase.driver(MEMGRAPH_URI, auth=auth)
    try:
        with driver.session() as session:
            # 1. Trigger snapshot creation in Memgraph
            print("Creating database snapshot in Memgraph...")
            session.run("CREATE SNAPSHOT;")
            print("Snapshot successfully created inside Memgraph container.")
            
            # 2. Get the filename of the latest snapshot by listing files in the container
            print("Locating the latest snapshot file...")
            list_cmd = ["docker", "exec", CONTAINER_NAME, "sh", "-c", "ls -t /var/lib/memgraph/snapshots"]
            list_result = subprocess.run(list_cmd, capture_output=True, text=True)
            if list_result.returncode != 0:
                raise Exception(f"Failed to list snapshots inside container: {list_result.stderr}")
            
            output_lines = [line.strip() for line in list_result.stdout.split("\n") if line.strip()]
            if not output_lines:
                raise Exception("No snapshot files found in /var/lib/memgraph/snapshots")
            
            latest_filename = output_lines[0]
            print(f"Latest snapshot identified: {latest_filename}")
            
            # 3. Stream the file directly from container to host using stdout
            print(f"Streaming snapshot from container to host path: {SNAPSHOT_PATH_HOST}...")
            src_path = f"/var/lib/memgraph/snapshots/{latest_filename}"
            stream_cmd = ["docker", "exec", "-i", CONTAINER_NAME, "cat", src_path]
            
            stream_result = subprocess.run(stream_cmd, capture_output=True)
            if stream_result.returncode != 0:
                raise Exception(f"Failed to stream snapshot: {stream_result.stderr.decode('utf-8', errors='ignore')}")
            
            # Write binary data to host file
            with open(SNAPSHOT_PATH_HOST, "wb") as f:
                f.write(stream_result.stdout)
                
            print(f"[OK] Binary snapshot exported cleanly to: {SNAPSHOT_PATH_HOST}")

        # 4. Dump Cypher script natively via Bolt session for cloud deployment
        cypher_path = os.path.join(SCRIPT_DIR, "datagraph_backup.cypher")
        print(f"Dumping database Cypher script to: {cypher_path}...")
        with driver.session() as session:
            result = session.run("DUMP DATABASE;")
            statements = [record[0] for record in result if record and record[0]]

        with open(cypher_path, "w", encoding="utf-8") as f:
            f.write("\n".join(statements))
        print(f"[OK] Cypher backup exported cleanly ({len(statements)} statements, {os.path.getsize(cypher_path)} bytes).")

    except Exception as e:
        print(f"[Error] Export failed: {e}")
        sys.exit(1)
    finally:
        driver.close()

def import_snapshot():
    print(f"Checking for snapshot file at: {SNAPSHOT_PATH_HOST}...")
    if not os.path.exists(SNAPSHOT_PATH_HOST):
        print(f"[Error] Import failed: Snapshot file does not exist at {SNAPSHOT_PATH_HOST}")
        sys.exit(1)

    # 1. Read local file in binary mode
    print("Reading snapshot file from host...")
    with open(SNAPSHOT_PATH_HOST, "rb") as f:
        snapshot_data = f.read()

    # 2. Stream snapshot file into the container
    print(f"Streaming snapshot file from host to container path: {SNAPSHOT_PATH_CONTAINER}...")
    stream_cmd = ["docker", "exec", "-i", CONTAINER_NAME, "sh", "-c", f"cat > {SNAPSHOT_PATH_CONTAINER}"]
    stream_result = subprocess.run(stream_cmd, input=snapshot_data, capture_output=True)
    if stream_result.returncode != 0:
        print(f"[Error] Import failed to stream file into container: {stream_result.stderr.decode('utf-8', errors='ignore')}")
        sys.exit(1)

    print("Connecting to Memgraph to recover snapshot...")
    driver = GraphDatabase.driver(MEMGRAPH_URI, auth=(MEMGRAPH_USER, MEMGRAPH_PASSWORD))
    try:
        with driver.session() as session:
            # 3. Run the recovery command in Memgraph (syntax: RECOVER SNAPSHOT 'path' FORCE;)
            print(f"Recovering snapshot from container path: {SNAPSHOT_PATH_CONTAINER}...")
            recover_query = f"RECOVER SNAPSHOT '{SNAPSHOT_PATH_CONTAINER}' FORCE;"
            session.run(recover_query)
            print("[OK] Memgraph has successfully loaded and restored the snapshot.")
    except Exception as e:
        print(f"[Error] Import failed: {e}")
        sys.exit(1)
    finally:
        driver.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python Model_snapshot.py [export|import]")
        sys.exit(1)

    action = sys.argv[1].lower()
    if action == "export":
        export_snapshot()
    elif action == "import":
        import_snapshot()
    else:
        print(f"Unknown action: {action}. Use 'export' or 'import'.")
        sys.exit(1)
