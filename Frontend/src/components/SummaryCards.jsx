import React from 'react';

/**
 * SummaryCards renders dynamically calculated risk level counters.
 * @param {Object} props
 * @param {Array} props.transactions - Scored transactions list
 */
export default function SummaryCards({ transactions = [] }) {
  const total = transactions.length;
  const critical = transactions.filter(t => t.risk_level === 'Critical').length;
  const high = transactions.filter(t => t.risk_level === 'High').length;
  const medium = transactions.filter(t => t.risk_level === 'Medium').length;
  const low = transactions.filter(t => t.risk_level === 'Low').length;

  return (
    <div className="summary-cards-container">
      <div className="summary-card total">
        <span className="summary-value">{total}</span>
        <span className="summary-label">Total Transactions</span>
      </div>
      
      <div className="summary-card critical">
        <span className="summary-value" style={{ color: 'var(--color-critical)' }}>{critical}</span>
        <span className="summary-label">Critical Risk</span>
      </div>
      
      <div className="summary-card high">
        <span className="summary-value" style={{ color: 'var(--color-high)' }}>{high}</span>
        <span className="summary-label">High Risk</span>
      </div>
      
      <div className="summary-card medium">
        <span className="summary-value" style={{ color: 'var(--color-medium)' }}>{medium}</span>
        <span className="summary-label">Medium Risk</span>
      </div>
      
      <div className="summary-card low">
        <span className="summary-value" style={{ color: 'var(--color-low)' }}>{low}</span>
        <span className="summary-label">Low Risk</span>
      </div>
    </div>
  );
}
