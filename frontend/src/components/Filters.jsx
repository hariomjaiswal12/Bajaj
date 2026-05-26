import React from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';

export const Filters = ({ filters, onFilterChange }) => {
  
  const handlePriorityChange = (e) => {
    onFilterChange({ ...filters, priority: e.target.value });
  };

  const handleBreachedToggle = (e) => {
    onFilterChange({ ...filters, breached: e.target.checked });
  };

  const handleClearFilters = () => {
    onFilterChange({ priority: '', breached: false });
  };

  const isFiltered = filters.priority || filters.breached;

  return (
    <div className="filter-panel glass-panel">
      <div className="filter-title">
        <SlidersHorizontal size={18} style={{ color: 'var(--color-primary)' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Triage Filters</h3>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="priority-filter">Filter by Priority</label>
        <select
          id="priority-filter"
          className="form-control"
          value={filters.priority || ''}
          onChange={handlePriorityChange}
        >
          <option value="">All Priorities</option>
          <option value="low">🟢 Low Priority</option>
          <option value="medium">🔵 Medium Priority</option>
          <option value="high">🟡 High Priority</option>
          <option value="urgent">🔴 Urgent Priority</option>
        </select>
      </div>

      <div className="form-group">
        <div className="breached-toggle" onClick={() => onFilterChange({ ...filters, breached: !filters.breached })}>
          <span className="form-label" style={{ cursor: 'pointer' }}>Show SLA Breached Only</span>
          <label className="switch" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              id="breached-filter"
              checked={filters.breached || false}
              onChange={handleBreachedToggle}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {isFiltered && (
        <button
          onClick={handleClearFilters}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-danger)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.25rem 0',
            textAlign: 'left',
            width: 'fit-content'
          }}
        >
          Reset active filters
        </button>
      )}
    </div>
  );
};

export default Filters;
