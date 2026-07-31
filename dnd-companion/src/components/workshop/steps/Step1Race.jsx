import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { CustomSelect, FeatChoiceEditor } from '../WorkshopWidgets';
import { resolveCharacterMechanics } from '../../../utils/mechanicsResolver';

export default function Step1Race({
  characterState,
  setCharacterState,
  dbData,
  loading,
  previewRaceId,
  setPreviewRaceId,
  resolvedMechanics,
  proficientSkills = []
}) {
  const [confirmChangeRace, setConfirmChangeRace] = useState(false);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState(true);

  const selectedRaceId = characterState.race?.id;
  const selectedRace = dbData.races?.find(r => r.species_id === selectedRaceId);
  const availableLineages = dbData.lineages?.filter(l => l.species_id === selectedRaceId) || [];
  
  // Define standard languages
  const standardLanguages = ["Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc"];
  const SPECIES_HIGHLIGHT_BADGES = {
    human: ['Versatile Feat', '+1 Skill'],
    elf: ['Darkvision 60ft', 'Fey Ancestry'],
    dwarf: ['Poison Resist', '+1 HP/Level'],
    dragonborn: ['Breath Weapon', 'Damage Resist'],
    tiefling: ['Fire Resist', 'Fiendish Spells'],
    goliath: ['Giant Ancestry', 'Powerful Build'],
    halfling: ['Lucky Rerolls', 'Brave'],
    orc: ['Relentless Endurance', 'Adrenaline Rush']
  };


  const handleLanguageToggle = (lang) => {
    const currentLangs = characterState.race?.languages || [];
    if (currentLangs.includes(lang)) {
      setCharacterState(prev => ({...prev, race: {...prev.race, languages: currentLangs.filter(l => l !== lang)}}));
    } else {
      if (currentLangs.length < 2) {
        setCharacterState(prev => ({...prev, race: {...prev.race, languages: [...currentLangs, lang]}}));
      } else {
        alert("You can select up to 2 languages only.");
      }
    }
  };
  
  const handleTraitChoice = (traitName, choice) => {
    setCharacterState(prev => ({...prev, race: {...prev.race, traitChoices: {...(prev.race?.traitChoices || {}), [traitName]: choice}}}));
  };

  const renderTraits = (raceObj, isInteractive = false) => {
    if (!raceObj || !raceObj.traits) return null;
    try {
      const traits = JSON.parse(raceObj.traits);
      if (!Array.isArray(traits)) return null;
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: '#711a19', marginBottom: '14px', fontSize: '1.05rem', fontWeight: '800', borderBottom: '2px solid #711a19', paddingBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-sparkles" style={{ color: '#711a19' }}></i> TRAITS & ABILITIES
          </h4>
          <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--color-gray)', fontSize: '0.9rem' }}>
            <li style={{ marginBottom: '12px' }}>
              <div style={{ marginBottom: '4px' }}><strong style={{ color: '#711a19', fontWeight: '800', fontSize: '0.95rem', marginRight: '6px' }}>Creature Type:</strong> <span style={{ color: '#334155' }}>Humanoid</span></div>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <div style={{ marginBottom: '4px' }}><strong style={{ color: '#711a19', fontWeight: '800', fontSize: '0.95rem', marginRight: '6px' }}>Size:</strong> <span style={{ color: '#334155' }}>{raceObj.size}</span></div>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <div style={{ marginBottom: '4px' }}><strong style={{ color: '#711a19', fontWeight: '800', fontSize: '0.95rem', marginRight: '6px' }}>Speed:</strong> <span style={{ color: '#334155' }}>{raceObj.speed} ft.</span></div>
            </li>
            {traits.map((t, idx) => {
              const hasDirectOptions = t.logic && (t.logic.type === 'choice' || t.logic.type === 'proficiency') && t.logic.options;
              const hasNestedOptions = t.logic && t.logic.choices && t.logic.choices.options;
              let options = hasDirectOptions ? t.logic.options : (hasNestedOptions ? t.logic.choices.options : null);
              
              // Do not show duplicate dropdown if choice is already represented by Lineage / Subrace cards below
              if (availableLineages.length > 0 && (t.name === 'Draconic Ancestry' || t.name === 'Giant Ancestry' || t.name === 'Elven Lineage')) {
                options = null;
              }
              
              // Dynamically load Origin feats for Versatile
              if (t.name === 'Versatile' && dbData.feats) {
                options = dbData.feats.filter(f => f.feat_type && f.feat_type.toLowerCase().includes('origin')).map(f => f.feat_name);
              }
              
              return (
                <li key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong style={{ color: '#711a19', fontWeight: '800', fontSize: '0.95rem', marginRight: '6px' }}>{t.name}:</strong>
                    <span style={{ color: '#334155', lineHeight: '1.6' }}>{t.display || t.desc}</span>
                  </div>
                  {isInteractive && options && (
                    <div style={{ marginTop: '4px' }}>
                      <CustomSelect 
                        value={characterState.race?.traitChoices?.[t.name] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleTraitChoice(t.name, val);
                          if (t.name === 'Versatile') {
                            const featObj = dbData.feats?.find(f => f.feat_name === val || f.feat_id === val);
                            const featId = featObj?.feat_id || val;
                            setCharacterState(prev => {
                              const prevFeats = (prev.feats || []).filter(f => typeof f === 'object' && f.source !== 'race_versatile');
                              if (featId) {
                                prevFeats.push({ id: featId, source: 'race_versatile', bonuses: {} });
                              }
                              return { ...prev, feats: prevFeats };
                            });
                          }
                        }}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem', width: '100%', maxWidth: '250px' }}
                      >
                        <option value="">-- Choose option for {t.name} --</option>
                        {options.map(opt => {
                          // Filter out skills selected in Versatile Feat bonuses (e.g. Time-Touched, Skilled, etc.)
                          if (t.name === 'Skillful') {
                            const versatileFeat = (characterState.feats || []).find(f => typeof f === 'object' && f.source === 'race_versatile');
                            const versatileSkillVal = versatileFeat?.bonuses?.skill1 || versatileFeat?.bonuses?.skill_proficiencies || versatileFeat?.bonuses?.skill;
                            const isChosenInVersatile = versatileSkillVal === opt && characterState.race?.traitChoices?.Skillful !== opt;
                            const isProficientElsewhere = (proficientSkills || []).includes(opt) && characterState.race?.traitChoices?.Skillful !== opt;
                            if (isChosenInVersatile || isProficientElsewhere) return null;
                          }
                          return <option key={opt} value={opt}>{opt}</option>;
                        })}
                      </CustomSelect>

                      {t.name === 'Versatile' && characterState.race?.traitChoices?.[t.name] && (() => {
                        const selectedVal = characterState.race.traitChoices[t.name];
                        const featObj = dbData.feats?.find(f => f.feat_name === selectedVal || f.feat_id === selectedVal);
                        const featId = featObj?.feat_id || selectedVal;
                        if (!featId) return null;
                        const versatileFeat = (characterState.feats || []).find(f => typeof f === 'object' && f.source === 'race_versatile');
                        const versatileSkills = Object.values(versatileFeat?.bonuses || {}).filter(val => typeof val === 'string' && val);
                        const activeProficientSkills = Array.from(new Set([
                          ...(proficientSkills || []),
                          ...(resolvedMechanics?.proficiencies?.skills || []),
                          characterState.race?.traitChoices?.Skillful || ''
                        ])).filter(Boolean);
                        return (
                          <FeatChoiceEditor
                            featId={featId}
                            currentBonuses={(characterState.feats?.find(f => typeof f === 'object' && f.source === 'race_versatile')?.bonuses) || {}}
                            onBonusChange={(newBonuses) => {
                              setCharacterState(prev => {
                                const prevFeats = prev.feats || [];
                                let found = false;
                                const updatedFeats = prevFeats.map(f => {
                                  if (typeof f === 'object' && f.source === 'race_versatile') {
                                    found = true;
                                    return { ...f, bonuses: newBonuses };
                                  }
                                  return f;
                                });
                                if (!found) {
                                  updatedFeats.push({ id: featId, source: 'race_versatile', bonuses: newBonuses });
                                }
                                return { ...prev, feats: updatedFeats };
                              });
                            }}
                            dbData={dbData}
                            proficientSkills={activeProficientSkills}
                            allKnownSpellIds={[]}
                            style={{ marginTop: '10px', maxWidth: '350px' }}
                          />
                        );
                      })()}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );
    } catch {
      return null; // Not valid JSON
    }
  };

  return (
    <div className="builder-step-content animate-fade-in">
      <h3 className="step-title">Choose Species (Race)</h3>
      <p className="step-subtitle" style={{ marginBottom: '12px' }}>Your species determines your fundamental physical traits, innate talents, and heritage.</p>

      {/* 💡 Beginner Guide Banner for Step 1 (Only visible BEFORE selecting a race) */}
      {!selectedRace && (
        <div style={{ backgroundColor: '#fef8f8', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
          <div 
            onClick={() => setShowBeginnerGuide(!showBeginnerGuide)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 'bold', color: '#711a19', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-compass-drafting" style={{ color: '#711a19' }}></i>
              คำแนะนำสำหรับผู้เล่นใหม่: เผ่าพันธุ์ (Species) คืออะไร?
            </div>
            <span style={{ fontSize: '0.8rem', color: '#711a19', fontWeight: 'bold' }}>
              {showBeginnerGuide ? 'ซ่อนคู่มือ ▲' : 'แสดงคู่มือ ▼'}
            </span>
          </div>
          {showBeginnerGuide && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #fca5a5', fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.6' }}>
              • <strong>เผ่าพันธุ์คืออะไร?:</strong> เผ่าพันธุ์ (เช่น มนุษย์, เอลฟ์, คนแคระ) คือจุดกำเนิดทางกายภาพ มอบโบนัสระยะมองเห็นในความมืด (Darkvision), ความเร็วเคลื่อนที่ และพรสวรรค์ประจำเผ่า<br />
              • <strong>เสรีภาพในการเลือก:</strong> ใน D&D 2024 คุณสามารถเลือกเผ่าพันธุ์ใดเล่นคู่กับคลาสอาชีพใดก็ได้ตามจินตนาการ โดยไม่มีข้อจำกัดเรื่องสเตตัสเผ่าแบบเดิมอีกต่อไป<br />
              • <strong>วิธีใช้งาน:</strong> คลิกการ์ดเผ่าพันธุ์เพื่อเปิดดูรายละเอียด จากนั้นกด <em>"Select This Species"</em> เพื่อยืนยัน
            </div>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="placeholder-content"><i className="fa-solid fa-circle-notch fa-spin"></i><p>Loading...</p></div>
      ) : !selectedRace ? (
        <>
          <div className="race-selection-container">
            <div className="grid-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {dbData.races?.map(r => (
                <div 
                  key={r.species_id} 
                  className="selection-card"
                  onClick={() => setPreviewRaceId(r.species_id)}
                  style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--bg-white)', transition: 'all 0.2s' }}
                >
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: 'bold' }}>{r.species_name}</h4>
                  
                  {/* Speed & Size Pill Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fa-solid fa-person-running" style={{ color: '#711a19' }}></i> {r.speed} ft
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fa-solid fa-ruler-vertical" style={{ color: '#711a19' }}></i> {r.size}
                    </span>
                  </div>

                  {/* Clean Subtle Highlight Badges (Supports DB Custom Species & Admin Tags) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(() => {
                      let badges = null;
                      if (r.highlights) {
                        try { badges = Array.isArray(r.highlights) ? r.highlights : JSON.parse(r.highlights); } catch { badges = [r.highlights]; }
                      } else if (r.tags) {
                        badges = typeof r.tags === 'string' ? r.tags.split(',').map(s=>s.trim()) : r.tags;
                      }
                      if (!badges || !Array.isArray(badges) || badges.length === 0) {
                        badges = SPECIES_HIGHLIGHT_BADGES[r.species_id?.toLowerCase()] || ['Species Trait'];
                      }
                      return badges.map((badgeText, bIdx) => (
                        <span key={bIdx} style={{ fontSize: '0.7rem', fontWeight: '600', backgroundColor: '#fef8f8', color: '#711a19', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px' }}>
                          • {badgeText}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popup Modal for Race Preview (Portaled to document.body) */}
          {previewRaceId && createPortal((
            <div className="modal-overlay" onClick={() => setPreviewRaceId(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
              <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-white)', padding: '28px', borderRadius: '12px', maxWidth: '650px', width: '92%', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                {(() => {
                  const previewRace = dbData.races?.find(r => r.species_id === previewRaceId);
                  if (!previewRace) return null;
                  return (
                    <>
                      {/* Header Title */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #711a19', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                          <h2 style={{ margin: 0, color: '#711a19', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-dna" style={{ color: '#711a19' }}></i>
                            {previewRace.species_name}
                          </h2>
                        </div>
                        <button onClick={() => setPreviewRaceId(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>

                      {/* Speed & Size Badges */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-person-running" style={{ color: '#711a19' }}></i> Speed: {previewRace.speed} ft
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-ruler-vertical" style={{ color: '#711a19' }}></i> Size: {previewRace.size}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <div style={{ color: '#334155', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '20px', backgroundColor: '#fcfcfc', padding: '14px', borderRadius: '8px', borderLeft: '3px solid #711a19' }} dangerouslySetInnerHTML={{ __html: previewRace.species_desc || 'No description available.' }}></div>
                      
                      {/* Traits & Abilities List */}
                      {renderTraits(previewRace, false)}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <button onClick={() => setPreviewRaceId(null)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          ← ยกเลิก (Back)
                        </button>
                        <button 
                          onClick={() => {
                            setCharacterState(prev => ({...prev, race: { id: previewRace.species_id, lineageId: null, languages: [], traits: [], asiChoices: {} }}));
                            setPreviewRaceId(null);
                          }} 
                          style={{ padding: '10px 24px', border: 'none', backgroundColor: '#711a19', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(113,26,25,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <i className="fa-solid fa-check"></i>
                          ✓ เลือกเผ่าพันธุ์นี้ (Select Species)
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          ), document.body)}
        </>
      ) : (
        // Selected Race Details View
        <div className="selected-race-details animate-slide-down">
          
          {/* Checklist Status Banner for Selected Species */}
          {(() => {
            const selectedLangs = characterState.race?.languages || [];
            const langComplete = selectedLangs.length === 2;
            const requiresLineage = availableLineages.length > 0;
            const lineageSelected = !requiresLineage || Boolean(characterState.race?.lineageId);
            const isHuman = selectedRace.species_id === 'human';
            const skillfulSelected = !isHuman || Boolean(characterState.race?.traitChoices?.Skillful);
            const versatileSelected = !isHuman || Boolean(characterState.race?.traitChoices?.Versatile);

            const allComplete = langComplete && lineageSelected && skillfulSelected && versatileSelected;

            return (
              <div style={{ backgroundColor: allComplete ? '#f0fdf4' : '#fff7ed', border: allComplete ? '1px solid #bbf7d0' : '1px solid #fed7aa', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', color: allComplete ? '#15803d' : '#c2410c', fontSize: '0.9rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className={allComplete ? "fa-solid fa-circle-check" : "fa-solid fa-list-check"}></i>
                  {allComplete ? 'เลือกรายละเอียดเผ่าพันธุ์ครบถ้วนแล้ว พร้อมไป Step 2' : 'รายการที่ต้องเลือกในเผ่านี้ (Selection Checklist):'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#15803d', fontWeight: '600' }}>✓ เผ่า: {selectedRace.species_name}</span>
                  {requiresLineage && (
                    <span style={{ color: lineageSelected ? '#15803d' : '#dc2626', fontWeight: '600' }}>
                      {lineageSelected ? '✓ สายเลือด: เลือกแล้ว' : '⚠️ ยังไม่ได้เลือก Lineage / Subrace'}
                    </span>
                  )}
                  <span style={{ color: langComplete ? '#15803d' : '#dc2626', fontWeight: '600' }}>
                    {langComplete ? `✓ ภาษา: ${selectedLangs.join(', ')} (2/2)` : `⚠️ ภาษา: เลือกแล้ว ${selectedLangs.length}/2 ภาษา`}
                  </span>
                  {isHuman && (
                    <>
                      <span style={{ color: skillfulSelected ? '#15803d' : '#dc2626', fontWeight: '600' }}>
                        {skillfulSelected ? '✓ Skillful: เลือกแล้ว' : '⚠️ Skillful: ยังไม่ได้เลือก Skill'}
                      </span>
                      <span style={{ color: versatileSelected ? '#15803d' : '#dc2626', fontWeight: '600' }}>
                        {versatileSelected ? '✓ Versatile: เลือกแล้ว' : '⚠️ Versatile: ยังไม่ได้เลือก Feat'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fca5a5', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', color: '#711a19' }}>{selectedRace.species_name}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-gray)' }}>Speed: {selectedRace.speed}ft | Size: {selectedRace.size}</p>
            </div>
            <button 
              onClick={() => setConfirmChangeRace(true)}
              style={{ padding: '8px 16px', border: '1px solid #ef4444', backgroundColor: 'var(--bg-white)', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-rotate"></i> Change Species
            </button>
          </div>

          <div className="race-full-details" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'var(--bg-white)' }}>
              <div style={{ color: 'var(--color-gray)', fontSize: '0.95rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: selectedRace.species_desc || 'No description available.' }}></div>
              {renderTraits(selectedRace, true)}
              {(() => {
                const selectedLineage = availableLineages.find(l => l.lineage_id === characterState.race?.lineageId);
                if (selectedLineage && selectedLineage.traits) {
                  return (
                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
                      <h4 style={{ color: '#711a19', margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>
                        <i className="fa-solid fa-code-branch"></i> {selectedLineage.lineage_name} Traits
                      </h4>
                      {renderTraits({ traits: selectedLineage.traits, size: selectedRace.size, speed: selectedRace.speed }, true)}
                    </div>
                  );
                }
                return null;
              })()}
          </div>

          {availableLineages.length > 0 && (
            <div className="lineage-selection" style={{ marginBottom: '30px' }}>
              <h4 style={{ color: 'var(--color-ink)', marginBottom: '10px' }}><i className="fa-solid fa-code-branch"></i> Lineage / Subrace <span style={{ color: 'red' }}>*</span></h4>
              <div className="grid-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {availableLineages.map(l => {
                  const isSelected = characterState.race.lineageId === l.lineage_id;
                  return (
                    <div 
                      key={l.lineage_id} 
                      className={`selection-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        const cleanLineageName = l.lineage_name.replace(' Dragon Ancestry', '').replace(' Ancestry', '').trim();
                        setCharacterState(prev => ({
                          ...prev,
                          race: {
                            ...prev.race,
                            lineageId: l.lineage_id,
                            traitChoices: {
                              ...(prev.race?.traitChoices || {}),
                              'Draconic Ancestry': cleanLineageName,
                              'Giant Ancestry': cleanLineageName,
                              'Elven Lineage': l.lineage_name
                            }
                          }
                        }));
                      }}
                      style={{ padding: '16px', border: isSelected ? '2px solid #711a19' : '1px solid #d1d5db', borderRadius: '2px', cursor: 'pointer', backgroundColor: isSelected ? '#fef8f8' : 'var(--bg-white)', transition: 'all 0.2s', position: 'relative' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <h5 style={{ margin: 0, color: isSelected ? '#711a19' : 'var(--color-ink)', fontSize: '1.05rem', fontWeight: 'bold' }}>{l.lineage_name}</h5>
                        {isSelected && (
                          <span style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', padding: '2px 8px', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <i className="fa-solid fa-check"></i> SELECTED
                          </span>
                        )}
                      </div>
                      {l.lineage_desc && <p style={{ fontSize: '0.85rem', color: isSelected ? '#374151' : 'var(--color-gray)', margin: '0 0 8px 0', lineHeight: '1.4' }}>{l.lineage_desc}</p>}
                      {(() => {
                        if (!l.granted_spells) return null;
                        try {
                          const spells = typeof l.granted_spells === 'string' ? JSON.parse(l.granted_spells) : l.granted_spells;
                          if (!Array.isArray(spells) || spells.length === 0) return null;
                          return (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontSize: '0.78rem', color: '#1e293b' }}>
                              <strong style={{ color: '#711a19', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <i className="fa-solid fa-wand-magic-sparkles"></i> Lineage Spells:
                              </strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {spells.map((s, sIdx) => {
                                  const spId = s.spell_id || s.name || (s.is_choice ? `Choice (Level ${s.choice_level} Cantrip)` : 'Spell');
                                  const spObj = dbData?.spells?.find(sp => String(sp.spell_id) === String(spId) || sp.spell_name === spId);
                                  const spName = spObj ? spObj.spell_name : (s.name || spId);
                                  return (
                                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                        Lvl {s.level || 1}
                                      </span>
                                      <span style={{ fontWeight: '500' }}>{spName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        } catch { return null; }
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* Render Lineage Spells Choice if applicable */}
              {(() => {
                const selLineage = availableLineages.find(l => l.lineage_id === characterState.race.lineageId);
                if (selLineage && selLineage.granted_spells) {
                  try {
                    const spells = JSON.parse(selLineage.granted_spells);
                    
                    // Check if ANY spell requires an ability choice
                    let abilityOptions = [];
                    const spellWithAbilityChoice = spells.find(s => s.ability && s.ability.includes('or '));
                    if (spellWithAbilityChoice) {
                      abilityOptions = spellWithAbilityChoice.ability.split(',').map(a => a.replace('or ', '').trim());
                    }
                    
                    // Check if there is a spell choice
                    const choiceSpell = spells.find(s => s.is_choice === 1);
                    let spellOptions = [];
                    if (choiceSpell && choiceSpell.choice_list) {
                      const targetClass = dbData.classes?.find(c => c.class_id === choiceSpell.choice_list);
                      if (targetClass && targetClass.spell_list) {
                        try {
                          const listArray = JSON.parse(targetClass.spell_list);
                          spellOptions = dbData.spells?.filter(s => 
                            listArray.includes(s.spell_id) && parseInt(s.spell_level) === parseInt(choiceSpell.choice_level)
                          ) || [];
                        } catch { /* ignore */ }
                      }
                    }
                    
                    if (abilityOptions.length > 0 || choiceSpell) {
                      return (
                        <div className="lineage-spells-choice animate-slide-down" style={{ marginTop: '20px', padding: '15px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#fff' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: 'var(--color-ink)' }}><i className="fa-solid fa-wand-magic-sparkles"></i> Choose Lineage Spells</h5>
                          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {abilityOptions.length > 0 && (
                              <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gray)', marginBottom: '5px' }}>Spellcasting Ability <span style={{ color: 'red' }}>*</span></label>
                                <CustomSelect 
                                  value={characterState.race.lineageSpellAbility || ''}
                                  onChange={(e) => setCharacterState(prev => ({...prev, race: {...prev.race, lineageSpellAbility: e.target.value}}))}
                                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                >
                                  <option value="">-- Choose Ability --</option>
                                  {abilityOptions.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                  ))}
                                </CustomSelect>
                              </div>
                            )}
                            {choiceSpell && (
                              <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gray)', marginBottom: '5px' }}>Spell (Level {choiceSpell.choice_level}) <span style={{ color: 'red' }}>*</span></label>
                                <CustomSelect 
                                  value={characterState.race.lineageSpellChoice || ''}
                                  onChange={(e) => setCharacterState(prev => ({...prev, race: {...prev.race, lineageSpellChoice: e.target.value}}))}
                                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                >
                                  <option value="">-- Choose Spell --</option>
                                  {spellOptions.map(s => (
                                    <option key={s.spell_id} value={s.spell_id}>{s.spell_name}</option>
                                  ))}
                                </CustomSelect>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  } catch { /* ignore */ }
                }
                return null;
              })()}
            </div>
          )}

          <div className="language-selection" style={{ marginBottom: '30px' }}>
            <h4 style={{ color: 'var(--color-ink)', marginBottom: '5px' }}><i className="fa-solid fa-language"></i> Languages Known <span style={{ color: 'red' }}>*</span></h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', marginBottom: '10px' }}>Choose up to 2 bonus languages</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {standardLanguages.map(lang => {
                const isSelected = characterState.race.languages?.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => handleLanguageToggle(lang)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: isSelected ? '2px solid #711a19' : '1px solid #d1d5db',
                      backgroundColor: isSelected ? '#fef2f2' : 'var(--bg-white)',
                      color: isSelected ? '#711a19' : 'var(--color-gray)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      cursor: 'pointer'
                    }}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Choice for races with multiple size options */}
          {selectedRace.size && selectedRace.size.includes(' or ') && (
            <div className="size-selection" style={{ marginBottom: '30px' }}>
              <h4 style={{ color: 'var(--color-ink)', marginBottom: '5px' }}><i className="fa-solid fa-ruler"></i> Character Size <span style={{ color: 'red' }}>*</span></h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', marginBottom: '10px' }}>Your species allows you to choose your physical size</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selectedRace.size.split(' or ').map(sz => {
                  const isSelected = characterState.race.sizeChoice === sz.trim();
                  return (
                    <button
                      key={sz}
                      onClick={() => setCharacterState(prev => ({...prev, race: {...prev.race, sizeChoice: sz.trim()}}))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: isSelected ? '2px solid #711a19' : '1px solid #d1d5db',
                        backgroundColor: isSelected ? '#fef2f2' : 'var(--bg-white)',
                        color: isSelected ? '#711a19' : 'var(--color-gray)',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {sz.trim()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm Change Race Modal */}
          {confirmChangeRace && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
              <div className="modal-content animate-fade-in" style={{ backgroundColor: 'var(--bg-white)', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '15px' }}></i>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-ink)' }}>Are you sure?</h3>
                <p style={{ color: 'var(--color-gray)', marginBottom: '25px', fontSize: '0.95rem' }}>Changing your species will reset your lineage and language selections on this page.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => setConfirmChangeRace(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'var(--bg-white)', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                  <button 
                    onClick={() => {
                      setCharacterState(prev => ({...prev, race: { id: null, lineageId: null, languages: [], traits: [], asiChoices: {} }}));
                      setConfirmChangeRace(false);
                    }} 
                    style={{ padding: '8px 16px', border: 'none', backgroundColor: '#ef4444', color: 'var(--bg-white)', borderRadius: '6px', cursor: 'pointer', flex: 1 }}
                  >
                    Confirm Change Species
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
