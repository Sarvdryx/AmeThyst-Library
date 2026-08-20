import os
import random
import json
import pandas as pd
import psycopg2
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from dotenv import load_dotenv

load_dotenv()

def bootstrap_from_existing_data(cursor):
    """
    Seeds initial baseline impression logs using users and books 
    that already exist in your initialized database tables.
    """
    print("Empty impressions table detected! Fetching your initialized users and books...")
    
    # 1. Fetch real user IDs from your existing searches or users table
    # Adjust 'searches' to 'users' if you have a dedicated user table
    cursor.execute("SELECT DISTINCT user_id FROM search_history LIMIT 50;")
    user_ids = [row[0] for row in cursor.fetchall()]
    
    # 2. Fetch real book IDs from your catalog
    cursor.execute("SELECT book_id FROM books LIMIT 100;")
    book_ids = [row[0] for row in cursor.fetchall()]
    
    if not user_ids:
        print("❌ Error: No users found in the 'search_history' table. Please run your user data mock script first.")
        return False
    if not book_ids:
        print("❌ Error: The 'books' table is completely empty.")
        return False

    print(f"Bootstrapping interaction history for {len(user_ids)} real users...")
    
    # 3. Insert a realistic mix of initial views (mostly skips, a few clicks)
    for u_id in user_ids:
        # Sample a few random books for each active user to build their baseline feed history
        sampled_books = random.sample(book_ids, min(15, len(book_ids)))
        for b_id in sampled_books:
            is_clicked = random.random() < 0.15  # 15% baseline click-through rate
            cursor.execute("""
                INSERT INTO recommends (user_id, book_id, is_clicked)
                VALUES (%s, %s, %s);
            """, (u_id, b_id, is_clicked))
            
    print("✓ Successfully populated initial impressions from existing database entities.")
    return True

def fetch_training_dataset():
    """Queries PostgreSQL and safely compiles ranking features."""
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "your_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password")
    )
    cursor = conn.cursor()
    
    # Check if the table is currently empty
    cursor.execute("SELECT COUNT(*) FROM recommends;")
    if cursor.fetchone()[0] == 0:
        success = bootstrap_from_existing_data(cursor)
        if not success:
            conn.close()
            return pd.DataFrame()
        conn.commit()  # Commit the new records to the database

    query = """
        SELECT 
            i.user_id,
            i.book_id,
            EXTRACT(MONTH FROM i.showed_at) as session_month,
            COALESCE((
                SELECT COUNT(*) FROM recommends i2 
                WHERE i2.user_id = i.user_id 
                  AND i2.book_id = i.book_id 
                  AND i2.showed_at < i.showed_at 
                  AND i2.is_clicked = FALSE 
                  AND i2.renewed_at IS NULL
            ), 0) as past_impressions_count,
            CASE WHEN EXISTS(
                SELECT 1 FROM user_wishlist uw 
                WHERE uw.user_id = i.user_id AND uw.book_id = i.book_id
            ) THEN 1 ELSE 0 END as is_in_wishlist,
            COALESCE((
                SELECT SUM(available_quantity) FROM library l 
                WHERE l.book_id = i.book_id
            ), 0) as global_available_copies,
            CASE WHEN i.is_clicked = TRUE THEN 1 ELSE 0 END as label
        FROM recommends i;
    """
    
    df = pd.read_sql_query(query, conn)
    cursor.close()
    conn.close()
    return df

def run_local_training():
    df = fetch_training_dataset()
    
    if df.empty or len(df) < 5:
        print("❌ Training aborted: Insufficient dataset footprint available.")
        return
        
    feature_columns = ['session_month', 'past_impressions_count', 'is_in_wishlist', 'global_available_copies']
    X = df[feature_columns]
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    train_matrix = lgb.Dataset(X_train, label=y_train)
    test_matrix = lgb.Dataset(X_test, label=y_test, reference=train_matrix)
    
    hyperparameters = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'boosting_type': 'gbdt',
        'learning_rate': 0.05,
        'num_leaves': 7,          
        'min_data_in_leaf': 2,
        'verbose': -1
    }
    
    print(f"Training LightGBM model locally on {len(X_train)} rows...")
    ranker_model = lgb.train(
        hyperparameters,
        train_matrix,
        num_boost_round=50,
        valid_sets=[test_matrix]
    )
    
    model_output_path = os.path.join(os.path.dirname(__file__), "lightgbm_ranker.txt")
    ranker_model.save_model(model_output_path)
    print(f"Success! Initial weights file compiled cleanly to: {model_output_path}")



if __name__ == "__main__":
    run_local_training()