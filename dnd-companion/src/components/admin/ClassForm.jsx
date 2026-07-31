import React, { useState, useEffect } from 'react';
import ModifierBuilder from './ModifierBuilder';

export default function ClassForm({ initialData, availableFeats = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    class_id: '',
    class_name: '',
    hit_die: 'd8',
    primary_ability: 'Strength',
    class_desc: '',
    srd_source: 'Custom',
    is_homebrew: 1,
    proficiencies: {
      armor: [],
      weapons: [],
      tools: [],
      saving_throws: [],
      skills: { choose: 2, from: [] }
    },
    features: [] // Array of { level: 1, name: '', desc: '' }
  });

  useEffect(() => {
    if (initialData) {
      let parsedProf = { armor: [], weapons: [], tools: [], saving_throws: [], skills: { choose: 2, from: [] } };
      let parsedFeat = [];
      try { parsedProf = typeof initialData.proficiencies === 'string' ? JSON.parse(initialData.proficiencies) : (initialData.proficiencies || parsedProf); } catch(e){}
      try { parsedFeat = typeof initialData.features === 'string' ? JSON.parse(initialData.features) : (initialData.features || []); } catch(e){}

      setFormData({
        ...initialData,
        proficiencies: { ...parsedProf },
        features: Array.isArray(parsedFeat) ? parsedFeat : []
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, { level: 1, name: '', description: '', modifiers: [] }] }));
  };

  const handleUpdateFeature = (index, field, value) => {
    const newF = [...formData.features];
    newF[index][field] = value;
    setFormData(prev => ({ ...prev, features: newF }));
  };

  const handleRemoveFeature = (index) => {
    const newF = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, features: newF }));
  };

  const handleImportFeat = (index, featId) => {
    if (!featId) return;
    const feat = availableFeats.find(f => String(f.feat_id) === String(featId));
    if (feat) {
      const newF = [...formData.features];
      newF[index].name = feat.feat_name || '';
      newF[index].description = feat.feat_desc || '';
      try {
        newF[index].modifiers = typeof feat.modifiers === 'string' ? JSON.parse(feat.modifiers) : (feat.modifiers || []);
      } catch (e) {
        newF[index].modifiers = [];
      }
      setFormData(prev => ({ ...prev, features: newF }));
    }
  };

  const handleProfChange = (category, value) => {
    // value is comma separated string
    const arr = value.split(',').map(s => s.trim()).filter(s => s);
    setFormData(prev => ({
      ...prev,
      proficiencies: { ...prev.proficiencies, [category]: arr }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      proficiencies: JSON.stringify(formData.proficiencies),
      features: JSON.stringify(formData.features)
    };
    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Basic Info */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูลพื้นฐาน (Class Basics)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัสคลาส (ID):</label>
            <input type="text" name="class_id" value={formData.class_id || ''} onChange={handleChange} required disabled={!!initialData} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อคลาส (Name):</label>
            <input type="text" name="class_name" value={formData.class_name || ''} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ลูกเต๋าพลังชีวิต (Hit Die):</label>
            <select name="hit_die" value={formData.hit_die || 'd8'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="d6">d6</option>
              <option value="d8">d8</option>
              <option value="d10">d10</option>
              <option value="d12">d12</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>พลังหลัก (Primary Ability):</label>
            <input type="text" name="primary_ability" placeholder="e.g. Strength or Dexterity" value={formData.primary_ability || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รายละเอียดคลาส (Description):</label>
          <textarea rows="3" name="class_desc" value={formData.class_desc || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px' }} />
        </div>
      </div>

      {/* Proficiencies */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#a78bfa', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ความชำนาญเริ่มต้น (Starting Proficiencies)</h4>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Saving Throws:</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].map(st => {
              const currentList = formData.proficiencies.saving_throws || [];
              const isSel = currentList.some(s => s.toLowerCase() === st.toLowerCase() || s.toLowerCase() === st.substring(0,3).toLowerCase());
              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => {
                    const nextList = isSel ? currentList.filter(s => s.toLowerCase() !== st.toLowerCase() && s.toLowerCase() !== st.substring(0,3).toLowerCase()) : [...currentList, st];
                    setFormData(prev => ({ ...prev, proficiencies: { ...prev.proficiencies, saving_throws: nextList } }));
                  }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px', border: '1px solid',
                    borderColor: isSel ? '#a78bfa' : '#475569',
                    backgroundColor: isSel ? '#5b21b6' : '#1e293b',
                    color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold'
                  }}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>เกราะ (Armor):</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Light', 'Medium', 'Heavy', 'Shields'].map(arm => {
                const currentList = formData.proficiencies.armor || [];
                const isSel = currentList.some(a => a.toLowerCase() === arm.toLowerCase());
                return (
                  <button
                    type="button"
                    key={arm}
                    onClick={() => {
                      const nextList = isSel ? currentList.filter(a => a.toLowerCase() !== arm.toLowerCase()) : [...currentList, arm];
                      setFormData(prev => ({ ...prev, proficiencies: { ...prev.proficiencies, armor: nextList } }));
                    }}
                    style={{
                      padding: '4px 8px', borderRadius: '4px', border: '1px solid',
                      borderColor: isSel ? '#38bdf8' : '#475569',
                      backgroundColor: isSel ? '#0284c7' : '#1e293b',
                      color: '#fff', cursor: 'pointer', fontSize: '0.75rem'
                    }}
                  >
                    {arm}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>อาวุธ (Weapons):</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Simple', 'Martial'].map(wp => {
                const currentList = formData.proficiencies.weapons || [];
                const isSel = currentList.some(w => w.toLowerCase() === wp.toLowerCase());
                return (
                  <button
                    type="button"
                    key={wp}
                    onClick={() => {
                      const nextList = isSel ? currentList.filter(w => w.toLowerCase() !== wp.toLowerCase()) : [...currentList, wp];
                      setFormData(prev => ({ ...prev, proficiencies: { ...prev.proficiencies, weapons: nextList } }));
                    }}
                    style={{
                      padding: '4px 8px', borderRadius: '4px', border: '1px solid',
                      borderColor: isSel ? '#f59e0b' : '#475569',
                      backgroundColor: isSel ? '#b45309' : '#1e293b',
                      color: '#fff', cursor: 'pointer', fontSize: '0.75rem'
                    }}
                  >
                    {wp}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Class Features Matrix */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ color: '#fbbf24', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>ความสามารถตามเลเวล (Class Features)</h4>
          <button type="button" onClick={handleAddFeature} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+ เพิ่ม Feature</button>
        </div>
        
        {formData.features.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>ยังไม่มี Feature...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {formData.features.map((feat, idx) => (
              <div key={idx} style={{ padding: '12px', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', position: 'relative' }}>
                <button type="button" onClick={() => handleRemoveFeature(idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
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
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', marginBottom: '8px', paddingRight: '20px' }}>
                  <input type="number" placeholder="Lv." value={feat.level} onChange={(e) => handleUpdateFeature(idx, 'level', parseInt(e.target.value))} min="1" max="20" style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem' }} />
                  <input type="text" placeholder="ชื่อ Feature (เช่น Action Surge)" value={feat.name} onChange={(e) => handleUpdateFeature(idx, 'name', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem' }} />
                </div>
                <textarea placeholder="คำอธิบาย..." rows="2" value={feat.description || feat.desc || ''} onChange={(e) => handleUpdateFeature(idx, 'description', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '8px' }} />
                <ModifierBuilder modifiers={feat.modifiers || []} onChange={(mods) => handleUpdateFeature(idx, 'modifiers', mods)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>ยกเลิก</button>
        <button type="submit" style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกข้อมูล</button>
      </div>
    </form>
  );
}
