import React from 'react';

const MODIFIER_TYPES = {
  bonus: 'โบนัส (Bonus)',
  proficiency: 'ความชำนาญ (Proficiency)',
  advantage: 'ได้เปรียบ (Advantage)',
  disadvantage: 'เสียเปรียบ (Disadvantage)',
  resistance: 'ต้านทาน (Resistance)',
  immunity: 'ภูมิคุ้มกัน (Immunity)',
  vulnerability: 'แพ้ทาง (Vulnerability)',
  sense: 'การมองเห็น/สัมผัส (Sense)',
  speed: 'ความเร็ว (Speed)',
  spell: 'คาถา (Spell)',
  damage: 'ความเสียหาย (Damage)'
};

const SUB_TYPES = {
  bonus: { stat: 'สเตตัส (Ability Score)', ac: 'คลาสเกราะ (AC)', hp: 'พลังชีวิต (HP)', attack: 'ทอยโจมตี (Attack Roll)', damage: 'ทอยดาเมจ (Damage Roll)', save: 'ทอยหลบ (Saving Throw)' },
  proficiency: { skill: 'ทักษะ (Skill)', tool: 'เครื่องมือ (Tool)', weapon: 'อาวุธ (Weapon)', armor: 'ชุดเกราะ (Armor)', save: 'ทอยหลบ (Saving Throw)' },
  advantage: { skill: 'ทักษะ (Skill)', save: 'ทอยหลบ (Saving Throw)', attack: 'ทอยโจมตี (Attack Roll)' },
  disadvantage: { skill: 'ทักษะ (Skill)', save: 'ทอยหลบ (Saving Throw)', attack: 'ทอยโจมตี (Attack Roll)' },
  resistance: { damage: 'ประเภทดาเมจ (Damage Type)' },
  immunity: { damage: 'ประเภทดาเมจ (Damage Type)', condition: 'สถานะผิดปกติ (Condition)' },
  vulnerability: { damage: 'ประเภทดาเมจ (Damage Type)' },
  sense: { vision: 'การมองเห็น (Vision Type)' },
  speed: { move: 'ประเภทการเคลื่อนที่ (Movement Type)' },
  spell: { grant: 'ได้รับคาถา (Grant Spell)' },
  damage: { add: 'เพิ่มดาเมจ (Add Damage)' }
};

