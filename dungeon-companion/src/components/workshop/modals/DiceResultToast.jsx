import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export default function DiceResultToast({ diceModalData, setDiceModalData }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (diceModalData) {
      setToasts(prev => [...prev, { ...diceModalData, id: Date.now() + Math.random() }]);
      // Immediately clear the parent state so subsequent identical rolls trigger the effect again
      if (typeof setDiceModalData === 'function') {
        setDiceModalData(null);
      }
    }
  }, [diceModalData, setDiceModalData]);

  if (toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {toasts.map(t => (
        <IndividualToast key={t.id} data={t} onRemove={(id) => setToasts(prev => prev.filter(x => x.id !== id))} />
      ))}
    </div>,
    document.body
  );
}

function IndividualToast({ data, onRemove }) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isFading, setIsFading] = useState(false);
  const DURATION = 3000; // 3 seconds per user request

  useEffect(() => {
    if (isHovered || isFading) return;

    const interval = 16;
    const step = (100 / (DURATION / interval));

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          triggerClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isHovered, isFading]);

  const triggerClose = () => {
    setIsFading(true);
    setTimeout(() => {
      onRemove(data.id);
    }, 300); // 300ms fade out animation
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '320px',
        backgroundColor: 'var(--bg-paper)',
        border: '2px solid #711a19',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: isFading ? 0 : 1,
        transform: isFading ? 'translateY(20px)' : 'translateY(0)',
        cursor: 'pointer' // clicking it can close it immediately
      }}
      onClick={triggerClose}
    >
      <div style={{ padding: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#711a19', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-dice-d20"></i> {data?.title || 'Dice Roll'}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); triggerClose(); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-gray)', cursor: 'pointer', padding: 0 }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-ink)', lineHeight: 1 }}>
            {data?.total}
          </div>
        </div>

        <div style={{ backgroundColor: '#f8f4e9', border: '1px solid #e2d8c3', borderRadius: '6px', padding: '8px', fontSize: '0.75rem', color: 'var(--color-gray)' }}>
          <div style={{ marginBottom: '4px' }}><strong>Formula:</strong> {data?.formula}</div>
          {data?.rolls && <div><strong>Rolls:</strong> {data?.rolls}</div>}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', backgroundColor: 'var(--border-color)', width: '100%' }}>
        <div style={{ 
          height: '100%', 
          backgroundColor: '#d97706',
          width: `${progress}%`,
          transition: isHovered ? 'width 0.2s ease' : 'none'
        }} />
      </div>
    </div>
  );
}
