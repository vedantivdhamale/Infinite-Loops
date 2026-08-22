"""
Person 3 - Rules Engine Developer
Fast, deterministic hard-block layer. Runs BEFORE any scoring - if a
transaction trips a rule here, it's blocked outright (HARD_BLOCK) and
Person 4's behavioral scoring is skipped entirely (score=100, Critical).

Usage:
    from rules_engine import apply_rules_to_dataframe
    rules_df = apply_rules_to_dataframe(df)
    # -> DataFrame with: transaction_id, rule_verdict, rule_reasons

Smoke test:
    python rules_engine.py transactions.csv
"""

import pandas as pd

# --- Thresholds (tune these once you see real data) -------------------------

VELOCITY_MAX_TXNS = 5              # 5+ txns by same customer in the window -> block
VELOCITY_WINDOW_MINUTES = 2

HARD_AMOUNT_CEILING = 200_000      # any single txn above this -> block

BLOCKLISTED_DEVICES = ["dev_blk_001", "dev_blk_002"]
BLOCKLISTED_BENEFICIARIES = ["benef_blk_001"]
BLOCKLISTED_LOCATIONS = ["Unknown", "XX"]

# -----------------------------------------------------------------------------


def _velocity_count(customer_txns, ts, window_minutes):
    """How many of this customer's transactions fall in [ts - window, ts]."""
    window_start = ts - pd.Timedelta(minutes=window_minutes)
    nearby = customer_txns[
        (customer_txns["timestamp"] >= window_start) & (customer_txns["timestamp"] <= ts)
    ]
    return len(nearby)


def apply_rules_to_dataframe(df):
    """
    Expects df to have: transaction_id, customer_id, timestamp, channel,
    amount, location, device_id, beneficiary_id.

    Returns:
        pd.DataFrame with columns:
            transaction_id
            rule_verdict   - "HARD_BLOCK" or "PASS"
            rule_reasons   - list[str], empty list when verdict is PASS
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # pre-group once so the velocity check doesn't re-filter the whole df per row
    grouped = {cid: g for cid, g in df.groupby("customer_id")}

    rows = []
    for _, row in df.sort_values("timestamp").iterrows():
        reasons = []

        if row.get("device_id") in BLOCKLISTED_DEVICES:
            reasons.append("Device is on the blocklist")
        if row.get("beneficiary_id") in BLOCKLISTED_BENEFICIARIES:
            reasons.append("Beneficiary is on the blocklist")
        if row.get("location") in BLOCKLISTED_LOCATIONS:
            reasons.append("Location is blacklisted")
        if row["amount"] > HARD_AMOUNT_CEILING:
            reasons.append(f"Amount exceeds hard ceiling of {HARD_AMOUNT_CEILING}")

        n_recent = _velocity_count(
            grouped[row["customer_id"]], row["timestamp"], VELOCITY_WINDOW_MINUTES
        )
        if n_recent >= VELOCITY_MAX_TXNS:
            reasons.append(
                f"{n_recent} transactions within a {VELOCITY_WINDOW_MINUTES}-minute window"
            )

        rows.append({
            "transaction_id": row["transaction_id"],
            "rule_verdict": "HARD_BLOCK" if reasons else "PASS",
            "rule_reasons": reasons,
        })

    # restore original row order (we sorted by timestamp above)
    result = pd.DataFrame(rows)
    order = df["transaction_id"].tolist()
    result = result.set_index("transaction_id").loc[order].reset_index()
    return result


if __name__ == "__main__":
    # Quick smoke test - run: python rules_engine.py transactions.csv
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "transactions.csv"
    df = pd.read_csv(path)

    result = apply_rules_to_dataframe(df)
    merged = df.merge(result, on="transaction_id")

    blocked = merged[merged["rule_verdict"] == "HARD_BLOCK"]
    print(f"{len(blocked)} of {len(merged)} transactions HARD_BLOCKed\n")
    print(blocked[["transaction_id", "customer_id", "device_id", "beneficiary_id",
                    "location", "amount", "rule_reasons"]].head(20).to_string())

    print(f"\n{len(merged) - len(blocked)} transactions PASSed to scoring.")