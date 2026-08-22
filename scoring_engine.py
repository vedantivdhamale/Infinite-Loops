"""
Person 4 - Risk Scoring & Reason Codes Developer
Combines Person 3's rules engine (hard blocks) with Person 2's cross-channel
features (behavioral scoring) into a final risk score, level, reasons, and
suggested action - matching API_CONTRACT.md exactly.

Usage:
    from scoring_engine import score_all
    results = score_all(df)   # -> list of dicts matching the API contract
"""

import pandas as pd

from rules_engine import apply_rules_to_dataframe
from cross_channel_features import build_customer_profiles, compute_transaction_features

# --- Scoring weights (tune these if you have time) --------------------------

WEIGHTS = {
    "multi_channel": 30,       # 3+ distinct channels in the window
    "high_velocity": 20,       # many txns (any channel) in the window
    "amount_deviation": 25,    # amount far above customer's average
    "new_device": 15,          # device_id never seen before for this customer
}

MULTI_CHANNEL_THRESHOLD = 3     # distinct channels in window to trigger
HIGH_VELOCITY_THRESHOLD = 4     # txns in window to trigger
AMOUNT_DEVIATION_RATIO = 2.5    # amount / avg_amount to trigger

# -----------------------------------------------------------------------------


def bucket_risk(score):
    if score >= 80:
        return "Critical"
    elif score >= 60:
        return "High"
    elif score >= 30:
        return "Medium"
    else:
        return "Low"


def action_for_level(level):
    return {
        "Low": "Allow",
        "Medium": "Monitor",
        "High": "Manual Review",
        "Critical": "Manual Review",
    }[level]


def score_behavioral(row):
    """
    Weighted scoring based on cross-channel features (Person 2's output).
    Returns (score, reasons list).
    """
    score = 0
    reasons = []

    if row["channels_in_window"] >= MULTI_CHANNEL_THRESHOLD:
        score += WEIGHTS["multi_channel"]
        reasons.append(
            f"Customer used {row['channels_in_window']} different channels within "
            f"a short time window"
        )

    if row["txns_in_window"] >= HIGH_VELOCITY_THRESHOLD:
        score += WEIGHTS["high_velocity"]
        reasons.append(
            f"{row['txns_in_window']} transactions detected in a short time window"
        )

    if row["amount_ratio_to_avg"] >= AMOUNT_DEVIATION_RATIO:
        score += WEIGHTS["amount_deviation"]
        reasons.append(
            f"Amount is {row['amount_ratio_to_avg']}x above customer's average"
        )

    if row["is_new_device"]:
        score += WEIGHTS["new_device"]
        reasons.append("Transaction made from a device not seen before for this customer")

    return min(score, 100), reasons


def score_all(df):
    """
    Full pipeline: rules engine -> cross-channel features -> behavioral scoring
    -> final result matching API_CONTRACT.md.

    Expects df to have: transaction_id, customer_id, timestamp, channel,
    amount, location, device_id, beneficiary_id.

    Returns:
        list of dicts, one per transaction, in the same order as the input,
        matching the shape defined in API_CONTRACT.md.
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    original_order = df["transaction_id"].tolist()

    # Step 1: hard-block rules (Person 3)
    rules_df = apply_rules_to_dataframe(df)

    # Step 2: cross-channel behavioral features (Person 2)
    profiles = build_customer_profiles(df)
    feat_df = compute_transaction_features(df, profiles)

    # Merge rules + features on transaction_id
    merged = feat_df.merge(
        rules_df[["transaction_id", "rule_verdict", "rule_reasons"]],
        on="transaction_id",
        how="left",
    )

    results = []
    for _, row in merged.iterrows():
        if row["rule_verdict"] == "HARD_BLOCK":
            score = 100
            level = "Critical"
            reasons = list(row["rule_reasons"])
        else:
            score, reasons = score_behavioral(row)
            level = bucket_risk(score)

        results.append({
            "transaction_id": row["transaction_id"],
            "customer_id": row["customer_id"],
            "risk_score": score,
            "risk_level": level,
            "reasons": reasons,
            "action": action_for_level(level),
        })

    # preserve original input order
    results_by_id = {r["transaction_id"]: r for r in results}
    return [results_by_id[tid] for tid in original_order]


if __name__ == "__main__":
    # Quick smoke test - run: python scoring_engine.py transactions.csv
    import json
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "transactions.csv"
    df = pd.read_csv(path)

    results = score_all(df)

    print(f"Scored {len(results)} transactions\n")

    # show the riskiest ones first
    top = sorted(results, key=lambda r: r["risk_score"], reverse=True)[:10]
    print("Top 10 riskiest transactions:")
    print(json.dumps(top, indent=2))

    levels = {}
    for r in results:
        levels[r["risk_level"]] = levels.get(r["risk_level"], 0) + 1
    print("\nRisk level distribution:", levels)
