import React, { useState } from 'react';
import RiskBadge from './RiskBadge';

/**
 * TransactionRow renders a single transaction and handles its expanded reasons state.
 * @param {Object} props
 * @param {Object} props.transaction - Transaction data object
 */
export default function TransactionRow({ transaction }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    transaction_id,
    customer_id,
    risk_score,
    risk_level,
    reasons = [],
    action
  } = transaction;

  // Determine progress bar and value colors based on risk_level
  const riskClass = risk_level ? risk_level.toLowerCase() : 'low';
  
  // Format Action CSS class
  const getActionClass = (act) => {
    if (!act) return 'allow';
    const norm = act.toLowerCase();
    if (norm.includes('allow')) return 'allow';
    if (norm.includes('monitor')) return 'monitor';
    if (norm.includes('manual') || norm.includes('review')) return 'manual-review';
    return 'allow';
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <tr className={`row-hover ${isExpanded ? 'row-expanded' : ''}`}>
        {/* Transaction ID */}
        <td className="mono-text">{transaction_id}</td>
        
        {/* Customer ID */}
        <td className="mono-text">{customer_id}</td>
        
        {/* Risk Score Progress Bar */}
        <td>
          <div className="score-cell">
            <div className="score-number-group">
              <span className={`score-value ${riskClass}`}>{risk_score}</span>
              <span className="score-max">/ 100</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className={`progress-bar-fill ${riskClass}`} 
                style={{ width: `${risk_score}%` }}
              ></div>
            </div>
          </div>
        </td>
        
        {/* Risk Level Badge */}
        <td>
          <RiskBadge level={risk_level} />
        </td>
        
        {/* Reasons trigger */}
        <td>
          <div className="reasons-cell" onClick={handleToggleExpand}>
            <span className="reasons-trigger">
              <span className="reasons-count">
                {reasons.length} {reasons.length === 1 ? 'reason' : 'reasons'}
              </span>
              <span style={{ fontSize: '0.75rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                ▼
              </span>
            </span>
          </div>
        </td>
        
        {/* Action Styling */}
        <td>
          <span className={`action-badge ${getActionClass(action)}`}>
            {action}
          </span>
        </td>
      </tr>
      
      {/* Expanded details row */}
      {isExpanded && (
        <tr className="row-expanded">
          <td colSpan={6} className="row-expanded-content">
            <div className="reasons-expanded-box">
              <div className="reasons-title">Risk Analysis Reasons</div>
              {reasons.length > 0 ? (
                <ul className="reasons-list">
                  {reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <div className="no-reasons">No risk indicators detected.</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
