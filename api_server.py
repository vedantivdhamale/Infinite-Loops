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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from scoring_engine import score_all

app = FastAPI(title="Cross-Channel Fraud Risk Scoring API")

# Allow your frontend (running on a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for hackathon speed; tighten this if you have time
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/score")
def score(transactions: list[dict]):
    """
    Request body: list of raw transactions (see API_CONTRACT.md)
    Response: list of scored results, same order as input (see API_CONTRACT.md)
    """
    df = pd.DataFrame(transactions)
    results = score_all(df)
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
