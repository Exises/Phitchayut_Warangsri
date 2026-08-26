import React, { useState, useEffect } from 'react';
import ModifierBuilder from './ModifierBuilder';

export default function ItemForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    item_id: '',
    item_name: '',
    item_type: 'Gear',
    subcategory: '',
    rarity: 'Common',
    cost: '0 gp',
    weight: '0',
    attunement: '',
    damage: '',
    properties: [],
    ac: '',
    strength_req: '',
    stealth: '',
    item_desc: '',
    srd_source: 'Custom',
    is_homebrew: 1,
    mechanics: {
      magic_bonus: 0,
      charges: 0,
      recharge: '',
      modifiers: []
    }
  });

  useEffect(() => {
    if (initialData) {
      let parsedProps = [];
      let parsedMech = { magic_bonus: 0, charges: 0, recharge: '', modifiers: [] };
      try { parsedProps = typeof initialData.properties === 'string' ? JSON.parse(initialData.properties) : (initialData.properties || []); } catch(e){}
      try { 
        if (initialData.mechanics) {
          parsedMech = typeof initialData.mechanics === 'string' ? JSON.parse(initialData.mechanics) : initialData.mechanics; 
        }
      } catch(e){}

      setFormData({
        ...initialData,
        properties: Array.isArray(parsedProps) ? parsedProps : [],
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

  const handlePropertyToggle = (prop) => {
    setFormData(prev => {
      const isSelected = prev.properties.includes(prop);
      if (isSelected) {
        return { ...prev, properties: prev.properties.filter(p => p !== prop) };
      } else {
        return { ...prev, properties: [...prev.properties, prop] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      properties: JSON.stringify(formData.properties),
      mechanics: JSON.stringify(formData.mechanics)
    };
    onSave(submitData);
  };

  const weaponProperties = ['Ammunition', 'Finesse', 'Heavy', 'Light', 'Loading', 'Reach', 'Thrown', 'Two-Handed', 'Versatile'];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูลทั่วไป (General Info)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัสไอเทม (ID):</label>
            <input type="text" name="item_id" value={formData.item_id || ''} onChange={handleChange} required disabled={!!initialData} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อไอเทม (Name):</label>
            <input type="text" name="item_name" value={formData.item_name || ''} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ประเภท (Type):</label>
            <select name="item_type" value={formData.item_type || 'Gear'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="Weapon">Weapon (อาวุธ)</option>
              <option value="Armor">Armor (ชุดเกราะ)</option>
              <option value="Gear">Gear (สัมภาระ)</option>
              <option value="Tool">Tool (เครื่องมือ)</option>
              <option value="Magic Item">Magic Item</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ระดับ (Rarity):</label>
            <select name="rarity" value={formData.rarity || 'Common'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Very Rare">Very Rare</option>
              <option value="Legendary">Legendary</option>
              <option value="Artifact">Artifact</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ราคา (Cost):</label>
            <input type="text" name="cost" value={formData.cost || '0 gp'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>น้ำหนัก (Weight lbs):</label>
            <input type="text" name="weight" value={formData.weight || '0'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>การผูกมัด (Attunement):</label>
          <input type="text" name="attunement" placeholder="เว้นว่างถ้าไม่ต้องผูกมัด หรือระบุเงื่อนไข เช่น 'by a spellcaster'" value={formData.attunement || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>คำอธิบาย (Description):</label>
          <textarea rows="3" name="item_desc" value={formData.item_desc || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px' }} />
        </div>
      </div>

      {(formData.item_type === 'Weapon' || formData.item_type === 'Armor') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Weapon Specific */}
          {formData.item_type === 'Weapon' && (
            <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <h4 style={{ color: '#fbbf24', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูลอาวุธ (Weapon Stats)</h4>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ความเสียหาย (Damage):</label>
                <input type="text" name="damage" placeholder="e.g. 1d8 slashing" value={formData.damage || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>คุณสมบัติอาวุธ (Properties):</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {weaponProperties.map(prop => (
                    <button 
                      type="button" 
                      key={prop}
                      onClick={() => handlePropertyToggle(prop)}
                      style={{
                        padding: '4px 8px', borderRadius: '4px', border: '1px solid',
                        borderColor: formData.properties.includes(prop) ? '#f59e0b' : '#475569',
                        backgroundColor: formData.properties.includes(prop) ? '#b45309' : '#1e293b',
                        color: '#fff', cursor: 'pointer', fontSize: '0.75rem'
                      }}
                    >
                      {prop}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Armor Specific */}
          {formData.item_type === 'Armor' && (
            <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <h4 style={{ color: '#a78bfa', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูลชุดเกราะ (Armor Stats)</h4>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>คลาสเกราะ (AC):</label>
                <input type="text" name="ac" placeholder="e.g. 14 + Dex modifier (max 2)" value={formData.ac || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>STR ขั้นต่ำ (STR Req):</label>
                  <input type="text" name="strength_req" placeholder="e.g. 13" value={formData.strength_req || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ลอบเร้น (Stealth):</label>
                  <select name="stealth" value={formData.stealth || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                    <option value="">ปกติ (Normal)</option>
                    <option value="Disadvantage">เสียเปรียบ (Disadvantage)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Magic Item / Advanced Mechanics & Modifiers */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#ec4899', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>กลไกและโบนัสไอเทม (Item Mechanics & Modifiers)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>โบนัสเวท/อาวุธ (Magic Bonus):</label>
            <input type="number" name="magic_bonus" placeholder="e.g. 1 สำหรับ +1 Weapon" value={formData.mechanics.magic_bonus || 0} onChange={handleMechanicsChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชาร์จสูงสุด (Max Charges):</label>
            <input type="number" name="charges" value={formData.mechanics.charges || 0} onChange={handleMechanicsChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>การฟื้นฟู (Recharge):</label>
            <input type="text" name="recharge" placeholder="e.g. 1d4+1 daily at dawn" value={formData.mechanics.recharge || ''} onChange={handleMechanicsChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>
        
        <ModifierBuilder 
          modifiers={formData.mechanics.modifiers || []} 
          onChange={(mods) => handleMechanicsChange({ target: { name: 'modifiers', value: mods } })} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>ยกเลิก</button>
        <button type="submit" style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกข้อมูล</button>
      </div>
    </form>
  );
}
