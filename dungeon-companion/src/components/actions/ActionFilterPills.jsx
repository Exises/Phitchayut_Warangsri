import React from 'react';

const PILLS = [
  { id: 'ALL', label: 'All' },
  { id: 'ATTACK', label: 'Attack' },
  { id: 'ACTION', label: 'Action' },
  { id: 'BONUS ACTION', label: 'Bonus Action' },
  { id: 'REACTION', label: 'Reaction' },
  { id: 'OTHER', label: 'Other' },
];

export default function ActionFilterPills({ activeFilter, onFilterChange }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      backgroundColor: 'var(--bg-sidebar)',
      padding: '6px',
      borderRadius: '8px',
      border: '1px solid #cbd5e1',
      marginBottom: '16px'
    }}>
      {PILLS.map(pill => {
        const isActive = activeFilter === pill.id;
        return (
          <button
            key={pill.id}
            type="button"
            onClick={() => onFilterChange(pill.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isActive ? '#711a19' : 'transparent',
              color: isActive ? 'var(--bg-white)' : 'var(--color-gray)',
              fontWeight: isActive ? '800' : '600',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: isActive ? '0 1px 3px rgba(113, 26, 25, 0.3)' : 'none'
            }}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
