import React, { useState, useEffect } from 'react';

const DND_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

const PRESET_TOOLS_LANG = [
  "Thieves' Tools", "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies",
  "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils",
  "Disguise Kit", "Forgery Kit", "Gaming Set", "Glassblower's Tools", "Herbalism Kit",
  "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Musical Instrument",
  "Navigator's Tools", "Painter's Supplies", "Poisoner's Kit", "Potter's Tools",
  "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools",
  "Common", "Elvish", "Dwarvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc",
  "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon"
];

const ABILITY_SCORES = [
  'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'
];

export default function BackgroundForm({ initialData, availableItems = [], availableFeats = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    background_id: '',
    background_name: '',
    background_desc: '',
    srd_source: 'Custom',
    is_homebrew: 1,
    feat_id: '',
    ability_scores: ['Strength', 'Dexterity', 'Constitution'],
    skill_proficiencies: [],
    tool_proficiencies: [],
    equipment_gold: 50,
    equipment: []
  });

  const [itemSearchText, setItemSearchText] = useState('');

  useEffect(() => {
    if (initialData) {
      let parsedSkills = [];
      let parsedTools = [];
      let parsedEq = [];
      let parsedAbilities = ['Strength', 'Dexterity', 'Constitution'];
      let parsedGold = 50;

      // Parse Ability Scores
      try {
        let raw = typeof initialData.ability_scores === 'string' ? JSON.parse(initialData.ability_scores) : (initialData.ability_scores || {});
        if (Array.isArray(raw)) parsedAbilities = raw;
        else if (raw?.logic?.allowed_attributes) parsedAbilities = raw.logic.allowed_attributes;
      } catch(e){}

      // Parse Skills
      try { 
        let raw = typeof initialData.skill_proficiencies === 'string' ? JSON.parse(initialData.skill_proficiencies) : (initialData.skill_proficiencies || []); 
        parsedSkills = Array.isArray(raw) ? raw : (raw?.logic?.granted || []);
      } catch(e){}

      // Parse Tools
      try { 
        let raw = typeof initialData.tool_proficiencies === 'string' ? JSON.parse(initialData.tool_proficiencies) : (initialData.tool_proficiencies || []); 
        parsedTools = Array.isArray(raw) ? raw : (raw?.logic?.granted || []);
      } catch(e){}

      // Parse Equipment
      try { 
        let raw = typeof initialData.equipment === 'string' ? JSON.parse(initialData.equipment) : (initialData.equipment || []); 
        if (Array.isArray(raw)) {
          parsedEq = raw.map(i => typeof i === 'string' ? { item_name: i, quantity: 1 } : i);
        } else if (raw?.logic?.items) {
          parsedEq = raw.logic.items.map(item => ({ item_name: item, quantity: 1 }));
          if (raw.logic.gold) parsedGold = raw.logic.gold;
        }
      } catch(e){}

      setFormData({
        ...initialData,
        ability_scores: parsedAbilities,
        skill_proficiencies: parsedSkills,
        tool_proficiencies: parsedTools,
        equipment_gold: parsedGold,
        equipment: parsedEq
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Ability Scores Toggle
  const handleToggleAbility = (ability) => {
    setFormData(prev => {
      const current = prev.ability_scores || [];
      if (current.includes(ability)) {
        return { ...prev, ability_scores: current.filter(a => a !== ability) };
      } else {
        if (current.length >= 3) {
          return { ...prev, ability_scores: [...current.slice(1), ability] };
        }
        return { ...prev, ability_scores: [...current, ability] };
      }
    });
  };

  // Skill Handlers
  const handleAddSkill = (skillName) => {
    if (!skillName) return;
    if (!formData.skill_proficiencies.includes(skillName)) {
      setFormData(prev => ({ ...prev, skill_proficiencies: [...prev.skill_proficiencies, skillName] }));
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({ ...prev, skill_proficiencies: prev.skill_proficiencies.filter((_, i) => i !== index) }));
  };

  // Tool Handlers
  const handleAddTool = (toolName) => {
    if (!toolName) return;
    if (!formData.tool_proficiencies.includes(toolName)) {
      setFormData(prev => ({ ...prev, tool_proficiencies: [...prev.tool_proficiencies, toolName] }));
    }
  };

  const handleRemoveTool = (index) => {
    setFormData(prev => ({ ...prev, tool_proficiencies: prev.tool_proficiencies.filter((_, i) => i !== index) }));
  };

  // Equipment List Handlers
  const handleAddEqItem = (itemName) => {
    if (!itemName) return;
    setFormData(prev => ({
      ...prev,
      equipment: [...prev.equipment, { item_name: itemName, quantity: 1 }]
    }));
  };

  const handleUpdateEq = (index, field, value) => {
    const newEq = [...formData.equipment];
    newEq[index][field] = value;
    setFormData(prev => ({ ...prev, equipment: newEq }));
  };

  const handleRemoveEq = (index) => {
    const newEq = formData.equipment.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, equipment: newEq }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Construct structured objects with .display & .logic
    const abilityScoresObj = {
      logic: { allowed_attributes: formData.ability_scores, modes: ["plus_two_one", "three_plus_one"] },
      display: formData.ability_scores.join(', ')
    };

    const skillProfObj = {
      logic: { granted: formData.skill_proficiencies },
      display: formData.skill_proficiencies.join(' and ')
    };

    const toolProfObj = {
      logic: { granted: formData.tool_proficiencies },
      display: formData.tool_proficiencies.join(', ')
    };

    const eqItemList = formData.equipment.map(e => e.item_name).filter(Boolean);
    const eqDisplayParts = [...eqItemList];
    if (formData.equipment_gold) eqDisplayParts.push(`${formData.equipment_gold} GP`);

    const equipmentObj = {
      logic: { gold: parseInt(formData.equipment_gold || 0), items: eqItemList },
      display: eqDisplayParts.join(', ')
    };

    const { equipment_gold, ...cleanFormData } = formData;

    const submitData = {
      ...cleanFormData,
      ability_scores: JSON.stringify(abilityScoresObj),
      skill_proficiencies: JSON.stringify(skillProfObj),
      tool_proficiencies: JSON.stringify(toolProfObj),
      equipment: JSON.stringify(equipmentObj)
    };

    onSave(submitData);
  };

  // Filter available items for equipment picker
  const filteredCatalogItems = availableItems.filter(item => 
    itemSearchText ? (item.item_name || '').toLowerCase().includes(itemSearchText.toLowerCase()) : true
  ).slice(0, 30);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Background Info */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูลประวัติ (Background Info)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัสประวัติ (ID):</label>
            <input type="text" name="background_id" value={formData.background_id || ''} onChange={handleChange} required disabled={!!initialData} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อประวัติ (Name):</label>
            <input type="text" name="background_name" value={formData.background_name || ''} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รายละเอียด (Description & Feature):</label>
          <textarea rows="3" name="background_desc" value={formData.background_desc || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px' }} />
        </div>

        {/* Origin Feat Selector */}
        {availableFeats.length > 0 && (
          <div>
            <label style={{ fontSize: '0.78rem', color: '#fbbf24', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>🎁 ความสามารถพิเศษเริ่มต้น (Granted Origin Feat):</label>
            <select name="feat_id" value={formData.feat_id || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #fbbf24', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="">-- ไม่ระบุ Feat --</option>
              {availableFeats.map(f => (
                <option key={f.feat_id} value={f.feat_id}>{f.feat_name} ({f.category || 'Feat'})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Ability Scores Selection */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#34d399', marginTop: 0, marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>💪 คุณสมบัติเด่นประจำประวัติ (Ability Scores)</h4>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 12px 0' }}>เลือก 3 คุณสมบัติเด่นที่เหมาะกับสายการเล่นของประวัตินี้ (ผู้เล่นจะนำไปเพิ่มโบนัส +2/+1 หรือ +1/+1/+1)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {ABILITY_SCORES.map(ab => {
            const isSelected = (formData.ability_scores || []).includes(ab);
            return (
              <button
                key={ab}
                type="button"
                onClick={() => handleToggleAbility(ab)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #34d399' : '1px solid #475569',
                  backgroundColor: isSelected ? '#065f46' : '#1e293b',
                  color: isSelected ? '#a7f3d0' : '#94a3b8',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {isSelected ? '✓ ' : ''}{ab}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Skills Selection */}
        <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
          <h4 style={{ color: '#fbbf24', marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>🎯 ทักษะ (Skills)</h4>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select
              onChange={(e) => { handleAddSkill(e.target.value); e.target.value = ''; }}
              style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #fbbf24', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="">-- เลือกทักษะเพิ่ม --</option>
              {DND_SKILLS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {formData.skill_proficiencies.map((skill, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#b45309', color: '#fef3c7', padding: '4px 10px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                {skill}
                <button type="button" onClick={() => handleRemoveSkill(idx)} style={{ background: 'transparent', border: 'none', color: '#fef3c7', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Tools / Lang Selection */}
        <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
          <h4 style={{ color: '#a78bfa', marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>🛠️ เครื่องมือ/ภาษา (Tools/Lang)</h4>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select
              onChange={(e) => { handleAddTool(e.target.value); e.target.value = ''; }}
              style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #a78bfa', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="">-- เลือกเครื่องมือ/ภาษา --</option>
              {PRESET_TOOLS_LANG.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {formData.tool_proficiencies.map((tool, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#5b21b6', color: '#ede9fe', padding: '4px 10px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                {tool}
                <button type="button" onClick={() => handleRemoveTool(idx)} style={{ background: 'transparent', border: 'none', color: '#ede9fe', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Starting Equipment Selection */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#10b981', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>🎒 อุปกรณ์เริ่มต้น (Starting Equipment)</h4>
        
        {/* Searchable Picker */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '8px', marginBottom: '12px', width: '100%' }}>
          <input
            type="text"
            placeholder="🔍 ค้นหาไอเทม..."
            value={itemSearchText}
            onChange={(e) => setItemSearchText(e.target.value)}
            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem' }}
          />
          <select
            onChange={(e) => { handleAddEqItem(e.target.value); e.target.value = ''; }}
            style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', backgroundColor: '#1e293b', border: '1px solid #10b981', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem' }}
          >
            <option value="">-- เลือกไอเทมเพิ่ม --</option>
            {filteredCatalogItems.map(item => (
              <option key={item.item_id || item.item_name} value={item.item_name}>
                {item.item_name} ({item.item_type || 'Gear'}) - {item.cost || 'Free'}
              </option>
            ))}
          </select>
        </div>

        {/* Gold Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', backgroundColor: '#1e293b', borderRadius: '6px' }}>
          <label style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 'bold' }}>🪙 เงินเริ่มต้น (Gold GP):</label>
          <input
            type="number"
            name="equipment_gold"
            value={formData.equipment_gold || 0}
            onChange={handleChange}
            min="0"
            style={{ width: '100px', backgroundColor: '#0f172a', border: '1px solid #fbbf24', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}
          />
        </div>

        {/* Selected Equipment List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {formData.equipment.map((eq, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '8px', alignItems: 'center', backgroundColor: '#1e293b', padding: '6px 10px', borderRadius: '6px' }}>
              <input
                type="text"
                placeholder="ชื่อไอเทม"
                value={eq.item_name}
                onChange={(e) => handleUpdateEq(idx, 'item_name', e.target.value)}
                style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem' }}
              />
              <input
                type="number"
                placeholder="จำนวน"
                value={eq.quantity}
                onChange={(e) => handleUpdateEq(idx, 'quantity', parseInt(e.target.value) || 1)}
                min="1"
                style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => handleRemoveEq(idx)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>ยกเลิก</button>
        <button type="submit" style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกข้อมูล</button>
      </div>
    </form>
  );
}
