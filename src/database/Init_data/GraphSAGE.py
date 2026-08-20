import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Database Connection Configurations
MEMGRAPH_URI = "bolt://localhost:7687"  # Explicit loopback to protect socket connectivity
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
ENV_PATH = os.path.join(ROOT_DIR, ".env")
load_dotenv(ENV_PATH)

def run_graphsage_optimized():
    MEMGRAPH_USER = os.getenv("MEMGRAPH_USER")
    MEMGRAPH_PASSWORD = os.getenv("MEMGRAPH_PASSWORD")
    
    print("Connecting to Memgraph container...")
    driver = GraphDatabase.driver(MEMGRAPH_URI, auth=(MEMGRAPH_USER, MEMGRAPH_PASSWORD))
    
    with driver.session() as session:
        # --- STEP 1: INITIALIZE BOOK ENTITIES & FEATURE BACKFILLS ---
        print("Mapping native book embedding vectors directly to features...")
        session.run("""
            MATCH (b:Book)
            WHERE b.embedding IS NOT NULL
            SET b.features = b.embedding;
        """)
        
        labels_to_initialize = ["User", "Author", "Genre", "Branch"]
        for label in labels_to_initialize:
            session.run(f"""
                MATCH (n:{label})
                SET n.features = [x IN range(1, 384) | 0.0];
            """)

        # --- STEP 2: PREPROCESS MULTI-TIERED RELATIONAL WEIGHTS & TRENDING FACTORS ---
        print("[Clean] Cleaning out old projection paths...")
        session.run("MATCH (u:User)-[r:INTERACTED]->(b:Book) DELETE r;")

        print("[Weight] Injecting topological parallel relationships (Multi-Edge Weighting)...")
        
        # 2a. Process Borrows (Priority 1: Base Scale = 5)
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

        # 2b. Process Returns (Priority 1.5: Base Scale = 4)
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

        # 2c. Process Wishlists (Priority 2: Base Scale = 3)
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

        # 2d. Process Search Clicks (Priority 3: Base Scale = 1)
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

        # 2e. Process Clicked Recommends (Priority 2.5: Base Scale = 3)
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

        # --- STEP 3: CONFIGURE THE MULTI-RELATIONAL MODEL ---
        print("Configuring local GraphSAGE architectural properties...")
        setup_query = """
        CALL link_prediction.set_model_parameters({
            layer_type: "graph_sage",
            aggregator: "gcn",
            target_relation: "INTERACTED", 
            add_reverse_edges: true, 
            node_features_property: "features",
            device_type: "cpu",
            hidden_features_size: [64, 32],
            batch_size: 64,
            learning_rate: 0.005
        }) YIELD status, message;
        """
        config_res = session.run(setup_query).single()
        print(f"Configuration status: {config_res['status']} | Msg: {config_res['message']}")
        if not config_res['status']:
            raise Exception(f"GraphSAGE model configuration failed: {config_res['message']}")
        
        # --- STEP 4: TRIGGER IN-MEMORY MODEL TRAINING ---
        print("Starting weighted-edge GraphSAGE representation training loops...")
        train_query = """
        CALL link_prediction.train() 
        YIELD training_results, validation_results
        RETURN training_results, validation_results;
        """
        train_res = session.run(train_query).single()
        
        print("\n=== Local GraphSAGE Engine Output ===")
        print(f"Training Results: {train_res['training_results']}")
        print(f"Validation Evaluation: {train_res['validation_results']}")
        
    driver.close()
    print("\nWeighted topological models are compiled successfully!")

if __name__ == "__main__":
    run_graphsage_optimized()