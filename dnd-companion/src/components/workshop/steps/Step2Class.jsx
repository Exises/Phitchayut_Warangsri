import React, { useState } from 'react';
import WARLOCK_INVOCATIONS from '../../../data/warlock_invocations.json';
import {
  ALL_SKILLS_LIST,
  getFeatConfig,
  getEnhancedFeatDesc,
  getAllInnateAndFeatureSpells,
  deduplicateSubclasses,
  purgeOnLevelDowngrade,
  cleanAndStyleHtml,
  toggleMultiLevelFilter,
  matchesMultiLevel
} from '../../../utils/workshopHelpers';
import {
  CustomLevelSelect,
  CustomSelect,
  FeatChoiceEditor
} from '../WorkshopWidgets';

const CLASS_HIGHLIGHT_BADGES = {
  barbarian: ['🛡️ ถึกทานดาเมจ', '🔥 คลั่งวิญญาณ (Rage)'],
  bard: ['🎶 สายบัฟ & สกิล', '🔮 เวทมนตร์ดนตรี'],
  cleric: ['✨ ศักดิ์สิทธิ์ & ฮีล', '🛡️ เกราะหนัก & เวท'],
  druid: ['🌿 แปลงร่างเป็นสัตว์', '🍃 พลังธรรมชาติ'],
  fighter: ['⚔️ ชำนาญอาวุธ', '🛡️ สู้ได้ทุกระยะ'],
  monk: ['🥋 หมัดมวย & ความเร็ว', '💨 เคลื่อนที่พริ้ว'],
  paladin: ['⚔️ ศักดิ์สิทธิ์ & ฟันแรง', '🛡️ ออร่าป้องกัน'],
  ranger: ['🏹 แกะรอย & ธนู', '🌿 เวทมนตร์ป่า'],
  rogue: ['🗡️ โจมตีจุดตาย', '🗝️ ชำนาญสกิล'],
  sorcerer: ['🔮 พลังเวทกำเนิด', '⚡ Metamagic'],
  warlock: ['📜 พันธสัญญาปีศาจ', '💥 คาถา Eldritch'],
  wizard: ['📚 ตำราเวทคาถา', '🪄 เวทหลากหลาย']
};


