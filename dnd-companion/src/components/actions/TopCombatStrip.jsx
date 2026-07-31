import React, { useState } from 'react';
import ReactDOM from 'react-dom';

export default function TopCombatStrip({
  resolvedMechanics,
  characterState,
  strMod = 0,
  dexMod = 0,
  conMod = 0,
  intMod = 0,
  wisMod = 0,
  chaMod = 0,
  profBonus = 2,
  totalLvl = 1,
  fmtMod,
  triggerQuickRoll,
  reviewHpCur,
  setReviewHpCur,
  reviewHpTemp,
  setReviewHpTemp,
  expendedHitDice: propExpendedHd,
  setExpendedHitDice: propSetExpendedHd,
  syncHpAndSave,
  liveSpellSlots,
  setLiveSpellSlots,
  liveFeatureCharges,
  setLiveFeatureCharges,
  dynamicResourceTrackers = [],
  setGameplayRollHistory
}) {
  const [showShortRestModal, setShowShortRestModal] = useState(false);
  const [localExpendedHd, setLocalExpendedHd] = useState(0);
  const expendedHitDice = propExpendedHd !== undefined ? propExpendedHd : localExpendedHd;
  const setExpendedHitDice = propSetExpendedHd || setLocalExpendedHd;

  const maxHp = resolvedMechanics?.hitPoints?.max || 10;
  const curHp = reviewHpCur !== null && reviewHpCur !== undefined ? reviewHpCur : maxHp;
  const hitDiceList = resolvedMechanics?.hitPoints?.hitDiceList || [{ hitDie: 8, count: totalLvl }];
  const totalHdCount = totalLvl;
  const availHd = Math.max(0, totalHdCount - expendedHitDice);

  const isWarlock = (characterState?.classes || characterState?.classData?.classes || []).some(cl => String(cl.classId).toLowerCase() === 'warlock');

  const handleShortRestRoll = () => {
    if (availHd <= 0) {
      alert("No Hit Dice remaining!");
      return;
    }
    // Roll primary HD
    const hdType = hitDiceList[0]?.hitDie || 8;
    const roll = Math.floor(Math.random() * hdType) + 1;
    const recovered = Math.max(1, roll + conMod);
    const nextHp = Math.min(maxHp, curHp + recovered);
    const nextHd = Math.min(totalHdCount, expendedHitDice + 1);
    
    setReviewHpCur(nextHp);
    setExpendedHitDice(nextHd);
    if (syncHpAndSave) {
      syncHpAndSave(nextHp, undefined, nextHd);
    }

    // Log to gameplay history
    if (setGameplayRollHistory) {
      setGameplayRollHistory(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        title: `Short Rest Hit Die Roll (1d${hdType} + ${conMod})`,
        total: `+${recovered} HP (${roll} + ${conMod})`,
        formula: `HP: ${curHp} ➔ ${nextHp} (HD left: ${availHd - 1})`
      }, ...prev]);
    }
  };

  const handleFinishShortRest = () => {
    // Reset short rest features
    if (setLiveFeatureCharges) {
      setLiveFeatureCharges(prev => {
        const updated = { ...prev };
        dynamicResourceTrackers.forEach(tr => {
          if ((tr.reset || '').toLowerCase().includes('short')) {
            updated[tr.id] = tr.max;
          }
        });
        return updated;
      });
    }

    // Reset Warlock Pact Magic slots on Short Rest (while preserving standard spell slots and 1/LR free casts)
    if (setLiveSpellSlots) {
      setLiveSpellSlots(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (String(key).startsWith('pact')) {
            delete updated[key]; // Restore Pact Magic slot
          }
        });
        return updated;
      });
    }

    if (setGameplayRollHistory) {
      setGameplayRollHistory(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        title: 'Short Rest Completed',
        total: 'Restored',
        formula: isWarlock ? 'Short Rest features & Warlock Pact Magic slots recovered' : 'Short Rest features recovered'
      }, ...prev]);
    }

    setShowShortRestModal(false);
  };

  const handleLongRest = () => {
    if (!window.confirm("Perform a Long Rest? This will fully restore HP, all spell slots, half your Hit Dice, and all feature pools.")) return;

    // Restore HP
    setReviewHpCur(maxHp);
    if (setReviewHpTemp) setReviewHpTemp(0);

    // Restore Spell Slots
    if (setLiveSpellSlots) setLiveSpellSlots({});

    // Restore Feature Charges
    if (setLiveFeatureCharges) setLiveFeatureCharges({});

    // Restore half Hit Dice
    const restoreHd = Math.max(1, Math.floor(totalLvl / 2));
    const nextHd = Math.max(0, expendedHitDice - restoreHd);
    setExpendedHitDice(nextHd);

    if (syncHpAndSave) {
      syncHpAndSave(maxHp, 0, nextHd);
    }

    if (setGameplayRollHistory) {
      setGameplayRollHistory(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        title: 'Long Rest Completed 🌙',
        total: 'Full Recovery',
        formula: `HP reset to ${maxHp}/${maxHp}, all Spell Slots & Features restored.`
      }, ...prev]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    }}>
      <button
        type="button"
        onClick={() => setShowShortRestModal(true)}
        style={{
          backgroundColor: 'var(--bg-paper)',
          border: '1.5px solid #711a19',
          color: '#711a19',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: '800',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 1px 3px rgba(113, 26, 25, 0.15)',
          transition: 'all 0.15s'
        }}
        title={`Available Hit Dice: ${availHd} / ${totalHdCount}`}
      >
        <span>☕</span> Short Rest <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '800' }}>{availHd}/{totalHdCount} HD</span>
      </button>

      <button
        type="button"
        onClick={handleLongRest}
        style={{
          backgroundColor: '#711a19',
          border: '1.5px solid #711a19',
          color: 'var(--bg-white)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: '800',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 1px 3px rgba(113, 26, 25, 0.3)',
          transition: 'all 0.15s'
        }}
        title="Perform a Long Rest to fully restore HP, spell slots, features, and half Hit Dice"
      >
        <span>🌙</span> Long Rest
      </button>

      {/* Short Rest Modal (Portaled & Parchment Theme) */}
      {showShortRestModal && ReactDOM.createPortal((
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '16px'
        }}>
          <div className="animate-scale-up" style={{
            backgroundColor: 'var(--bg-paper)',
            borderRadius: '14px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 25px 50px -12px rgba(113, 26, 25, 0.35)',
            border: '2px solid #711a19',
            color: 'var(--color-ink)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#711a19', fontFamily: 'Cinzel, serif', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ☕ Take a Short Rest
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Spend Hit Dice to recover Hit Points (1d{hitDiceList[0]?.hitDie || 8} + CON modifier per die).
            </p>

            <div style={{ backgroundColor: '#fefcf8', border: '1px solid #e2d8c3', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-gray)', fontWeight: '600' }}>Available Hit Dice:</span>
                <strong style={{ color: '#711a19' }}>{availHd} / {totalHdCount} (1d{hitDiceList[0]?.hitDie || 8})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-gray)', fontWeight: '600' }}>Current HP:</span>
                <strong style={{ color: 'var(--color-ink)' }}>{curHp} / {maxHp}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                disabled={availHd <= 0 || curHp >= maxHp}
                onClick={handleShortRestRoll}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: availHd <= 0 || curHp >= maxHp ? 'var(--border-color)' : '#2563eb',
                  color: 'var(--bg-white)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: availHd <= 0 || curHp >= maxHp ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                🎲 Roll 1 Hit Die (+{conMod} CON)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2d8c3', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowShortRestModal(false)}
                style={{ padding: '8px 14px', backgroundColor: 'var(--bg-white)', color: 'var(--color-gray)', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinishShortRest}
                style={{ padding: '8px 16px', backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Finish Rest & Recover Features
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}

