import React, { useState } from 'react';
import {
  ALL_SKILLS_LIST,
  formatCleanName,
  getFeatName
} from '../../../utils/workshopHelpers';
import {
  CustomSelect,
  FeatChoiceEditor
} from '../WorkshopWidgets';


const BACKGROUND_HIGHLIGHT_BADGES = {
  acolyte: ['⛪ อาราม & ศรัทธา', '🔮 คาถา Magic Initiate'],
  artisan: ['🔨 ช่างฝีมือ & ค้าขาย', '💼 งานประดิษฐ์'],
  charlatan: ['🎭 หลอกลวง & ปลอมตัว', '🗝️ การต้มตุ๋น'],
  criminal: ['🗡️ โลกใต้ดิน & ย่องเบา', '🚨 ตื่นตัว Alert'],
  entertainer: ['🎶 การแสดง & เสียงเพลง', '💃 สร้างความบันเทิง'],
  farmer: ['🌾 เกษตรกร & อดทน', '💪 ร่างกายแข็งแกร่ง'],
  guard: ['🛡️ ยามอารักขา', '👁️ สังเกตการณ์'],
  guide: ['🧭 นำทาง & สำรวจป่า', '🌿 การเอาชีวิตรอด'],
  hermit: ['🏔️ ฤาษีสันโดษ', '📜 ค้นคว้าความลับ'],
  merchant: ['💼 เจรจาค้าขาย', '💰 มั่งคั่ง'],
  noble: ['🏰 ชนชั้นสูง & ยศถา', '👑 อำนาจบารมี'],
  sage: ['📚 ตำรา & ความรู้', '🔮 เวทมนตร์ศึกษา'],
  sailor: ['⛵ เดินเรือ & การทะเล', '🌊 อดทนต่อคลื่นลม'],
  soldier: ['⚔️ การรบ & วินัย', '💥 Savage Attacker'],
  wayfarer: ['🚶 นักเดินทาง', '🗝️ เอาตัวรอดในเมือง']
};

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

