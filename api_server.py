"""
Person 5 - API/Backend Developer
Wraps scoring_engine.score_all() in a FastAPI endpoint matching API_CONTRACT.md.

Usage:
    uvicorn api_server:app --reload --port 8000

Test:
    curl -X POST http://localhost:8000/score \
      -H "Content-Type: application/json" \
      -d @sample_request.json
"""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from scoring_engine import score_all, build_customer_risk_profiles

app = FastAPI(title="Cross-Channel Fraud Risk Scoring API")

# Allow your frontend (running on a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for hackathon speed; tighten this if you have time
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to the shared dataset - this file must sit next to api_server.py
TRANSACTIONS_CSV_PATH = os.path.join(os.path.dirname(__file__), "transactions.csv")


def _load_transactions_csv():
    if not os.path.exists(TRANSACTIONS_CSV_PATH):
        raise HTTPException(
            status_code=404,
            detail=f"transactions.csv not found at {TRANSACTIONS_CSV_PATH}. "
                   f"Run generate_data.py first.",
        )
    return pd.read_csv(TRANSACTIONS_CSV_PATH)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/transactions/scored")
def get_all_scored_transactions():
    """
    Loads transactions.csv server-side and returns ALL transactions scored.
    No request body needed - this is what the frontend should call to populate
    the full dashboard (all 737+ rows), instead of POSTing a hardcoded subset.
    """
    df = _load_transactions_csv()
    results = score_all(df)
    return {
        "total_transactions": len(results),
        "results": results,
    }


@app.get("/customers/profiles")
def get_all_customer_profiles():
    """
    Loads transactions.csv server-side and returns ALL customer risk profiles.
    No request body needed - use this to populate the customer-level view.
    """
    df = _load_transactions_csv()
    scored = score_all(df)
    profiles = build_customer_risk_profiles(df, transaction_results=scored)
    return {
        "total_customers": len(profiles),
        "profiles": profiles,
    }


@app.post("/score")
def score(transactions: list[dict]):
    """
    Request body: list of raw transactions (see API_CONTRACT.md)
    Response: list of scored results, same order as input (see API_CONTRACT.md)
    Use this if the frontend wants to score a specific/custom set of
    transactions rather than the full dataset (e.g. an uploaded file).
    """
    df = pd.DataFrame(transactions)
    results = score_all(df)
    return results


@app.post("/customer-profiles")
def customer_profiles(transactions: list[dict]):
    """
    Request body: same list of raw transactions as /score
    Response: list of per-customer risk profiles, riskiest first
    """
    df = pd.DataFrame(transactions)
    scored = score_all(df)
    profiles = build_customer_risk_profiles(df, transaction_results=scored)
    return profiles


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)