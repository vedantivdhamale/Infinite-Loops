import React from 'react';

/**
 * RiskDistribution renders a custom horizontal bar chart showing risk ratios.
 * @param {Object} props
 * @param {Array} props.transactions - Scored transactions list
 */
export default function RiskDistribution({ transactions = [] }) {
  const total = transactions.length;
  
  const getCount = (level) => transactions.filter(t => t.risk_level === level).length;
  
  const criticalCount = getCount('Critical');
  const highCount = getCount('High');
  const mediumCount = getCount('Medium');
  const lowCount = getCount('Low');

  // Calculate percentages
  const getPercent = (count) => (total > 0 ? (count / total) * 100 : 0);
  
  const criticalPct = getPercent(criticalCount);
  const highPct = getPercent(highCount);
  const mediumPct = getPercent(mediumCount);
  const lowPct = getPercent(lowCount);

  return (
    <div className="distribution-card">
      <div className="distribution-header">
        <span>Risk Profile Distribution</span>
        <span className="mono-text" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {total} Active Cases
        </span>
      </div>
      
      <div className="distribution-chart-wrapper">
        {total === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
            No data available to display distribution.
          </div>
        ) : (
          <>
            {/* Custom horizontal stacked bar chart */}
            <div className="bar-chart-container">
              {criticalCount > 0 && (
                <div 
                  className="bar-segment critical" 
                  style={{ width: `${criticalPct}%` }}
                  title={`Critical: ${criticalCount} (${criticalPct.toFixed(1)}%)`}
                />
              )}
              {highCount > 0 && (
                <div 
                  className="bar-segment high" 
                  style={{ width: `${highPct}%` }}
                  title={`High: ${highCount} (${highPct.toFixed(1)}%)`}
                />
              )}
              {mediumCount > 0 && (
                <div 
                  className="bar-segment medium" 
                  style={{ width: `${mediumPct}%` }}
                  title={`Medium: ${mediumCount} (${mediumPct.toFixed(1)}%)`}
                />
              )}
              {lowCount > 0 && (
                <div 
                  className="bar-segment low" 
                  style={{ width: `${lowPct}%` }}
                  title={`Low: ${lowCount} (${lowPct.toFixed(1)}%)`}
                />
              )}
            </div>
            
            {/* Legend with percentages */}
            <div className="bar-legend">
              <div className="legend-item">
                <span className="legend-color critical"></span>
                <span>Critical:</span>
                <span className="legend-percentage">{criticalCount} ({criticalPct.toFixed(0)}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color high"></span>
                <span>High:</span>
                <span className="legend-percentage">{highCount} ({highPct.toFixed(0)}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color medium"></span>
                <span>Medium:</span>
                <span className="legend-percentage">{mediumCount} ({mediumPct.toFixed(0)}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color low"></span>
                <span>Low:</span>
                <span className="legend-percentage">{lowCount} ({lowPct.toFixed(0)}%)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
