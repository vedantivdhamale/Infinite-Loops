import React from 'react';

/**
 * Renders a color-coded badge based on the risk level.
 * @param {Object} props
 * @param {string} props.level - Low, Medium, High, Critical
 */
export default function RiskBadge({ level }) {
  const normLevel = level ? level.toLowerCase() : 'low';
  
  return (
    <span className={`risk-badge ${normLevel}`}>
      <span className="status-dot"></span>
      {level}
    </span>
  );
}
