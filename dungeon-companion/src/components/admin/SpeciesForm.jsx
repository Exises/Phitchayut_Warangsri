import React, { useState, useEffect } from 'react';
import ModifierBuilder from './ModifierBuilder';

export default function SpeciesForm({ initialData, availableFeats = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    species_id: '',
    species_name: '',
    size: 'Medium',
    speed: '30 ft.',
    species_desc: '',
    traits: [],
    granted_spells: [],
    srd_source: 'Custom',
    is_homebrew: 1
  });

  useEffect(() => {
    if (initialData) {
      let parsedTraits = [];
      let parsedSpells = [];
      try {
        parsedTraits = typeof initialData.traits === 'string' ? JSON.parse(initialData.traits) : (initialData.traits || []);
      } catch (e) {}
      try {
        parsedSpells = typeof initialData.granted_spells === 'string' ? JSON.parse(initialData.granted_spells) : (initialData.granted_spells || []);
      } catch (e) {}

      setFormData({
        ...initialData,
        traits: Array.isArray(parsedTraits) ? parsedTraits : [],
        granted_spells: Array.isArray(parsedSpells) ? parsedSpells : []
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTrait = () => {
    setFormData(prev => ({
      ...prev,
      traits: [...prev.traits, { name: '', description: '', level: 1, modifiers: [] }]
    }));
  };

  const handleUpdateTrait = (index, field, value) => {
    const newTraits = [...formData.traits];
    newTraits[index][field] = value;
    setFormData(prev => ({ ...prev, traits: newTraits }));
  };

  const handleRemoveTrait = (index) => {
    const newTraits = formData.traits.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, traits: newTraits }));
  };

  const handleImportFeat = (index, featId) => {
    if (!featId) return;
    const feat = availableFeats.find(f => String(f.feat_id) === String(featId));
    if (feat) {
      const newTraits = [...formData.traits];
      newTraits[index].name = feat.feat_name || '';
      newTraits[index].description = feat.feat_desc || '';
      try {
        newTraits[index].modifiers = typeof feat.modifiers === 'string' ? JSON.parse(feat.modifiers) : (feat.modifiers || []);
      } catch (e) {
        newTraits[index].modifiers = [];
      }
      setFormData(prev => ({ ...prev, traits: newTraits }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      traits: JSON.stringify(formData.traits),
      granted_spells: JSON.stringify(formData.granted_spells)
    };
    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Basic Info */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูลพื้นฐาน (Basic Info)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัสเผ่า (ID):</label>
            <input type="text" name="species_id" value={formData.species_id || ''} onChange={handleChange} required disabled={!!initialData} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อเผ่าพันธุ์ (Name):</label>
            <input type="text" name="species_name" value={formData.species_name || ''} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ขนาด (Size):</label>
            <select name="size" value={formData.size || 'Medium'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="Tiny">Tiny</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ความเร็ว (Speed):</label>
            <input type="text" name="speed" value={formData.speed || '30 ft.'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>แหล่งที่มา (Source):</label>
            <input type="text" name="srd_source" value={formData.srd_source || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รายละเอียด (Description):</label>
          <textarea rows="3" name="species_desc" value={formData.species_desc || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px' }} />
        </div>
      </div>

      {/* Traits (Dynamic Array) */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ color: '#fbbf24', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>คุณสมบัติเผ่าพันธุ์ (Traits)</h4>
          <button type="button" onClick={handleAddTrait} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+ เพิ่ม Trait</button>
        </div>
        
        {formData.traits.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>ยังไม่มีคุณสมบัติ...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {formData.traits.map((trait, idx) => (
              <div key={idx} style={{ padding: '12px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', position: 'relative' }}>
                <button type="button" onClick={() => handleRemoveTrait(idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                  <select 
                    onChange={(e) => { handleImportFeat(idx, e.target.value); e.target.value = ''; }}
                    style={{ backgroundColor: '#334155', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '4px', padding: '4px', fontSize: '0.75rem', width: '200px' }}
                  >
                    <option value="">-- นำเข้าจาก Feat --</option>
                    {availableFeats.map(f => (
                      <option key={f.feat_id} value={f.feat_id}>{f.feat_name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px', paddingRight: '20px' }}>
                  <input type="text" placeholder="ชื่อคุณสมบัติ (เช่น Darkvision)" value={trait.name} onChange={(e) => handleUpdateTrait(idx, 'name', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem' }} />
                  <input type="number" placeholder="เลเวลที่ได้รับ" value={trait.level} onChange={(e) => handleUpdateTrait(idx, 'level', parseInt(e.target.value))} min="1" max="20" style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem' }} />
                </div>
                <textarea placeholder="คำอธิบายสำหรับผู้เล่นอ่าน..." rows="2" value={trait.description || trait.desc || ''} onChange={(e) => handleUpdateTrait(idx, 'description', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '8px' }} />
                <ModifierBuilder modifiers={trait.modifiers || []} onChange={(mods) => handleUpdateTrait(idx, 'modifiers', mods)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>ยกเลิก</button>
        <button type="submit" style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกข้อมูล</button>
      </div>
    </form>
  );
}
