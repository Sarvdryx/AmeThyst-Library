import os
import sys
import lightgbm as lgb
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="AmeThyst LightGBM Micro-Ranker Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATHS = [
    os.path.join(SCRIPT_DIR, "lightgbm_ranker.txt"),
    os.path.abspath(os.path.join(SCRIPT_DIR, "../../../database/Init_data/lightgbm_ranker.txt")),
    os.path.abspath(os.path.join(SCRIPT_DIR, "../../../src/database/Init_data/lightgbm_ranker.txt")),
]

def find_model_path():
    for path in MODEL_PATHS:
        if os.path.exists(path):
            return path
    return MODEL_PATHS[0]

class Candidate(BaseModel):
    id: str
    session_month: Optional[float] = 1.0
    past_impressions_count: Optional[float] = 0.0
    is_in_wishlist: Optional[float] = 0.0
    global_available_copies: Optional[float] = 0.0
    gcn_score: Optional[float] = 0.0

class PredictRequest(BaseModel):
    user_id: str
    candidates: List[Candidate]

class ModelManager:
    def __init__(self):
        self.bst = None
        self.last_mtime = 0
        self.model_path = find_model_path()
        self.load_model()

    def load_model(self):
        self.model_path = find_model_path()
        if os.path.exists(self.model_path):
            try:
                self.bst = lgb.Booster(model_file=self.model_path)
                self.last_mtime = os.path.getmtime(self.model_path)
                print(f"[Render FastAPI] Loaded LightGBM model from {self.model_path} (mtime: {self.last_mtime})", flush=True)
            except Exception as e:
                print(f"[Render FastAPI] Error loading model: {e}", file=sys.stderr, flush=True)
                self.bst = None
        else:
            print(f"[Render FastAPI] Model file not found at {self.model_path}. Fallback active.", flush=True)
            self.bst = None
            self.last_mtime = 0

    def get_booster(self):
        if os.path.exists(self.model_path):
            current_mtime = os.path.getmtime(self.model_path)
            if current_mtime != self.last_mtime:
                print("[Render FastAPI] Model file change detected. Reloading model...", flush=True)
                self.load_model()
        return self.bst

model_manager = ModelManager()

@app.get("/")
@app.get("/health")
def health_check():
    bst = model_manager.get_booster()
    return {
        "status": "healthy",
        "service": "AmeThyst LightGBM Micro-Ranker",
        "model_loaded": bst is not None,
        "model_path": model_manager.model_path
    }

@app.post("/predict")
def predict(req: PredictRequest):
    if not req.user_id or not req.candidates:
        raise HTTPException(status_code=400, detail="Missing user_id or candidates")

    bst = model_manager.get_booster()
    candidates_dict = [c.dict() for c in req.candidates]

    if bst is not None:
        try:
            df_features = pd.DataFrame(candidates_dict)
            for col in ['session_month', 'past_impressions_count', 'is_in_wishlist', 'global_available_copies']:
                if col not in df_features.columns:
                    df_features[col] = 0.0

            X = df_features[['session_month', 'past_impressions_count', 'is_in_wishlist', 'global_available_copies']]
            preds = bst.predict(X)

            ranked_list = []
            for idx, pred in enumerate(preds):
                ranked_list.append({
                    "id": candidates_dict[idx]["id"],
                    "score": float(pred)
                })
        except Exception as e:
            print(f"[Render FastAPI] Prediction error: {e}", file=sys.stderr, flush=True)
            ranked_list = [{"id": c["id"], "score": float(c.get("gcn_score", 0.0))} for c in candidates_dict]
    else:
        ranked_list = [{"id": c["id"], "score": float(c.get("gcn_score", 0.0))} for c in candidates_dict]

    ranked_list = sorted(ranked_list, key=lambda x: x["score"], reverse=True)
    return {"success": True, "ranked": ranked_list}
