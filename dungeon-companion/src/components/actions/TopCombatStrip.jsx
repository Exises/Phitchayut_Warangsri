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
  const [showLongRestModal, setShowLongRestModal] = useState(false);
  const [localExpendedHd, setLocalExpendedHd] = useState(0);
  const expendedHitDice = propExpendedHd !== undefined ? propExpendedHd : localExpendedHd;
  const setExpendedHitDice = propSetExpendedHd || setLocalExpendedHd;

  const maxHp = resolvedMechanics?.hitPoints?.max || 10;
  const curHp = reviewHpCur !== null && reviewHpCur !== undefined ? reviewHpCur : maxHp;
  const hitDiceList = resolvedMechanics?.hitPoints?.hitDiceList || [{ classId: 'unknown', hitDie: 8, count: totalLvl }];
  const totalHdCount = totalLvl;
  const totalExpendedHd = Object.values(expendedHitDice || {}).reduce((a, b) => a + (parseInt(b) || 0), 0);
  const availHd = Math.max(0, totalHdCount - totalExpendedHd);

  const isWarlock = (characterState?.classes || characterState?.classData?.classes || []).some(cl => String(cl.classId).toLowerCase() === 'warlock');

  const handleShortRestRoll = (targetClassId, targetHitDie) => {
    if (availHd <= 0) return;
    const cExpended = parseInt(expendedHitDice?.[targetClassId]) || 0;
    
    const roll = Math.floor(Math.random() * targetHitDie) + 1;
    const recovered = Math.max(1, roll + conMod);
    const nextHp = Math.min(maxHp, curHp + recovered);
    const nextHd = { ...expendedHitDice, [targetClassId]: cExpended + 1 };
    
    setReviewHpCur(nextHp);
    setExpendedHitDice(nextHd);
    if (syncHpAndSave) {
      syncHpAndSave(nextHp, undefined, nextHd);
    }

    if (setGameplayRollHistory) {
      setGameplayRollHistory(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        title: `Short Rest HD Roll (${targetClassId} 1d${targetHitDie} + ${conMod})`,
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
    // Restore HP
    setReviewHpCur(maxHp);
    if (setReviewHpTemp) setReviewHpTemp(0);

    // Restore Spell Slots
    if (setLiveSpellSlots) setLiveSpellSlots({});

    // Restore Feature Charges
    if (setLiveFeatureCharges) {
      setLiveFeatureCharges(() => {
        const updated = {};
        (dynamicResourceTrackers || []).forEach(tr => {
          updated[tr.id] = tr.max;
        });
        return updated;
      });
    }

    // Restore half Hit Dice (5e RAW)
    const restoreCount = Math.max(1, Math.floor(totalLvl / 2));
    const expendedList = (hitDiceList || [])
      .map(hd => ({ cId: hd.classId || 'unknown', hitDie: parseInt(hd.hitDie) || 0, expended: parseInt(expendedHitDice?.[hd.classId || 'unknown']) || 0 }))
      .filter(x => x.expended > 0)
      .sort((a, b) => b.hitDie - a.hitDie);
    
    let remainingToRecover = restoreCount;
    const nextHd = { ...expendedHitDice };
    for (const hd of expendedList) {
      if (remainingToRecover <= 0) break;
      const recoverFromThis = Math.min(hd.expended, remainingToRecover);
      nextHd[hd.cId] -= recoverFromThis;
      remainingToRecover -= recoverFromThis;
    }

    setExpendedHitDice(nextHd);

    if (syncHpAndSave) {
      syncHpAndSave(maxHp, 0, nextHd, 0, 0);
    }

    if (setGameplayRollHistory) {
      setGameplayRollHistory(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        title: 'Long Rest Completed 🌙',
        total: 'Full Recovery',
        formula: `HP reset to ${maxHp}/${maxHp}, all Spell Slots, Features, and ${restoreCount - remainingToRecover} HD restored.`
      }, ...prev]);
    }

    setShowLongRestModal(false);
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
        onClick={() => setShowLongRestModal(true)}
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
        title="พักผ่อนระยะยาวเพื่อฟื้นฟูพลังชีวิต, ช่องเวท, ความสามารถ และแต้ม Hit Dice อย่างเต็มที่"
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
              ☕ พักผ่อนระยะสั้น (Short Rest)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              ใช้แต้ม Hit Dice เพื่อฟื้นฟูพลังชีวิต (ทอย 1d{hitDiceList[0]?.hitDie || 8} + ค่าโบนัส CON ต่อ 1 แต้มที่ใช้)
            </p>

            <div style={{ backgroundColor: '#fefcf8', border: '1px solid #e2d8c3', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-gray)', fontWeight: '600' }}>แต้มคงเหลือ:</span>
                <strong style={{ color: '#711a19' }}>{availHd} / {totalHdCount} HD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-gray)', fontWeight: '600' }}>พลังชีวิตปัจจุบัน:</span>
                <strong style={{ color: 'var(--color-ink)' }}>{curHp} / {maxHp}</strong>
              </div>
              
              <div style={{ borderTop: '1px solid #e2d8c3', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {hitDiceList.map((hd, i) => {
                  const cId = hd.classId || `class_${i}`;
                  const cMax = parseInt(hd.count) || 0;
                  const cExpended = parseInt(expendedHitDice?.[cId]) || 0;
                  const cAvail = Math.max(0, cMax - cExpended);
                  return (
                    <div key={cId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: 'var(--color-gray)' }}>{cId} (1d{hd.hitDie}):</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>{cAvail}/{cMax}</span>
                        <button
                          type="button"
                          disabled={cAvail <= 0 || curHp >= maxHp}
                          onClick={() => handleShortRestRoll(cId, hd.hitDie)}
                          style={{ padding: '6px 10px', backgroundColor: cAvail <= 0 || curHp >= maxHp ? 'var(--border-color)' : '#2563eb', color: 'var(--bg-white)', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: cAvail <= 0 || curHp >= maxHp ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <i className="fa-solid fa-dice"></i> Roll
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                สิ้นสุดการพักผ่อน (ฟื้นฟู HP/ฟีเจอร์)
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Long Rest Modal (Portaled & Parchment Theme) */}
      {showLongRestModal && ReactDOM.createPortal((
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
            <h3 style={{ margin: '0 0 12px 0', color: '#711a19', fontFamily: 'Cinzel, serif', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌙 พักผ่อนระยะยาว (Long Rest)
            </h3>
            
            <div style={{ backgroundColor: '#fefcf8', border: '1px solid #e2d8c3', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--color-ink)', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                คุณต้องการทำการ Long Rest ใช่หรือไม่?
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#711a19', fontSize: '0.9rem', lineHeight: '1.6', fontWeight: 'bold' }}>
                <li>ฟื้นฟูพลังชีวิต (HP) จนเต็มระดับสูงสุด</li>
                <li>ฟื้นฟูช่องเวทมนตร์ (Spell Slots) ทั้งหมด</li>
                <li>ฟื้นฟูแต้ม Hit Dice (อย่างน้อยครึ่งหนึ่ง)</li>
                <li>รีเซ็ตความสามารถ (Features) ทั้งหมด</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowLongRestModal(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--bg-white)',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  color: 'var(--color-gray)',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLongRest}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#711a19',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--bg-white)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(113, 26, 25, 0.3)'
                }}
              >
                🌙 พักผ่อนเลย
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

    </div>
  );
}

