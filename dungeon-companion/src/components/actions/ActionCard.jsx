import React, { useState } from 'react';

export default function ActionCard({ title, subtitle, icon = 'fa-circle-chevron-right', description, actionButtons, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={{
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-white)',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      transition: 'all 0.2s ease'
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: expanded ? 'var(--bg-white)' : 'var(--bg-white)',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: expanded ? '1px solid #e2e8f0' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: '#fee2e2',
            color: '#711a19',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem'
          }}>
            <i className={`fa-solid ${icon}`}></i>
          </div>
          <div>
            <div style={{ fontWeight: '800', color: 'var(--color-ink)', fontSize: '0.88rem' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={e => e.stopPropagation()}>
          {actionButtons && <div style={{ display: 'flex', gap: '6px' }}>{actionButtons}</div>}
          <div
            onClick={() => setExpanded(!expanded)}
            style={{
              color: 'var(--color-gray)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`}></i>
          </div>
        </div>
      </div>

      {expanded && description && (
        <div style={{
          padding: '12px 14px',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
          lineHeight: '1.5',
          backgroundColor: 'var(--bg-white)',
          borderTop: '1px solid #f1f5f9'
        }}>
          {typeof description === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: description }} />
          ) : (
            description
          )}
        </div>
      )}
    </div>
  );
}