// Helper Component for Truncating & Expanding Long Feature Descriptions
function ExpandableDesc({ htmlContent, maxLength = 260 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const plainText = (htmlContent || '').replace(/<[^>]+>/g, '');

  if (plainText.length <= maxLength) {
    return <div style={{ color: '#334155', lineHeight: '1.5', fontSize: '0.88rem' }} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  }

  return (
    <div style={{ color: '#334155', lineHeight: '1.5', fontSize: '0.88rem' }}>
      {!isExpanded ? (
        <div>
          <div style={{ maxHeight: '110px', overflow: 'hidden', position: 'relative' }}>
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, #fcfcfc)' }} />
          </div>
          <button 
            type="button"
            onClick={() => setIsExpanded(true)}
            style={{ border: 'none', background: 'none', color: '#711a19', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', marginTop: '4px', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <i className="fa-solid fa-chevron-down"></i> อ่านคำอธิบายเต็ม (Show More)
          </button>
        </div>
      ) : (
        <div>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          <button 
            type="button"
            onClick={() => setIsExpanded(false)}
            style={{ border: 'none', background: 'none', color: '#711a19', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', marginTop: '8px', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <i className="fa-solid fa-chevron-up"></i> ย่อคำอธิบาย (Show Less)
          </button>
        </div>
      )}
    </div>
  );
}

export default function Step2Class({
  characterState,
  setCharacterState,
  dbData,
  loading,
  setPreviewClassId,
  setShowFullClassInfo,
  showFeatDetails,
  setShowFeatDetails,
  setClassToDeleteIndex,
  setLevelConfirm,
  isSpellbookView,
  setIsSpellbookView,
  activeSpellClassTab,
  setActiveSpellClassTab,
  spellSearchTerm,
  setSpellSearchTerm,
  spellFilterLevel,
  setSpellFilterLevel,
  spellFilterSchool,
  setSpellFilterSchool,
  spellbookSearchTerm,
  setSpellbookSearchTerm,
  spellbookFilterLevels,
  setSpellbookFilterLevels,
  totalStats,
  spellSlotsCalculation,
  knownSpellsSourceMap,
  allKnownSpellIds,
  handleAddSpell,
  handleRemoveSpell,
  proficientSkills,
  expertiseSkills
}) {
        const [showBeginnerGuide, setShowBeginnerGuide] = useState(true);
        const [expandedSpells, setExpandedSpells] = useState({});
        const classList = characterState.classData?.classes || [];
        const _addClass = (classId) => {
          const classInfo = dbData.classes?.find(c => c.class_id === classId);
          if (!classInfo) return;
          const newClassList = [...classList, { classId, subclassId: null, level: 1, hitDie: parseInt(classInfo.hit_die) || 8, featureChoices: {} }];
          setCharacterState(prev => ({...prev, classData: {...prev.classData, classes: newClassList, primaryClassId: newClassList[0].classId}}));
        };
        const _removeClass = (index) => {
          const newClassList = classList.filter((_, i) => i !== index);
          setCharacterState(prev => ({...prev, classData: {...prev.classData, classes: newClassList, primaryClassId: newClassList[0]?.classId || null}}));
        };
        const updateClass = (index, field, value) => {
          const newClassList = [...classList];
          if (field === 'level' && value < newClassList[index].level) {
            newClassList[index] = purgeOnLevelDowngrade(newClassList[index], value);
          } else if (field.startsWith('featureChoices.')) {
            const featKey = field.replace('featureChoices.', '');
            newClassList[index] = {
              ...newClassList[index],
              featureChoices: {
                ...(newClassList[index].featureChoices || {}),
                [featKey]: value
              }
            };
          } else {
            newClassList[index][field] = value;
          }
          setCharacterState(prev => ({...prev, classData: {...prev.classData, classes: newClassList}}));
        };

        const handleLevelDropdownChange = (index, currentLevel, newLevel) => {
          if (newLevel > currentLevel) {
            updateClass(index, 'level', newLevel);
          } else if (newLevel < currentLevel) {
            setLevelConfirm({ index, currentLevel, newLevel });
          }
        };

        const handleFeatureChoice = (classIndex, featureKey, choiceIndex, value) => {
          setCharacterState(prev => {
            const newClassList = [...prev.classData.classes];
            const currentChoices = newClassList[classIndex].featureChoices || {};
            const featureArray = currentChoices[featureKey] ? [...currentChoices[featureKey]] : [];
            featureArray[choiceIndex] = value;
            
            newClassList[classIndex] = {
              ...newClassList[classIndex],
              featureChoices: {
                ...currentChoices,
                [featureKey]: featureArray
              }
            };
            
            return {
              ...prev,
              classData: {
                ...prev.classData,
                classes: newClassList
              }
            };
          });
        };

        const totalLevel = classList.reduce((sum, cl) => sum + cl.level, 0);
        const availableClassesForMulti = dbData.classes?.filter(c => !classList.some(cl => cl.classId === c.class_id)) || [];
        const hasSpellcaster = classList.some(cl => ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'].includes(cl.classId));

        return (
          <div className="builder-step-content animate-fade-in">
            {isSpellbookView ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 className="step-title" style={{ margin: 0 }}>Manage Spells (Spellbook)</h3>
                    <p className="step-subtitle" style={{ margin: '5px 0 0 0' }}>Select and prepare spells for your class and lineage.</p>
                  </div>
                  <button onClick={() => setIsSpellbookView(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'var(--bg-white)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-arrow-left"></i> Back to Class Progression
                  </button>
                </div>
                
                <div className="spellbook-container animate-fade-in">
                  {/* 1. Global Spell Slots Header */}
                  {(() => {
                    const { casterLevel, standardSlots: slots, warlockSlots } = spellSlotsCalculation;

                    if (casterLevel === 0 && !warlockSlots) return null;

                    return (
                      <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {casterLevel > 0 && (
                          <div style={{ flex: 1, minWidth: '300px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fa-solid fa-star"></i> Combined Spell Slots
                            </h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {slots.map((count, index) => (
                                <div key={`slot-${index}`} style={{ backgroundColor: 'var(--bg-white)', padding: '5px 12px', borderRadius: '4px', border: '1px solid #fde68a', fontSize: '0.9rem' }}>
                                  Level {index + 1}: <strong style={{ color: '#b45309' }}>{count}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Pact Magic (Warlock) Separation */}
                        {warlockSlots && (
                          <div style={{ flex: 1, minWidth: '300px', borderLeft: casterLevel > 0 ? '2px dashed #fcd34d' : 'none', paddingLeft: casterLevel > 0 ? '20px' : '0' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fa-solid fa-moon"></i> Pact Magic Slots (Warlock)
                            </h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              <div style={{ backgroundColor: 'var(--bg-white)', padding: '5px 12px', borderRadius: '4px', border: '1px solid #c4b5fd', fontSize: '0.9rem' }}>
                                Level <span style={{ color: '#6d28d9', fontWeight: 'bold' }}>{warlockSlots.level}</span>: <strong style={{ color: '#6d28d9' }}>{warlockSlots.count}</strong>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)', alignSelf: 'center' }}>(Recharges on Short Rest)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 2. Innate Spells Section */}
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-leaf"></i> Innate & Feature Spells (Always Prepared)
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#15803d' }}>Spells from Lineage or Feats (cast once without a spell slot, doesn't count against class spells prepared)</p>
                    
                    {(() => {
                      const harvestedSpells = getAllInnateAndFeatureSpells(characterState, dbData);
                      
                      return (
                        <>
                          {harvestedSpells.length > 0 ? (
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {harvestedSpells.map((spItem, idx) => {
                                const spellId = spItem.id || spItem.name;
                                const spell = dbData.spells?.find(s => String(s.spell_id) === String(spellId) || String(s.spell_name)?.toLowerCase() === String(spItem.name)?.toLowerCase());
                                const spellName = spell ? spell.spell_name : spItem.name;
                                const spellLevel = spell ? spell.spell_level : spItem.level;
                                return (
                                  <div key={`innate-${spellId}-${idx}`} style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #86efac', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <strong style={{ color: '#166534', fontSize: '0.9rem' }}>{spellName}</strong>
                                    <span style={{ fontSize: '0.75rem', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                                      {String(spellLevel) === '0' ? 'Cantrip' : `Lv. ${spellLevel}`}
                                    </span>
                                    {spItem.source && (
                                      <span style={{ fontSize: '0.7rem', color: '#166534', fontStyle: 'italic' }}>({spItem.source})</span>
                                    )}
                                    {spItem.hasFreeCast && (
                                      <span style={{ fontSize: '0.65rem', backgroundColor: '#bbf7d0', color: '#14532d', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>1/LR Free</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', fontStyle: 'italic', opacity: 0.8 }}>No innate spells or spell features selected yet.</p>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* 3. Class Tabs */}
                  {(() => {
                    const spellcasterClasses = classList.filter(cl => ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'].includes(cl.classId));
                    const activeSpellTab = activeSpellClassTab || spellcasterClasses[0]?.classId;

                    return (
                      <>
                        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px', overflowX: 'auto', paddingBottom: '1px' }}>
                          {spellcasterClasses.map(cl => {
                            const cInfo = dbData.classes?.find(c => c.class_id === cl.classId);
                            const isActive = activeSpellTab === cl.classId;
                            return (
                              <button 
                                key={cl.classId}
                                onClick={() => setActiveSpellClassTab(cl.classId)}
                                style={{ 
                                  padding: '10px 20px', 
                                  backgroundColor: 'transparent', 
                                  border: 'none', 
                                  borderBottom: isActive ? '3px solid #711a19' : '3px solid transparent', 
                                  color: isActive ? '#711a19' : 'var(--color-gray)', 
                                  fontWeight: isActive ? 'bold' : 'normal', 
                                  cursor: 'pointer', 
                                  fontSize: '1rem',
                                  marginBottom: '-2px',
                                  whiteSpace: 'nowrap',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {cInfo?.class_name || cl.classId} Spells
                              </button>
                            );
                          })}
                        </div>

                        {/* 4. Dynamic Work Area */}
                        {activeSpellTab && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            {(() => {
                              const isWizard = activeSpellTab === 'wizard';
                              const isKnown = ['bard', 'sorcerer', 'ranger', 'warlock'].includes(activeSpellTab);
                              
                              const activeClassInfo = dbData.classes?.find(c => c.class_id === activeSpellTab);
                              let classSpellIds = [];
                              try {
                                if (activeClassInfo?.spell_list) {
                                  classSpellIds = JSON.parse(activeClassInfo.spell_list);
                                }
                              } catch { /* ignore */ }
                              
                              const allAvailableSpells = dbData.spells?.filter(s => classSpellIds.includes(s.spell_id)) || [];
                              const activeSpellState = characterState.spells?.classes?.[activeSpellTab] || { cantrips: [], spellbook: [], prepared: [] };

                              // Calculate Limits
                              const activeClassLevel = classList.find(c => c.classId === activeSpellTab)?.level || 1;
                              let classProgression = [];
                              try {
                                if (activeClassInfo?.level_progression) {
                                  classProgression = JSON.parse(activeClassInfo.level_progression);
                                }
                              } catch { /* ignore */ }
                              const currentProgression = classProgression.find(p => p.level === activeClassLevel)?.class_specific || {};
                              const maxCantrips = currentProgression.cantrips || '-';
                              const maxPrepared = currentProgression.prepared_spells || '-';

                              // Calculate Max Spell Level
                              let maxSpellLevel = 0;
                              if (activeSpellTab === 'warlock') {
                                if (currentProgression.slot_level) maxSpellLevel = parseInt(currentProgression.slot_level, 10);
                                if (activeClassLevel >= 11) maxSpellLevel = Math.max(maxSpellLevel, 6);
                                if (activeClassLevel >= 13) maxSpellLevel = Math.max(maxSpellLevel, 7);
                                if (activeClassLevel >= 15) maxSpellLevel = Math.max(maxSpellLevel, 8);
                                if (activeClassLevel >= 17) maxSpellLevel = Math.max(maxSpellLevel, 9);
                              } else {
                                for (let i = 1; i <= 9; i++) {
                                  if (currentProgression[`spell_slots_${i}`] && currentProgression[`spell_slots_${i}`] !== '-') {
                                    maxSpellLevel = i;
                                  }
                                }
                              }

                              const filteredSpells = allAvailableSpells.filter(spell => {
                                const spellLevel = parseInt(spell.spell_level, 10) || 0;
                                if (spellLevel > maxSpellLevel && spellLevel !== 0) return false;
                                
                                const matchSearch = spellSearchTerm === '' || spell.spell_name.toLowerCase().includes(spellSearchTerm.toLowerCase());
                                const matchLevel = matchesMultiLevel(spell.spell_level, spellFilterLevel);
                                const matchSchool = spellFilterSchool === 'all' || spell.school === spellFilterSchool;
                                return matchSearch && matchLevel && matchSchool;
                              }).sort((a, b) => {
                                  const lvlA = parseInt(a.spell_level, 10) || 0;
                                  const lvlB = parseInt(b.spell_level, 10) || 0;
                                  if (lvlA !== lvlB) return lvlA - lvlB;
                                  return a.spell_name.localeCompare(b.spell_name);
                              });

                              return (
                                <>
                                  {/* Column 1: Full Class List */}
                                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'var(--bg-white)', display: 'flex', flexDirection: 'column', height: '600px' }}>
                                    <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', backgroundColor: 'var(--bg-white)', borderRadius: '8px 8px 0 0' }}>
                                      <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-list"></i> Full Spell List ({filteredSpells.length})
                                      </h4>
                                      
                                      {/* Search and Filters */}
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <input 
                                            type="text" 
                                            placeholder="Search spells by name..." 
                                            value={spellSearchTerm}
                                            onChange={(e) => setSpellSearchTerm(e.target.value)}
                                            style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                          />
                                          <CustomSelect 
                                            value={spellFilterSchool}
                                            onChange={(e) => setSpellFilterSchool(e.target.value)}
                                            style={{ width: '135px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                          >
                                            <option value="all">All Schools</option>
                                            <option value="Abjuration">Abjuration</option>
                                            <option value="Conjuration">Conjuration</option>
                                            <option value="Divination">Divination</option>
                                            <option value="Enchantment">Enchantment</option>
                                            <option value="Evocation">Evocation</option>
                                            <option value="Illusion">Illusion</option>
                                            <option value="Necromancy">Necromancy</option>
                                            <option value="Transmutation">Transmutation</option>
                                          </CustomSelect>
                                        </div>
                                        {/* Multi-select Level Pills */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                          {[
                                            { label: 'ALL', val: 'all' },
                                            { label: 'CANTRIP', val: 'cantrip' },
                                            ...Array.from({ length: maxSpellLevel }).map((_, i) => ({ label: `LVL ${i+1}`, val: String(i+1) }))
                                          ].map(btn => {
                                            const isSel = (spellFilterLevel || ['all']).includes(btn.val);
                                            return (
                                              <button
                                                key={btn.val}
                                                type="button"
                                                onClick={() => setSpellFilterLevel(prev => toggleMultiLevelFilter(prev, btn.val))}
                                                style={{
                                                  padding: '2px 7px',
                                                  borderRadius: '10px',
                                                  border: '1px solid',
                                                  borderColor: isSel ? '#1d4ed8' : 'var(--border-color)',
                                                  backgroundColor: isSel ? '#1d4ed8' : 'var(--bg-white)',
                                                  color: isSel ? 'var(--bg-white)' : 'var(--color-gray)',
                                                  fontSize: '0.65rem',
                                                  fontWeight: 'bold',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                {btn.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Spell List Content Area */}
                                    <div style={{ padding: '15px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-white)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {filteredSpells.length > 0 ? (
                                        filteredSpells.map(spell => {
                                          const isCantrip = String(spell.spell_level) === '0';
                                          const isAdded = isCantrip 
                                            ? activeSpellState.cantrips?.includes(spell.spell_id)
                                            : (isWizard ? activeSpellState.spellbook?.includes(spell.spell_id) : activeSpellState.prepared?.includes(spell.spell_id));
                                          
                                          const isKnownFromFeatOrOther = !isAdded && allKnownSpellIds.includes(String(spell.spell_id).toLowerCase());
                                          const isAlreadySelected = isAdded || isKnownFromFeatOrOther;
                                          const knownSourceLabel = isKnownFromFeatOrOther ? (knownSpellsSourceMap.get(String(spell.spell_id).toLowerCase()) || 'Known (Other)') : null;

                                          // Check Limits
                                          const isLimitReached = isCantrip 
                                            ? (maxCantrips !== '-' && (activeSpellState.cantrips?.length || 0) >= maxCantrips)
                                            : (!isWizard && maxPrepared !== '-' && (activeSpellState.prepared?.length || 0) >= maxPrepared);

                                          const isDisabled = isKnownFromFeatOrOther || (!isAdded && !isWizard && isLimitReached);

                                          return (
                                            <div key={spell.spell_id} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', flexDirection: 'column', backgroundColor: isAlreadySelected ? 'var(--bg-white)' : 'var(--bg-white)' }}>
                                              <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <button onClick={() => setExpandedSpells(prev => ({ ...prev, [spell.spell_id]: !prev[spell.spell_id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--color-ink)' }}>
                                                      <i className={`fa-solid fa-chevron-${expandedSpells[spell.spell_id] ? 'up' : 'down'}`}></i>
                                                    </button>
                                                    <strong style={{ display: 'block', color: 'var(--color-ink)' }}>{spell.spell_name}</strong>
                                                    {isKnownFromFeatOrOther && (
                                                      <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{knownSourceLabel}</span>
                                                    )}
                                                  </div>
                                                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)', marginLeft: '16px' }}>{isCantrip ? 'Cantrip' : `Level ${spell.spell_level}`} • {spell.school}</span>
                                                </div>
                                              <button 
                                                onClick={() => isAdded ? handleRemoveSpell(activeSpellTab, isCantrip ? 'cantrips' : (isWizard ? 'spellbook' : 'prepared'), spell.spell_id) : (!isDisabled && handleAddSpell(activeSpellTab, isWizard ? 'spellbook' : 'prepared', spell))}
                                                disabled={isDisabled}
                                                style={{ 
                                                  background: isAdded ? '#1e40af' : (isKnownFromFeatOrOther ? 'var(--bg-white)' : (isLimitReached ? '#fef3c7' : '#fee2e2')), 
                                                  border: `1px solid ${isAdded ? '#1d4ed8' : (isKnownFromFeatOrOther ? 'var(--border-color)' : (isLimitReached ? '#fcd34d' : '#f87171'))}`, 
                                                  color: isAdded ? 'var(--bg-white)' : (isKnownFromFeatOrOther ? '#9ca3af' : (isLimitReached ? '#d97706' : '#b91c1c')),
                                                  borderRadius: '4px', 
                                                  padding: '4px 8px', 
                                                  cursor: isDisabled ? 'not-allowed' : 'pointer', 
                                                  fontSize: '0.85rem',
                                                  transition: 'all 0.15s'
                                                }}
                                                title={isAdded ? 'Click to Remove/Unprepare' : (isKnownFromFeatOrOther ? `Already Known from ${knownSourceLabel || 'Source'}` : (isLimitReached ? 'Limit Reached' : (isWizard ? 'Add to Spellbook' : (isKnown ? 'Learn Spell' : 'Prepare Spell'))))}
                                              >
                                                <i className={`fa-solid ${isAdded ? 'fa-check' : (isKnownFromFeatOrOther ? 'fa-check' : (isLimitReached ? 'fa-ban' : 'fa-plus'))}`}></i> {isAdded ? (isWizard ? 'In Spellbook (Remove)' : 'Added (Toggle)') : (isKnownFromFeatOrOther ? `Known (${(knownSourceLabel || 'Source').split(' ')[0]})` : (isLimitReached ? 'Limit' : (isWizard ? 'Add to Spellbook' : (isKnown ? 'Learn' : 'Prepare'))))}
                                              </button>
                                            </div>
                                              {expandedSpells[spell.spell_id] && spell?.spell_desc && (
                                                <div style={{ padding: '8px 10px 8px 26px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                              )}
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                                          No spells found.
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Column 2: Spellbook (Wizard Only) */}
                                  {isWizard && (() => {
                                    const filteredSpellbook = (activeSpellState.spellbook || []).filter(spellId => {
                                      const spell = dbData.spells?.find(s => s.spell_id === spellId);
                                      if (!spell) return false;
                                      const matchSearch = !spellbookSearchTerm || spell.spell_name.toLowerCase().includes(spellbookSearchTerm.toLowerCase());
                                      const matchLevel = matchesMultiLevel(spell.spell_level, spellbookFilterLevels);
                                      return matchSearch && matchLevel;
                                    }).sort((aId, bId) => {
                                      const sA = dbData.spells?.find(s => s.spell_id === aId);
                                      const sB = dbData.spells?.find(s => s.spell_id === bId);
                                      const lvlA = parseInt(sA?.spell_level || 0, 10);
                                      const lvlB = parseInt(sB?.spell_level || 0, 10);
                                      if (lvlA !== lvlB) return lvlA - lvlB;
                                      return (sA?.spell_name || '').localeCompare(sB?.spell_name || '');
                                    });

                                    return (
                                      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'var(--bg-white)', display: 'flex', flexDirection: 'column', height: '600px' }}>
                                        <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', backgroundColor: 'var(--bg-white)', borderRadius: '8px 8px 0 0' }}>
                                          <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="fa-solid fa-book-open"></i> Your Spellbook ({activeSpellState.spellbook?.length || 0})
                                          </h4>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <input
                                              type="text"
                                              placeholder="Search in spellbook..."
                                              value={spellbookSearchTerm}
                                              onChange={(e) => setSpellbookSearchTerm(e.target.value)}
                                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                              {[
                                                { label: 'ALL', val: 'all' },
                                                ...Array.from({ length: maxSpellLevel || 9 }).map((_, i) => ({ label: `LVL ${i+1}`, val: String(i+1) }))
                                              ].map(btn => {
                                                const isSel = (spellbookFilterLevels || ['all']).includes(btn.val);
                                                return (
                                                  <button
                                                    key={btn.val}
                                                    type="button"
                                                    onClick={() => setSpellbookFilterLevels(prev => toggleMultiLevelFilter(prev, btn.val))}
                                                    style={{
                                                      padding: '2px 7px',
                                                      borderRadius: '10px',
                                                      border: '1px solid',
                                                      borderColor: isSel ? '#1d4ed8' : 'var(--border-color)',
                                                      backgroundColor: isSel ? '#1d4ed8' : 'var(--bg-white)',
                                                      color: isSel ? 'var(--bg-white)' : 'var(--color-gray)',
                                                      fontSize: '0.65rem',
                                                      fontWeight: 'bold',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    {btn.label}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{ padding: '15px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                          {filteredSpellbook.length > 0 ? (
                                            filteredSpellbook.map(spellId => {
                                              const spell = dbData.spells?.find(s => s.spell_id === spellId);
                                              if (!spell) return null;
                                              const isPrepared = activeSpellState.prepared?.includes(spellId);
                                              const preparedLimitReached = maxPrepared !== '-' && (activeSpellState.prepared?.length || 0) >= maxPrepared;
                                              const isPrepareDisabled = !isPrepared && preparedLimitReached;
                                              return (
                                                <div key={`sb-${spellId}`} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isPrepared ? '#f0fdf4' : 'var(--bg-white)' }}>
                                                  <div>
                                                    <strong style={{ display: 'block', color: 'var(--color-ink)' }}>{spell.spell_name}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>Level {spell.spell_level} • {spell.school}</span>
                                                  </div>
                                                  <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button 
                                                      onClick={() => isPrepared ? handleRemoveSpell(activeSpellTab, 'prepared', spellId) : (!isPrepareDisabled && handleAddSpell(activeSpellTab, 'prepared', spell))}
                                                      disabled={isPrepareDisabled}
                                                      style={{ background: isPrepared ? '#166534' : (preparedLimitReached ? '#fef3c7' : 'var(--bg-white)'), border: `1px solid ${isPrepared ? '#15803d' : (preparedLimitReached ? '#fcd34d' : 'var(--border-color)')}`, color: isPrepared ? 'var(--bg-white)' : (preparedLimitReached ? '#d97706' : '#374151'), borderRadius: '4px', padding: '4px 8px', cursor: isPrepareDisabled ? 'not-allowed' : 'pointer', fontSize: '0.85rem', transition: 'all 0.15s' }}
                                                      title={isPrepared ? 'Click to Unprepare Spell' : (preparedLimitReached ? 'Prepare Limit Reached' : 'Prepare Spell')}
                                                    >
                                                      <i className={`fa-solid ${isPrepared ? 'fa-check' : (preparedLimitReached ? 'fa-ban' : 'fa-hand-sparkles')}`}></i> {isPrepared ? 'Prepared (Toggle)' : (preparedLimitReached ? 'Limit Reached' : 'Prepare')}
                                                    </button>
                                                    <button 
                                                      onClick={() => handleRemoveSpell(activeSpellTab, 'spellbook', spellId)}
                                                      style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                      title="Remove from Spellbook"
                                                    >
                                                      <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                                              No matching spells in your spellbook.
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Column 3: Prepared / Known Spells */}
                                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'var(--bg-white)', display: 'flex', flexDirection: 'column', height: '600px' }}>
                                    <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', backgroundColor: 'var(--bg-white)', borderRadius: '8px 8px 0 0' }}>
                                      <h4 style={{ margin: 0, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-hand-sparkles"></i> {isKnown ? 'Known Spells' : 'Prepared Spells'}
                                      </h4>
                                    </div>
                                    <div style={{ padding: '15px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {/* Cantrips Section (Always separate) */}
                                      <div style={{ marginBottom: '10px' }}>
                                        <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-gray)', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                          <span>Cantrips (Level 0)</span>
                                          <span style={{ color: activeSpellState.cantrips?.length > (maxCantrips === '-' ? 99 : maxCantrips) ? '#ef4444' : 'var(--color-gray)' }}>
                                            {activeSpellState.cantrips?.length || 0} / {maxCantrips}
                                          </span>
                                        </h5>
                                        {activeSpellState.cantrips?.length > 0 ? (
                                          activeSpellState.cantrips.map(spellId => {
                                            const spell = dbData.spells?.find(s => s.spell_id === spellId);
                                            if (!spell) return null;
                                            return (
                                              <div key={`prep-${spellId}`} style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', backgroundColor: 'var(--bg-white)' }}>
                                                <div>
                                                  <strong style={{ display: 'block', color: 'var(--color-ink)', fontSize: '0.9rem' }}>{spell.spell_name}</strong>
                                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{spell.school}</span>
                                                </div>
                                                <button 
                                                  onClick={() => handleRemoveSpell(activeSpellTab, 'cantrips', spellId)}
                                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                                  title="Remove Cantrip"
                                                >
                                                  <i className="fa-solid fa-xmark"></i>
                                                </button>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>No cantrips selected.</p>
                                        )}
                                      </div>

                                      {/* Leveled Spells Section */}
                                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-gray)', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Leveled Spells</span>
                                        <span style={{ color: activeSpellState.prepared?.length > (maxPrepared === '-' ? 99 : maxPrepared) ? '#ef4444' : 'var(--color-gray)' }}>
                                          {activeSpellState.prepared?.length || 0} / {maxPrepared}
                                        </span>
                                      </h5>
                                      {activeSpellState.prepared?.length > 0 ? (
                                        activeSpellState.prepared.map(spellId => {
                                          const spell = dbData.spells?.find(s => s.spell_id === spellId);
                                          if (!spell) return null;
                                          return (
                                            <div key={`prep-${spellId}`} style={{ border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', backgroundColor: '#f0fdf4' }}>
                                              <div>
                                                <strong style={{ display: 'block', color: '#166534' }}>{spell.spell_name}</strong>
                                                <span style={{ fontSize: '0.8rem', color: '#15803d' }}>Level {spell.spell_level} • {spell.school}</span>
                                              </div>
                                              <button 
                                                onClick={() => handleRemoveSpell(activeSpellTab, 'prepared', spellId)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                                title="Unprepare Spell"
                                              >
                                                <i className="fa-solid fa-xmark"></i>
                                              </button>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>
                                          No spells prepared yet.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="step-title" style={{ margin: 0 }}>Choose Class & Multiclassing</h3>
                    <p className="step-subtitle" style={{ margin: '5px 0 10px 0' }}>Your primary class defines your core progression. You can add additional classes for multiclassing.</p>

                    {/* 💡 Beginner Guide Banner for Step 2 (Only visible BEFORE selecting a class) */}
                    {classList.length === 0 && (
                      <div style={{ backgroundColor: '#fef8f8', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '15px' }}>
                      <div 
                        onClick={() => setShowBeginnerGuide(!showBeginnerGuide)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#711a19', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fa-solid fa-compass-drafting" style={{ color: '#711a19' }}></i>
                          คำแนะนำสำหรับผู้เล่นใหม่: คลาสอาชีพ (Class) คืออะไร?
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#711a19', fontWeight: 'bold' }}>
                          {showBeginnerGuide ? 'ซ่อนคู่มือ ▲' : 'แสดงคู่มือ ▼'}
                        </span>
                      </div>
                      {showBeginnerGuide && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #fca5a5', fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.6' }}>
                          • <strong>คลาสอาชีพคืออะไร?:</strong> คืออาชีพและการต่อสู้ (เช่น Fighter, Wizard, Rogue) กำหนดความถึก (HP/Hit Die), อาวุธ/เกราะที่ใช้ได้ และเวทมนตร์<br />
                          • <strong>Primary Ability (สเตตัสหลัก):</strong> ค่าพลังสำคัญของคลาสนั้นๆ เช่น Fighter เน้น STR/DEX, Wizard เน้น INT, Cleric เน้น WIS, Sorcerer เน้น CHA<br />
                          • <strong>วิธีใช้งาน:</strong> คลิกการ์ดคลาสเพื่อดูรายละเอียด จากนั้นกด <em>"Select This Class"</em> หากต้องการผสมมากกว่า 1 คลาส สามารถกดปุ่ม <em>"+ Add Class"</em> ได้
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                  {hasSpellcaster && (
                    <button 
                      onClick={() => setIsSpellbookView(true)} 
                      style={{ 
                        backgroundColor: 'var(--bg-white)', 
                        color: '#711a19', 
                        border: '1px solid #711a19', 
                        padding: '8px 16px', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        fontWeight: '600', 
                        fontSize: '0.95rem',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#711a19'; e.currentTarget.style.color = 'var(--bg-white)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-white)'; e.currentTarget.style.color = '#711a19'; }}
                    >
                      <i className="fa-solid fa-book-sparkles"></i> Manage Spells
                    </button>
                  )}
                </div>
            
            {loading || !dbData.classes?.length ? (
              <div className="placeholder-content"><i className="fa-solid fa-circle-notch fa-spin"></i><p>Loading...</p></div>
            ) : classList.length === 0 ? (
              <div className="grid-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {dbData.classes?.map(c => (
                  <div 
                    key={c.class_id} 
                    className="selection-card" 
                    onClick={() => setPreviewClassId(c.class_id)} 
                    style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-white)', transition: 'all 0.2s' }}
                  >
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: 'bold' }}>{c.class_name}</h4>
                    
                    {/* Primary Ability & Hit Die Icon Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-bolt" style={{ color: '#711a19' }}></i> {c.primary_ability || 'Any'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-dice-d20" style={{ color: '#711a19' }}></i> d{c.hit_die || 8}
                      </span>
                    </div>

                    {/* Dynamic Role Highlight Badges (Supports DB Custom Classes & Admin Tags) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(() => {
                        let badges = null;
                        if (c.highlights) {
                          try { badges = Array.isArray(c.highlights) ? c.highlights : JSON.parse(c.highlights); } catch { badges = [c.highlights]; }
                        } else if (c.tags) {
                          badges = typeof c.tags === 'string' ? c.tags.split(',').map(s=>s.trim()) : c.tags;
                        }
                        if (!badges || !Array.isArray(badges) || badges.length === 0) {
                          badges = CLASS_HIGHLIGHT_BADGES[c.class_id?.toLowerCase()] || ['• Custom Class', '⚔️ Adventurer'];
                        }
                        return badges.map((badgeText, bIdx) => (
                          <span key={bIdx} style={{ fontSize: '0.7rem', fontWeight: '600', backgroundColor: '#fef8f8', color: '#711a19', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px' }}>
                            {badgeText}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="selected-classes-container">
                {classList.map((cl, index) => {
                  const classInfo = dbData.classes?.find(c => c.class_id === cl.classId);
                  if (!classInfo) return null;
                  const subclasses = deduplicateSubclasses(dbData.subclasses?.filter(sc => sc.class_id === cl.classId) || [], cl.subclassId);
                  return (
                    <div key={cl.classId} className="class-row animate-slide-down" style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '15px', backgroundColor: index === 0 ? '#fef2f2' : 'var(--bg-white)', position: 'relative' }}>
                      
                      {/* Level Control and Header */}
                      <div className="class-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {classInfo?.class_name}
                            {index === 0 && <span style={{ fontSize: '0.7rem', backgroundColor: '#711a19', color: 'var(--bg-white)', padding: '2px 8px', borderRadius: '12px' }}>Primary Class</span>}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-gray)' }}>Primary Ability: {classInfo?.primary_ability || 'Any'} | Hit Die: d{classInfo?.hit_die || 8}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div className="level-control" style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-white)', padding: '5px 10px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontWeight: '600' }}>Level</span>
                            <CustomLevelSelect 
                              value={cl.level}
                              maxLevel={Math.min(20, 20 - totalLevel + cl.level)}
                              onChange={(newLevel) => handleLevelDropdownChange(index, cl.level, newLevel)}
                            />
                          </div>
                          {index === 0 ? (
                            <button 
                              onClick={() => setClassToDeleteIndex(index)} 
                              style={{ padding: '8px 16px', border: '1px solid #ef4444', backgroundColor: 'var(--bg-white)', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                            >
                              <i className="fa-solid fa-rotate"></i> Change Class
                            </button>
                          ) : (
                            <button onClick={() => setClassToDeleteIndex(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          )}
                        </div>
                      </div>


                      {/* Subclass Selection (Only >= 3) */}
                      {cl.level >= 3 && subclasses.length > 0 && (
                        <div className="subclass-select" style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gray)', marginBottom: '5px' }}><i className="fa-solid fa-code-branch"></i> Subclass (Specialization at Level 3)</label>
                          <CustomSelect 
                            value={cl.subclassId || ''} 
                            onChange={(e) => updateClass(index, 'subclassId', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                          >
                            <option value="">-- Choose Subclass --</option>
                            {subclasses.map(sc => (
                              <option key={sc.subclass_id} value={sc.subclass_id}>{sc.subclass_name}</option>
                            ))}
                          </CustomSelect>
                        </div>
                      )}

                      {/* Core Traits Section */}
                      {(() => {
                        let coreTraits = null;
                        if (classInfo.core_traits) {
                          try { coreTraits = typeof classInfo.core_traits === 'string' ? JSON.parse(classInfo.core_traits) : classInfo.core_traits; } catch { /* ignore */ }
                        }
                        if (!coreTraits) return null;

                        // Inject missing tools for Bard if not present in DB
                        if (classInfo.class_id === 'bard' && !coreTraits.tools) {
                            coreTraits.tools = {
                                choose: 3,
                                options: ['Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Lute', 'Lyre', 'Horn', 'Pan Flute', 'Shawm', 'Viol']
                            };
                        }

                        // Inject missing tools for Monk if not present in DB
                        if ((classInfo.class_id === 'monk' || classInfo.class_name === 'Monk') && !coreTraits.tools) {
                            coreTraits.tools = {
                                choose: 1,
                                options: [
                                    "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies", "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools",
                                    "Bagpipes", "Drum", "Dulcimer", "Flute", "Lute", "Lyre", "Horn", "Pan Flute", "Shawm", "Viol"
                                ]
                            };
                        }

                        return (
                          <div style={{ marginBottom: '25px', backgroundColor: 'var(--bg-white)', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px' }}>
                            <h4 style={{ margin: '0 0 15px 0', color: 'var(--color-ink)', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>Becoming a {classInfo.class_name}...</h4>
                            
                            <div style={{ marginBottom: '15px' }}>
                              <h5 style={{ margin: '0 0 8px 0', color: '#711a19' }}>As a Level 1 Character</h5>
                              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                                <li>Gain all the traits in the Core {classInfo.class_name} Traits table.</li>
                                <li>Gain the {classInfo.class_name}'s level 1 features.</li>
                              </ul>
                            </div>
                            
                            <div style={{ marginBottom: '15px' }}>
                              <h5 style={{ margin: '0 0 8px 0', color: '#711a19' }}>As a Multiclass Character</h5>
                              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                                <li><strong>Hit Point Max:</strong> You gain the Hit Points from the new class's Hit Point Die.</li>
                                <li><strong>Requirements:</strong> {coreTraits.multiclass?.requirements || 'None'}</li>
                                <li><strong>Proficiencies Gained:</strong> {coreTraits.multiclass?.proficiencies_gained?.join(', ') || 'None'}</li>
                              </ul>
                            </div>

                            <h5 style={{ margin: '0 0 10px 0', color: 'var(--color-ink)', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>Core {classInfo.class_name} Traits</h5>
                            <table style={{ width: '100%', fontSize: '0.9rem', color: 'var(--color-gray)', borderCollapse: 'collapse', marginBottom: '15px' }}>
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
                                  <td style={{ padding: '8px 0' }}>{Array.isArray(coreTraits.saving_throws) ? coreTraits.saving_throws.join(', ') : coreTraits.saving_throws}</td>
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
                                  <td style={{ padding: '8px 0' }}>{Array.isArray(coreTraits.weapon_proficiencies) ? coreTraits.weapon_proficiencies.join(', ') : coreTraits.weapon_proficiencies}</td>
                                </tr>
                                 {(coreTraits.tool_proficiencies || coreTraits.tools || classInfo.class_id === 'monk' || classInfo.class_name === 'Monk') && (
                                 <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                   <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Tool Proficiencies</td>
                                   <td style={{ padding: '8px 0' }}>
                                     {coreTraits.tool_proficiencies 
                                       ? (Array.isArray(coreTraits.tool_proficiencies) ? coreTraits.tool_proficiencies.join(', ') : coreTraits.tool_proficiencies)
                                       : ((classInfo.class_id === 'monk' || classInfo.class_name === 'Monk') 
                                           ? "Choose one type of Artisan's Tools or Musical Instrument (see Equipment)" 
                                           : (coreTraits.tools?.choose ? `Choose ${coreTraits.tools.choose}` : 'None'))}
                                   </td>
                                 </tr>
                                 )}
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Armor Training</td>
                                  <td style={{ padding: '8px 0' }}>{Array.isArray(coreTraits.armor_training) ? coreTraits.armor_training.join(', ') : coreTraits.armor_training}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Starting Equipment</td>
                                  <td style={{ padding: '8px 0', fontStyle: 'italic', fontSize: '0.85rem' }}>{coreTraits.starting_equipment || 'See Equipment step'}</td>
                                </tr>
                              </tbody>
                            </table>

                            {/* Class Skill Choices */}
                            {coreTraits.skills && coreTraits.skills.choose > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                <h6 style={{ margin: '0 0 5px 0', color: 'var(--color-ink)', fontSize: '0.9rem' }}>Skill Proficiencies (Choose {coreTraits.skills.choose})</h6>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {Array.from({ length: coreTraits.skills.choose }).map((_, skillIdx) => {
                                     const selectedValue = cl.featureChoices?.['ClassSkills']?.[skillIdx] || '';
                                     return (
                                       <CustomSelect 
                                         key={skillIdx}
                                         value={selectedValue}
                                         onChange={(e) => handleFeatureChoice(index, 'ClassSkills', skillIdx, e.target.value)}
                                         style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                       >
                                         <option value="">-- Choose Skill #{skillIdx + 1} --</option>
                                         {(() => {
                                            const isProf = (opt) => proficientSkills.some(p => String(p).trim().toLowerCase() === String(opt).trim().toLowerCase());
                                            const selectedClassSkills = (cl.featureChoices?.['ClassSkills'] || []);
                                            let optionsToShow = coreTraits.skills.options;
                                            let availableOptions = optionsToShow.filter(opt => {
                                              const isSelectedGlobal = isProf(opt) && selectedValue !== opt;
                                              const isSelectedSibling = selectedClassSkills.includes(opt) && selectedValue !== opt;
                                              return !isSelectedGlobal && !isSelectedSibling;
                                            });
                                            
                                            // If class base list is exhausted due to overlap, fallback to ALL_SKILLS_LIST
                                            if (availableOptions.length === 0) {
                                               optionsToShow = ALL_SKILLS_LIST;
                                               availableOptions = optionsToShow.filter(opt => {
                                                  const isSelectedGlobal = isProf(opt) && selectedValue !== opt;
                                                  const isSelectedSibling = selectedClassSkills.includes(opt) && selectedValue !== opt;
                                                  return !isSelectedGlobal && !isSelectedSibling;
                                               });
                                            }
                                           
                                           return availableOptions.map(opt => (
                                             <option key={opt} value={opt}>
                                               {opt}
                                             </option>
                                           ));
                                         })()}
                                       </CustomSelect>
                                     );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Class Tool Choices */}
                            {coreTraits.tools && coreTraits.tools.choose > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                <h6 style={{ margin: '0 0 5px 0', color: 'var(--color-ink)', fontSize: '0.9rem' }}>
                                  Tool Proficiencies {(classInfo.class_id === 'monk' || classInfo.class_name === 'Monk') ? "(Choose one type of Artisan's Tools or Musical Instrument)" : `(Choose ${coreTraits.tools.choose})`}
                                </h6>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {Array.from({ length: coreTraits.tools.choose }).map((_, toolIdx) => {
                                     const selectedValue = cl.featureChoices?.['ClassTools']?.[toolIdx] || '';
                                     return (
                                       <CustomSelect 
                                         key={`tool-${toolIdx}`}
                                         value={selectedValue}
                                         onChange={(e) => handleFeatureChoice(index, 'ClassTools', toolIdx, e.target.value)}
                                         style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                       >
                                         <option value="">{(classInfo.class_id === 'monk' || classInfo.class_name === 'Monk') ? "-- Choose one Artisan's Tools or Musical Instrument --" : `-- Choose Tool/Instrument #${toolIdx + 1} --`}</option>
                                         {coreTraits.tools.options.filter(opt => {
                                           const isSelectedHere = cl.featureChoices?.['ClassTools']?.includes(opt) && selectedValue !== opt;
                                           const isSelectedGlobal = characterState.proficiencies?.tools?.includes(opt);
                                           return !isSelectedHere && !isSelectedGlobal;
                                         }).map(opt => (
                                           <option key={opt} value={opt}>
                                             {opt}
                                           </option>
                                         ))}
                                       </CustomSelect>
                                     );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* View Full Class Info Button */}
                      <button 
                        onClick={() => setShowFullClassInfo({ classInfo: classInfo, subclassId: cl.subclassId })} 
                        style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-white)', border: '1px dashed #9ca3af', borderRadius: '6px', color: 'var(--color-gray)', cursor: 'pointer', marginBottom: '15px', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-white)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'var(--bg-white)'}
                      >
                        <i className="fa-solid fa-book-open"></i> View Full Class Progression (Level 1-20)
                      </button>

                      {/* Progressive Features */}
                      <div className="class-features">
                        <h5 style={{ margin: '0 0 10px 0', color: 'var(--color-ink)', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>Class Features (Level 1 - {cl.level})</h5>
                        {(() => {
                           let featuresToRender = [];
                           if (classInfo?.features) {
                             try {
                               const feats = JSON.parse(classInfo.features);
                               featuresToRender = [...featuresToRender, ...feats.filter(f => f.level <= cl.level)];
                             } catch { /* ignore */ }
                           }
                           if (cl.subclassId) {
                             const selSub = subclasses.find(sc => sc.subclass_id === cl.subclassId);
                             if (selSub && selSub.features) {
                               try {
                                 const subFeats = JSON.parse(selSub.features);
                                 featuresToRender = [...featuresToRender, ...subFeats.filter(f => f.level <= cl.level)];
                               } catch { /* ignore */ }
                             }
                           }

                           const cidFighter = (cl.classId || cl.class_id || cl.name || classInfo?.class_id || classInfo?.class_name || '').toLowerCase();
                           if (cidFighter === 'fighter') {
                             if (cl.level >= 4 && !featuresToRender.some(f => f.name === 'Weapon Mastery' && f.level === 4)) {
                               featuresToRender.push({ name: 'Weapon Mastery', level: 4, desc: 'Choose 1 additional Weapon Mastery' });
                             }
                             if (cl.level >= 10 && !featuresToRender.some(f => f.name === 'Weapon Mastery' && f.level === 10)) {
                               featuresToRender.push({ name: 'Weapon Mastery', level: 10, desc: 'Choose 1 additional Weapon Mastery' });
                             }
                             if (cl.level >= 16 && !featuresToRender.some(f => f.name === 'Weapon Mastery' && f.level === 16)) {
                               featuresToRender.push({ name: 'Weapon Mastery', level: 16, desc: 'Choose 1 additional Weapon Mastery' });
                             }
                           }
                           
                            // Prerequisite Checker
                            const checkPrerequisite = (feat) => {
                                let disabled = false;
                                let reqText = '';
                                if (!feat.prerequisite) return { disabled, reqText };
                                
                                const preLower = feat.prerequisite.toLowerCase();
                                
                                // Check Level
                                const lvlMatch = preLower.match(/level (\d+)/);
                                if (lvlMatch) {
                                    const reqLvl = parseInt(lvlMatch[1], 10);
                                    if (cl.level < reqLvl) disabled = true;
                                }
                                
                                // Check Abilities (support abbreviations and commas)
                                const abilities = {
                                    strength: totalStats.str,
                                    dexterity: totalStats.dex,
                                    constitution: totalStats.con,
                                    intelligence: totalStats.int,
                                    wisdom: totalStats.wis,
                                    charisma: totalStats.cha,
                                };
                                
                                const statMatch = preLower.match(/(strength|dexterity|constitution|intelligence|wisdom|charisma)(?: or (strength|dexterity|constitution|intelligence|wisdom|charisma))? 13\+/);
                                if (statMatch) {
                                    const stat1 = statMatch[1];
                                    const stat2 = statMatch[2];
                                    if (stat2) {
                                        if (abilities[stat1] < 13 && abilities[stat2] < 13) {
                                            disabled = true;
                                        }
                                    } else {
                                        if (abilities[stat1] < 13) {
                                            disabled = true;
                                        }
                                    }
                                }
                                
                                if (disabled) reqText = ` (Requires ${feat.prerequisite})`;
                                return { disabled, reqText };
                            };

                           // Sort by level
                           featuresToRender.sort((a, b) => a.level - b.level);
                           
                           // If a subclass is selected, remove the generic 'Wizard Subclass' placeholders
                           if (cl.subclassId) {
                               featuresToRender = featuresToRender.filter(f => !f.name.includes('Subclass'));
                           }

                           // Filter out two/three uses variants to avoid cluttering the sidebar
                           featuresToRender = featuresToRender.filter(f => !f.name.includes('(two uses)') && !f.name.includes('(three uses)'));
                           
                           if (featuresToRender.length === 0) return <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>No specific class features at this level.</p>;
                           
                           return (
                             <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--color-gray)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                               {featuresToRender.map((f, i) => {
                                 let mechanicsObj = f.mechanics;
                                 if (typeof mechanicsObj === 'string') {
                                   try { mechanicsObj = JSON.parse(mechanicsObj); } catch { mechanicsObj = null; }
                                 }
                                 
                                 let isChoice = mechanicsObj?.logic?.type === 'choice';
                                 let chooseAmount = isChoice ? (mechanicsObj.logic.choose || 1) : 0;
                                 let options = isChoice ? (mechanicsObj.logic.options || []) : [];
                                 const featureKey = `${f.name}_Lv${f.level}`;
                                 
                                 // Dynamic Options Handling
                                 let finalOptions = Array.isArray(options) ? [...options] : [];
                                 let warningMessage = null;
                                 let customUI = null;
                                 const isProf = (opt) => proficientSkills.some(p => String(p).trim().toLowerCase() === String(opt).trim().toLowerCase());

                                 if (options === 'ClassSkills') {
                                     let coreTraits = null;
                                     try { coreTraits = typeof classInfo?.core_traits === 'string' ? JSON.parse(classInfo.core_traits) : classInfo?.core_traits; } catch { /* ignore */ }
                                     const classOptions = coreTraits?.skills?.options || [];
                                     const selectedValues = Array.isArray(cl.featureChoices?.[featureKey]) ? cl.featureChoices[featureKey] : [];
                                     
                                     finalOptions = classOptions.filter(opt => !isProf(opt) || selectedValues.includes(opt));
                                     if (finalOptions.length === 0 && classOptions.length > 0) {
                                         warningMessage = "You already possess all available skill proficiencies from this class.";
                                     }
                                 } else if (options === 'AllSkills') {
                                     const selectedValues = Array.isArray(cl.featureChoices?.[featureKey]) ? cl.featureChoices[featureKey] : [];
                                     finalOptions = ALL_SKILLS_LIST.filter(opt => !isProf(opt) || selectedValues.includes(opt));
                                 }

                                 // 1. Scholar (Level 2) - Expertise
                                 if (f.name === 'Scholar' || f.name.includes('Expertise')) {
                                   const selectedValues = Array.isArray(cl.featureChoices?.[featureKey]) ? cl.featureChoices[featureKey] : [];
                                   
                                   if (f.name === 'Scholar') {
                                       const allowedSkills = ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Religion'];
                                       finalOptions = allowedSkills.filter(opt => proficientSkills.includes(opt));
                                   } else {
                                       // General Expertise (e.g. Bard) - Must be proficient
                                       finalOptions = proficientSkills;
                                   }
                                   
                                   // Hide skills that already have expertise (unless it's the one currently selected in this dropdown)
                                   finalOptions = finalOptions.filter(opt => !expertiseSkills.includes(opt) || selectedValues.includes(opt));
                                   
                                   isChoice = true;
                                   chooseAmount = mechanicsObj?.logic?.choose || (f.name === 'Scholar' ? 1 : 2);
                                   if (finalOptions.length === 0) {
                                     warningMessage = f.name === 'Scholar' 
                                       ? "Scholar requires proficiency in Arcana, History, Investigation, Medicine, Nature, or Religion to grant Expertise. Please assign proficiency in Step 1 (Race) or Step 3 (Background) first."
                                       : "No available proficient skills left to upgrade to Expertise. Please select skill proficiencies in Step 1 or Step 3 first.";
                                   }
                                 }

                                 // 2. Ability Score Improvement / Feats (Level 4, 8, 12, 16)
                                 if (f.name === 'Ability Score Improvement') {
                                    isChoice = false;
                                    const selectedFeatObj = cl.featureChoices?.[featureKey]?.[0] || { id: '', bonuses: {} };
                                    // Backwards compatibility for old string saves
                                    const selectedFeatId = typeof selectedFeatObj === 'string' ? selectedFeatObj : (selectedFeatObj.id || '');
                                    const selectedBonuses = typeof selectedFeatObj === 'string' ? {} : (selectedFeatObj.bonuses || {});
                                    const _featConfig = getFeatConfig(selectedFeatId, dbData);

                                    customUI = (
                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <CustomSelect
                                              value={selectedFeatId}
                                              onChange={(e) => {
                                                  const newId = e.target.value;
                                                  // When feat changes, reset bonuses
                                                  handleFeatureChoice(index, featureKey, 0, { id: newId, bonuses: {} });
                                              }}
                                              style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                            >
                                                <option value="">-- Choose Feat (or Ability Score Improvement) --</option>
                                                {dbData.feats?.filter(feat => {
                                                    // Allow ASI to be repeatable
                                                    if (feat.feat_name === 'Ability Score Improvement') return true;

                                                    // Check if chosen in any class
                                                    const inClasses = characterState.classData.classes.some(classObj => 
                                                        Object.entries(classObj.featureChoices || {}).some(([k, v]) => {
                                                            if (classObj === cl && k === featureKey) return false; // Ignore self
                                                            return v.some(choice => {
                                                                const choiceId = typeof choice === 'string' ? choice : choice?.id;
                                                                return choiceId === feat.feat_id;
                                                            });
                                                        })
                                                    );

                                                    // Check if chosen in background
                                                    const inBackground = characterState.feats?.some(f => f.id === feat.feat_id);

                                                    if (inClasses || inBackground) return false;

                                                    // Hide Fighting Styles if not eligible
                                                    const hasFightingStyleFeature = JSON.stringify(classInfo.features || []).toLowerCase().includes('fighting style feature');
                                                    if (feat.feat_type?.includes('Fighting Style') && !hasFightingStyleFeature) return false;
                                                    
                                                    // Hide Epic Boons from standard ASI
                                                    if (feat.feat_type?.includes('Epic Boon')) return false;
                                                    
                                                    return true;
                                                }).map(feat => {
                                                    const { disabled, reqText } = checkPrerequisite(feat);
                                                    return <option key={feat.feat_id} value={feat.feat_id} disabled={disabled}>{feat.feat_name}{reqText}</option>;
                                                })}
                                            </CustomSelect>

                                            {/* Feat Details Toggle */}
                                            {selectedFeatId && (
                                                <div style={{ maxWidth: '500px' }}>
                                                    <button 
                                                        onClick={() => setShowFeatDetails(prev => ({ ...prev, [`${index}-${featureKey}`]: !prev[`${index}-${featureKey}`] }))}
                                                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}
                                                    >
                                                        {showFeatDetails[`${index}-${featureKey}`] ? 'Hide Feat Details' : 'Show Feat Details'}
                                                    </button>
                                                    {showFeatDetails[`${index}-${featureKey}`] && (
                                                        <div style={{ marginTop: '5px', padding: '10px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.4' }}
                                                             dangerouslySetInnerHTML={{ __html: getEnhancedFeatDesc(dbData.feats?.find(f => (f.feat_id || f.feat_name || f.name)?.toLowerCase() === String(selectedFeatId).toLowerCase()), selectedFeatId) }}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {selectedFeatId && (
                                                <FeatChoiceEditor
                                                    featId={selectedFeatId}
                                                    currentBonuses={selectedBonuses}
                                                    onBonusChange={(newBonuses) => handleFeatureChoice(index, featureKey, 0, { id: selectedFeatId, bonuses: newBonuses })}
                                                    dbData={dbData}
                                                    proficientSkills={proficientSkills}
                                                    allKnownSpellIds={allKnownSpellIds}
                                                    style={{ maxWidth: '450px', marginTop: '8px' }}
                                                />
                                            )}
                                        </div>
                                    );
                                 }

                                 // 3. Epic Boon (Level 19)
                                 if (f.name === 'Epic Boon') {
                                    isChoice = false;
                                    const categoryChoice = cl.featureChoices?.[featureKey]?.[0] || '';
                                    const featChoiceObj = cl.featureChoices?.[featureKey]?.[1] || { id: '', bonuses: {} };
                                    const featChoiceId = typeof featChoiceObj === 'string' ? featChoiceObj : (featChoiceObj.id || '');
                                    const selectedBonuses = typeof featChoiceObj === 'string' ? {} : (featChoiceObj.bonuses || {});
                                    const _featConfig = getFeatConfig(featChoiceId, dbData);

                                    customUI = (
                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <CustomSelect
                                              value={categoryChoice}
                                              onChange={(e) => {
                                                  handleFeatureChoice(index, featureKey, 0, e.target.value);
                                                  handleFeatureChoice(index, featureKey, 1, { id: '', bonuses: {} }); // reset 2nd choice
                                              }}
                                              style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                            >
                                                <option value="">-- Choose Category --</option>
                                                <option value="Epic Boon">Epic Boon Feat</option>
                                                <option value="General Feat">General Feat</option>
                                            </CustomSelect>
                                            
                                            {categoryChoice && (
                                                <>
                                                    <CustomSelect
                                                      value={featChoiceId}
                                                      onChange={(e) => handleFeatureChoice(index, featureKey, 1, { id: e.target.value, bonuses: {} })}
                                                      style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="">-- Choose {categoryChoice} --</option>
                                                        {dbData.feats?.filter(ft => {
                                                            const isEpicBoon = ft.feat_type?.includes('Epic Boon');
                                                            const isCorrectCategory = categoryChoice === 'Epic Boon' ? isEpicBoon : !isEpicBoon;
                                                            const isChosenElsewhere = ft.feat_name !== 'Ability Score Improvement' && Object.entries(cl.featureChoices || {}).some(([k, v]) => {
                                                                if (k === featureKey) return false;
                                                                if (!k.startsWith('Ability Score Improvement') && !k.startsWith('Epic Boon')) return false;
                                                                return v.some(choice => {
                                                                    const choiceId = typeof choice === 'string' ? choice : choice?.id;
                                                                    return choiceId === ft.feat_id;
                                                                });
                                                            });
                                                            const hasFightingStyleFeature = JSON.stringify(classInfo.features || []).toLowerCase().includes('fighting style feature');
                                                            if (ft.feat_type?.includes('Fighting Style') && !hasFightingStyleFeature) return false;
                                                            
                                                            return isCorrectCategory && !isChosenElsewhere;
                                                        }).map(feat => {
                                                            const { disabled, reqText } = checkPrerequisite(feat);
                                                            return <option key={feat.feat_id} value={feat.feat_id} disabled={disabled}>{feat.feat_name}{reqText}</option>;
                                                        })}
                                                    </CustomSelect>
                                                    
                                                    {/* Feat Details Toggle */}
                                                    {featChoiceId && (
                                                        <div style={{ maxWidth: '500px', marginTop: '5px' }}>
                                                            <button 
                                                                onClick={() => setShowFeatDetails(prev => ({ ...prev, [`${index}-${featureKey}`]: !prev[`${index}-${featureKey}`] }))}
                                                                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}
                                                            >
                                                                {showFeatDetails[`${index}-${featureKey}`] ? 'Hide Feat Details' : 'Show Feat Details'}
                                                            </button>
                                                            {showFeatDetails[`${index}-${featureKey}`] && (
                                                                <div style={{ marginTop: '5px', padding: '10px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.4' }}
                                                                     dangerouslySetInnerHTML={{ __html: getEnhancedFeatDesc(dbData.feats?.find(f => (f.feat_id || f.feat_name || f.name)?.toLowerCase() === String(featChoiceId).toLowerCase()), featChoiceId) }}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {featChoiceId && (
                                                <FeatChoiceEditor
                                                    featId={featChoiceId}
                                                    currentBonuses={selectedBonuses}
                                                    onBonusChange={(newBonuses) => handleFeatureChoice(index, featureKey, 1, { id: featChoiceId, bonuses: newBonuses })}
                                                    dbData={dbData}
                                                    proficientSkills={proficientSkills}
                                                    allKnownSpellIds={allKnownSpellIds}
                                                    style={{ maxWidth: '450px', marginTop: '8px' }}
                                                />
                                            )}
                                        </div>
                                    );
                                 }

                                 // 4. Evocation Savant (Level 3 Evoker)
                                 if (f.name === 'Evocation Savant') {
                                    isChoice = false;
                                    
                                    // Base 2 choices (Lv 1-2)
                                    let extraChoices = [
                                        { label: 'Bonus Spell 1 (Max Lv. 2)', maxLvl: 2 },
                                        { label: 'Bonus Spell 2 (Max Lv. 2)', maxLvl: 2 }
                                    ];
                                    
                                    // Extra choices for higher levels
                                    if (cl.level >= 5) extraChoices.push({ label: 'Bonus Spell (Max Lv. 3)', maxLvl: 3 });
                                    if (cl.level >= 7) extraChoices.push({ label: 'Bonus Spell (Max Lv. 4)', maxLvl: 4 });
                                    if (cl.level >= 9) extraChoices.push({ label: 'Bonus Spell (Max Lv. 5)', maxLvl: 5 });
                                    if (cl.level >= 11) extraChoices.push({ label: 'Bonus Spell (Max Lv. 6)', maxLvl: 6 });
                                    if (cl.level >= 13) extraChoices.push({ label: 'Bonus Spell (Max Lv. 7)', maxLvl: 7 });
                                    if (cl.level >= 15) extraChoices.push({ label: 'Bonus Spell (Max Lv. 8)', maxLvl: 8 });
                                    if (cl.level >= 17) extraChoices.push({ label: 'Bonus Spell (Max Lv. 9)', maxLvl: 9 });

                                    // Get all evocation spells the character could potentially learn
                                    const allEvoSpells = dbData.spells?.filter(s => s.school === 'Evocation') || [];
                                    let wizardSpellIds = [];
                                    try {
                                        const wizInfo = dbData.classes?.find(c => c.class_id === 'wizard');
                                        if (wizInfo?.spell_list) wizardSpellIds = JSON.parse(wizInfo.spell_list);
                                    } catch { /* ignore */ }
                                    
                                    const evoWizSpells = allEvoSpells.filter(s => wizardSpellIds.includes(s.spell_id)).sort((a, b) => {
                                        const lvlA = parseInt(a.spell_level, 10) || 0;
                                        const lvlB = parseInt(b.spell_level, 10) || 0;
                                        if (lvlA !== lvlB) return lvlA - lvlB;
                                        return a.spell_name.localeCompare(b.spell_name);
                                    });
                                    
                                    customUI = (
                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {extraChoices.map((choice, cIdx) => {
                                                const selectedValue = cl.featureChoices?.[featureKey]?.[cIdx] || '';
                                                // Prevent duplicates
                                                const allSelected = extraChoices.map((_, i) => cl.featureChoices?.[featureKey]?.[i]).filter(Boolean);
                                                
                                                return (
                                                    <CustomSelect
                                                      key={cIdx}
                                                      value={selectedValue}
                                                      onChange={(e) => handleFeatureChoice(index, featureKey, cIdx, e.target.value)}
                                                      style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="">-- Choose {choice.label} --</option>
                                                        {evoWizSpells.filter(s => parseInt(s.spell_level, 10) <= choice.maxLvl).map(s => {
                                                            const isDisabled = allSelected.includes(s.spell_id) && selectedValue !== s.spell_id;
                                                            return (
                                                              <option key={s.spell_id} value={s.spell_id} disabled={isDisabled}>
                                                                {s.spell_name} (Lv.{s.spell_level})
                                                              </option>
                                                            );
                                                        })}
                                                    </CustomSelect>
                                                )
                                            })}
                                        </div>
                                    );
                                 }

                                 // 5. Weapon Mastery
                                 if (f.name === 'Weapon Mastery') {
                                     isChoice = false;
                                     const cidWM = (cl.classId || cl.class_id || cl.name || classInfo?.class_id || classInfo?.class_name || '').toLowerCase();
                                     const isFighterWM = cidWM === 'fighter';
                                     const numChoices = f.level === 1 ? (isFighterWM ? 3 : 2) : 1;
                                     const MASTERY_WEAPONS = [
                                         { name: 'Club', prop: 'Slow' },
                                         { name: 'Dagger', prop: 'Nick' },
                                         { name: 'Greatclub', prop: 'Push' },
                                         { name: 'Handaxe', prop: 'Vex' },
                                         { name: 'Javelin', prop: 'Pierce' },
                                         { name: 'Light Hammer', prop: 'Nick' },
                                         { name: 'Mace', prop: 'Sap' },
                                         { name: 'Quarterstaff', prop: 'Topple' },
                                         { name: 'Sickle', prop: 'Nick' },
                                         { name: 'Spear', prop: 'Sap' },
                                         { name: 'Battleaxe', prop: 'Topple' },
                                         { name: 'Flail', prop: 'Sap' },
                                         { name: 'Glaive', prop: 'Graze' },
                                         { name: 'Greataxe', prop: 'Cleave' },
                                         { name: 'Greatsword', prop: 'Graze' },
                                         { name: 'Halberd', prop: 'Cleave' },
                                         { name: 'Lance', prop: 'Topple' },
                                         { name: 'Longsword', prop: 'Sap' },
                                         { name: 'Maul', prop: 'Topple' },
                                         { name: 'Morningstar', prop: 'Sap' },
                                         { name: 'Pike', prop: 'Push' },
                                         { name: 'Rapier', prop: 'Vex' },
                                         { name: 'Scimitar', prop: 'Nick' },
                                         { name: 'Shortsword', prop: 'Vex' },
                                         { name: 'Trident', prop: 'Topple' },
                                         { name: 'War Pick', prop: 'Sap' },
                                         { name: 'Warhammer', prop: 'Push' },
                                         { name: 'Whip', prop: 'Slow' }
                                     ];
                                     
                                     const allMasteriesSelected = [];
                                     Object.entries(cl.featureChoices || {}).forEach(([k, v]) => {
                                         if (k.startsWith('Weapon Mastery')) {
                                             if (Array.isArray(v)) allMasteriesSelected.push(...v.filter(Boolean));
                                         }
                                     });

                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                             {Array.from({ length: numChoices }).map((_, cIdx) => {
                                                 const selectedValue = cl.featureChoices?.[featureKey]?.[cIdx] || '';
                                                 
                                                 return (
                                                     <CustomSelect
                                                       key={cIdx}
                                                       value={selectedValue}
                                                       onChange={(e) => handleFeatureChoice(index, featureKey, cIdx, e.target.value)}
                                                       style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                                     >
                                                         <option value="">-- Choose Weapon Mastery #{cIdx + 1} --</option>
                                                         {MASTERY_WEAPONS.map(w => {
                                                             const isDisabled = allMasteriesSelected.includes(w.name) && selectedValue !== w.name;
                                                             if (isDisabled) return null;
                                                             return <option key={w.name} value={w.name}>{w.name} ({w.prop})</option>;
                                                         })}
                                                     </CustomSelect>
                                                 );
                                             })}
                                         </div>
                                     );
                                 }

                                 // Fighting Style (Standard Fighter & Paladin)
                                 const isRangerForFS = (cl.classId || cl.class_id || cl.name || classInfo?.class_id || classInfo?.class_name || '').toLowerCase() === 'ranger';
                                 if (!isRangerForFS && (f.name === 'Fighting Style' || f.name === 'Fighting Style feature' || f.name.includes('Fighting Style'))) {
                                     isChoice = false;
                                     const fightingStyleFeats = dbData.feats?.filter(ft => ft.feat_type?.includes('Fighting Style')).sort((a,b)=>a.feat_name.localeCompare(b.feat_name)) || [];
                                     const selectedValue = cl.featureChoices?.[featureKey]?.[0] || '';

                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                             <div style={{ fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.5', marginBottom: '4px' }}>
                                                 You have honed your martial prowess and gain a Fighting Style feat of your choice (see "Feats"). <strong>Defense is recommended.</strong><br/>
                                                 <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>Whenever you gain a Fighter level, you can replace the feat you chose with a different Fighting Style feat.</span>
                                             </div>
                                             <CustomSelect
                                               value={selectedValue}
                                               onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                               style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                             >
                                                 <option value="">-- Choose Fighting Style Feat (e.g. Defense) --</option>
                                                 {fightingStyleFeats.map(ft => {
                                                     const rec = ft.feat_name === 'Defense' ? ' (Recommended)' : '';
                                                     return <option key={ft.feat_id} value={ft.feat_id}>{ft.feat_name}{rec}</option>;
                                                 })}
                                             </CustomSelect>

                                             {selectedValue && (
                                                 <div style={{ maxWidth: '500px' }}>
                                                     <button 
                                                         onClick={() => setShowFeatDetails(prev => ({ ...prev, [`${index}-${featureKey}`]: !prev[`${index}-${featureKey}`] }))}
                                                         style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}
                                                     >
                                                         {showFeatDetails[`${index}-${featureKey}`] ? 'Hide Fighting Style Details' : 'Show Fighting Style Details'}
                                                     </button>
                                                     {showFeatDetails[`${index}-${featureKey}`] && (
                                                         <div style={{ marginTop: '5px', padding: '10px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.4' }}
                                                              dangerouslySetInnerHTML={{ __html: getEnhancedFeatDesc(dbData.feats?.find(f => (f.feat_id || f.feat_name || f.name)?.toLowerCase() === String(selectedValue).toLowerCase()), selectedValue) }}
                                                         />
                                                     )}
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 }

                                 // 6. Barbarian: Primal Knowledge
                                 if (f.name === 'Primal Knowledge') {
                                     isChoice = false;
                                     const BARBARIAN_SKILLS = ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'];
                                     const selectedValue = cl.featureChoices?.[featureKey]?.[0] || '';

                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <CustomSelect
                                              value={selectedValue}
                                              onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                              style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                            >
                                                <option value="">-- Choose 1 Skill (Primal Knowledge) --</option>
                                                {BARBARIAN_SKILLS.map(skill => {
                                                    const isDisabled = proficientSkills.includes(skill) && selectedValue !== skill;
                                                    if (isDisabled) return null;
                                                    return <option key={skill} value={skill}>{skill}</option>;
                                                })}
                                            </CustomSelect>
                                         </div>
                                     );
                                 }

                                 // Bard: Bonus Proficiencies (Level 3)
                                 if (f.name === 'Bonus Proficiencies') {
                                     isChoice = false;
                                     const ALL_SKILLS_LIST = ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'];

                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {[0, 1, 2].map(cIdx => {
                                                const selectedValue = cl.featureChoices?.[featureKey]?.[cIdx] || '';
                                                return (
                                                    <CustomSelect
                                                      key={cIdx}
                                                      value={selectedValue}
                                                      onChange={(e) => handleFeatureChoice(index, featureKey, cIdx, e.target.value)}
                                                      style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="">-- Choose 1 Skill (Bonus Proficiencies) --</option>
                                                        {ALL_SKILLS_LIST.map(skill => {
                                                            const isSelectedElsewhere = [0, 1, 2].some(n => n !== cIdx && cl.featureChoices?.[featureKey]?.[n] === skill);
                                                            const isDisabled = (proficientSkills.includes(skill) || isSelectedElsewhere) && selectedValue !== skill;
                                                            if (isDisabled) return null;
                                                            return <option key={skill} value={skill}>{skill}</option>;
                                                        })}
                                                    </CustomSelect>
                                                );
                                            })}
                                         </div>
                                     );
                                 }

                                 // Bard: Magical Discoveries (Level 6)
                                 if (f.name === 'Magical Discoveries') {
                                     isChoice = false;
                                     const maxSpellSlot = Math.ceil(cl.level / 2); // For full casters, max slot is ceil(level/2)

                                     let validSpellIds = [];
                                     ['cleric', 'druid', 'wizard'].forEach(cId => {
                                         const cInfo = dbData.classes?.find(c => c.class_id === cId);
                                         if (cInfo?.spell_list) {
                                             try { validSpellIds.push(...JSON.parse(cInfo.spell_list)); } catch { /* ignore */ }
                                         }
                                     });
                                     validSpellIds = [...new Set(validSpellIds)];

                                     const availableSpells = dbData.spells?.filter(s => {
                                         const lvl = parseInt(s.spell_level, 10);
                                         return validSpellIds.includes(s.spell_id) && lvl <= maxSpellSlot;
                                     }).sort((a, b) => {
                                         const lvlA = parseInt(a.spell_level, 10);
                                         const lvlB = parseInt(b.spell_level, 10);
                                         if (lvlA !== lvlB) return lvlA - lvlB;
                                         return a.spell_name.localeCompare(b.spell_name);
                                     }) || [];

                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {[0, 1].map(cIdx => {
                                                const selectedValue = cl.featureChoices?.[featureKey]?.[cIdx] || '';
                                                return (
                                                    <CustomSelect
                                                      key={cIdx}
                                                      value={selectedValue}
                                                      onChange={(e) => handleFeatureChoice(index, featureKey, cIdx, e.target.value)}
                                                      style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="">-- Choose Spell (Max Lv.{maxSpellSlot}) --</option>
                                                        {availableSpells.map(s => {
                                                            const isSelectedElsewhere = [0, 1].some(n => n !== cIdx && cl.featureChoices?.[featureKey]?.[n] === s.spell_id);
                                                            const isDisabled = isSelectedElsewhere && selectedValue !== s.spell_id;
                                                            if (isDisabled) return null;
                                                            return <option key={s.spell_id} value={s.spell_id}>{s.spell_name} (Lv.{s.spell_level})</option>;
                                                        })}
                                                    </CustomSelect>
                                                );
                                            })}
                                         </div>
                                     );
                                 }



                                 // Druid: Elemental Fury (Level 7)
                                 if (f.name === 'Elemental Fury') {
                                     isChoice = false;
                                     const ELEMENTAL_FURY_OPTIONS = [
                                         { value: 'Potent Spellcasting', label: 'Potent Spellcasting (Add Wis mod to Druid cantrip dmg)' },
                                         { value: 'Primal Strike', label: 'Primal Strike (1d8 Cold/Fire/Lightning/Thunder to weapon/Beast attacks)' }
                                     ];
                                     const selectedValue = cl.featureChoices?.[featureKey]?.[0] || '';

                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                             <CustomSelect
                                               value={selectedValue}
                                               onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                               style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                             >
                                                 <option value="">-- Choose 1 Option (Elemental Fury) --</option>
                                                 {ELEMENTAL_FURY_OPTIONS.map(opt => (
                                                     <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                 ))}
                                             </CustomSelect>
                                         </div>
                                     );
                                 }

                                 // Cleric: Blessed Strikes (Level 7)
                                 if (f.name === 'Blessed Strikes') {
                                     isChoice = false;
                                     const BLESSED_STRIKES_OPTIONS = [
                                         { value: 'Divine Strike', label: 'Divine Strike (1d8 Necrotic/Radiant to weapon attacks)' },
                                         { value: 'Potent Spellcasting', label: 'Potent Spellcasting (Add Wis mod to Cleric cantrip dmg)' }
                                     ];
                                     const selectedValue = cl.featureChoices?.[featureKey]?.[0] || '';

                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                             <CustomSelect
                                               value={selectedValue}
                                               onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                               style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                             >
                                                 <option value="">-- Choose 1 Option (Blessed Strikes) --</option>
                                                 {BLESSED_STRIKES_OPTIONS.map(opt => (
                                                     <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                 ))}
                                             </CustomSelect>
                                         </div>
                                     );
                                 }

                                 // 7. Spell Mastery & Signature Spells placeholders
                                 if (f.name === 'Spell Mastery') {
                                    isChoice = false;
                                    const spell1 = cl.featureChoices?.[featureKey]?.[0] || '';
                                    const spell2 = cl.featureChoices?.[featureKey]?.[1] || '';
                                    const wizardSpellbook = characterState.spells?.classes?.wizard?.spellbook || [];
                                    const spellsInBook = dbData.spells?.filter(s => wizardSpellbook.includes(s.spell_id)) || [];
                                    const lvl1Spells = spellsInBook.filter(s => parseInt(s.spell_level, 10) === 1).sort((a,b)=>a.spell_name.localeCompare(b.spell_name));
                                    const lvl2Spells = spellsInBook.filter(s => parseInt(s.spell_level, 10) === 2).sort((a,b)=>a.spell_name.localeCompare(b.spell_name));
                                    
                                    customUI = (
                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <CustomSelect 
                                              value={spell1} 
                                              onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                              style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                            >
                                                <option value="">{wizardSpellbook.length === 0 ? '-- No Spells in Spellbook (Add via Spellbook button) --' : '-- Choose Lv.1 Spell from Spellbook --'}</option>
                                                {lvl1Spells.map(s => <option key={s.spell_id} value={s.spell_id}>{s.spell_name}</option>)}
                                            </CustomSelect>
                                            <CustomSelect 
                                              value={spell2} 
                                              onChange={(e) => handleFeatureChoice(index, featureKey, 1, e.target.value)}
                                              style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                            >
                                                <option value="">{wizardSpellbook.length === 0 ? '-- No Spells in Spellbook (Add via Spellbook button) --' : '-- Choose Lv.2 Spell from Spellbook --'}</option>
                                                {lvl2Spells.map(s => <option key={s.spell_id} value={s.spell_id}>{s.spell_name}</option>)}
                                            </CustomSelect>
                                        </div>
                                    );
                                 }
                                 if (f.name === 'Signature Spells') {
                                    isChoice = false;
                                    const spell1 = cl.featureChoices?.[featureKey]?.[0] || '';
                                    const spell2 = cl.featureChoices?.[featureKey]?.[1] || '';
                                    const wizardSpellbook = characterState.spells?.classes?.wizard?.spellbook || [];
                                    const spellsInBook = dbData.spells?.filter(s => wizardSpellbook.includes(s.spell_id)) || [];
                                    const lvl3Spells = spellsInBook.filter(s => parseInt(s.spell_level, 10) === 3).sort((a,b)=>a.spell_name.localeCompare(b.spell_name));
                                    
                                    customUI = (
                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <CustomSelect 
                                              value={spell1} 
                                              onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                              style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                            >
                                                <option value="">{wizardSpellbook.length === 0 ? '-- No Spells in Spellbook (Add via Spellbook button) --' : '-- Choose Lv.3 Spell from Spellbook (Slot 1) --'}</option>
                                                {lvl3Spells.map(s => <option key={s.spell_id} value={s.spell_id} disabled={s.spell_id === spell2}>{s.spell_name}</option>)}
                                            </CustomSelect>
                                            <CustomSelect 
                                              value={spell2} 
                                              onChange={(e) => handleFeatureChoice(index, featureKey, 1, e.target.value)}
                                              style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                            >
                                                <option value="">{wizardSpellbook.length === 0 ? '-- No Spells in Spellbook (Add via Spellbook button) --' : '-- Choose Lv.3 Spell from Spellbook (Slot 2) --'}</option>
                                                {lvl3Spells.map(s => <option key={s.spell_id} value={s.spell_id} disabled={s.spell_id === spell1}>{s.spell_name}</option>)}
                                            </CustomSelect>
                                        </div>
                                    );
                                 }

                                 let descHtml = cleanAndStyleHtml(f.name, f.display || f.description || f.desc || '');

                                 if (f.name === 'Circle of the Land Spells') {
                                     isChoice = false;
                                     const LAND_TYPES = ['Arid', 'Polar', 'Temperate', 'Tropical'];
                                     const selectedValue = cl.featureChoices?.[featureKey]?.[0] || '';

                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                             <CustomSelect
                                               value={selectedValue}
                                               onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                               style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                             >
                                                 <option value="">-- Choose Land Type --</option>
                                                 {LAND_TYPES.map(land => (
                                                     <option key={land} value={land}>{land}</option>
                                                 ))}
                                             </CustomSelect>
                                         </div>
                                     );

                                     const introMatch = descHtml.match(/^(.*?)<p[^>]*><strong>Arid/s);
                                     let intro = introMatch ? introMatch[1] : descHtml;
                                     
                                     let selectedTableHtml = '';
                                     if (selectedValue) {
                                         const tableRegex = new RegExp(`<p[^>]*><strong>${selectedValue} Land</strong></p>\\s*<div[^>]*>.*?</div>`, 's');
                                         const tableMatch = descHtml.match(tableRegex);
                                         if (tableMatch) {
                                             selectedTableHtml = tableMatch[0];
                                         }
                                     }

                                     descHtml = intro + selectedTableHtml;
                                 }

                                 // --- Ranger Feature Choices ---
                                 const isRangerClass = (cl.classId || cl.class_id || cl.name || classInfo?.class_id || classInfo?.class_name || '').toLowerCase() === 'ranger';
                                 if (isRangerClass) {
                                     const RANGER_ALL_LANGS = ["Abyssal", "Celestial", "Common", "Common Sign Language", "Deep Speech", "Draconic", "Druidic", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Infernal", "Orc", "Primordial", "Sylvan", "Thieves' Cant", "Undercommon"];

                                     if (f.name === 'Deft Explorer') {
                                         isChoice = false;
                                         const choices = cl.featureChoices?.[featureKey] || [];
                                         const expChoice = choices[0] || '';
                                         const lang1 = choices[1] || '';
                                         const lang2 = choices[2] || '';
                                         
                                         const availSkills = proficientSkills.filter(s => !expertiseSkills.includes(s) || s === expChoice);
                                         descHtml = "<p style='margin-bottom: 8px; line-height: 1.6;'>Thanks to your travels, you gain the following benefits.</p><p style='margin-bottom: 6px; line-height: 1.6;'><strong>Expertise.</strong> Choose one of your skill proficiencies with which you lack Expertise. You gain Expertise in that skill.</p><p style='margin-bottom: 0; line-height: 1.6;'><strong>Languages.</strong> You know two languages of your choice from the language tables in \"Character Creation.\"</p>";

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '450px', padding: '12px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Choose 1 Skill for Expertise:</div>
                                                 <CustomSelect
                                                     value={expChoice}
                                                     onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose 1 Skill (Expertise) --</option>
                                                     {availSkills.map(sk => <option key={sk} value={sk}>{sk}</option>)}
                                                 </CustomSelect>

                                                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)', marginTop: '4px' }}>Choose 2 Bonus Languages:</div>
                                                 <CustomSelect
                                                     value={lang1}
                                                     onChange={(e) => handleFeatureChoice(index, featureKey, 1, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose 1st Language --</option>
                                                     {RANGER_ALL_LANGS.map(l => <option key={l} value={l} disabled={l === lang2}>{l}</option>)}
                                                 </CustomSelect>
                                                 <CustomSelect
                                                     value={lang2}
                                                     onChange={(e) => handleFeatureChoice(index, featureKey, 2, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose 2nd Language --</option>
                                                     {RANGER_ALL_LANGS.map(l => <option key={l} value={l} disabled={l === lang1}>{l}</option>)}
                                                 </CustomSelect>
                                             </div>
                                         );
                                     }

                                     if (f.name === 'Fighting Style' || f.name.includes('Fighting Style')) {
                                         isChoice = false;
                                         const mode = cl.featureChoices?.[featureKey]?.[0] || '';
                                         const choice1 = cl.featureChoices?.[featureKey]?.[1] || '';
                                         const choice2 = cl.featureChoices?.[featureKey]?.[2] || '';

                                         const druidClassObj = dbData.classes?.find(c => c.class_id === 'druid');
                                         const druidSpellList = druidClassObj?.spell_list ? JSON.parse(druidClassObj.spell_list) : [];
                                         const druidCantrips = dbData.spells?.filter(s => s.spell_level === 0 && (druidSpellList.includes(s.spell_id) || s.classes?.toLowerCase().includes('druid'))).sort((a,b)=>a.spell_name.localeCompare(b.spell_name)) || [];
                                         const fightingStyleFeats = dbData.feats?.filter(ft => ft.feat_type?.includes('Fighting Style')).sort((a,b)=>a.feat_name.localeCompare(b.feat_name)) || [];

                                         descHtml = "<p style='margin-bottom: 0; line-height: 1.6;'>Choose between <strong>Druidic Warrior</strong> or <strong>Fighting Style</strong> option</p>";

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                 <CustomSelect
                                                     value={mode}
                                                     onChange={(e) => {
                                                         const newMode = e.target.value;
                                                         handleFeatureChoice(index, featureKey, 0, newMode);
                                                         handleFeatureChoice(index, featureKey, 1, '');
                                                         handleFeatureChoice(index, featureKey, 2, '');
                                                     }}
                                                     style={{ width: '100%', maxWidth: '450px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontWeight: 'bold' }}
                                                 >
                                                     <option value="">-- Choose Fighting Style / Druidic Warrior --</option>
                                                     <option value="fighting-style">Fighting Style (Choose a Fighting Style Feat)</option>
                                                     <option value="druidic-warrior">Druidic Warrior (Choose 2 Druid Cantrips)</option>
                                                 </CustomSelect>

                                                 {mode === 'fighting-style' && (
                                                     <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '450px' }}>
                                                         <div style={{ fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.5' }}>
                                                             You gain a Fighting Style feat of your choice (see "Feats"). <strong>Defense is recommended.</strong>
                                                         </div>
                                                         <CustomSelect
                                                             value={choice1}
                                                             onChange={(e) => handleFeatureChoice(index, featureKey, 1, e.target.value)}
                                                             style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                         >
                                                             <option value="">-- Choose Fighting Style Feat (e.g. Defense) --</option>
                                                             {fightingStyleFeats.map(ft => {
                                                                 const rec = ft.feat_name === 'Defense' ? ' (Recommended)' : '';
                                                                 return <option key={ft.feat_id} value={ft.feat_id}>{ft.feat_name}{rec}</option>;
                                                             })}
                                                         </CustomSelect>
                                                         {choice1 && (
                                                             <div>
                                                                 <button 
                                                                     onClick={() => setShowFeatDetails(prev => ({ ...prev, [`${index}-${featureKey}`]: !prev[`${index}-${featureKey}`] }))}
                                                                     style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}
                                                                 >
                                                                     {showFeatDetails[`${index}-${featureKey}`] ? 'Hide Fighting Style Details' : 'Show Fighting Style Details'}
                                                                 </button>
                                                                 {showFeatDetails[`${index}-${featureKey}`] && (
                                                                     <div style={{ marginTop: '5px', padding: '10px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.4' }}
                                                                         dangerouslySetInnerHTML={{ __html: getEnhancedFeatDesc(dbData.feats?.find(f => (f.feat_id || f.feat_name || f.name)?.toLowerCase() === String(choice1).toLowerCase()), choice1) }}
                                                                     />
                                                                 )}
                                                             </div>
                                                         )}
                                                     </div>
                                                 )}

                                                 {mode === 'druidic-warrior' && (
                                                     <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '480px' }}>
                                                         <div style={{ fontSize: '0.85rem', color: '#166534', lineHeight: '1.5' }}>
                                                             <strong>Druidic Warrior.</strong> You learn two Druid cantrips of your choice (see the Druid class's section for a list of Druid spells). Guidance and Starry Wisp are recommended. The chosen cantrips count as Ranger spells for you, and Wisdom is your spellcasting ability for them. Whenever you gain a Ranger level, you can replace one of these cantrips with another Druid cantrip.
                                                         </div>
                                                         <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#15803d', marginTop: '4px' }}>Choose 2 Druid Cantrips (Recommended: Guidance & Starry Wisp):</div>
                                                         <CustomSelect
                                                             value={choice1}
                                                             onChange={(e) => handleFeatureChoice(index, featureKey, 1, e.target.value)}
                                                             style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                         >
                                                             <option value="">-- Choose 1st Cantrip (Recommended: Guidance) --</option>
                                                             {druidCantrips.map(sp => {
                                                                 const isRec = sp.spell_name === 'Guidance' || sp.spell_name === 'Starry Wisp';
                                                                 return <option key={sp.spell_id} value={sp.spell_id} disabled={sp.spell_id === choice2}>{sp.spell_name}{isRec ? ' (Recommended)' : ''}</option>;
                                                             })}
                                                         </CustomSelect>
                                                         <CustomSelect
                                                             value={choice2}
                                                             onChange={(e) => handleFeatureChoice(index, featureKey, 2, e.target.value)}
                                                             style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                         >
                                                             <option value="">-- Choose 2nd Cantrip (Recommended: Starry Wisp) --</option>
                                                             {druidCantrips.map(sp => {
                                                                 const isRec = sp.spell_name === 'Guidance' || sp.spell_name === 'Starry Wisp';
                                                                 return <option key={sp.spell_id} value={sp.spell_id} disabled={sp.spell_id === choice1}>{sp.spell_name}{isRec ? ' (Recommended)' : ''}</option>;
                                                             })}
                                                         </CustomSelect>
                                                     </div>
                                                 )}
                                             </div>
                                         );
                                     }

                                     if (f.name === "Hunter's Prey") {
                                         isChoice = false;
                                         const selectedOption = cl.featureChoices?.[featureKey]?.[0] || '';
                                         const intro = "<p style='margin-bottom: 8px; line-height: 1.6;'>You gain one of the following feature options of your choice. Whenever you finish a Short or Long Rest, you can replace the chosen option with the other one.</p>";
                                         if (selectedOption === 'Colossus Slayer') {
                                             descHtml = intro + "<p style='margin-bottom: 0; line-height: 1.6;'><strong>Colossus Slayer.</strong> Your tenacity can wear down even the most resilient foes. When you hit a creature with a weapon, the weapon deals an extra 1d8 damage to the target if it's missing any of its Hit Points. You can deal this extra damage only once per turn.</p>";
                                         } else if (selectedOption === 'Horde Breaker') {
                                             descHtml = intro + "<p style='margin-bottom: 0; line-height: 1.6;'><strong>Horde Breaker.</strong> Once on each of your turns when you make an attack with a weapon, you can make another attack with the same weapon against a different creature that is within 5 feet of the original target, that is within the weapon's range, and that you haven't attacked this turn.</p>";
                                         } else {
                                             descHtml = intro;
                                         }

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '450px', padding: '12px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Choose 1 Option (Hunter's Prey):</div>
                                                 <CustomSelect
                                                     value={selectedOption}
                                                     onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose Hunter's Prey Option --</option>
                                                     <option value="Colossus Slayer">Colossus Slayer (Extra 1d8 dmg to damaged target 1/turn)</option>
                                                     <option value="Horde Breaker">Horde Breaker (Extra attack vs adjacent foe)</option>
                                                 </CustomSelect>
                                             </div>
                                         );
                                     }

                                     if (f.name === "Defensive Tactics") {
                                         isChoice = false;
                                         const selectedOption = cl.featureChoices?.[featureKey]?.[0] || '';
                                         const intro = "<p style='margin-bottom: 8px; line-height: 1.6;'>You gain one of the following feature options of your choice. Whenever you finish a Short or Long Rest, you can replace the chosen option with the other one.</p>";
                                         if (selectedOption === 'Escape the Horde') {
                                             descHtml = intro + "<p style='margin-bottom: 0; line-height: 1.6;'><strong>Escape the Horde.</strong> Opportunity Attacks have Disadvantage against you.</p>";
                                         } else if (selectedOption === 'Multiattack Defense') {
                                             descHtml = intro + "<p style='margin-bottom: 0; line-height: 1.6;'><strong>Multiattack Defense.</strong> When a creature hits you with an attack roll, that creature has Disadvantage on all other attack rolls against you this turn.</p>";
                                         } else {
                                             descHtml = intro;
                                         }

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '450px', padding: '12px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Choose 1 Option (Defensive Tactics):</div>
                                                 <CustomSelect
                                                     value={selectedOption}
                                                     onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose Defensive Tactics Option --</option>
                                                     <option value="Escape the Horde">Escape the Horde (Disadvantage on Opportunity Attacks vs you)</option>
                                                     <option value="Multiattack Defense">Multiattack Defense (Disadvantage on subsequent attacks from hitting foe)</option>
                                                 </CustomSelect>
                                             </div>
                                         );
                                     }
                                 }

                                 // --- Rogue Feature Choices ---
                                 const isRogueClass = (cl.classId || cl.class_id || cl.name || classInfo?.class_id || classInfo?.class_name || '').toLowerCase() === 'rogue';
                                 if (isRogueClass) {
                                     if (f.name === "Thieves' Cant" || f.name.includes("Thieves' Cant")) {
                                         isChoice = false;
                                         const selectedLang = cl.featureChoices?.[featureKey]?.[0] || '';
                                         const ROGUE_LANGS = ["Abyssal", "Celestial", "Common", "Common Sign Language", "Deep Speech", "Draconic", "Druidic", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Infernal", "Orc", "Primordial", "Sylvan", "Undercommon"];
                                         descHtml = "<p style='margin-bottom: 0; line-height: 1.6;'>You picked up various languages in the communities where you plied your roguish talents. You know Thieves' Cant and one other language of your choice, which you choose from the language tables in \"Character Creation.\"</p>";

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '450px', padding: '12px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Choose 1 Bonus Language (alongside Thieves' Cant):</div>
                                                 <CustomSelect
                                                     value={selectedLang}
                                                     onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose 1 Language --</option>
                                                     {ROGUE_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                                                 </CustomSelect>
                                             </div>
                                         );
                                     }
                                 }

                                 // --- Sorcerer Feature Choices ---
                                 const isSorcererClass = (cl.classId || cl.class_id || cl.name || classInfo?.class_id || classInfo?.class_name || '').toLowerCase() === 'sorcerer';
                                 if (isSorcererClass) {
                                     const METAMAGIC_OPTIONS = [
                                         { name: "Careful Spell", cost: "1 SP", desc: "Protect allies from saving throw spells." },
                                         { name: "Distant Spell", cost: "1 SP", desc: "Double spell range or make Touch 30 ft." },
                                         { name: "Empowered Spell", cost: "1 SP", desc: "Reroll damage dice up to CHA modifier." },
                                         { name: "Extended Spell", cost: "1 SP", desc: "Double spell duration up to 24 hrs + Adv. on Conc." },
                                         { name: "Heightened Spell", cost: "2 SP", desc: "Give one target Disadvantage on saving throw." },
                                         { name: "Quickened Spell", cost: "2 SP", desc: "Change Action casting time to Bonus Action." },
                                         { name: "Seeking Spell", cost: "1 SP", desc: "Reroll missed attack roll." },
                                         { name: "Subtle Spell", cost: "1 SP", desc: "Cast spell without Verbal or Somatic components." },
                                         { name: "Transmuted Spell", cost: "1 SP", desc: "Swap elemental damage type (Acid, Cold, Fire, Lightning, Poison, Thunder)." },
                                         { name: "Twinned Spell", cost: "1 SP", desc: "Increase effective spell level by 1 for multi-target spells." }
                                     ];

                                     if (f.name === 'Metamagic') {
                                         isChoice = false;
                                         const quota = cl.level >= 17 ? 6 : (cl.level >= 10 ? 4 : 2);
                                         const selectedMetas = Array.isArray(cl.featureChoices?.['Metamagic_Lv2']) ? cl.featureChoices['Metamagic_Lv2'] : [];

                                         if (f.level === 2) {
                                             descHtml = `<p style="margin-bottom: 8px; line-height: 1.6;">Because your magic flows from within, you can alter your spells to suit your needs. You gain Metamagic options of your choice to temporarily modify spells you cast.</p>`;

                                             const toggleMeta = (metaName) => {
                                                 let current = [...selectedMetas];
                                                 if (current.includes(metaName)) {
                                                     current = current.filter(m => m !== metaName);
                                                 } else {
                                                     if (current.length >= quota) {
                                                         alert(`You can select up to ${quota} Metamagic options at this level.`);
                                                         return;
                                                     }
                                                     current.push(metaName);
                                                 }
                                                 setCharacterState(prev => {
                                                     const newClassList = [...prev.classData.classes];
                                                     const curChoices = newClassList[index].featureChoices || {};
                                                     newClassList[index] = {
                                                         ...newClassList[index],
                                                         featureChoices: {
                                                             ...curChoices,
                                                             'Metamagic_Lv2': current
                                                         }
                                                     };
                                                     return {...prev, classData: {...prev.classData, classes: newClassList}};
                                                 });
                                             };

                                             customUI = (
                                                 <div style={{ marginTop: '12px', padding: '14px', backgroundColor: 'var(--bg-white)', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                     <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#711a19', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                         <span>Choose Metamagic Options ({selectedMetas.length}/{quota}):</span>
                                                         <span style={{ fontSize: '0.75rem', color: selectedMetas.length === quota ? '#16a34a' : '#ea580c' }}>
                                                             {selectedMetas.length === quota ? 'Maximum reached' : `${quota - selectedMetas.length} selections remaining`}
                                                         </span>
                                                     </div>
                                                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                                                         {METAMAGIC_OPTIONS.map(opt => {
                                                             const isChecked = selectedMetas.includes(opt.name);
                                                             const isDisabled = !isChecked && selectedMetas.length >= quota;
                                                             return (
                                                                 <label 
                                                                     key={opt.name} 
                                                                     style={{ 
                                                                         display: 'flex', 
                                                                         alignItems: 'flex-start', 
                                                                         gap: '8px', 
                                                                         padding: '8px 10px', 
                                                                         borderRadius: '6px', 
                                                                         backgroundColor: isChecked ? '#fef2f2' : 'var(--bg-white)', 
                                                                         border: isChecked ? '1px solid #f87171' : '1px solid #e5e7eb',
                                                                         cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                         opacity: isDisabled ? 0.5 : 1
                                                                     }}
                                                                 >
                                                                     <input 
                                                                         type="checkbox" 
                                                                         checked={isChecked} 
                                                                         disabled={isDisabled}
                                                                         onChange={() => toggleMeta(opt.name)}
                                                                         style={{ marginTop: '3px', accentColor: '#711a19' }}
                                                                     />
                                                                     <div style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                                                                         <strong style={{ color: 'var(--color-ink)' }}>{opt.name}</strong> <span style={{ fontSize: '0.72rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>{opt.cost}</span>
                                                                         <div style={{ color: 'var(--color-gray)', fontSize: '0.75rem', marginTop: '2px' }}>{opt.desc}</div>
                                                                     </div>
                                                                 </label>
                                                             );
                                                         })}
                                                     </div>
                                                 </div>
                                             );
                                         } else {
                                             return null;
                                         }
                                     }

                                     if (f.name === 'Elemental Affinity') {
                                         isChoice = false;
                                         const DAMAGE_TYPES = ['Acid', 'Cold', 'Fire', 'Lightning', 'Poison'];
                                         const selectedDamage = cl.featureChoices?.[featureKey]?.[0] || '';

                                         descHtml = `<p style="margin-bottom: 8px; line-height: 1.6;">Your draconic magic has an affinity with a damage type associated with Dragons. Choose one of those types:</p>`;

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px', padding: '12px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Choose Damage Type:</div>
                                                 <CustomSelect
                                                     value={selectedDamage}
                                                     onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose 1 Damage Type --</option>
                                                     {DAMAGE_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                                 </CustomSelect>
                                             </div>
                                         );
                                     }
                                 }

                                 // --- Warlock Feature Choices ---
                                 const isWarlockClass = (cl.classId || cl.class_id || cl.name || classInfo?.class_id || classInfo?.class_name || '').toLowerCase() === 'warlock';
                                 if (isWarlockClass) {
                                     const getWarlockInvocationQuota = (lvl) => {
                                         if (lvl >= 18) return 10;
                                         if (lvl >= 15) return 9;
                                         if (lvl >= 12) return 8;
                                         if (lvl >= 9) return 7;
                                         if (lvl >= 7) return 6;
                                         if (lvl >= 5) return 5;
                                         if (lvl >= 2) return 3;
                                         if (lvl >= 1) return 1;
                                         return 0;
                                     };

                                     if (f.name === 'Eldritch Invocations') {
                                         isChoice = false;
                                         if (f.level !== 1) return null;

                                         const quota = getWarlockInvocationQuota(cl.level);
                                         const rawChoices = cl.featureChoices?.['Eldritch_Invocations'];
                                         const selectedInvs = (Array.isArray(rawChoices) ? rawChoices : []).flat(Infinity).map(x => typeof x === 'string' ? x : '');

                                         descHtml = `<p style="margin-bottom: 8px; line-height: 1.6;">You have unearthed Eldritch Invocations, pieces of forbidden knowledge that imbue you with an abiding magical ability. You gain invocations of your choice as you gain Warlock levels (Choose up to ${quota} invocations at this level):</p>`;

                                         const getMinLv = (prq) => {
                                             if (!prq) return 1;
                                             const m = prq.match(/\bLevel\s+(\d+)\+/i);
                                             return m ? parseInt(m[1], 10) : 1;
                                         };

                                         const sortedInvs = [...WARLOCK_INVOCATIONS].sort((a, b) => {
                                             const lA = getMinLv(a.prereq);
                                             const lB = getMinLv(b.prereq);
                                             if (lA !== lB) return lA - lB;
                                             return a.name.localeCompare(b.name);
                                         });

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '480px' }}>
                                                 {Array.from({ length: quota }, (_, sIdx) => sIdx).map(slotIdx => {
                                                     const currentChoice = selectedInvs[slotIdx] || '';
                                                     const toggleKey = `inv_detail_${slotIdx}`;
                                                     const isShowing = showFeatDetails[`${index}-${toggleKey}`];
                                                     const invObj = sortedInvs.find(x => x.name === currentChoice);

                                                     return (
                                                         <div key={`inv-slot-${slotIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                             <CustomSelect
                                                                 value={currentChoice}
                                                                 onChange={(e) => handleFeatureChoice(index, 'Eldritch_Invocations', slotIdx, e.target.value)}
                                                                 style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                             >
                                                                 <option value="">-- Choose Eldritch Invocation #{slotIdx + 1} --</option>
                                                                 {sortedInvs.map(opt => {
                                                                     let isLvlBlocked = false;
                                                                     const matchLvl = opt.prereq?.match(/\bLevel\s+(\d+)\+/i);
                                                                     if (matchLvl && cl.level < parseInt(matchLvl[1], 10)) {
                                                                         isLvlBlocked = true;
                                                                     }
                                                                     const otherChosen = selectedInvs.filter((_, i) => i !== slotIdx);
                                                                     let isDepBlocked = false;
                                                                     if (opt.prereq?.includes('Pact of the Blade') && !otherChosen.includes('Pact of the Blade')) isDepBlocked = true;
                                                                     if (opt.prereq?.includes('Pact of the Tome') && !otherChosen.includes('Pact of the Tome')) isDepBlocked = true;
                                                                     if (opt.prereq?.includes('Pact of the Chain') && !otherChosen.includes('Pact of the Chain')) isDepBlocked = true;
                                                                     if (opt.prereq?.includes('Thirsting Blade') && !otherChosen.includes('Thirsting Blade')) isDepBlocked = true;

                                                                     const isDuplicate = otherChosen.includes(opt.name);
                                                                     const disabled = isLvlBlocked || isDepBlocked || isDuplicate;

                                                                     let suffix = '';
                                                                     if (isDuplicate) suffix = ' (Selected)';
                                                                     else if (opt.prereq) {
                                                                         const cleanPrq = opt.prereq.replace(/^Prerequisite:\s*/i, '');
                                                                         suffix = ` (${cleanPrq})`;
                                                                     }

                                                                     return (
                                                                         <option key={opt.name} value={opt.name} disabled={disabled}>
                                                                             {opt.name}{suffix}
                                                                         </option>
                                                                     );
                                                                 })}
                                                             </CustomSelect>

                                                             {invObj && (
                                                                 <div style={{ marginLeft: '2px', marginBottom: '4px' }}>
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => setShowFeatDetails(prev => ({ ...prev, [`${index}-${toggleKey}`]: !prev[`${index}-${toggleKey}`] }))}
                                                                         style={{ fontSize: '0.78rem', color: '#711a19', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 'bold', textDecoration: 'underline' }}
                                                                     >
                                                                         {isShowing ? `Hide Details (${invObj.name})` : `Show Details (${invObj.name})`}
                                                                     </button>
                                                                     {isShowing && (
                                                                         <div style={{ marginTop: '6px', padding: '10px', backgroundColor: 'var(--bg-white)', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.82rem', color: '#374151', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml('', invObj.desc) }}></div>
                                                                     )}
                                                                 </div>
                                                             )}
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                         );
                                     }

                                     if (f.name === 'Fiendish Resilience') {
                                         isChoice = false;
                                         const RESILIENCE_TYPES = ['Acid', 'Bludgeoning', 'Cold', 'Fire', 'Lightning', 'Necrotic', 'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'];
                                         const selectedType = cl.featureChoices?.['Fiendish Resilience']?.[0] || '';

                                         descHtml = `<p style="margin-bottom: 8px; line-height: 1.6;">Choose one damage type, other than Force, whenever you finish a Short or Long Rest. You have Resistance to that damage type until you choose a different one:</p>`;

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px', padding: '12px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Choose Damage Resistance Type:</div>
                                                 <CustomSelect
                                                     value={selectedType}
                                                     onChange={(e) => handleFeatureChoice(index, 'Fiendish Resilience', 0, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose 1 Type --</option>
                                                     {RESILIENCE_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                                 </CustomSelect>
                                             </div>
                                         );
                                     }

                                     if (f.name.startsWith('Mystic Arcanum')) {
                                         isChoice = false;
                                         const matchLvl = f.name.match(/\blevel\s+(\d+)\b/i);
                                         const arcanumLvl = matchLvl ? parseInt(matchLvl[1], 10) : (f.level === 13 ? 7 : (f.level === 15 ? 8 : (f.level === 17 ? 9 : 6)));
                                         const selectedSpellId = cl.featureChoices?.[featureKey]?.[0] || '';

                                         const warlockClassObj = dbData.classes?.find(c => (c.class_id || c.name || '').toLowerCase() === 'warlock');
                                         const warlockSpellListIds = (() => {
                                             try {
                                                 return warlockClassObj?.spell_list ? (typeof warlockClassObj.spell_list === 'string' ? JSON.parse(warlockClassObj.spell_list) : warlockClassObj.spell_list) : [];
                                             } catch { return []; }
                                         })();

                                         const warlockHighSpells = (dbData.spells || []).filter(s => {
                                             if (parseInt(s.spell_level, 10) !== arcanumLvl) return false;
                                             return warlockSpellListIds.includes(s.spell_id);
                                         }).sort((a, b) => a.spell_name.localeCompare(b.spell_name));

                                         descHtml = `<p style="margin-bottom: 8px; line-height: 1.6;">Your patron bestows upon you a magical secret called an arcanum. Choose one level ${arcanumLvl} Warlock spell as this arcanum:</p>`;

                                         customUI = (
                                             <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '450px', padding: '12px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                 <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Choose Mystic Arcanum Spell (Lv.{arcanumLvl}):</div>
                                                 <CustomSelect
                                                     value={selectedSpellId}
                                                     onChange={(e) => handleFeatureChoice(index, featureKey, 0, e.target.value)}
                                                     style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)' }}
                                                 >
                                                     <option value="">-- Choose Lv.{arcanumLvl} Spell --</option>
                                                     {warlockHighSpells.map(sp => <option key={sp.spell_id} value={sp.spell_id}>{sp.spell_name}</option>)}
                                                 </CustomSelect>
                                             </div>
                                         );
                                     }
                                 }

                                 if (isChoice && !customUI && finalOptions.length > 0) {
                                     const curSelected = Array.isArray(cl.featureChoices?.[featureKey]) ? cl.featureChoices[featureKey] : [];
                                     customUI = (
                                         <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                             {warningMessage && <div style={{ fontSize: '0.8rem', color: '#ea580c' }}>{warningMessage}</div>}
                                             {chooseAmount > 1 ? (
                                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px', marginTop: '4px' }}>
                                                     {Array.from({ length: chooseAmount }).map((_, cIdx) => {
                                                         const val = curSelected[cIdx] || '';
                                                         const otherSelections = curSelected.filter((_, idx) => idx !== cIdx);
                                                         return (
                                                             <CustomSelect
                                                                 key={cIdx}
                                                                 value={val}
                                                                 onChange={(e) => {
                                                                     const newSelected = [...curSelected];
                                                                     newSelected[cIdx] = e.target.value;
                                                                     updateClass(index, `featureChoices.${featureKey}`, newSelected);
                                                                 }}
                                                                 style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                                             >
                                                                 <option value="">-- Choose Option {cIdx + 1} --</option>
                                                                 {finalOptions.map(opt => (
                                                                     <option key={opt} value={opt} disabled={otherSelections.includes(opt)}>
                                                                         {opt}
                                                                     </option>
                                                                 ))}
                                                             </CustomSelect>
                                                         );
                                                     })}
                                                 </div>
                                             ) : (
                                                 <CustomSelect
                                                     value={curSelected[0] || ''}
                                                     onChange={(e) => updateClass(index, `featureChoices.${featureKey}`, [e.target.value])}
                                                     style={{ maxWidth: '300px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                                 >
                                                     <option value="">-- Choose Option --</option>
                                                     {finalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                 </CustomSelect>
                                             )}
                                         </div>
                                     );
                                 } else if (warningMessage && !customUI) {
                                     customUI = <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#ea580c' }}>{warningMessage}</div>;
                                 }

                                 return (
                                   <li key={i} style={{ marginBottom: '12px' }}>
                                     <div style={{ fontWeight: '800', color: '#711a19', fontSize: '0.98rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                       <span>{f.name}</span>
                                       <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#475569', backgroundColor: '#e2e8f0', padding: '1px 8px', borderRadius: '4px' }}>Lv. {f.level}</span>
                                     </div>
                                     <ExpandableDesc htmlContent={descHtml} />
                                     {customUI}
                                   </li>
                                 );
                               })}
                             </ul>
                           );
                        })()}
                      </div>
                    </div>
                  );
                })}

                {availableClassesForMulti.length > 0 && totalLevel < 20 && (
                  <div className="add-multiclass" style={{ marginTop: '20px', textAlign: 'center' }}>
                    <CustomSelect 
                      onChange={(e) => { if(e.target.value) setPreviewClassId(e.target.value); e.target.value = ""; }}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: '1px dashed #d1d5db', cursor: 'pointer', backgroundColor: 'var(--bg-white)', color: 'var(--color-gray)' }}
                    >
                      <option value="">+ Add Multiclass</option>
                      {availableClassesForMulti.map(c => (
                        <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                      ))}
                    </CustomSelect>
                  </div>
                )}
              </div>
            )}
            </>
          )}
        </div>
      );
}
