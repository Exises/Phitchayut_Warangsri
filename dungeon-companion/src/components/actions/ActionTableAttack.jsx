import React from 'react';
import { resolveUnarmedStrike } from '../../utils/mechanicsResolver';

export default function ActionTableAttack({
  characterState = null,
  resolvedMechanics = null,
  activeWeaponsList = [],
  attackSpellsList = [],
  strMod = 0,
  dexMod = 0,
  spellMod = 0,
  profBonus = 2,
  attacksPerAction = 1,
  fmtMod,
  triggerQuickRoll,
  onAddWeaponClick
}) {
  const unarmed = resolvedMechanics?.unarmedStrike || resolveUnarmedStrike(characterState || {}) || {
    hitBonus: strMod + profBonus,
    dmgMod: strMod,
    diceStr: 'Flat 1',
    damageType: 'Bludgeoning',
    sourceNote: 'Standard Unarmed Strike'
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Table Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '2px solid #711a19', paddingBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ color: '#711a19', fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            ACTIONS • Attacks per Action: {attacksPerAction}
          </strong>
        </div>
        {onAddWeaponClick && (
          <button
            type="button"
            onClick={onAddWeaponClick}
            style={{
              backgroundColor: 'var(--bg-white)',
              border: '1px solid #711a19',
              color: '#711a19',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            MANAGE CUSTOM
          </button>
        )}
      </div>

      {/* Columns Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
        gap: '8px',
        padding: '6px 12px',
        backgroundColor: 'var(--bg-white)',
        borderBottom: '1px solid #cbd5e1',
        fontSize: '0.65rem',
        fontWeight: '800',
        color: 'var(--color-gray)',
        textTransform: 'uppercase'
      }}>
        <div>ATTACK</div>
        <div>RANGE</div>
        <div style={{ textAlign: 'center' }}>HIT / DC</div>
        <div>DAMAGE</div>
        <div>NOTES</div>
      </div>

      {/* Rows Container */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 1. Unarmed Strike (Standard 5e RAW) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
          gap: '8px',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px dashed #e2e8f0',
          fontSize: '0.8rem',
          backgroundColor: 'var(--bg-white)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-hand-fist" style={{ color: 'var(--color-gray)', fontSize: '0.85rem' }}></i>
              <strong style={{ color: 'var(--color-ink)', fontWeight: '700' }}>Unarmed Strike</strong>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-gray)' }}>
              Melee Attack • <span style={{ color: '#711a19', fontWeight: '600' }}>{unarmed.sourceNote}</span>
            </div>
          </div>
          <div style={{ fontWeight: '600', color: 'var(--color-gray)', fontSize: '0.78rem' }}>5 ft. Reach</div>
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => triggerQuickRoll && triggerQuickRoll('Unarmed Strike Attack', unarmed.hitBonus)}
              style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-ink)', cursor: 'pointer' }}
            >
              {fmtMod ? fmtMod(unarmed.hitBonus) : `+${unarmed.hitBonus}`}
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => triggerQuickRoll && triggerQuickRoll('Unarmed Strike Damage', unarmed.dmgMod, unarmed.diceStr)}
              style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--color-gray)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>
                {unarmed.diceStr.startsWith('Flat') ? Math.max(1, 1 + unarmed.dmgMod) : `${unarmed.diceStr}${unarmed.dmgMod >= 0 ? `+${unarmed.dmgMod}` : unarmed.dmgMod}`}
              </span>
              <span style={{ fontSize: '0.75rem' }}>👊</span>
            </button>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-gray)' }}>{unarmed.damageType} / Grapple / Shove</div>
        </div>

        {/* 2. Active Equipped Weapons */}
        {activeWeaponsList.map((w, idx) => {
          const props = Array.isArray(w.properties) ? w.properties : (w.properties || '').split(',').map(s => s.trim()).filter(Boolean);
          const isFinesse = props.some(p => p.toLowerCase().includes('finesse'));
          const isRanged = (w.category || '').toLowerCase().includes('ranged') || props.some(p => p.toLowerCase().includes('range') || p.toLowerCase().includes('thrown'));
          
          let atkMod = strMod;
          if (w.stat === 'dex' || (isRanged && !props.some(p => p.toLowerCase().includes('thrown')))) {
            atkMod = dexMod;
          } else if (isFinesse) {
            atkMod = Math.max(strMod, dexMod);
          } else if (w.stat === 'int') {
            atkMod = spellMod;
          }

          const hitMod = atkMod + profBonus;
          const rawDamage = w.damage || w.damage_dice || '1d6';
          const dmgTypeMatch = (w.name + ' ' + (w.subcategory || '')).toLowerCase();
          let dmgSymbol = '⚔️';
          if (dmgTypeMatch.includes('bow') || dmgTypeMatch.includes('crossbow') || dmgTypeMatch.includes('dart') || dmgTypeMatch.includes('piercing')) dmgSymbol = '🏹';
          else if (dmgTypeMatch.includes('hammer') || dmgTypeMatch.includes('club') || dmgTypeMatch.includes('mace') || dmgTypeMatch.includes('staff') || dmgTypeMatch.includes('bludgeoning')) dmgSymbol = '🔨';

          let rangeText = '5 ft. Reach';
          if (w.range) rangeText = w.range;
          else if (isRanged) rangeText = '80/320 ft.';

          return (
            <div key={`w_${idx}`} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
              gap: '8px',
              alignItems: 'center',
              padding: '10px 12px',
              borderBottom: '1px dashed #e2e8f0',
              fontSize: '0.8rem',
              backgroundColor: 'var(--bg-white)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-khanda" style={{ color: '#711a19', fontSize: '0.85rem' }}></i>
                  <strong style={{ color: 'var(--color-ink)', fontWeight: '700' }}>{w.name}</strong>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-gray)' }}>{w.category || 'Melee Weapon'}</div>
              </div>
              <div style={{ fontWeight: '600', color: 'var(--color-gray)', fontSize: '0.78rem' }}>{rangeText}</div>
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => triggerQuickRoll && triggerQuickRoll(`${w.name} Attack`, hitMod)}
                  style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-ink)', cursor: 'pointer' }}
                >
                  {fmtMod ? fmtMod(hitMod) : `+${hitMod}`}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => triggerQuickRoll && triggerQuickRoll(`${w.name} Damage`, atkMod, rawDamage)}
                  style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--color-gray)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{rawDamage}{atkMod !== 0 ? (atkMod > 0 ? ` + ${atkMod}` : ` - ${Math.abs(atkMod)}`) : ''}</span>
                  <span style={{ fontSize: '0.75rem' }}>{dmgSymbol}</span>
                </button>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-gray)' }}>{props.join(', ') || '--'}</div>
            </div>
          );
        })}

        {/* 3. Attack Spells & Cantrips */}
        {attackSpellsList.map((sp, idx) => {
          const spellHitMod = spellMod + profBonus;
          const rawDamageMatch = (sp.mechanics ? JSON.stringify(sp.mechanics) : sp.effect || '').match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/);
          const rawDamage = rawDamageMatch ? rawDamageMatch[1] : '1d10';
          const rangeText = sp.range || '120 ft.';

          return (
            <div key={`sp_${idx}`} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
              gap: '8px',
              alignItems: 'center',
              padding: '10px 12px',
              borderBottom: '1px dashed #e2e8f0',
              fontSize: '0.8rem',
              backgroundColor: 'var(--bg-white)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#1d4ed8', fontSize: '0.85rem' }}></i>
                  <strong style={{ color: 'var(--color-ink)', fontWeight: '700', fontStyle: 'italic' }}>{sp.name}</strong>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-gray)' }}>{parseInt(sp.level || 0) === 0 ? 'Cantrip' : `Level ${sp.level} Spell`} • Attack</div>
              </div>
              <div style={{ fontWeight: '600', color: 'var(--color-gray)', fontSize: '0.78rem' }}>{rangeText}</div>
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => triggerQuickRoll && triggerQuickRoll(`${sp.name} Spell Attack`, spellHitMod)}
                  style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: '800', color: '#1d4ed8', cursor: 'pointer' }}
                >
                  {fmtMod ? fmtMod(spellHitMod) : `+${spellHitMod}`}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => triggerQuickRoll && triggerQuickRoll(`${sp.name} Damage`, 0, rawDamage)}
                  style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--color-gray)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{rawDamage}</span>
                  <span style={{ fontSize: '0.75rem' }}>✨</span>
                </button>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-gray)' }}>{sp.components || 'V/S'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
