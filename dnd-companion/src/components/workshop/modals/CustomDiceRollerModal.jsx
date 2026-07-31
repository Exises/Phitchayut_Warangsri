import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useDice3D } from '../../dice3d/Dice3DProvider';

const DiceSvgIcon = ({ type, color, size = '1.65rem' }) => {
  switch (type) {
    case 'd4':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.15s' }}>
          <polygon points="12,2 2,21 22,21" fill={color} fillOpacity="0.2" />
          <line x1="12" y1="2" x2="12" y2="13" />
          <line x1="2" y1="21" x2="12" y2="13" />
          <line x1="22" y1="21" x2="12" y2="13" />
          <circle cx="12" cy="13" r="1.2" fill={color} />
        </svg>
      );
    case 'd6':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.15s' }}>
          <polygon points="12,2 2,7 2,17 12,22 22,17 22,7" fill={color} fillOpacity="0.2" />
          <line x1="12" y1="22" x2="12" y2="12" />
          <line x1="22" y1="7" x2="12" y2="12" />
          <line x1="2" y1="7" x2="12" y2="12" />
          <circle cx="12" cy="7" r="1" fill={color} />
        </svg>
      );
    case 'd8':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.15s' }}>
          <polygon points="12,2 22,12 12,22 2,12" fill={color} fillOpacity="0.2" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <polygon points="12,6 18,12 12,18 6,12" stroke={color} strokeWidth="1" fill="none" />
        </svg>
      );
    case 'd10':
    case 'd100':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.15s' }}>
          <polygon points="12,2 21,10 12,22 3,10" fill={color} fillOpacity="0.2" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="12" y1="8" x2="17" y2="13" />
          <line x1="12" y1="8" x2="7" y2="13" />
        </svg>
      );
    case 'd12':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.15s' }}>
          <polygon points="12,2 21,8 18,19 6,19 3,8" fill={color} fillOpacity="0.2" />
          <line x1="12" y1="2" x2="18" y2="19" />
          <line x1="12" y1="2" x2="6" y2="19" />
          <line x1="3" y1="8" x2="21" y2="8" />
          <circle cx="12" cy="11" r="2.5" fill={color} fillOpacity="0.5" />
        </svg>
      );
    case 'd20':
    default:
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.15s' }}>
          <polygon points="12,2 22,18 2,18" fill={color} fillOpacity="0.2" />
          <line x1="12" y1="2" x2="12" y2="18" />
          <line x1="2" y1="18" x2="17" y2="10" />
          <line x1="22" y1="18" x2="7" y2="10" />
          <polygon points="12,7 15,13 9,13" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="1" />
        </svg>
      );
  }
};

