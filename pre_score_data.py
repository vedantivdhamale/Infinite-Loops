import json
import pandas as pd
from scoring_engine import score_all, build_customer_risk_profiles

def main():
    csv_path = "transactions.csv"
    tx_json_path = "Frontend/src/data/transactions.json"
    scored_json_path = "Frontend/src/data/mockScoredTransactions.json"
    profiles_json_path = "Frontend/src/data/mockCustomerProfiles.json"

    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Save raw transactions to JSON for frontend usage
    print(f"Saving raw transactions to {tx_json_path}...")
    raw_txs = df.to_dict(orient="records")
    with open(tx_json_path, "w", encoding="utf-8") as f:
        json.dump(raw_txs, f, indent=2)

    # Score transactions
    print("Scoring all transactions...")
    scored_results = score_all(df)
    with open(scored_json_path, "w", encoding="utf-8") as f:
        json.dump(scored_results, f, indent=2)
    print(f"Scored transactions saved to {scored_json_path}")

    # Build customer profiles
    print("Building customer risk profiles...")
    profiles = build_customer_risk_profiles(df, transaction_results=scored_results)
    with open(profiles_json_path, "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=2)
    print(f"Customer profiles saved to {profiles_json_path}")

if __name__ == "__main__":
    main()
