import React, { useState, useEffect } from 'react';
import ModifierBuilder from './ModifierBuilder';

export default function SubclassForm({ initialData, availableClasses = [], availableFeats = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    subclass_id: '',
    class_id: '',
    subclass_name: '',
    subclass_desc: '',
    description: '', // Some places might use description
    srd_source: 'Custom',
    is_homebrew: 1,
    features: [] // Array of { level: 3, name: '', desc: '' }
  });

  useEffect(() => {
    if (initialData) {
      let parsedFeat = [];
      try { parsedFeat = typeof initialData.features === 'string' ? JSON.parse(initialData.features) : (initialData.features || []); } catch(e){}

      setFormData({
        ...initialData,
        features: Array.isArray(parsedFeat) ? parsedFeat : []
      });
    } else {
        // Pre-select first class if available
        if (availableClasses.length > 0) {
            setFormData(prev => ({ ...prev, class_id: availableClasses[0].class_id }));
        }
    }
  }, [initialData, availableClasses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, { level: 3, name: '', description: '', modifiers: [] }] }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      subclass_desc: formData.subclass_desc || formData.description,
      features: JSON.stringify(formData.features)
    };
    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Basic Info */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>ข้อมูลพื้นฐาน (Subclass Basics)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รหัสซับคลาส (ID):</label>
            <input type="text" name="subclass_id" value={formData.subclass_id || ''} onChange={handleChange} required disabled={!!initialData} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ชื่อซับคลาส (Name):</label>
            <input type="text" name="subclass_name" value={formData.subclass_name || ''} onChange={handleChange} required style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>คลาสหลัก (Parent Class):</label>
          <select name="class_id" value={formData.class_id || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
            {availableClasses.map(c => (
                <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>รายละเอียดซับคลาส (Description):</label>
          <textarea rows="3" name="subclass_desc" value={formData.subclass_desc || formData.description || ''} onChange={handleChange} style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px' }} />
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ color: '#4ade80', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>ฟีเจอร์ประจำซับคลาส (Subclass Features)</h4>
          <button type="button" onClick={handleAddFeature} style={{ backgroundColor: '#166534', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>➕ เพิ่มฟีเจอร์</button>
        </div>

        {formData.features.map((feat, index) => (
          <div key={index} style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #475569', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Feature #{index + 1}</strong>
              <button type="button" onClick={() => handleRemoveFeature(index)} style={{ backgroundColor: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️ ลบ</button>
            </div>

            {availableFeats.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <select onChange={(e) => handleImportFeat(index, e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '0.75rem', backgroundColor: '#0f172a', color: '#94a3b8', border: '1px solid #334155' }}>
                  <option value="">-- นำเข้าข้อมูลจาก Feat ที่มีอยู่ (Import) --</option>
                  {availableFeats.map(f => (
                    <option key={f.feat_id} value={f.feat_id}>{f.feat_name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', marginBottom: '8px' }}>
              <input type="number" min="1" max="20" placeholder="Level" value={feat.level || 1} onChange={e => handleUpdateFeature(index, 'level', parseInt(e.target.value) || 1)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.8rem' }} />
              <input type="text" placeholder="ชื่อฟีเจอร์..." value={feat.name || ''} onChange={e => handleUpdateFeature(index, 'name', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.8rem' }} />
            </div>

            <textarea rows="2" placeholder="คำอธิบายฟีเจอร์..." value={feat.description || feat.desc || ''} onChange={e => handleUpdateFeature(index, 'description', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '8px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ประเภทแอคชั่น (Action Type)</label>
                <select value={feat.action_type || ''} onChange={e => handleUpdateFeature(index, 'action_type', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <option value="">-- อัตโนมัติ (Passive) --</option>
                  <option value="Action">แอคชั่นหลัก (Action)</option>
                  <option value="Bonus Action">โบนัสแอคชั่น (Bonus Action)</option>
                  <option value="Reaction">รีแอคชั่น (Reaction)</option>
                  <option value="Free Action">ฟรีแอคชั่น (Free Action)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>จำนวนครั้งที่ใช้ได้ (Uses)</label>
                <input type="text" placeholder="เช่น 3 หรือ profBonus" value={feat.uses_count || ''} onChange={e => handleUpdateFeature(index, 'uses_count', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.75rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ฟื้นฟูเมื่อ (Recovery)</label>
                <select value={feat.uses_recovery || ''} onChange={e => handleUpdateFeature(index, 'uses_recovery', e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <option value="">-- ไม่มีขีดจำกัด --</option>
                  <option value="Short Rest">พักสั้น (Short Rest)</option>
                  <option value="Long Rest">พักยาว (Long Rest)</option>
                  <option value="Dawn">รุ่งสาง (Dawn)</option>
                </select>
              </div>
            </div>

            <div style={{ padding: '8px', backgroundColor: '#0f172a', borderRadius: '4px', border: '1px dashed #475569' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>ตัวปรับแต่งความสามารถ (Modifiers) - เมื่อได้รับฟีเจอร์นี้</div>
              <ModifierBuilder
                modifiers={feat.modifiers || []}
                onChange={(mods) => handleUpdateFeature(index, 'modifiers', mods)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
        <button type="button" onClick={onCancel} style={{ backgroundColor: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>ยกเลิก</button>
        <button type="submit" style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}>บันทึกข้อมูล</button>
      </div>
    </form>
  );
}
