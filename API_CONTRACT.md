# API Contract — LOCK THIS IN THE FIRST 15 MINUTES

This is the shared contract between:
- **Person 4** (scoring engine — produces this shape)
- **Person 5** (API/backend — serves this shape)
- **Person 6** (UI — consumes this shape, can build against mock data immediately)

Do not change field names once locked without telling the whole team.

---

## Endpoint

```
POST /score
Content-Type: application/json
```

### Request body

A list of raw transactions (matches Person 1's CSV columns):

```json
[
  {
    "transaction_id": "a1b2c3d4",
    "customer_id": "cust_susp_003",
    "timestamp": "2026-08-20T14:32:10",
    "channel": "UPI",
    "amount": 4200.50,
    "location": "Pune",
    "device_id": "dev_cust_susp_003_1",
    "beneficiary_id": "benef_17"
  }
]
```

### Response body

A list of scored results, **same order as input**, one object per transaction:

```json
[
  {
    "transaction_id": "a1b2c3d4",
    "customer_id": "cust_susp_003",
    "risk_score": 82,
    "risk_level": "Critical",
    "reasons": [
      "Customer used 3+ channels within a short time window",
      "Amount is 3.5x above customer's average"
    ],
    "action": "Manual Review"
  }
]
```

### Field definitions

| Field | Type | Notes |
|---|---|---|
| `risk_score` | integer, 0-100 | Higher = riskier |
| `risk_level` | string | One of: `"Low"`, `"Medium"`, `"High"`, `"Critical"` |
| `reasons` | array of strings | Human-readable, shown directly in UI |
| `action` | string | One of: `"Allow"`, `"Monitor"`, `"Manual Review"` |

### Risk level thresholds (Person 4 should follow this so UI color-coding matches)

| Score range | Level | Suggested action |
|---|---|---|
| 0–29 | Low | Allow |
| 30–59 | Medium | Monitor |
| 60–79 | High | Manual Review |
| 80–100 | Critical | Manual Review |

Note: any transaction that gets `HARD_BLOCK` from Person 3's rules engine should
be forced to `risk_score: 100`, `risk_level: "Critical"`, and have the rule
reason(s) included in `reasons` alongside any behavioral reasons.

---

## Mock response (Person 6 — use this to start building the UI NOW)

Save as `mock_response.json` and point your fetch layer at it before the real
API is ready:

```json
[
  {
    "transaction_id": "a1b2c3d4",
    "customer_id": "cust_susp_003",
    "risk_score": 82,
    "risk_level": "Critical",
    "reasons": [
      "Customer used 3+ channels within a short time window",
      "Amount is 3.5x above customer's average"
    ],
    "action": "Manual Review"
  },
  {
    "transaction_id": "b5c6d7e8",
    "customer_id": "cust_0012",
    "risk_score": 12,
    "risk_level": "Low",
    "reasons": [],
    "action": "Allow"
  },
  {
    "transaction_id": "c9d0e1f2",
    "customer_id": "cust_rule_002",
    "risk_score": 100,
    "risk_level": "Critical",
    "reasons": [
      "Beneficiary is on the blocklist"
    ],
    "action": "Manual Review"
  },
  {
    "transaction_id": "d3e4f5g6",
    "customer_id": "cust_0034",
    "risk_score": 45,
    "risk_level": "Medium",
    "reasons": [
      "Amount deviates from customer's normal pattern"
    ],
    "action": "Monitor"
  }
]
```

Once Person 5's real `/score` endpoint is live, swap the mock URL for the real
one — the shape is identical, so this should be a one-line change.
