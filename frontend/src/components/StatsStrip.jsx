import React from 'react';
import { Inbox, PlayCircle, CheckCircle2, Archive, AlertTriangle } from 'lucide-react';

export const StatsStrip = ({ stats = { statusCounts: {}, breachedCount: 0 } }) => {
  const { statusCounts = {}, breachedCount = 0 } = stats;

  const statItems = [
    {
      key: 'open',
      label: 'Open',
      value: statusCounts.open || 0,
      icon: <Inbox size={20} className="open-icon" style={{ color: 'var(--color-open)' }} />,
      className: 'open'
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      value: statusCounts.in_progress || 0,
      icon: <PlayCircle size={20} className="progress-icon" style={{ color: 'var(--color-progress)' }} />,
      className: 'in_progress'
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: statusCounts.resolved || 0,
      icon: <CheckCircle2 size={20} className="resolved-icon" style={{ color: 'var(--color-resolved)' }} />,
      className: 'resolved'
    },
    {
      key: 'closed',
      label: 'Closed',
      value: statusCounts.closed || 0,
      icon: <Archive size={20} className="closed-icon" style={{ color: 'var(--color-closed)' }} />,
      className: 'closed'
    },
    {
      key: 'breached',
      label: 'SLA Breached',
      value: breachedCount,
      icon: <AlertTriangle size={20} className="breached-icon" style={{ color: 'var(--color-breached)' }} />,
      className: 'breached-box'
    }
  ];

  return (
    <div className="stats-strip">
      {statItems.map((item) => (
        <div key={item.key} className={`stat-box glass-panel ${item.className}`}>
          {item.icon}
          <div className="stat-info">
            <span className=" his-value stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsStrip;