const TARGET_OPTIONS = {
  stat: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
  skill: ['acrobatics', 'animal handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight of hand', 'stealth', 'survival'],
  save: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
  damage: ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'],
  vision: ['darkvision', 'blindsight', 'truesight', 'tremorsense'],
  move: ['walk', 'fly', 'swim', 'climb', 'burrow'],
  weapon: ['simple', 'martial', 'club', 'dagger', 'greatclub', 'javelin', 'light hammer', 'mace', 'quarterstaff', 'sickle', 'spear', 'light crossbow', 'dart', 'shortbow', 'sling', 'battleaxe', 'flail', 'glaive', 'greataxe', 'greatsword', 'halberd', 'lance', 'longsword', 'maul', 'morningstar', 'pike', 'rapier', 'scimitar', 'shortsword', 'trident', 'war pick', 'warhammer', 'whip', 'blowgun', 'hand crossbow', 'heavy crossbow', 'longbow', 'net'],
  armor: ['light', 'medium', 'heavy', 'shields'],
  condition: ['blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'stunned', 'unconscious']
};

export default function ModifierBuilder({ modifiers = [], onChange }) {
  
  const handleAddModifier = (presetType = 'custom') => {
    let newMod = { type: 'bonus', sub_type: 'stat', target: 'strength', value: '' };
    
    if (presetType === 'stat_bonus') newMod = { type: 'bonus', sub_type: 'stat', target: 'strength', value: '2' };
    else if (presetType === 'proficiency_skill') newMod = { type: 'proficiency', sub_type: 'skill', target: 'perception', value: '' };
    else if (presetType === 'resistance_damage') newMod = { type: 'resistance', sub_type: 'damage', target: 'fire', value: '' };
    else if (presetType === 'sense_vision') newMod = { type: 'sense', sub_type: 'vision', target: 'darkvision', value: '60' };
    else if (presetType === 'speed_bonus') newMod = { type: 'speed', sub_type: 'move', target: 'walk', value: '10' };
    else if (presetType === 'ac_bonus') newMod = { type: 'bonus', sub_type: 'ac', target: 'ac', value: '1' };
    else if (presetType === 'hp_bonus') newMod = { type: 'bonus', sub_type: 'hp', target: 'hp', value: '1' };
    
    onChange([...modifiers, newMod]);
  };

  const handleUpdate = (index, field, val) => {
    const updated = [...modifiers];
    updated[index][field] = val;
    
    // Auto-reset sub_type and target when type changes to prevent invalid state
    if (field === 'type') {
      const firstSubType = SUB_TYPES[val] ? Object.keys(SUB_TYPES[val])[0] : '';
      updated[index].sub_type = firstSubType;
      const firstTarget = TARGET_OPTIONS[firstSubType] ? TARGET_OPTIONS[firstSubType][0] : '';
      updated[index].target = firstTarget;
    }
    
    if (field === 'sub_type') {
      const firstTarget = TARGET_OPTIONS[val] ? TARGET_OPTIONS[val][0] : '';
      updated[index].target = firstTarget;
    }

    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = modifiers.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h5 style={{ margin: 0, color: '#f59e0b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⚙️ D&D Mechanics Engine (Modifiers)
        </h5>
      </div>
      
      {/* Shortcut Buttons */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => handleAddModifier('stat_bonus')} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #059669', backgroundColor: '#064e3b', color: '#34d399', cursor: 'pointer' }}>+ บัฟสเตตัส (+2 STR)</button>
        <button type="button" onClick={() => handleAddModifier('proficiency_skill')} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #2563eb', backgroundColor: '#1e3a8a', color: '#60a5fa', cursor: 'pointer' }}>+ ชำนาญสกิล (Perception)</button>
        <button type="button" onClick={() => handleAddModifier('resistance_damage')} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #dc2626', backgroundColor: '#7f1d1d', color: '#f87171', cursor: 'pointer' }}>+ กันดาเมจ (Fire)</button>
        <button type="button" onClick={() => handleAddModifier('sense_vision')} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #9333ea', backgroundColor: '#581c87', color: '#c084fc', cursor: 'pointer' }}>+ การมองเห็น (Darkvision)</button>
        <button type="button" onClick={() => handleAddModifier('speed_bonus')} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d97706', backgroundColor: '#78350f', color: '#fbbf24', cursor: 'pointer' }}>+ เพิ่มความเร็ว (+10 Speed)</button>
        <button type="button" onClick={() => handleAddModifier('ac_bonus')} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #0284c7', backgroundColor: '#0c4a6e', color: '#38bdf8', cursor: 'pointer' }}>+ เพิ่มเกราะ (+1 AC)</button>
        <button type="button" onClick={() => handleAddModifier('hp_bonus')} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e11d48', backgroundColor: '#881337', color: '#fda4af', cursor: 'pointer' }}>+ เพิ่ม HP (+1 HP)</button>
        <button type="button" onClick={() => handleAddModifier('custom')} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#1e293b', color: '#cbd5e1', cursor: 'pointer' }}>+ กำหนดเอง (Custom)</button>
      </div>

      {/* Modifiers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {modifiers.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '8px', textAlign: 'center', border: '1px dashed #334155', borderRadius: '6px' }}>
            ยังไม่มีกลไกถูกตั้งค่าสำหรับคุณสมบัตินี้
          </div>
        ) : (
          modifiers.map((mod, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b', padding: '8px', borderRadius: '6px', border: '1px solid #475569', flexWrap: 'wrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>#{idx+1}</span>
              
              {/* Type Dropdown */}
              <select 
                value={mod.type || 'bonus'} 
                onChange={e => handleUpdate(idx, 'type', e.target.value)}
                style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}
              >
                {Object.entries(MODIFIER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              <span style={{ color: '#64748b' }}>▶</span>

              {/* Sub-Type Dropdown */}
              <select 
                value={mod.sub_type || ''} 
                onChange={e => handleUpdate(idx, 'sub_type', e.target.value)}
                style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}
              >
                {SUB_TYPES[mod.type] ? Object.entries(SUB_TYPES[mod.type]).map(([k, v]) => <option key={k} value={k}>{v}</option>) : <option value="">-</option>}
              </select>

              <span style={{ color: '#64748b' }}>▶</span>

              {/* Target Dropdown / Restricted Options Input */}
              {TARGET_OPTIONS[mod.sub_type] ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <select 
                    value={mod.target || ''} 
                    onChange={e => handleUpdate(idx, 'target', e.target.value)}
                    style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    <option value="">-- เลือกเป้าหมาย --</option>
                    <option value="1_choice">1 Choice (เลือกอิสระ)</option>
                    <option value="custom_pool">Custom Pool (ระบุกลุ่ม a,b,c)</option>
                    {TARGET_OPTIONS[mod.sub_type].map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                  </select>
                  {mod.target === 'custom_pool' && (
                    <input 
                      type="text" 
                      value={mod.options || ''} 
                      onChange={e => handleUpdate(idx, 'options', e.target.value)}
                      placeholder="ระบุตัวเลือก เช่น Arcana, History, Religion"
                      style={{ backgroundColor: '#0f172a', color: '#fbbf24', border: '1px solid #f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.78rem', width: '180px' }}
                    />
                  )}
                </div>
              ) : (
                <input 
                  type="text" 
                  value={mod.target || ''} 
                  onChange={e => handleUpdate(idx, 'target', e.target.value)}
                  placeholder="เป้าหมาย (เช่น spell name)"
                  style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', width: '120px' }}
                />
              )}

              {/* Value Input */}
              <input 
                type="text" 
                value={mod.value || ''} 
                onChange={e => handleUpdate(idx, 'value', e.target.value)}
                placeholder="ค่า (e.g. +2, 60)"
                style={{ backgroundColor: '#0f172a', color: '#10b981', border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', width: '80px', fontWeight: 'bold' }}
              />

              <button type="button" onClick={() => handleRemove(idx)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}>
                ✖
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