export default function CustomDiceRollerModal({
  isOpen,
  onClose,
  setDiceModalData,
  setGameplayRollHistory,
  triggerQuickRoll
}) {
  const { roll3D, isReady } = useDice3D();
  const [diceType, setDiceType] = useState('d20');
  const [diceCount, setDiceCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [advMode, setAdvMode] = useState('normal'); // 'normal' | 'adv' | 'dis'
  const [rollTitle, setRollTitle] = useState('');

  // Rules of Hooks: Always call top-level hooks before any condition or early return!
  if (!isOpen) return null;

  const diceOptions = [
    { id: 'd4', label: 'd4', icon: 'fa-dice-d4', sides: 4, color: '#059669' },
    { id: 'd6', label: 'd6', icon: 'fa-dice-d6', sides: 6, color: '#2563eb' },
    { id: 'd8', label: 'd8', icon: 'fa-dice-d8', sides: 8, color: '#7c3aed' },
    { id: 'd10', label: 'd10', icon: 'fa-dice', sides: 10, color: '#db2777' },
    { id: 'd12', label: 'd12', icon: 'fa-dice', sides: 12, color: '#ea580c' },
    { id: 'd20', label: 'd20', icon: 'fa-dice-d20', sides: 20, color: '#711a19' },
    { id: 'd100', label: 'd100', icon: 'fa-percent', sides: 100, color: 'var(--color-gray)' },
  ];

  const handleRollNow = () => {
    const sides = parseInt(diceType.replace('d', '')) || 20;
    const count = Math.max(1, Math.min(50, parseInt(diceCount) || 1));
    const modNum = parseInt(modifier) || 0;
    const customTitle = rollTitle.trim() || `🎲 Custom Roll (${count}${diceType}${modNum !== 0 ? (modNum > 0 ? `+${modNum}` : modNum) : ''})`;

    if (isReady && roll3D) {
      let notationStr = `${count}${diceType}`;
      if (diceType === 'd20' && count === 1 && advMode !== 'normal') {
        notationStr = `2d20`;
      }

      roll3D({
        notation: notationStr,
        onComplete: (res) => {
          let total = 0;
          let rollsStr = '';
          let formulaStr = '';
          if (diceType === 'd20' && count === 1 && advMode !== 'normal') {
            const roll1 = res?.rolls?.[0] || Math.floor(Math.random() * 20) + 1;
            const roll2 = res?.rolls?.[1] || Math.floor(Math.random() * 20) + 1; // Read physical second roll!
            const chosen = advMode === 'adv' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
            total = Math.max(1, chosen + modNum);
            const advLabel = advMode === 'adv' ? 'Advantage' : 'Disadvantage';
            formulaStr = `1d20 (${advLabel}) ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`;
            rollsStr = `d20 Rolls: [${roll1}, ${roll2}] ➔ Chosen: ${chosen} ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`;
          } else {
            const physicalRolls = res?.rolls || [];
            let subTotal = physicalRolls.reduce((a, b) => a + Number(b), 0);
            if (physicalRolls.length === 0) {
              for (let i = 0; i < count; i++) {
                const r = Math.floor(Math.random() * sides) + 1;
                physicalRolls.push(r);
                subTotal += r;
              }
            }
            total = Math.max(1, subTotal + modNum);
            formulaStr = `${count}d${sides} (${physicalRolls.join(', ')}) ${modNum !== 0 ? (modNum > 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`) : ''}`;
            rollsStr = `Dice [${physicalRolls.join(', ')}] = ${subTotal} | Mod [${modNum >= 0 ? `+${modNum}` : modNum}]`;
          }

          if (typeof setDiceModalData === 'function') {
            setDiceModalData({
              title: customTitle,
              formula: formulaStr,
              rolls: rollsStr,
              total,
              advMode: advMode
            });
          }
          if (typeof setGameplayRollHistory === 'function') {
            setGameplayRollHistory(prev => [{
              title: customTitle,
              formula: formulaStr,
              total,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...(prev || []).slice(0, 24)]);
          }
        }
      });
      onClose();
      return;
    }

    let total = 0;
    let rollsStr = '';
    let formulaStr = '';

    // Special handling for 1d20 with Advantage / Disadvantage
    if (diceType === 'd20' && count === 1 && advMode !== 'normal') {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      const chosen = advMode === 'adv' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      total = Math.max(1, chosen + modNum);
      const advLabel = advMode === 'adv' ? 'Advantage' : 'Disadvantage';
      formulaStr = `1d20 (${advLabel}) ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`;
      rollsStr = `d20 Rolls: [${roll1}, ${roll2}] ➔ Chosen: ${chosen} ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`;
    } else {
      // Standard multi-dice rolling
      const rolls = [];
      let subTotal = 0;
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        subTotal += r;
      }
      total = Math.max(1, subTotal + modNum);
      formulaStr = `${count}d${sides} ${modNum !== 0 ? (modNum > 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`) : ''}`;
      rollsStr = rolls.join(' + ') + (modNum !== 0 ? (modNum > 0 ? ` + ${modNum}` : ` - ${Math.abs(modNum)}`) : '');
    }

    if (typeof setDiceModalData === 'function') {
      setDiceModalData({
        title: customTitle,
        formula: formulaStr,
        rolls: rollsStr,
        total,
        advMode: advMode
      });
    }

    if (typeof setGameplayRollHistory === 'function') {
      setGameplayRollHistory(prev => [{
        title: customTitle,
        formula: formulaStr,
        total,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }, ...(prev || []).slice(0, 24)]);
    } else if (typeof triggerQuickRoll === 'function') {
      // Fallback
      triggerQuickRoll(customTitle, modNum, `${count}d${sides}`);
    }

    onClose();
  };

  // Live Formula Preview
  const getLiveFormula = () => {
    const modStr = modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : '';
    if (diceType === 'd20' && diceCount === 1 && advMode !== 'normal') {
      return `2d20 (${advMode === 'adv' ? 'Advantage' : 'Disadvantage'})${modStr}`;
    }
    return `${diceCount}${diceType}${modStr}`;
  };

  return ReactDOM.createPortal(
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.68)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="animate-scale-up"
        style={{
          backgroundColor: 'var(--bg-paper)',
          border: '2.5px solid #711a19',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          color: 'var(--color-ink)',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2d8c3', paddingBottom: '12px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.35rem', color: '#711a19', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
              <i className="fa-solid fa-dice-d20" style={{ fontSize: '1.4rem' }}></i> ทอยลูกเต๋าแบบกำหนดเอง
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-gray)', marginTop: '2px' }}>Custom Dice Roller (เลือกชนิด จำนวน และโบนัส)</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.6rem', color: 'var(--color-gray)', cursor: 'pointer', padding: '4px' }}
          >
            &times;
          </button>
        </div>

        {/* 1. เลือกชนิดลูกเต๋า (Dice Type) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: 'var(--color-gray)', marginBottom: '10px', textTransform: 'uppercase' }}>
            1. เลือกชนิดลูกเต๋า (Dice Type)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {diceOptions.map(opt => {
              const isSelected = diceType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setDiceType(opt.id);
                    if (opt.id !== 'd20') setAdvMode('normal');
                  }}
                  style={{
                    backgroundColor: isSelected ? '#711a19' : 'var(--bg-white)',
                    color: isSelected ? 'var(--bg-white)' : 'var(--color-ink)',
                    border: `2px solid ${isSelected ? '#450a0a' : 'var(--border-color)'}`,
                    padding: '12px 6px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 4px 10px rgba(113, 26, 25, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <DiceSvgIcon type={opt.id} color={isSelected ? '#facc15' : opt.color} size="1.65rem" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. จำนวนลูกเต๋า (Dice Count) */}
        <div style={{ marginBottom: '20px', backgroundColor: '#f8f4e9', padding: '14px', borderRadius: '12px', border: '1px solid #e2d8c3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--color-gray)', textTransform: 'uppercase', margin: 0 }}>
              2. จำนวนลูกเต๋า (Count)
            </label>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#711a19' }}>{diceCount} ลูก</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setDiceCount(prev => Math.max(1, prev - 1))}
              style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', color: 'var(--color-gray)' }}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="50"
              value={diceCount}
              onChange={e => setDiceCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 'bold', backgroundColor: 'var(--bg-white)', color: 'var(--color-ink)' }}
            />
            <button
              type="button"
              onClick={() => setDiceCount(prev => Math.min(50, prev + 1))}
              style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', color: 'var(--color-gray)' }}
            >
              +
            </button>
          </div>

          {/* Quick presets for count */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[1, 2, 3, 4, 6, 8, 10].map(cnt => (
              <button
                key={cnt}
                type="button"
                onClick={() => setDiceCount(cnt)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: diceCount === cnt ? '#711a19' : 'var(--border-color)',
                  backgroundColor: diceCount === cnt ? '#711a19' : 'var(--bg-white)',
                  color: diceCount === cnt ? 'var(--bg-white)' : 'var(--color-gray)',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {cnt} ลูก
              </button>
            ))}
          </div>
        </div>

        {/* 3. ตัวบวก/ลบ (Modifier / Bonus) */}
        <div style={{ marginBottom: '20px', backgroundColor: '#f8f4e9', padding: '14px', borderRadius: '12px', border: '1px solid #e2d8c3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--color-gray)', textTransform: 'uppercase', margin: 0 }}>
              3. ตัวบวก / ตัวลบโบนัส (Modifier)
            </label>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: modifier >= 0 ? '#059669' : '#dc2626' }}>
              {modifier >= 0 ? `+${modifier}` : modifier}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setModifier(prev => prev - 1)}
              style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', color: 'var(--color-gray)' }}
            >
              -
            </button>
            <input
              type="number"
              value={modifier}
              onChange={e => setModifier(parseInt(e.target.value) || 0)}
              style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 'bold', backgroundColor: 'var(--bg-white)', color: 'var(--color-ink)' }}
            />
            <button
              type="button"
              onClick={() => setModifier(prev => prev + 1)}
              style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', color: 'var(--color-gray)' }}
            >
              +
            </button>
          </div>

          {/* Quick presets for modifier */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[-2, -1, 0, 1, 2, 3, 5, 10].map(mod => (
              <button
                key={mod}
                type="button"
                onClick={() => setModifier(mod)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: modifier === mod ? '#711a19' : 'var(--border-color)',
                  backgroundColor: modifier === mod ? '#711a19' : 'var(--bg-white)',
                  color: modifier === mod ? 'var(--bg-white)' : 'var(--color-gray)',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {mod >= 0 ? `+${mod}` : mod}
              </button>
            ))}
          </div>
        </div>

        {/* 4. โหมดความได้เปรียบ (Advantage/Disadvantage - เฉพาะ d20) */}
        {diceType === 'd20' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: 'var(--color-gray)', marginBottom: '8px', textTransform: 'uppercase' }}>
              4. โหมดความได้เปรียบ (Advantage Mode สำหรับ d20)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setAdvMode('normal')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '8px',
                  border: `2px solid ${advMode === 'normal' ? 'var(--color-gray)' : 'var(--border-color)'}`,
                  backgroundColor: advMode === 'normal' ? 'var(--color-gray)' : 'var(--bg-white)',
                  color: advMode === 'normal' ? 'var(--bg-white)' : 'var(--color-gray)',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                🎯 ปกติ (Normal)
              </button>
              <button
                type="button"
                onClick={() => setAdvMode('adv')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '8px',
                  border: `2px solid ${advMode === 'adv' ? '#059669' : 'var(--border-color)'}`,
                  backgroundColor: advMode === 'adv' ? '#10b981' : 'var(--bg-white)',
                  color: advMode === 'adv' ? 'var(--bg-white)' : '#059669',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                ⬆️ ได้เปรียบ (Adv.)
              </button>
              <button
                type="button"
                onClick={() => setAdvMode('dis')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '8px',
                  border: `2px solid ${advMode === 'dis' ? '#dc2626' : 'var(--border-color)'}`,
                  backgroundColor: advMode === 'dis' ? '#ef4444' : 'var(--bg-white)',
                  color: advMode === 'dis' ? 'var(--bg-white)' : '#dc2626',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                ⬇️ เสียเปรียบ (Dis.)
              </button>
            </div>
          </div>
        )}

        {/* 5. ชื่อหรือเหตุผลการทอย (Optional) */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: 'var(--color-gray)', marginBottom: '6px', textTransform: 'uppercase' }}>
            5. ชื่อหรือเหตุผลการทอย (ไม่ระบุก็ได้)
          </label>
          <input
            type="text"
            value={rollTitle}
            onChange={e => setRollTitle(e.target.value)}
            placeholder={`เช่น โจมตีดาบใหญ่, เช็คความจำ, ความเสียหาย Fireball...`}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.9rem',
              color: 'var(--color-ink)',
              backgroundColor: 'var(--bg-white)'
            }}
          />
        </div>

        {/* Live Formula Box */}
        <div style={{ backgroundColor: 'var(--color-ink)', color: 'var(--bg-white)', padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', border: '1px solid #334155' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
              สูตรลูกเต๋าที่จะทอย (Ready to Roll)
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', fontWeight: 'bold', color: '#facc15', marginTop: '2px' }}>
              {getLiveFormula()}
            </div>
          </div>
          <i className="fa-solid fa-dice" style={{ fontSize: '2.2rem', color: 'var(--border-color)', opacity: 0.8 }}></i>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: 'var(--bg-sidebar)',
              color: 'var(--color-gray)',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleRollNow}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#711a19',
              color: 'var(--bg-white)',
              fontWeight: '800',
              fontSize: '1.05rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(113, 26, 25, 0.4)',
              transition: 'all 0.15s'
            }}
          >
            <i className="fa-solid fa-dice-d20" style={{ color: '#facc15', fontSize: '1.2rem' }}></i>
            <span>ทอยทันที ({getLiveFormula()})</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
