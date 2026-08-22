"""
Person 1 - Data & Schema Lead
Generates synthetic transaction data with cross-channel fields.

Usage:
    python generate_data.py --rows 800 --output transactions.csv
"""

import argparse
import random
import uuid
from datetime import datetime, timedelta

import pandas as pd

CHANNELS = ["UPI", "ATM", "Card", "NetBanking"]
LOCATIONS = ["Pune", "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"]

# A small blocklist that Person 3 (Rules Engine) will check against
BLOCKLISTED_DEVICES = ["dev_blk_001", "dev_blk_002"]
BLOCKLISTED_BENEFICIARIES = ["benef_blk_001"]


def random_timestamp(base_time, max_minutes_offset=0):
    return base_time + timedelta(minutes=random.uniform(0, max_minutes_offset))


def make_normal_customer_transactions(customer_id, n_txns, base_time):
    """Normal behavior: single channel, consistent amounts, spread out in time."""
    rows = []
    channel = random.choice(CHANNELS)
    avg_amount = random.uniform(500, 5000)
    location = random.choice(LOCATIONS)
    device_id = f"dev_{customer_id}_{random.randint(1,3)}"

    for i in range(n_txns):
        ts = base_time + timedelta(hours=random.uniform(0, 72))
        rows.append({
            "transaction_id": str(uuid.uuid4())[:8],
            "customer_id": customer_id,
            "timestamp": ts.isoformat(),
            "channel": channel,
            "amount": round(random.gauss(avg_amount, avg_amount * 0.15), 2),
            "location": location,
            "device_id": device_id,
            "beneficiary_id": f"benef_{random.randint(1,50)}",
        })
    return rows


def make_cross_channel_suspicious_customer(customer_id, base_time):
    """
    Suspicious behavior: same customer, 3+ channels, tight time window,
    escalating amounts. This is what the cross-channel layer should catch.
    """
    rows = []
    n_channels = random.randint(3, 4)
    channels_used = random.sample(CHANNELS, n_channels)
    device_id = f"dev_{customer_id}_1"
    location = random.choice(LOCATIONS)
    amount = random.uniform(2000, 5000)

    window_start = base_time + timedelta(hours=random.uniform(0, 60))

    for i, channel in enumerate(channels_used):
        amount *= random.uniform(1.3, 1.8)  # escalating amounts
        ts = window_start + timedelta(minutes=i * random.uniform(1, 4))  # tight window
        rows.append({
            "transaction_id": str(uuid.uuid4())[:8],
            "customer_id": customer_id,
            "timestamp": ts.isoformat(),
            "channel": channel,
            "amount": round(amount, 2),
            "location": location,
            "device_id": device_id,
            "beneficiary_id": f"benef_{random.randint(1,50)}",
        })
    return rows


def make_rule_violation_customer(customer_id, base_time):
    """
    Cases meant to trip Person 3's hard-block rules engine directly:
    blocklisted device, blocklisted beneficiary, extreme velocity.
    """
    rows = []
    scenario = random.choice(["blocklisted_device", "blocklisted_beneficiary", "extreme_velocity"])

    if scenario == "blocklisted_device":
        ts = base_time + timedelta(hours=random.uniform(0, 72))
        rows.append({
            "transaction_id": str(uuid.uuid4())[:8],
            "customer_id": customer_id,
            "timestamp": ts.isoformat(),
            "channel": random.choice(CHANNELS),
            "amount": round(random.uniform(1000, 4000), 2),
            "location": random.choice(LOCATIONS),
            "device_id": random.choice(BLOCKLISTED_DEVICES),
            "beneficiary_id": f"benef_{random.randint(1,50)}",
        })

    elif scenario == "blocklisted_beneficiary":
        ts = base_time + timedelta(hours=random.uniform(0, 72))
        rows.append({
            "transaction_id": str(uuid.uuid4())[:8],
            "customer_id": customer_id,
            "timestamp": ts.isoformat(),
            "channel": random.choice(CHANNELS),
            "amount": round(random.uniform(1000, 4000), 2),
            "location": random.choice(LOCATIONS),
            "device_id": f"dev_{customer_id}_1",
            "beneficiary_id": random.choice(BLOCKLISTED_BENEFICIARIES),
        })

    else:  # extreme_velocity: 6 transactions in 2 minutes
        window_start = base_time + timedelta(hours=random.uniform(0, 60))
        device_id = f"dev_{customer_id}_1"
        location = random.choice(LOCATIONS)
        for i in range(6):
            ts = window_start + timedelta(seconds=i * 15)
            rows.append({
                "transaction_id": str(uuid.uuid4())[:8],
                "customer_id": customer_id,
                "timestamp": ts.isoformat(),
                "channel": random.choice(CHANNELS),
                "amount": round(random.uniform(500, 2000), 2),
                "location": location,
                "device_id": device_id,
                "beneficiary_id": f"benef_{random.randint(1,50)}",
            })
    return rows


def generate_dataset(n_rows=800, n_suspicious=15, n_rule_violations=8, seed=42):
    random.seed(seed)
    base_time = datetime(2026, 8, 20, 0, 0, 0)
    all_rows = []

    n_normal_customers = max(1, (n_rows - n_suspicious * 4 - n_rule_violations * 3) // 6)

    for i in range(n_normal_customers):
        customer_id = f"cust_{i:04d}"
        n_txns = random.randint(3, 8)
        all_rows.extend(make_normal_customer_transactions(customer_id, n_txns, base_time))

    for i in range(n_suspicious):
        customer_id = f"cust_susp_{i:03d}"
        all_rows.extend(make_cross_channel_suspicious_customer(customer_id, base_time))

    for i in range(n_rule_violations):
        customer_id = f"cust_rule_{i:03d}"
        all_rows.extend(make_rule_violation_customer(customer_id, base_time))

    df = pd.DataFrame(all_rows)
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=800, help="Approx target row count")
    parser.add_argument("--suspicious", type=int, default=15, help="Number of cross-channel suspicious customers")
    parser.add_argument("--rule-violations", type=int, default=8, help="Number of hard-rule violation customers")
    parser.add_argument("--output", type=str, default="transactions.csv")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    df = generate_dataset(
        n_rows=args.rows,
        n_suspicious=args.suspicious,
        n_rule_violations=args.rule_violations,
        seed=args.seed,
    )
    df.to_csv(args.output, index=False)
    print(f"Generated {len(df)} rows -> {args.output}")
    print(f"Distinct customers: {df['customer_id'].nunique()}")
    print("\nSample suspicious customer (check these get flagged):")
    susp_sample = df[df['customer_id'].str.startswith('cust_susp')]['customer_id'].iloc[0]
    print(df[df['customer_id'] == susp_sample])
