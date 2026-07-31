import React, { useState, useEffect } from 'react';

export default function SpellForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    spell_id: '',
    spell_name: '',
    spell_level: 0,
    school: 'Evocation',
    casting_time: '1 Action',
    range_dist: '60 ft.',
    duration: 'Instantaneous',
    components: 'V, S',
    spell_desc: '',
    srd_source: 'Custom',
    is_homebrew: 1,
    mechanics: {
      attack_type: '',
      save_type: '',
      damage_dice: '',
      damage_type: '',
      upcast_dice: ''
    }
  });

  useEffect(() => {
    if (initialData) {
      let parsedMech = { attack_type: '', save_type: '', damage_dice: '', damage_type: '', upcast_dice: '' };
      try {
        if (initialData.mechanics) {
          parsedMech = typeof initialData.mechanics === 'string' ? JSON.parse(initialData.mechanics) : initialData.mechanics;
        }
      } catch(e) {}

      setFormData({
        ...initialData,
        spell_level: parseInt(initialData.spell_level) || 0,
        mechanics: { ...parsedMech }
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMechanicsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      mechanics: { ...prev.mechanics, [name]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      mechanics: JSON.stringify(formData.mechanics)
    };
    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูลคาถา (Spell Info)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัสคาถา (ID):</label>
            <input type="text" name="spell_id" value={formData.spell_id || ''} onChange={handleChange} required disabled={!!initialData} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อคาถา (Name):</label>
            <input type="text" name="spell_name" value={formData.spell_name || ''} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ระดับ (Level 0-9):</label>
            <input type="number" name="spell_level" value={formData.spell_level} onChange={handleChange} min="0" max="9" style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>สำนักเวท (School):</label>
            <select name="school" value={formData.school || 'Evocation'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="Abjuration">Abjuration</option>
              <option value="Conjuration">Conjuration</option>
              <option value="Divination">Divination</option>
              <option value="Enchantment">Enchantment</option>
              <option value="Evocation">Evocation</option>
              <option value="Illusion">Illusion</option>
              <option value="Necromancy">Necromancy</option>
              <option value="Transmutation">Transmutation</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>เวลาการร่าย (Casting):</label>
            <input type="text" name="casting_time" value={formData.casting_time || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ระยะ (Range):</label>
            <input type="text" name="range_dist" value={formData.range_dist || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ระยะเวลา (Duration):</label>
            <input type="text" name="duration" value={formData.duration || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>องค์ประกอบ (Components):</label>
            <input type="text" name="components" value={formData.components || ''} placeholder="V, S, M (..)" onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>คำอธิบาย (Description):</label>
          <textarea rows="4" name="spell_desc" value={formData.spell_desc || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px' }} />
        </div>
      </div>

      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#ef4444', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>กลไกและการคำนวณ (Mechanics & Rolls)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ประเภทการโจมตี (Attack Type):</label>
            <select name="attack_type" value={formData.mechanics.attack_type || ''} onChange={handleMechanicsChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="">ไม่มี (None)</option>
              <option value="Melee Spell Attack">Melee Spell Attack</option>
              <option value="Ranged Spell Attack">Ranged Spell Attack</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>การทอยหลบ (Saving Throw):</label>
            <select name="save_type" value={formData.mechanics.save_type || ''} onChange={handleMechanicsChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="">ไม่มี (None)</option>
              <option value="STR">Strength</option>
              <option value="DEX">Dexterity</option>
              <option value="CON">Constitution</option>
              <option value="INT">Intelligence</option>
              <option value="WIS">Wisdom</option>
              <option value="CHA">Charisma</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ลูกเต๋าดาเมจ (Damage Dice):</label>
            <input type="text" name="damage_dice" placeholder="e.g. 8d6" value={formData.mechanics.damage_dice || ''} onChange={handleMechanicsChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ประเภทดาเมจ (Damage Type):</label>
            <input type="text" name="damage_type" placeholder="e.g. Fire" value={formData.mechanics.damage_type || ''} onChange={handleMechanicsChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>การอัปสเกล (Upcast Dice):</label>
            <input type="text" name="upcast_dice" placeholder="e.g. 1d6" value={formData.mechanics.upcast_dice || ''} onChange={handleMechanicsChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>ยกเลิก</button>
        <button type="submit" style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกข้อมูล</button>
      </div>
    </form>
  );
}
