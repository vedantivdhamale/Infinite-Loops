export const mockResponse = [
  {
    transaction_id: "a1b2c3d4",
    customer_id: "cust_susp_003",
    risk_score: 82,
    risk_level: "Critical",
    reasons: [
      "Customer used 3+ channels within a short time window",
      "Amount is 3.5x above customer's average"
    ],
    action: "Manual Review"
  },
  {
    transaction_id: "b5c6d7e8",
    customer_id: "cust_0012",
    risk_score: 12,
    risk_level: "Low",
    reasons: [],
    action: "Allow"
  },
  {
    transaction_id: "c9d0e1f2",
    customer_id: "cust_rule_002",
    risk_score: 100,
    risk_level: "Critical",
    reasons: [
      "Beneficiary is on the blocklist"
    ],
    action: "Manual Review"
  },
  {
    transaction_id: "d3e4f5g6",
    customer_id: "cust_0034",
    risk_score: 45,
    risk_level: "Medium",
    reasons: [
      "Amount deviates from customer's normal pattern"
    ],
    action: "Monitor"
  }
];

export const rawTransactions = [
  {
    transaction_id: "a1b2c3d4",
    customer_id: "cust_susp_003",
    timestamp: "2026-08-20T14:32:10",
    channel: "UPI",
    amount: 4200.50,
    location: "Pune",
    device_id: "dev_cust_susp_003_1",
    beneficiary_id: "benef_17"
  },
  {
    transaction_id: "b5c6d7e8",
    customer_id: "cust_0012",
    timestamp: "2026-08-20T14:35:00",
    channel: "NetBanking",
    amount: 150.00,
    location: "Mumbai",
    device_id: "dev_cust_0012_1",
    beneficiary_id: "benef_02"
  },
  {
    transaction_id: "c9d0e1f2",
    customer_id: "cust_rule_002",
    timestamp: "2026-08-20T14:40:00",
    channel: "Card",
    amount: 12000.00,
    location: "Delhi",
    device_id: "dev_cust_rule_002_1",
    beneficiary_id: "benef_17"
  },
  {
    transaction_id: "d3e4f5g6",
    customer_id: "cust_0034",
    timestamp: "2026-08-20T14:42:00",
    channel: "UPI",
    amount: 2500.00,
    location: "Bangalore",
    device_id: "dev_cust_0034_1",
    beneficiary_id: "benef_88"
  }
];

