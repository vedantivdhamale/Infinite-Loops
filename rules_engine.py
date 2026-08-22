"""
Person 3 - Rules Engine Developer
Fast, deterministic hard-block layer. Runs BEFORE the weighted scoring engine
(Person 4). If a rule fires, we short-circuit straight to a verdict instead
of computing a score - inspired by RailHawk's "Layer 1: Rules Engine" idea,
simplified to plain Python (no YAML hot-reload needed for a hackathon).

Usage:
    from rules_engine import apply_rules, apply_rules_to_dataframe
"""

import pandas as pd

# --- Config: adjust these thresholds as needed ------------------------------

BLOCKLISTED_DEVICES = {"dev_blk_001", "dev_blk_002"}
BLOCKLISTED_BENEFICIARIES = {"benef_blk_001"}

VELOCITY_WINDOW_MINUTES = 2
VELOCITY_MAX_TXNS = 5        # more than this many txns in the window -> block
HARD_AMOUNT_CEILING = 200000  # any single transaction above this -> block

# -----------------------------------------------------------------------------


def check_blocklisted_device(row):
    if row["device_id"] in BLOCKLISTED_DEVICES:
        return "Device is on the blocklist"
    return None


def check_blocklisted_beneficiary(row):
    if row["beneficiary_id"] in BLOCKLISTED_BENEFICIARIES:
        return "Beneficiary is on the blocklist"
    return None


def check_hard_amount_ceiling(row):
    if row["amount"] > HARD_AMOUNT_CEILING:
        return f"Transaction amount exceeds hard ceiling of {HARD_AMOUNT_CEILING}"
    return None


def check_velocity(row, customer_txns_df):
    """
    customer_txns_df: all transactions for this customer (with 'timestamp' as
    datetime), used to count how many fall within VELOCITY_WINDOW_MINUTES of
    this transaction.
    """
    ts = row["timestamp"]
    window_start = ts - pd.Timedelta(minutes=VELOCITY_WINDOW_MINUTES)
    window_end = ts + pd.Timedelta(minutes=VELOCITY_WINDOW_MINUTES)

    nearby = customer_txns_df[
        (customer_txns_df["timestamp"] >= window_start)
        & (customer_txns_df["timestamp"] <= window_end)
    ]
    if len(nearby) > VELOCITY_MAX_TXNS:
        return f"{len(nearby)} transactions within a {VELOCITY_WINDOW_MINUTES}-minute window"
    return None


def apply_rules(row, customer_txns_df):
    """
    Runs all hard-block checks for a single transaction row.

    Returns:
        dict: {
            "verdict": "HARD_BLOCK" | "PASS",
            "triggered_rules": [list of reason strings, empty if PASS]
        }
    """
    checks = [
        check_blocklisted_device(row),
        check_blocklisted_beneficiary(row),
        check_hard_amount_ceiling(row),
        check_velocity(row, customer_txns_df),
    ]
    triggered = [c for c in checks if c is not None]

    if triggered:
        return {"verdict": "HARD_BLOCK", "triggered_rules": triggered}
    return {"verdict": "PASS", "triggered_rules": []}


def apply_rules_to_dataframe(df):
    """
    Runs apply_rules() across an entire transactions dataframe.

    Expects df to have columns: transaction_id, customer_id, timestamp,
    channel, amount, location, device_id, beneficiary_id.
    'timestamp' will be converted to datetime if not already.

    Returns:
        pd.DataFrame with two new columns: 'rule_verdict', 'rule_reasons'
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    verdicts = []
    reasons_list = []

    # group once for efficiency instead of filtering inside the loop
    grouped = {cid: g for cid, g in df.groupby("customer_id")}

    for _, row in df.iterrows():
        customer_txns = grouped[row["customer_id"]]
        result = apply_rules(row, customer_txns)
        verdicts.append(result["verdict"])
        reasons_list.append(result["triggered_rules"])

    df["rule_verdict"] = verdicts
    df["rule_reasons"] = reasons_list
    return df


if __name__ == "__main__":
    # Quick smoke test - run: python rules_engine.py transactions.csv
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "transactions.csv"
    df = pd.read_csv(path)
    result_df = apply_rules_to_dataframe(df)

    blocked = result_df[result_df["rule_verdict"] == "HARD_BLOCK"]
    print(f"Total transactions: {len(result_df)}")
    print(f"Hard-blocked: {len(blocked)}")
    print(blocked[["transaction_id", "customer_id", "rule_reasons"]].head(10))