export default function Step3Background({
  characterState,
  setCharacterState,
  dbData,
  resolvedMechanics,
  proficientSkills = [],
  expertiseSkills = [],
  allKnownSpellIds = []
}) {
        const [showBeginnerGuide, setShowBeginnerGuide] = useState(true);
        const [bgSearchTerm, setBgSearchTerm] = useState('');
        const [bgStatFilter, setBgStatFilter] = useState('');
        const [bgFeatFilter, setBgFeatFilter] = useState('');
        const activeProficientSkills = Array.from(new Set([...(proficientSkills.length > 0 ? proficientSkills : (resolvedMechanics?.proficiencies?.skills || [])), ...(expertiseSkills.length > 0 ? expertiseSkills : (resolvedMechanics?.proficiencies?.expertise || []))]));

        const bgList = dbData.backgrounds || [];
        const selectedBgId = characterState.background.id;
        const selectedBg = bgList.find(b => b.background_id === selectedBgId);

        // Calculate current skills from all sources EXCEPT Background
        const currentNonBackgroundSkills = new Set();
        (characterState.proficiencies?.skills || []).forEach(s => currentNonBackgroundSkills.add(s));
        characterState.classData.classes.forEach(cl => {
            Object.values(cl.featureChoices || {}).forEach(v => {
                const items = Array.isArray(v) ? v : (typeof v === 'object' && v !== null ? Object.values(v) : [v]);
                items.forEach(s => {
                    if (typeof s === 'string' && ALL_SKILLS_LIST.includes(s)) currentNonBackgroundSkills.add(s);
                });
            });
        });
        (characterState.feats || []).forEach(feat => {
            if (feat.id === 'skilled') {
                if (feat.bonuses?.skill1) currentNonBackgroundSkills.add(feat.bonuses.skill1);
                if (feat.bonuses?.skill2) currentNonBackgroundSkills.add(feat.bonuses.skill2);
                if (feat.bonuses?.skill3) currentNonBackgroundSkills.add(feat.bonuses.skill3);
            }
        });
        if (characterState.race) {
            Object.values(characterState.race.traitChoices || {}).forEach(val => {
                if (typeof val === 'string' && ALL_SKILLS_LIST.includes(val)) {
                    currentNonBackgroundSkills.add(val);
                } else if (Array.isArray(val)) {
                    val.forEach(v => { if (typeof v === 'string' && ALL_SKILLS_LIST.includes(v)) currentNonBackgroundSkills.add(v); });
                }
            });
            const raceObj = dbData.races?.find(r => r.species_id === characterState.race.id);
            if (raceObj && raceObj.traits) {
                try {
                    const traits = typeof raceObj.traits === 'string' ? JSON.parse(raceObj.traits) : raceObj.traits;
                    if (Array.isArray(traits)) {
                        traits.forEach(t => {
                            if (t.logic && t.logic.granted && Array.isArray(t.logic.granted)) {
                                t.logic.granted.forEach(g => { if (typeof g === 'string' && ALL_SKILLS_LIST.includes(g)) currentNonBackgroundSkills.add(g); });
                            }
                        });
                    }
                } catch { /* ignore */ }
            }
            if (characterState.race.lineageId) {
                const lineageObj = dbData.lineages?.find(l => l.lineage_id === characterState.race.lineageId);
                if (lineageObj && lineageObj.traits) {
                    try {
                        const traits = typeof lineageObj.traits === 'string' ? JSON.parse(lineageObj.traits) : lineageObj.traits;
                        if (Array.isArray(traits)) {
                            traits.forEach(t => {
                                if (t.logic && t.logic.granted && Array.isArray(t.logic.granted)) {
                                    t.logic.granted.forEach(g => { if (typeof g === 'string' && ALL_SKILLS_LIST.includes(g)) currentNonBackgroundSkills.add(g); });
                                }
                            });
                        }
                    } catch { /* ignore */ }
                }
            }
        }

        const handleSelectBackground = (bgId) => {
           const bg = bgList.find(b => b.background_id === bgId);
           if (!bg) return;
           
           let originalSkills = [];
           let asiRules = null;
           let toolChoices = [];
           let featId = bg.feat_id;
           
           try {
             if (bg.skill_proficiencies) {
               const parsed = typeof bg.skill_proficiencies === 'string' ? JSON.parse(bg.skill_proficiencies) : bg.skill_proficiencies;
               const bgSkills = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.granted) ? parsed.granted : (Array.isArray(parsed?.logic?.granted) ? parsed.logic.granted : []));
               originalSkills = bgSkills.filter(s => typeof s === 'string' && ALL_SKILLS_LIST.includes(s));
             }
             if (bg.ability_scores) {
               const parsed = typeof bg.ability_scores === 'string' ? JSON.parse(bg.ability_scores) : bg.ability_scores;
               if (parsed.logic) asiRules = parsed.logic;
             }
             if (bg.tool_proficiencies) {
               const parsed = typeof bg.tool_proficiencies === 'string' ? JSON.parse(bg.tool_proficiencies) : bg.tool_proficiencies;
               const toolSkills = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.granted) ? parsed.granted : (Array.isArray(parsed?.logic?.granted) ? parsed.logic.granted : []));
               toolChoices = toolSkills.filter(s => typeof s === 'string');
             }
           } catch { /* ignore */ }
           
           const newFeats = characterState.feats ? characterState.feats.filter(f => f.source !== 'background') : [];
           if (featId) {
             newFeats.push({
               id: featId,
               source: 'background',
               bonuses: {},
               selections: {}
             });
           }

           setCharacterState(prev => ({
             ...prev,
             background: {
               id: bgId,
               asiRules: asiRules,
               originalSkills: originalSkills,
               toolChoices: toolChoices,
               replacedSkills: {}
             },
             feats: newFeats
           }));

           setTimeout(() => {
             const el = document.getElementById('selected-background-details');
             if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
           }, 100);
        };

        const currentNonBackgroundFeats = new Set();
        if (characterState.feats) {
          characterState.feats.forEach(f => {
            if (f.source !== 'background') currentNonBackgroundFeats.add(f.id);
          });
        }

        const STAT_INFO = {
          STR: { icon: 'fa-solid fa-dumbbell', label: 'STR' },
          DEX: { icon: 'fa-solid fa-person-running', label: 'DEX' },
          CON: { icon: 'fa-solid fa-shield-heart', label: 'CON' },
          INT: { icon: 'fa-solid fa-brain', label: 'INT' },
          WIS: { icon: 'fa-solid fa-eye', label: 'WIS' },
          CHA: { icon: 'fa-solid fa-masks-theater', label: 'CHA' }
        };

        const getBgMeta = (bg) => {
          let stats = [];
          let featId = bg.feat_id || '';
          let featName = getFeatName(featId, dbData) || formatCleanName(featId) || 'Origin Feat';
          let skills = [];
          try {
            if (bg.ability_scores) {
              const parsed = typeof bg.ability_scores === 'string' ? JSON.parse(bg.ability_scores) : bg.ability_scores;
              const rawStr = JSON.stringify(parsed).toUpperCase();
              ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(s => {
                if (rawStr.includes(s) || (parsed.display && parsed.display.toUpperCase().includes(s))) stats.push(s);
              });
            }
            if (bg.skill_proficiencies) {
              const parsed = typeof bg.skill_proficiencies === 'string' ? JSON.parse(bg.skill_proficiencies) : bg.skill_proficiencies;
              const bgSkills = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.granted) ? parsed.granted : (Array.isArray(parsed?.logic?.granted) ? parsed.logic.granted : []));
              skills = bgSkills.filter(s => typeof s === 'string' && ALL_SKILLS_LIST.includes(s));
            }
          } catch { /* ignore */ }
          return { stats, featId, featName, skills };
        };

        const originFeatOptions = Array.from(new Set(bgList.map(b => b.feat_id).filter(Boolean))).map(fId => {
          return { id: fId, name: getFeatName(fId, dbData) || formatCleanName(fId) };
        });

        const filteredBgList = bgList.filter(bg => {
          const meta = getBgMeta(bg);
          if (bgSearchTerm.trim()) {
            const term = bgSearchTerm.trim().toLowerCase();
            const nameMatch = (bg.background_name || '').toLowerCase().includes(term);
            const featMatch = (meta.featName || '').toLowerCase().includes(term);
            if (!nameMatch && !featMatch) return false;
          }
          if (bgStatFilter && bgStatFilter.length > 0) {
            const hasAnyStat = bgStatFilter.some(stat => meta.stats.includes(stat));
            if (!hasAnyStat) return false;
          }
          if (bgFeatFilter && bgFeatFilter !== 'all') {
            if (meta.featId?.toLowerCase() !== bgFeatFilter.toLowerCase() && meta.featName?.toLowerCase() !== bgFeatFilter.toLowerCase()) return false;
          }
          return true;
        });

        // Check if selected background has skill overlap
        const overlappingSkills = selectedBg ? characterState.background.originalSkills.filter(s => currentNonBackgroundSkills.has(s)) : [];

        return (
          <div className="builder-step-content animate-fade-in">
            <h3 className="step-title" style={{ fontSize: '1.6rem', color: 'var(--color-ink)', marginBottom: '4px' }}>Choose Background</h3>
            <p className="step-subtitle" style={{ color: 'var(--color-gray)', marginBottom: '12px' }}>ภูมิหลัง (Background) จะบอกเล่าที่มาของคุณ พร้อมมอบ Skill Proficiencies, Tool Proficiencies และ Origin Feats ประจำตัว</p>

            {/* 💡 Beginner Guide Banner for Step 3 (Only visible BEFORE selecting a background) */}
            {!selectedBg && (
              <div style={{ backgroundColor: '#fef8f8', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                <div 
                  onClick={() => setShowBeginnerGuide(!showBeginnerGuide)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 'bold', color: '#711a19', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-compass-drafting" style={{ color: '#711a19' }}></i>
                    คำแนะนำสำหรับผู้เล่นใหม่: ภูมิหลัง/ประวัติ (Background) คืออะไร?
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#711a19', fontWeight: 'bold' }}>
                    {showBeginnerGuide ? 'ซ่อนคู่มือ ▲' : 'แสดงคู่มือ ▼'}
                  </span>
                </div>
                {showBeginnerGuide && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #fca5a5', fontSize: '0.85rem', color: 'var(--color-gray)', lineHeight: '1.6' }}>
                    • <strong>ภูมิหลังคืออะไร?:</strong> คือเรื่องราวที่มาของตัวละครก่อนออกผจญภัย (เช่น Acolyte นักบวช, Criminal อาชญากร, Sage นักปราชญ์, Soldier ทหาร)<br />
                    • <strong>สิ่งที่ได้รับ:</strong> มอบโบนัสสเตตัส 3 ค่า (+2/+1 หรือ +1/+1/+1), ทักษะความชำนาญ (Skills 2 ทักษะ), อุปกรณ์เริ่มต้น และ <strong>Origin Feat</strong> (ความสามารถพิเศษเริ่มต้น)<br />
                    • <strong>วิธีใช้งาน:</strong> คลิกการ์ดประวัติเพื่อเลือกดูรายละเอียด และปรับการเลือกทักษะซ้ำได้ตามต้องการ
                  </div>
                )}
              </div>
            )}

            {/* Smart Filter Bar */}
            <div style={{ backgroundColor: 'var(--bg-white)', padding: '18px', borderRadius: '14px', border: '1px solid #cbd5e1', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ flex: '1 1 280px', position: 'relative' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray)' }}></i>
                  <input
                    type="text"
                    placeholder="Search backgrounds or Origin Feats..."
                    value={bgSearchTerm}
                    onChange={(e) => setBgSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', backgroundColor: 'var(--bg-white)', color: 'var(--color-ink)' }}
                  />
                </div>

                <div style={{ flex: '0 1 260px', minWidth: '220px' }}>
                  <CustomSelect
                    value={bgFeatFilter}
                    onChange={(e) => setBgFeatFilter(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: 'var(--bg-white)', color: 'var(--color-ink)', fontWeight: '500' }}
                  >
                    <option value="all">Filter by Origin Feat (All)</option>
                    {originFeatOptions.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </CustomSelect>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontWeight: 'bold', marginRight: '4px' }}><i className="fa-solid fa-filter" style={{ color: 'var(--color-gray)' }}></i> Filter by Ability Score (OR Logic):</span>
                {Object.keys(STAT_INFO).map(stat => {
                  const info = STAT_INFO[stat];
                  const isActive = bgStatFilter.includes(stat);
                  return (
                    <button
                      key={stat}
                      onClick={() => {
                        setBgStatFilter(prev => isActive ? prev.filter(s => s !== stat) : [...prev, stat]);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: isActive ? '1px solid #1e293b' : '1px solid #cbd5e1',
                        backgroundColor: isActive ? 'var(--color-ink)' : 'var(--bg-white)',
                        color: isActive ? 'var(--bg-white)' : 'var(--color-gray)',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <i className={info.icon} style={{ color: isActive ? 'var(--bg-white)' : 'var(--color-gray)' }}></i> {info.label}
                    </button>
                  );
                })}
                {(bgStatFilter.length > 0 || bgFeatFilter !== 'all' || bgSearchTerm) && (
                  <button
                    onClick={() => { setBgStatFilter([]); setBgFeatFilter('all'); setBgSearchTerm(''); }}
                    style={{ background: 'none', border: 'none', color: '#711a19', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', marginLeft: 'auto', fontWeight: '600' }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>

            {/* Main Content Area (Full Width Grid Cards + Full Width Detail Banner) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Full Width Grid Cards List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.95rem', color: 'var(--color-gray)', fontWeight: '700' }}>Select Your Background ({filteredBgList.length} options available)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {filteredBgList.map(bg => {
                    const isSelected = selectedBgId === bg.background_id;
                    const meta = getBgMeta(bg);
                    return (
                      <div
                        key={bg.background_id}
                        onClick={() => handleSelectBackground(bg.background_id)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #711a19' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#fdf8f8' : 'var(--bg-white)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 8px 15px -3px rgba(113, 26, 25, 0.15)' : '0 2px 4px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, color: isSelected ? '#711a19' : 'var(--color-ink)', fontSize: '1.15rem', fontWeight: 'bold' }}>{bg.background_name}</h4>
                            {isSelected && <i className="fa-solid fa-circle-check" style={{ color: '#711a19', fontSize: '1.2rem' }}></i>}
                          </div>

                          {/* Stat Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                            {meta.stats.map(s => {
                              const st = STAT_INFO[s] || { icon: 'fa-solid fa-circle', label: s };
                              return (
                                <span key={s} style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--color-gray)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #cbd5e1' }}>
                                  <i className={st.icon} style={{ color: 'var(--color-gray)', marginRight: '4px' }}></i>{st.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          {/* Feat Badge */}
                          <div style={{ backgroundColor: '#fafaf9', border: '1px solid #e7e5e4', color: 'var(--color-ink)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                            <i className="fa-solid fa-star" style={{ color: '#711a19' }}></i> {meta.featName}
                          </div>

                          {/* Skill Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                            {meta.skills.map((sk, idx) => (
                              <span key={idx} style={{ backgroundColor: 'var(--bg-white)', color: 'var(--color-gray)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #f1f5f9' }}>
                                {sk}
                              </span>
                            ))}
                          </div>

                          {/* Role Highlight Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(() => {
                              let badges = null;
                              if (bg.highlights) {
                                try { badges = Array.isArray(bg.highlights) ? bg.highlights : JSON.parse(bg.highlights); } catch { badges = [bg.highlights]; }
                              } else if (bg.tags) {
                                badges = typeof bg.tags === 'string' ? bg.tags.split(',').map(s=>s.trim()) : bg.tags;
                              }
                              if (!badges || !Array.isArray(badges) || badges.length === 0) {
                                badges = BACKGROUND_HIGHLIGHT_BADGES[bg.background_id?.toLowerCase()] || ['• Origin Background'];
                              }
                              return badges.map((badgeText, bIdx) => (
                                <span key={bIdx} style={{ fontSize: '0.7rem', fontWeight: '600', backgroundColor: '#fef8f8', color: '#711a19', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px' }}>
                                  {badgeText}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Detail Frame (FULL WIDTH) Below Grid */}
              {selectedBg && (
                <div id="selected-background-details" className="animate-fade-in" style={{ backgroundColor: 'var(--bg-white)', padding: '24px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)', width: '100%' }}>
                  {/* TOP-LEVEL OVERLAP WARNING CARD */}
                  {overlappingSkills.length > 0 && (
                    <div className="animate-fade-in" style={{ backgroundColor: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(245, 158, 11, 0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b45309', fontWeight: 'bold', fontSize: '1rem', marginBottom: '10px' }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.4rem', color: '#d97706' }}></i>
                        Skill Proficiency Overlap Detected!
                      </div>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#78350f', lineHeight: '1.5' }}>
                        You already have these proficiencies from your species or class. Under D&D 2024 rules, you can choose any skill as a replacement:
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                        {overlappingSkills.map(skill => {
                          const replacedWith = characterState.background.replacedSkills?.[skill] || '';
                          return (
                            <div key={skill} style={{ backgroundColor: 'var(--bg-white)', padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                              <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-xmark"></i> {skill} (Duplicate) ➔ Choose Replacement Skill:
                              </div>
                              <CustomSelect
                                value={replacedWith}
                                onChange={(e) => {
                                  setCharacterState(prev => ({
                                    ...prev,
                                    background: {
                                      ...prev.background,
                                      replacedSkills: {
                                        ...(prev.background.replacedSkills || {}),
                                        [skill]: e.target.value
                                      }
                                    }
                                  }));
                                }}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-ink)' }}
                              >
                                <option value="">-- Choose replacement skill for {skill} --</option>
                                {(() => {
                                  const isProf = (opt) => activeProficientSkills.some(p => String(p).trim().toLowerCase() === String(opt).trim().toLowerCase());
                                  return ALL_SKILLS_LIST.map(opt => {
                                    const isAlreadyProficient = isProf(opt) && String(replacedWith).toLowerCase() !== String(opt).toLowerCase();
                                    return <option key={opt} value={opt} disabled={isAlreadyProficient}>{opt}{isAlreadyProficient ? ' (Already Proficient)' : ''}</option>;
                                  });
                                })()}
                              </CustomSelect>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#711a19', fontSize: '1.6rem', fontWeight: 'bold' }}>{selectedBg.background_name}</h3>
                    <span style={{ fontSize: '0.8rem', backgroundColor: '#fef2f2', color: '#711a19', padding: '4px 12px', borderRadius: '20px', border: '1px solid #fecaca', fontWeight: '700' }}>Selected Background</span>
                  </div>

                  <div style={{ color: 'var(--color-gray)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }} dangerouslySetInnerHTML={{ __html: selectedBg.background_desc }}></div>

                  {/* 3-Column Responsive Dashboard Grid inside Detail Frame */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {/* Origin Feat Drawer Block */}
                    <div style={{ backgroundColor: '#fafaf9', padding: '16px', borderRadius: '12px', border: '1px solid #e7e5e4' }}>
                      <h5 style={{ margin: '0 0 8px 0', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '700' }}>
                        <i className="fa-solid fa-star" style={{ color: '#711a19' }}></i> Granted Origin Feat
                      </h5>
                      <div style={{ color: 'var(--color-ink)', fontSize: '1rem', fontWeight: 'bold' }}>
                        {formatCleanName(getFeatName(selectedBg.feat_id, dbData) || formatCleanName(selectedBg.feat_id))}
                      </div>
                      {currentNonBackgroundFeats.has(selectedBg.feat_id) && (
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 'bold' }}>
                          <i className="fa-solid fa-triangle-exclamation"></i> You already selected this Feat from another feature.
                        </div>
                      )}
                      {selectedBg.feat_id && (
                        <FeatChoiceEditor
                          featId={selectedBg.feat_id}
                          characterState={characterState}
                          currentBonuses={(characterState.feats?.find(f => typeof f === 'object' && f.source === 'background')?.bonuses) || {}}
                          onBonusChange={(newBonuses) => {
                            setCharacterState(prev => {
                              const prevFeats = prev.feats || [];
                              let found = false;
                              const updatedFeats = prevFeats.map(f => {
                                if (typeof f === 'object' && f.source === 'background') {
                                  found = true;
                                  return { ...f, bonuses: newBonuses };
                                }
                                return f;
                              });
                              if (!found && selectedBg.feat_id) {
                                updatedFeats.push({ id: selectedBg.feat_id, source: 'background', bonuses: newBonuses });
                              }
                              return { ...prev, feats: updatedFeats };
                            });
                          }}
                          dbData={dbData}
                          proficientSkills={activeProficientSkills}
                          allKnownSpellIds={allKnownSpellIds}
                          style={{ marginTop: '14px', border: '1px solid #d6d3d1', backgroundColor: 'var(--bg-white)' }}
                        />
                      )}
                    </div>

                    {/* Ability Scores Block */}
                    <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                      <h5 style={{ margin: '0 0 8px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '700' }}>
                        <i className="fa-solid fa-arrow-up-right-dots"></i> Ability Score Increases
                      </h5>
                      <div style={{ color: '#15803d', fontSize: '1rem', fontWeight: 'bold' }}>
                        {(() => {
                          try {
                            const parsed = typeof selectedBg.ability_scores === 'string' ? JSON.parse(selectedBg.ability_scores) : selectedBg.ability_scores;
                            return parsed.display || 'No details available';
                          } catch { return 'No information available'; }
                        })()}
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#166534' }}>
                        <i className="fa-solid fa-circle-info"></i> Configure ability score improvements (+2/+1 or +1/+1/+1) in Step 4
                      </p>
                    </div>

                    {/* Skills & Tools Block */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ backgroundColor: 'var(--bg-white)', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--color-ink)', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-brain" style={{ color: '#711a19' }}></i> Skill Proficiencies
                        </h5>
                        {characterState.background.originalSkills.map(sk => {
                          const isOverlap = currentNonBackgroundSkills.has(sk);
                          const replaced = characterState.background.replacedSkills?.[sk];
                          return (
                            <div key={sk} style={{ fontSize: '0.85rem', color: isOverlap ? 'var(--color-gray)' : 'var(--color-gray)', fontWeight: '600', marginBottom: '4px' }}>
                              <i className="fa-solid fa-check" style={{ color: isOverlap ? 'var(--color-gray)' : '#10b981', marginRight: '6px' }}></i>
                              <span style={{ textDecoration: isOverlap ? 'line-through' : 'none' }}>{sk}</span>
                              {replaced && <span style={{ color: '#d97706', marginLeft: '6px' }}>➔ {replaced}</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ backgroundColor: 'var(--bg-white)', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--color-ink)', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-hammer" style={{ color: '#711a19' }}></i> Tool Proficiencies
                        </h5>
                        {characterState.background.toolChoices.length > 0 ? (
                          characterState.background.toolChoices.map((tool, idx) => (
                            <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontWeight: '600', marginBottom: '4px' }}>
                              <i className="fa-solid fa-wrench" style={{ color: 'var(--color-gray)', marginRight: '6px' }}></i> {tool}
                            </div>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>None</span>
                        )}
                      </div>
                    </div>

                    {/* Equipment & Gold Block */}
                    <div style={{ backgroundColor: 'var(--bg-white)', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', gridColumn: '1 / -1' }}>
                      <h5 style={{ margin: '0 0 8px 0', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '700' }}>
                        <i className="fa-solid fa-sack-dollar" style={{ color: '#711a19' }}></i> Background Starting Equipment & Gold
                      </h5>
                      {(() => {
                        let eqDisplay = 'No gear detailed';
                        let goldVal = 50;
                        let itemList = [];
                        if (selectedBg.equipment) {
                          try {
                            const parsed = typeof selectedBg.equipment === 'string' ? JSON.parse(selectedBg.equipment) : selectedBg.equipment;
                            eqDisplay = parsed.display || eqDisplay;
                            goldVal = parsed.logic?.gold !== undefined ? parsed.logic.gold : 50;
                            itemList = parsed.logic?.items || [];
                          } catch {
                            eqDisplay = selectedBg.equipment;
                          }
                        }
                        return (
                          <div>
                            <div style={{ color: 'var(--color-gray)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '10px' }}>
                              {eqDisplay}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{ backgroundColor: '#fef2f2', color: '#711a19', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800', border: '1px solid #711a19' }}>
                                <i className="fa-solid fa-coins" style={{ marginRight: '4px' }}></i>Starting Gold: {goldVal} GP
                              </span>
                              {itemList.map((it, idx) => (
                                <span key={idx} style={{ backgroundColor: 'var(--bg-white)', color: 'var(--color-gray)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid #cbd5e1' }}>
                                  <i className="fa-solid fa-box" style={{ marginRight: '4px', color: 'var(--color-gray)' }}></i>{it}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
}
