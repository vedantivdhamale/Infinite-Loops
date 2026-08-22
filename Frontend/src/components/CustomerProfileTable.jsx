import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import LoadingState from './LoadingState';

export default function CustomerProfileTable({
  profiles = [],
  isLoading = false,
  sortKey = '',
  sortDirection = 'desc',
  onSortChange
}) {
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);

  const renderSortIndicator = (key) => {
    if (sortKey !== key) return null;
    return (
      <span className="sort-indicator">
        {sortDirection === 'asc' ? ' ▲' : ' ▼'}
      </span>
    );
  };

  const handleHeaderClick = (key) => {
    if (onSortChange) {
      onSortChange(key);
    }
  };

  const handleToggleExpand = (customerId) => {
    setExpandedCustomerId(prev => prev === customerId ? null : customerId);
  };

  const getActionClass = (act) => {
    if (!act) return 'allow';
    const norm = act.toLowerCase();
    if (norm.includes('allow')) return 'allow';
    if (norm.includes('monitor')) return 'monitor';
    if (norm.includes('manual') || norm.includes('review')) return 'manual-review';
    return 'allow';
  };

  return (
    <div className="table-card">
      <div className="table-wrapper">
        <table className="risk-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleHeaderClick('customer_id')}>
                Customer ID {renderSortIndicator('customer_id')}
              </th>
              <th className="sortable" onClick={() => handleHeaderClick('overall_risk_score')}>
                Overall Risk Score {renderSortIndicator('overall_risk_score')}
              </th>
              <th className="sortable" onClick={() => handleHeaderClick('overall_risk_level')}>
                Risk Level {renderSortIndicator('overall_risk_level')}
              </th>
              <th className="sortable" onClick={() => handleHeaderClick('total_transactions')}>
                Total Txns {renderSortIndicator('total_transactions')}
              </th>
              <th className="sortable" onClick={() => handleHeaderClick('flagged_transactions')}>
                Flagged Txns {renderSortIndicator('flagged_transactions')}
              </th>
              <th>Channels Used</th>
              <th className="sortable" onClick={() => handleHeaderClick('total_amount')}>
                Total Amount {renderSortIndicator('total_amount')}
              </th>
              <th>Top Reasons</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingState rows={4} />
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={9}>
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
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3>No Customer Profiles Found</h3>
                    <p>Try clearing filters or check the connection settings.</p>
                  </div>
                </td>
              </tr>
            ) : (
              profiles.map((profile) => {
                const isExpanded = expandedCustomerId === profile.customer_id;
                const riskClass = profile.overall_risk_level ? profile.overall_risk_level.toLowerCase() : 'low';
                
                return (
                  <React.Fragment key={profile.customer_id}>
                    <tr className={`row-hover ${isExpanded ? 'row-expanded' : ''}`}>
                      {/* Customer ID */}
                      <td className="mono-text">{profile.customer_id}</td>

                      {/* Overall Risk Score */}
                      <td>
                        <div className="score-cell">
                          <div className="score-number-group">
                            <span className={`score-value ${riskClass}`}>{profile.overall_risk_score}</span>
                            <span className="score-max">/ 100</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className={`progress-bar-fill ${riskClass}`}
                              style={{ width: `${profile.overall_risk_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Risk Level Badge */}
                      <td>
                        <RiskBadge level={profile.overall_risk_level} />
                      </td>

                      {/* Total Txns */}
                      <td className="text-center font-semibold">{profile.total_transactions}</td>

                      {/* Flagged Txns */}
                      <td className={`text-center font-semibold ${profile.flagged_transactions > 0 ? 'text-rose-400' : ''}`}>
                        {profile.flagged_transactions}
                      </td>

                      {/* Channels Used */}
                      <td className="text-center">{profile.distinct_channels_used}</td>

                      {/* Total Amount */}
                      <td className="mono-text text-right font-bold">
                        ₹{Math.round(profile.total_amount).toLocaleString()}
                      </td>

                      {/* Top Reasons */}
                      <td>
                        <div className="reasons-list-column">
                          {profile.top_reasons.length > 0 ? (
                            profile.top_reasons.map((reason, idx) => (
                              <div key={idx} className="reason-item-inline" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                {reason}
                              </div>
                            ))
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>None</span>
                          )}
                        </div>
                      </td>

                      {/* Recommended Action */}
                      <td>
                        <span className={`action-badge ${getActionClass(profile.recommended_action)}`}>
                          {profile.recommended_action}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr className="row-expanded">
                        <td colSpan={9} className="row-expanded-content">
                          <div className="reasons-expanded-box">
                            <div className="reasons-title">Customer Risk Summary & Key Reasons</div>
                            {profile.top_reasons.length > 0 ? (
                              <ul className="reasons-list">
                                {profile.top_reasons.map((reason, i) => (
                                  <li key={i}>{reason}</li>
                                ))}
                              </ul>
                            ) : (
                              <div className="no-reasons">No risk indicators detected across this customer's transactions.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
