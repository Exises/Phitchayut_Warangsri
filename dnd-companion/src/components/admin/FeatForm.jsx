import React, { useState, useEffect } from 'react';
import ModifierBuilder from './ModifierBuilder';

export default function FeatForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    feat_id: '',
    feat_name: '',
    feat_type: 'General',
    prerequisite: '',
    feat_desc: '',
    srd_source: 'Custom',
    is_homebrew: 1,
    modifiers: [], // JSON Array for Mechanics Engine
    feat_choices: [] // JSON Array for sub-options
  });

  useEffect(() => {
    if (initialData) {
      let parsedModifiers = [];
      let parsedChoices = [];
      try { parsedModifiers = typeof initialData.modifiers === 'string' ? JSON.parse(initialData.modifiers) : (initialData.modifiers || []); } catch(e){}
      try { parsedChoices = typeof initialData.feat_choices === 'string' ? JSON.parse(initialData.feat_choices) : (initialData.feat_choices || []); } catch(e){}

      setFormData({
        ...initialData,
        modifiers: Array.isArray(parsedModifiers) ? parsedModifiers : [],
        feat_choices: Array.isArray(parsedChoices) ? parsedChoices : []
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatToggle = (stat) => {
    setFormData(prev => {
      const isSelected = prev.stat_options.includes(stat);
      if (isSelected) {
        return { ...prev, stat_options: prev.stat_options.filter(s => s !== stat) };
      } else {
        return { ...prev, stat_options: [...prev.stat_options, stat] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      modifiers: JSON.stringify(formData.modifiers),
      feat_choices: JSON.stringify(formData.feat_choices)
    };
    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูล Feat (Feat Info)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัส Feat (ID):</label>
            <input type="text" name="feat_id" value={formData.feat_id || ''} onChange={handleChange} required disabled={!!initialData} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อ Feat (Name):</label>
            <input type="text" name="feat_name" value={formData.feat_name || ''} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ประเภท (Category):</label>
            <select name="feat_type" value={formData.feat_type || 'General'} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="Origin">Origin</option>
              <option value="General">General</option>
              <option value="Fighting Style">Fighting Style</option>
              <option value="Epic Boon">Epic Boon</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>เงื่อนไข (Prerequisite):</label>
            <input type="text" name="prerequisite" placeholder="e.g. Dexterity 13 or higher" value={formData.prerequisite || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รายละเอียดความสามารถ (Description):</label>
          <textarea rows="3" name="feat_desc" value={formData.feat_desc || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '16px' }} />
        </div>
        
        {/* Modifier Engine */}
        <ModifierBuilder 
          modifiers={formData.modifiers || []} 
          onChange={(mods) => setFormData(prev => ({ ...prev, modifiers: mods }))} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>ยกเลิก</button>
        <button type="submit" style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกข้อมูล</button>
      </div>
    </form>
  );
}
