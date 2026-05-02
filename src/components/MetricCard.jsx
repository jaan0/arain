import React from 'react';

export function MetricCard({ title, value, subtitle, trend, trendValue, isPositive }) {
  return (
    <div className="card">
      <h3 className="metric-card-title">{title}</h3>
      <div className="metric-card-value mono">{value}</div>
      {(subtitle || trendValue) && (
        <div className="metric-card-subtitle">
          {trendValue && (
            <span className={`mono ${isPositive ? 'text-green' : 'text-red'}`} style={{ marginRight: '8px' }}>
              {isPositive ? '+' : '-'}{trendValue}
            </span>
          )}
          {subtitle}
        </div>
      )}
    </div>
  );
}
