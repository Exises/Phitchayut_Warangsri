import React from 'react';
import {
  cleanAndStyleHtml,
  purgeOnLevelDowngrade,
  formatTableFeatureNames,
  deduplicateSubclasses
} from '../../../utils/workshopHelpers';
import { renderClassAppendix } from '../WorkshopWidgets';

export default function WorkshopModals({
  classToDeleteIndex,
  setClassToDeleteIndex,
  previewClassId,
  setPreviewClassId,
  showFullClassInfo,
  setShowFullClassInfo,
  levelConfirm,
  setLevelConfirm,
  characterState,
  setCharacterState,
  dbData
}) {
  return (
    <>
      {/* Confirm Delete Class Modal */}
      {classToDeleteIndex !== null && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div className="modal-content animate-fade-in" style={{ backgroundColor: 'var(--bg-white)', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '15px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--color-ink)' }}>ยืนยันการลบคลาสอาชีพ</h2>
            <p style={{ color: 'var(--color-gray)', marginBottom: '25px', lineHeight: '1.5' }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบคลาสอาชีพนี้?<br/>
              <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>ความสามารถทั้งหมด เวทมนตร์ที่เลือกไว้ และตัวเลือกต่างๆ ของคลาสนี้จะถูกรีเซ็ตใหม่ทั้งหมด</span>
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => setClassToDeleteIndex(null)}
                style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', backgroundColor: 'var(--bg-white)', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >ยกเลิก</button>
              <button 
                onClick={() => {
                  setCharacterState(prev => {
                    const newClassList = prev.classData.classes.filter((_, i) => i !== classToDeleteIndex);
                    return {
                      ...prev, 
                      classData: {
                        ...prev.classData, 
                        classes: newClassList, 
                        primaryClassId: newClassList[0]?.classId || null
                      }
                    };
                  });
                  setClassToDeleteIndex(null);
                }}
                style={{ flex: 1, padding: '10px', border: 'none', backgroundColor: '#ef4444', color: 'var(--bg-white)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >ลบคลาสอาชีพ</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal for Class Preview (Both initial and multiclass) */}
      {previewClassId && (
        <div className="modal-overlay" onClick={() => setPreviewClassId(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-white)', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '75vh', overflowY: 'auto', marginTop: '20px' }}>
            {(() => {
              const previewClass = dbData.classes?.find(c => c.class_id === previewClassId);
              if (!previewClass) return null;
              const isMulticlass = characterState.classData.classes.length > 0;
              return (
                <>
                  <h2 style={{ marginTop: 0, color: '#711a19', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>{previewClass.class_name}</h2>
                  <p style={{ marginBottom: '15px' }}><strong>Primary Ability:</strong> {previewClass.primary_ability || 'Any'} | <strong>Hit Die:</strong> d{previewClass.hit_die || 8}</p>
                  
                  {isMulticlass && (
                    <div style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '10px', marginBottom: '15px', borderRadius: '4px', fontSize: '0.85rem', color: '#b45309' }}>
                      <i className="fa-solid fa-triangle-exclamation"></i> <strong>Multiclassing Requirement:</strong> To multiclass into this class, you must have <strong>{previewClass.primary_ability || 'Primary Ability Score'} 13 or higher</strong>
                    </div>
                  )}

                  <div style={{ color: 'var(--color-gray)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }} dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml('', previewClass.class_desc || 'No description available.') }}></div>
                  
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                    <button onClick={() => setPreviewClassId(null)} style={{ padding: '10px 20px', border: '1px solid #d1d5db', backgroundColor: 'var(--bg-white)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
                    <button 
                      onClick={() => {
                        const classInfo = dbData.classes?.find(c => c.class_id === previewClass.class_id);
                        if (classInfo) {
                          const newClassList = [...characterState.classData.classes, { classId: previewClass.class_id, subclassId: null, level: 1, hitDie: parseInt(classInfo.hit_die) || 8 }];
                          setCharacterState(prev => ({...prev, classData: {...prev.classData, classes: newClassList, primaryClassId: newClassList[0].classId}}));
                        }
                        setPreviewClassId(null);
                      }} 
                      style={{ padding: '10px 20px', border: 'none', backgroundColor: '#711a19', color: 'var(--bg-white)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Select This Class
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Full Class Info Modal */}
      {showFullClassInfo && (
        <div className="modal-overlay" onClick={() => setShowFullClassInfo(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-white)', padding: '30px', borderRadius: '12px', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto', marginTop: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#711a19' }}>{showFullClassInfo.classInfo.class_name}</h2>
                <p style={{ margin: '5px 0 0 0', color: 'var(--color-gray)', fontSize: '0.9rem' }}>Primary Ability: {showFullClassInfo.classInfo.primary_ability || 'Any'} | Hit Die: d{showFullClassInfo.classInfo.hit_die || 8}</p>
              </div>
              <button onClick={() => setShowFullClassInfo(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
            </div>

            <div style={{ color: 'var(--color-gray)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '30px' }} dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml('', showFullClassInfo.classInfo.class_desc || 'No description available.') }}></div>

            <h3 style={{ color: 'var(--color-ink)', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>Class Table (Level 1-20)</h3>
            {(() => {
              // Extract Core Traits
              let coreTraits = null;
              if (showFullClassInfo.classInfo.core_traits) {
                try { coreTraits = typeof showFullClassInfo.classInfo.core_traits === 'string' ? JSON.parse(showFullClassInfo.classInfo.core_traits) : showFullClassInfo.classInfo.core_traits; } catch { /* ignore */ }
              }

              let allFeatures = [];
              if (showFullClassInfo.classInfo.features) {
                try {
                  allFeatures = typeof showFullClassInfo.classInfo.features === 'string' ? JSON.parse(showFullClassInfo.classInfo.features) : showFullClassInfo.classInfo.features;
                } catch(e) { console.error(e); }
              }
              let selSub = null;
              if (showFullClassInfo.subclassId) {
                selSub = dbData.subclasses?.find(sc => sc.subclass_id === showFullClassInfo.subclassId);
              }
              let classSubclasses = deduplicateSubclasses(dbData.subclasses?.filter(sc => sc.class_id === showFullClassInfo.classInfo.class_id) || [], showFullClassInfo.subclassId);
              
              // Sort by level
              allFeatures.sort((a, b) => a.level - b.level);
              
              // Group by level
              const groupedFeatures = {};
              allFeatures.forEach(f => {
                if (!groupedFeatures[f.level]) groupedFeatures[f.level] = [];
                groupedFeatures[f.level].push(f);
              });

              // Build Progression Table
              let progressionData = [];
              if (showFullClassInfo.classInfo.level_progression) {
                try { 
                  progressionData = typeof showFullClassInfo.classInfo.level_progression === 'string' ? JSON.parse(showFullClassInfo.classInfo.level_progression) : showFullClassInfo.classInfo.level_progression; 
                } catch { /* ignore */ }
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Core Traits Section */}
                  {coreTraits && (
                    <div style={{ marginBottom: '10px', backgroundColor: 'var(--bg-white)', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px' }}>
                      <h4 style={{ margin: '0 0 15px 0', color: 'var(--color-ink)', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Becoming a {showFullClassInfo.classInfo.class_name}...</h4>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: '#711a19' }}>As a Level 1 Character</h5>
                        {coreTraits.level1?.text ? (
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                                {coreTraits.level1.text.map((item, idx) => (
                                    <li key={idx} dangerouslySetInnerHTML={{ __html: item }}></li>
                                ))}
                            </ul>
                        ) : (
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                              <li>Gain all the traits in the Core {showFullClassInfo.classInfo.class_name} Traits table.</li>
                              <li>Gain the {showFullClassInfo.classInfo.class_name}'s level 1 features.</li>
                            </ul>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: '#711a19' }}>As a Multiclass Character</h5>
                        {coreTraits.multiclass?.text ? (
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                                {coreTraits.multiclass.text.map((item, idx) => (
                                    <li key={idx} dangerouslySetInnerHTML={{ __html: item }}></li>
                                ))}
                            </ul>
                        ) : (
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                              <li><strong>Hit Point Max:</strong> You gain the Hit Points from the new class's Hit Point Die.</li>
                              <li><strong>Requirements:</strong> {coreTraits.multiclass?.requirements || 'None'}</li>
                              <li><strong>Proficiencies Gained:</strong> {coreTraits.multiclass?.proficiencies_gained?.join(', ') || 'None'}</li>
                            </ul>
                        )}
                      </div>

                      <h5 style={{ margin: '0 0 10px 0', color: 'var(--color-ink)', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>Core {showFullClassInfo.classInfo.class_name} Traits</h5>
                      <table style={{ width: '100%', fontSize: '0.9rem', color: 'var(--color-gray)', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold', width: '35%' }}>Primary Ability</td>
                            <td style={{ padding: '8px 0' }}>{coreTraits.primary_ability}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Hit Point Die</td>
                            <td style={{ padding: '8px 0' }}>{coreTraits.hit_point_die}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Saving Throw Proficiencies</td>
                            <td style={{ padding: '8px 0' }}>{coreTraits.saving_throws?.join(', ')}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Skill Proficiencies</td>
                            <td style={{ padding: '8px 0' }}>
                              {(() => {
                                if (!coreTraits.skills) return 'None';
                                if (Array.isArray(coreTraits.skills)) return coreTraits.skills.join(', ');
                                if (coreTraits.skills.choose && coreTraits.skills.options) return `Choose ${coreTraits.skills.choose} from: ${coreTraits.skills.options.join(', ')}`;
                                return 'None';
                              })()}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Weapon Proficiencies</td>
                            <td style={{ padding: '8px 0' }}>{coreTraits.weapon_proficiencies?.join(', ')}</td>
                          </tr>
                          {(coreTraits.tool_proficiencies || coreTraits.tools || showFullClassInfo.classInfo.class_id === 'monk' || showFullClassInfo.classInfo.class_name === 'Monk') && (
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Tool Proficiencies</td>
                            <td style={{ padding: '8px 0' }}>
                              {coreTraits.tool_proficiencies 
                                ? (Array.isArray(coreTraits.tool_proficiencies) ? coreTraits.tool_proficiencies.join(', ') : coreTraits.tool_proficiencies)
                                : ((showFullClassInfo.classInfo.class_id === 'monk' || showFullClassInfo.classInfo.class_name === 'Monk') 
                                    ? "Choose one type of Artisan's Tools or Musical Instrument (see Equipment)" 
                                    : (coreTraits.tools?.choose ? `Choose ${coreTraits.tools.choose}` : 'None'))}
                            </td>
                          </tr>
                          )}
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Armor Training</td>
                            <td style={{ padding: '8px 0' }}>{coreTraits.armor_training?.join(', ')}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Starting Equipment</td>
                            <td style={{ padding: '8px 0', fontStyle: 'italic', fontSize: '0.85rem' }}>{coreTraits.starting_equipment || 'See Equipment step'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h3 style={{ color: 'var(--color-ink)', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginTop: '10px', marginBottom: '0px' }}>{showFullClassInfo.classInfo.class_name} Features</h3>

                  {/* Level Progression Table */}
                  {progressionData.length > 0 && (
                    <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-white)', borderBottom: '2px solid #d1d5db', textAlign: 'left' }}>
                            <th rowSpan="2" style={{ padding: '8px', borderRight: '1px solid #e5e7eb', width: '50px' }}>Level</th>
                            <th rowSpan="2" style={{ padding: '8px', borderRight: '1px solid #e5e7eb', width: '80px', textAlign: 'center' }}>Prof. Bonus</th>
                            <th rowSpan="2" style={{ padding: '8px', borderRight: '1px solid #e5e7eb' }}>Class Features</th>
                            {/* Dynamic Class Specific Columns */}
                            {progressionData[0]?.class_specific && Object.keys(progressionData[0].class_specific).map(key => {
                              let headerText = key.replace(/_/g, ' ');
                              if (key.startsWith('spell_slots_')) {
                                const lvl = key.split('_')[2];
                                headerText = lvl + (lvl === '1' ? 'st' : lvl === '2' ? 'nd' : lvl === '3' ? 'rd' : 'th');
                              } else if (key === 'prepared_spells') {
                                headerText = 'Prepared Spells';
                              } else if (key === 'cantrips') {
                                headerText = 'Cantrips';
                              } else if (key === 'favored_enemy') {
                                headerText = 'Favored Enemy';
                              }
                              return <th key={key} rowSpan="2" style={{ padding: '8px', textTransform: 'capitalize', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{headerText}</th>;
                            })}
                            {/* Grouped Spell Slots Header */}
                            {progressionData[0]?.spell_slots && (
                              <th colSpan={progressionData[0].spell_slots.length} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>——Spell Slots per Spell Level——</th>
                            )}
                          </tr>
                          {progressionData[0]?.spell_slots && (
                          <tr style={{ backgroundColor: 'var(--bg-white)', borderBottom: '2px solid #d1d5db' }}>
                            {progressionData[0].spell_slots.map((_, idx) => (
                              <th key={`slot-header-${idx}`} style={{ padding: '4px', textAlign: 'center', borderRight: '1px solid #e5e7eb', fontSize: '0.85rem' }}>{idx + 1}</th>
                            ))}
                          </tr>
                          )}
                        </thead>
                        <tbody>
                          {progressionData.map((row, i) => {
                            const featsAtLevel = formatTableFeatureNames(showFullClassInfo.classInfo.class_id || showFullClassInfo.classInfo.class_name, row.level, groupedFeatures[row.level]);
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: i % 2 === 0 ? 'var(--bg-white)' : 'var(--bg-white)' }}>
                                <td style={{ padding: '8px', borderRight: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold' }}>{row.level}</td>
                                <td style={{ padding: '8px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>+{row.prof_bonus}</td>
                                <td style={{ padding: '8px', borderRight: '1px solid #e5e7eb', color: '#711a19', fontWeight: '500' }}>{featsAtLevel}</td>
                                {row.class_specific && Object.values(row.class_specific).map((val, idx) => (
                                  <td key={idx} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{val}</td>
                                ))}
                                {row.spell_slots && row.spell_slots.map((val, idx) => (
                                  <td key={`slot-val-${idx}`} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{val}</td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Detailed Feature Descriptions */}
                  {Array.from({length: 20}, (_, i) => i + 1).map(level => {
                    if (!groupedFeatures[level]) return null;
                    
                    const featsToDesc = groupedFeatures[level].filter(f => {
                        if ((f.name.includes('Subclass') || f.name.includes('Oath') || f.name.includes('Circle') || f.name.includes('College') || f.name.includes('Domain') || f.name.includes('Path')) && f.level > 3) return false;
                        if (f.name.includes('(two uses)') || f.name.includes('(three uses)')) return false;
                        if (f.name.includes('Mystic Arcanum') && f.level > 11) return false;
                        return true;
                    });
                    if (featsToDesc.length === 0) return null;
                    
                    return featsToDesc.map((f, i) => (
                      <div key={`feat-${level}-${i}`} style={{ backgroundColor: 'var(--bg-white)', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#711a19', fontSize: '1.1rem' }}>Level {level}</h4>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: 'bold' }}>{f.name.replace(' (one use)', '')}</h5>
                        {(() => {
                            let descHtml = cleanAndStyleHtml(f.name, f.display || f.description || f.desc || '');
                            return <div dangerouslySetInnerHTML={{ __html: descHtml }} style={{ color: 'var(--color-gray)', fontSize: '0.95rem', lineHeight: '1.6' }}></div>;
                        })()}
                        {f.collapsible_content && (
                          <div dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml(f.name, f.collapsible_content) }} style={{ color: 'var(--color-gray)', fontSize: '0.95rem', lineHeight: '1.6', marginTop: '10px' }}></div>
                        )}
                      </div>
                    ));
                  })}

                  {/* All Subclasses Features Section */}
                  {classSubclasses.length > 0 && (
                    <div style={{ marginTop: '30px', borderTop: '2px dashed #d1d5db', paddingTop: '20px' }}>
                      <h3 style={{ color: 'var(--color-ink)', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>
                        Subclasses
                      </h3>
                      {classSubclasses.map((sub, idx) => {
                        let subFeats = [];
                        if (sub.features) {
                          try {
                            subFeats = typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features;
                            subFeats.sort((a, b) => a.level - b.level);
                          } catch { /* ignore */ }
                        }
                        
                        const isSelected = selSub && selSub.subclass_id === sub.subclass_id;
                        
                        return (
                          <div key={sub.subclass_id} style={{ marginBottom: '25px', padding: '15px', backgroundColor: isSelected ? '#fdf4ff' : 'var(--bg-white)', borderRadius: '8px', border: isSelected ? '2px solid #d946ef' : '1px solid #e5e7eb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: isSelected ? '#a21caf' : 'var(--color-ink)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {sub.subclass_name} 
                              {isSelected && <span style={{ fontSize: '0.7rem', backgroundColor: '#d946ef', color: 'var(--bg-white)', padding: '2px 8px', borderRadius: '12px' }}>Selected</span>}
                            </h4>
                            <div dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml('', sub.subclass_desc || '') }} style={{ color: 'var(--color-gray)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '15px' }}></div>
                            
                            {subFeats.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {subFeats.map((f, i) => (
                                  <div key={`subfeat-${idx}-${i}`} style={{ backgroundColor: 'var(--bg-white)', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                    <h5 style={{ margin: '0 0 5px 0', color: 'var(--color-gray)', fontSize: '1rem' }}>Level {f.level}: {f.name}</h5>
                                    {(() => {
                                        let descHtml = cleanAndStyleHtml(f.name, f.display || f.description || f.desc || '');
                                        return <div dangerouslySetInnerHTML={{ __html: descHtml }} style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.85rem', lineHeight: '1.5' }}></div>;
                                    })()}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>No feature descriptions available.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Standalone Class Appendix Section */}
                  {renderClassAppendix(allFeatures)}

                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* Level Downgrade Confirm Modal */}
      {levelConfirm !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ backgroundColor: 'var(--bg-white)', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.3rem', fontWeight: 'bold' }}>ยืนยันการลดเลเวลคลาสอาชีพ?</h3>
            </div>
            
            <p style={{ color: 'var(--color-gray)', fontSize: '1rem', lineHeight: '1.5', marginBottom: '15px' }}>
              คุณกำลังลดเลเวลคลาสนี้จาก <strong style={{color: 'var(--color-ink)'}}>Lv.{levelConfirm.currentLevel}</strong> ลงมาเป็น <strong style={{color: 'var(--color-ink)'}}>Lv.{levelConfirm.newLevel}</strong>
            </p>
            <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '12px 15px', borderRadius: '0 8px 8px 0', marginBottom: '25px' }}>
              <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <strong>คำเตือน:</strong> การลดเลเวลจะทำการลบและรีเซ็ตความสามารถทั้งหมดที่ได้จากเลเวลที่สูงกว่าอย่างถาวร (เช่น การเลือก Subclass, การเพิ่มค่าพลัง ASI, และเวทมนตร์ระดับสูง)
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setLevelConfirm(null)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'var(--bg-white)', color: '#374151', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', fontSize: '0.95rem' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-white)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-white)'}
              >ยกเลิก</button>
              <button 
                onClick={() => {
                  setCharacterState(prev => {
                    const newClassList = [...prev.classData.classes];
                    newClassList[levelConfirm.index] = purgeOnLevelDowngrade(newClassList[levelConfirm.index], levelConfirm.newLevel);
                    return {...prev, classData: {...prev.classData, classes: newClassList}};
                  });
                  setLevelConfirm(null);
                }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: 'var(--bg-white)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Confirm Level Reduction
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
