import sys
import os
import json
import socket
import lightgbm as lgb
import pandas as pd
from dotenv import load_dotenv

# Path setup
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../../.."))
load_dotenv(os.path.join(ROOT_DIR, "database/.env"))
load_dotenv(os.path.join(ROOT_DIR, "server/.env"))

MODEL_PATH = os.path.join(ROOT_DIR, "database/Init_data/lightgbm_ranker.txt")
PORT = int(os.getenv("RECOMMENDATION_PORT", 5001))
HOST = "127.0.0.1"

class ModelManager:
    def __init__(self, model_path):
        self.model_path = model_path
        self.bst = None
        self.last_mtime = 0
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.bst = lgb.Booster(model_file=self.model_path)
                self.last_mtime = os.path.getmtime(self.model_path)
                print(f"[Python] Loaded LightGBM model from {self.model_path} (mtime: {self.last_mtime})", flush=True)
            except Exception as e:
                print(f"[Python] Error loading model: {e}", file=sys.stderr, flush=True)
                self.bst = None
        else:
            print(f"[Python] Model file not found at {self.model_path}. Will use fallback scoring.", flush=True)
            self.bst = None
            self.last_mtime = 0

    def get_booster(self):
        # Auto-reload if model file modification time changed
        if os.path.exists(self.model_path):
            current_mtime = os.path.getmtime(self.model_path)
            if current_mtime != self.last_mtime:
                print(f"[Python] Model file change detected. Reloading model...", flush=True)
                self.load_model()
        else:
            if self.bst is not None:
                print(f"[Python] Model file removed. Disabling model...", flush=True)
                self.bst = None
                self.last_mtime = 0
        return self.bst

def handle_prediction(data_str, model_manager):
    try:
        input_data = json.loads(data_str)
        user_id = input_data.get("user_id")
        candidates = input_data.get("candidates", []) # List of {"id": "...", "session_month": 7, "past_impressions_count": 0, "is_in_wishlist": 0, "global_available_copies": 5, "gcn_score": 0.9}

        if not user_id or not candidates:
            return {"success": False, "error": "Missing user_id or candidates"}

        bst = model_manager.get_booster()
        
        if bst is not None:
            # Create feature matrix matching model expectations
            # Must contain features: session_month, past_impressions_count, is_in_wishlist, global_available_copies
            df_features = pd.DataFrame(candidates)
            X = df_features[['session_month', 'past_impressions_count', 'is_in_wishlist', 'global_available_copies']]
            
            # Predict probabilities using LightGBM model
            preds = bst.predict(X)
            
            # Combine scores
            ranked_list = []
            for idx, pred in enumerate(preds):
                ranked_list.append({
                    "id": candidates[idx]["id"],
                    "score": float(pred)
                })
        else:
            # Fallback: model weights not compiled yet, use GCN score directly
            print("[Python] Booster is not loaded. Using fallback GCN scores.", flush=True)
            ranked_list = []
            for item in candidates:
                ranked_list.append({
                    "id": item["id"],
                    "score": float(item.get("gcn_score", 0.0))
                })

        # Rank candidates descending by score
        ranked_list = sorted(ranked_list, key=lambda x: x["score"], reverse=True)
        return {"success": True, "ranked": ranked_list}

    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    model_manager = ModelManager(MODEL_PATH)
    
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    try:
        server_socket.bind((HOST, PORT))
        server_socket.listen(5)
        print(f"[Python] TCP Inference Socket Server listening on {HOST}:{PORT}", flush=True)
    except Exception as e:
        print(f"[Python] Failed to bind to port {PORT}: {e}", file=sys.stderr, flush=True)
        sys.exit(1)

    while True:
        try:
            client_socket, client_address = server_socket.accept()
            # print(f"[Python] Connection from {client_address}", flush=True)
            
            buffer = ""
            while True:
                data = client_socket.recv(4096)
                if not data:
                    break
                buffer += data.decode("utf-8")
                
                # Check if we have received a full line/message
                if "\n" in buffer:
                    parts = buffer.split("\n", 1)
                    message = parts[0].strip()
                    buffer = parts[1]
                    
                    if message:
                        response = handle_prediction(message, model_manager)
                        response_str = json.dumps(response) + "\n"
                        client_socket.sendall(response_str.encode("utf-8"))
                        break # Close connection per request as Node.js uses connection-per-request or handle similarly
            
            client_socket.close()
        except KeyboardInterrupt:
            print("[Python] Stopping TCP socket server...", flush=True)
            break
        except Exception as e:
            print(f"[Python] Connection error: {e}", file=sys.stderr, flush=True)

    server_socket.close()

if __name__ == "__main__":
    main()
