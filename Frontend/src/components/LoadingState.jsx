import React from 'react';

/**
 * Renders skeleton rows to indicate transaction scoring analysis in progress.
 * @param {Object} props
 * @param {number} props.rows - Number of skeleton rows to generate
 */
export default function LoadingState({ rows = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={idx} className="skeleton-row">
          <td><div className="skeleton-text" style={{ width: '90px' }}></div></td>
          <td><div className="skeleton-text" style={{ width: '110px' }}></div></td>
          <td><div className="skeleton-text" style={{ width: '120px' }}></div></td>
          <td><div className="skeleton-text" style={{ width: '80px' }}></div></td>
          <td><div className="skeleton-text" style={{ width: '60px' }}></div></td>
          <td><div className="skeleton-text" style={{ width: '95px' }}></div></td>
        </tr>
      ))}
    </>
  );
}
