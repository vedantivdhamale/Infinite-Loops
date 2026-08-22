import React from 'react';
import TransactionRow from './TransactionRow';
import LoadingState from './LoadingState';

/**
 * TransactionTable renders the main table header and body.
 * Supports clicking headers to trigger sorting.
 */
export default function TransactionTable({ 
  transactions = [], 
  isLoading = false,
  sortKey = '',
  sortDirection = 'desc',
  onSortChange
}) {

  const renderSortIndicator = (key) => {
    if (sortKey !== key) return null;
    return (
      <span className="sort-indicator">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const handleHeaderClick = (key) => {
    if (onSortChange) {
      onSortChange(key);
    }
  };

  return (
    <div className="table-card">
      <div className="table-wrapper">
        <table className="risk-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Customer ID</th>
              <th 
                className="sortable" 
                onClick={() => handleHeaderClick('risk_score')}
              >
                Risk Score {renderSortIndicator('risk_score')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleHeaderClick('risk_level')}
              >
                Risk Level {renderSortIndicator('risk_level')}
              </th>
              <th>Reasons</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingState rows={4} />
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <svg 
                      width="48" 
                      height="48" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <h3>No Transactions Found</h3>
                    <p>Try clearing filters or check the connection settings.</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <TransactionRow key={tx.transaction_id} transaction={tx} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
