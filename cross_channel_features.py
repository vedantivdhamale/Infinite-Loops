"""
Person 2 - Cross-Channel Feature Engineer
Computes customer-level behavior across payment channels. This is the core
"cross-channel" logic that plain single-transaction fraud detection misses -
inspired by RailHawk's cross_rail concept, implemented simply with pandas
instead of a feature store / GNN.

Usage:
    from cross_channel_features import build_customer_profiles, compute_transaction_features
"""

import pandas as pd

CROSS_CHANNEL_WINDOW_MINUTES = 15  # how tight a window counts as "rapid channel switching"


def build_customer_profiles(df):
    """
    One row per customer, summarizing their overall historical behavior.
    Used as the "normal baseline" to measure individual transactions against.

    Expects df to have: customer_id, channel, amount, timestamp (as datetime)

    Returns:
        pd.DataFrame indexed by customer_id with columns:
            distinct_channels_overall, txn_count, avg_amount, std_amount
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    profiles = df.groupby("customer_id").agg(
        distinct_channels_overall=("channel", "nunique"),
        txn_count=("transaction_id", "count"),
        avg_amount=("amount", "mean"),
        std_amount=("amount", "std"),
    )
    # std can be NaN for customers with only 1 transaction - treat as 0
    profiles["std_amount"] = profiles["std_amount"].fillna(0)
    return profiles


def _channels_in_window(customer_txns, ts, window_minutes):
    """Distinct channels used by this customer within +/- window_minutes of ts."""
    window_start = ts - pd.Timedelta(minutes=window_minutes)
    window_end = ts + pd.Timedelta(minutes=window_minutes)
    nearby = customer_txns[
        (customer_txns["timestamp"] >= window_start)
        & (customer_txns["timestamp"] <= window_end)
    ]
    return nearby["channel"].nunique(), len(nearby)


def compute_transaction_features(df, profiles=None):
    """
    Computes per-transaction cross-channel features by comparing each
    transaction against its customer's baseline profile and nearby activity.

    Expects df to have: transaction_id, customer_id, channel, amount, timestamp
    (timestamp will be converted to datetime if needed)

    Returns:
        pd.DataFrame - original df with these new columns added:
            channels_in_window       - distinct channels used near this txn
            txns_in_window           - count of txns near this txn (any channel)
            amount_ratio_to_avg      - this txn's amount / customer's avg amount
            is_new_device            - bool, true if this is the customer's first
                                        time seeing this device_id
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    if profiles is None:
        profiles = build_customer_profiles(df)

    grouped = {cid: g for cid, g in df.groupby("customer_id")}

    channels_in_window_list = []
    txns_in_window_list = []
    amount_ratio_list = []
    is_new_device_list = []

    # track devices seen so far per customer, in chronological order
    seen_devices = {}

    df_sorted = df.sort_values("timestamp")
    order_index = df_sorted.index

    results = {}
    for idx, row in df_sorted.iterrows():
        cid = row["customer_id"]
        customer_txns = grouped[cid]

        n_channels, n_txns = _channels_in_window(
            customer_txns, row["timestamp"], CROSS_CHANNEL_WINDOW_MINUTES
        )

        avg_amount = profiles.loc[cid, "avg_amount"]
        amount_ratio = row["amount"] / avg_amount if avg_amount > 0 else 1.0

        seen = seen_devices.setdefault(cid, set())
        is_new_device = row["device_id"] not in seen
        seen.add(row["device_id"])

        results[idx] = {
            "channels_in_window": n_channels,
            "txns_in_window": n_txns,
            "amount_ratio_to_avg": round(amount_ratio, 2),
            "is_new_device": is_new_device,
        }

    feat_df = pd.DataFrame.from_dict(results, orient="index")
    df = df.join(feat_df)
    return df


if __name__ == "__main__":
    # Quick smoke test - run: python cross_channel_features.py transactions.csv
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "transactions.csv"
    df = pd.read_csv(path)

    profiles = build_customer_profiles(df)
    print("Customer profiles (sample):")
    print(profiles.head())

    feat_df = compute_transaction_features(df, profiles)
    print("\nTransactions with cross-channel features (sample):")
    print(feat_df[[
        "transaction_id", "customer_id", "channel", "amount",
        "channels_in_window", "txns_in_window", "amount_ratio_to_avg", "is_new_device"
    ]].head(15))

    print("\nMost suspicious by channels_in_window:")
    print(feat_df.sort_values("channels_in_window", ascending=False)[[
        "customer_id", "channel", "channels_in_window", "amount_ratio_to_avg"
    ]].head(10))
