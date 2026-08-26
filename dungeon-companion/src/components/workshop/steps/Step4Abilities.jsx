import React, { useState } from 'react';
import { CustomSelect } from '../WorkshopWidgets';
import { ALL_SKILLS_LIST, SKILL_ABILITY_MAP } from '../../../utils/workshopHelpers';

export default function Step4Abilities({
  characterState,
  setCharacterState,
  totalStats,
  resolvedMechanics,
  proficientSkills = [],
  expertiseSkills = []
}) {
  const method = characterState.abilities?.method || 'standard';
  const baseAbilities = characterState.abilities?.base || { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
  const bgBonus = characterState.abilities?.backgroundBonus || characterState.abilities?.racialBonus || { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const STAT_NAMES = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma'
  };
  const STAT_SHORT = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
  const charLevel = (characterState.classData?.classes || []).reduce((sum, cl) => sum + (Number(cl.level) || 0), 0) || 1;
  const [showBeginnerGuide, setShowBeginnerGuide] = useState(true);
  const profBonus = Math.ceil(1 + (charLevel / 4));
  const activeProficientSkills = proficientSkills.length > 0 ? proficientSkills : (resolvedMechanics?.proficiencies?.skills || []);
  const activeExpertiseSkills = expertiseSkills.length > 0 ? expertiseSkills : (resolvedMechanics?.proficiencies?.expertise || []);

  const handleMethodChange = (newMethod) => {
    let newBase = { ...baseAbilities };
    if (newMethod === 'standard') {
      newBase = { str: '', dex: '', con: '', int: '', wis: '', cha: '' };
    } else if (newMethod === 'pointbuy') {
      newBase = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    }
    setCharacterState(prev => ({
      ...prev,
      abilities: { ...prev.abilities, method: newMethod, base: newBase }
    }));
  };

  // Standard Array Helpers
  const STD_ARRAY = [15, 14, 13, 12, 10, 8];
  const handleStandardChange = (stat, val) => {
    const numVal = val === '' ? '' : (parseInt(val) || '');
    setCharacterState(prev => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        base: { ...prev.abilities.base, [stat]: numVal }
      }
    }));
  };
  const handleClearStandard = () => {
    setCharacterState(prev => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        method: 'standard',
        base: { str: '', dex: '', con: '', int: '', wis: '', cha: '' }
      }
    }));
  };

  // Point Buy Helpers (27 pts, scores 8-15)
  const POINT_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const totalPointCost = STAT_KEYS.reduce((sum, k) => sum + (POINT_COSTS[baseAbilities[k]] || 0), 0);
  const remainingPoints = 27 - totalPointCost;

  const handlePointBuyStep = (stat, delta) => {
    const currentVal = baseAbilities[stat] || 8;
    const nextVal = currentVal + delta;
    if (nextVal < 8 || nextVal > 15) return;
    const costDiff = (POINT_COSTS[nextVal] || 0) - (POINT_COSTS[currentVal] || 0);
    if (costDiff > remainingPoints) return;
    setCharacterState(prev => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        base: { ...prev.abilities.base, [stat]: nextVal }
      }
    }));
  };

  // Manual Roll Helpers
  const handleRollAll = () => {
    const rollOneStat = () => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => a - b);
      return rolls[1] + rolls[2] + rolls[3];
    };
    const rolledBase = {
      str: rollOneStat(), dex: rollOneStat(), con: rollOneStat(),
      int: rollOneStat(), wis: rollOneStat(), cha: rollOneStat()
    };
    setCharacterState(prev => ({
      ...prev,
      abilities: { ...prev.abilities, method: 'roll', base: rolledBase }
    }));
  };

  const handleManualStatChange = (stat, val) => {
    let numVal = parseInt(val);
    if (isNaN(numVal)) numVal = 8;
    if (numVal < 3) numVal = 3;
    if (numVal > 20) numVal = 20;
    setCharacterState(prev => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        base: { ...prev.abilities.base, [stat]: numVal }
      }
    }));
  };

  // Background ASI Rules Logic
  const bgRules = characterState.background?.asiRules || {};
  let allowedStats = STAT_KEYS;
  if (Array.isArray(bgRules.allowed_attributes) && bgRules.allowed_attributes.length > 0) {
    const attrMap = { strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha' };
    allowedStats = bgRules.allowed_attributes.map(a => attrMap[a?.toLowerCase()] || a?.toLowerCase()?.substring(0,3)).filter(k => STAT_KEYS.includes(k));
  }
  const asiMode = characterState.background?.asiMode || 'plus_two_one';
  const asiChoices = characterState.background?.asiChoices || { plus2: allowedStats[0] || 'str', plus1: allowedStats[1] || allowedStats[0] || 'dex', plus1_list: allowedStats.slice(0,3) };

  const updateBgBonuses = (mode, choices) => {
    const newBonus = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (mode === 'plus_two_one') {
      if (choices.plus2) newBonus[choices.plus2] = (newBonus[choices.plus2] || 0) + 2;
      if (choices.plus1 && choices.plus1 !== choices.plus2) newBonus[choices.plus1] = (newBonus[choices.plus1] || 0) + 1;
    } else if (mode === 'three_plus_one') {
      const listToUse = allowedStats.length <= 3 ? allowedStats : (choices.plus1_list || allowedStats.slice(0,3));
      Array.from(new Set(listToUse)).forEach(k => { if (k) newBonus[k] = (newBonus[k] || 0) + 1; });
    }
    setCharacterState(prev => ({
      ...prev,
      background: { ...prev.background, asiMode: mode, asiChoices: choices },
      abilities: {
        ...prev.abilities,
        backgroundBonus: newBonus,
        racialBonus: newBonus
      }
    }));
  };

  return (
    <div className="builder-step-content animate-fade-in" style={{ padding: '10px 0' }}>
      <h3 className="step-title" style={{ fontSize: '1.4rem', color: 'var(--color-ink)', marginBottom: '6px', fontWeight: '800' }}>
        Determine Ability Scores
      </h3>
      <p className="step-subtitle" style={{ color: 'var(--color-gray)', marginBottom: '12px' }}>
        Choose generation method and assign background ability score improvements (D&D 2024 Rules)
      </p>

      {/* 💡 Beginner Guide Banner for Step 4 */}
      <div style={{ backgroundColor: '#fef8f8', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
        <div 
          onClick={() => setShowBeginnerGuide(!showBeginnerGuide)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div style={{ fontWeight: 'bold', color: '#711a19', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-compass-drafting" style={{ color: '#711a19' }}></i>
            คู่มือคำแนะนำสำหรับผู้เล่นใหม่: ค่าพลังทั้ง 6 (Ability Scores) & วิธีการกำหนดแต้ม 3 รูปแบบ
          </div>
          <span style={{ fontSize: '0.8rem', color: '#711a19', fontWeight: 'bold' }}>
            {showBeginnerGuide ? 'ซ่อนคู่มือ ▲' : 'แสดงคู่มือ ▼'}
          </span>
        </div>
        {showBeginnerGuide && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #fca5a5', fontSize: '0.88rem', color: '#334155', lineHeight: '1.7' }}>
            
            {/* Part 1: Ability Scores Fundamentals */}
            <div style={{ backgroundColor: 'var(--bg-white)', padding: '12px 14px', borderRadius: '6px', border: '1px solid #fee2e2', marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#711a19', marginBottom: '6px', fontSize: '0.9rem' }}>
                📌 1. ค่าพลังทั้ง 6 (Ability Scores) & หลักการคำนวณ Modifier คืออะไร?
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.85rem' }}>
                <li><strong>STR (Strength):</strong> พละกำลังกาย การโจมตีประชิด แบกของ และการปีนป่าย</li>
                <li><strong>DEX (Dexterity):</strong> ความคล่องแคล่ว หลบหลีก ความเร็ว อาชีพสายธนู/มีด และค่า AC</li>
                <li><strong>CON (Constitution):</strong> ความทรหดอดทน พลังชีวิต (HP) และความอึด</li>
                <li><strong>INT (Intelligence):</strong> สติปัญญาวิชาการ เวทมนตร์พ่อมด (Wizard) ความรู้ประวัติศาสตร์/เวท</li>
                <li><strong>WIS (Wisdom):</strong> ความรอบรู้ สัญชาตญาณ การสังเกต (Perception) เวทมนตร์ Cleric/Druid</li>
                <li><strong>CHA (Charisma):</strong> เสน่ห์ การเจรจา การโน้มน้าว เวทมนตร์ Paladin/Bard/Sorcerer/Warlock</li>
                <li><strong>หลักการคำนวณ Modifier:</strong> แต้ม 10 คือคนปกติทั่วไป (+0) / แต้ม 14-15 คือระดับผู้เชี่ยวชาญ (+2) / ทุกๆ 2 แต้มที่เพิ่มขึ้นจะบวกโบนัส Modifier เพิ่ม +1 ในการทอยเต๋าต่อสู้และทักษะ</li>
              </ul>
            </div>

            {/* Part 2: Generation Methods */}
            <div style={{ backgroundColor: 'var(--bg-white)', padding: '12px 14px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
              <div style={{ fontWeight: 'bold', color: '#711a19', marginBottom: '6px', fontSize: '0.9rem' }}>
                🎲 2. รายละเอียดวิธีการกำหนดแต้มทั้ง 3 รูปแบบ (Generation Methods)
              </div>
              <div style={{ marginBottom: '8px' }}>
                • <strong>1) Standard Array (ชุดค่ามาตรฐาน - แนะนำสำหรับผู้เล่นใหม่):</strong><br />
                ชุดตัวเลขสำเร็จรูปตามมาตรฐาน D&D 2024 (<strong>15, 14, 13, 12, 10, 8</strong>) นำตัวเลขทั้ง 6 ไปจัดวางลงสเตตัสต่างๆ โดยแต่ละตัวเลขใช้ได้ 1 ครั้ง แนะนำวาง 15 ลงสเตตัสหลักของคลาส (Primary Ability)
              </div>
              <div style={{ marginBottom: '8px' }}>
                • <strong>2) Point Buy System (ระบบซื้อแต้มคะแนน - 27 Points Budget):</strong><br />
                เริ่มต้นทุกสเตตัสที่ <strong>8 แต้ม (ฟรี)</strong> แล้วใช้แต้มงบประมาณ <strong>27 แต้ม</strong> ซื้อสเตตัสเพิ่มได้สูงสุดถึง 15 แต้ม (ยิ่งค่าพลังสูง ค่าใช้จ่ายแต้มจะยิ่งแพงขึ้น เช่น 8→9 ใช้ 1pt, 14→15 ใช้ 2pt)
              </div>
              <div>
                • <strong>3) Manual Roll & Custom Input (การทอยลูกเต๋า 4d6 Drop Lowest / กรอกค่าเอง):</strong><br />
                วิธีดั้งเดิมของการเล่น D&D ทอยลูกเต๋า 6 หน้า (d6) จำนวน 4 ลูกต่อสเตตัส แล้ว <strong>ตัดลูกแต้มต่ำสุดออก 1 ลูก</strong> นำแต้ม 3 ลูกที่เหลือมารวมกัน (ได้ 3-18 แต้ม) หรือกรอกค่าที่ทอยได้จริงบนโต๊ะเข้ามาได้ทันที
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Method Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
        {[
          { id: 'standard', label: 'Standard Array', icon: 'fa-solid fa-chart-column', desc: '15, 14, 13, 12, 10, 8 (Recommended)' },
          { id: 'pointbuy', label: 'Point Buy System', icon: 'fa-solid fa-coins', desc: '27 Budget Points' },
          { id: 'roll', label: 'Manual Roll / Custom Input', icon: 'fa-solid fa-dice', desc: '4d6 Drop Lowest' }
        ].map(tab => {
          const isActive = method === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleMethodChange(tab.id)}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '8px',
                border: isActive ? '2px solid #711a19' : '1px solid #cbd5e1',
                backgroundColor: isActive ? '#fef2f2' : 'var(--bg-white)',
                color: isActive ? '#711a19' : 'var(--color-gray)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 4px rgba(113, 26, 25, 0.08)' : 'none'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                <i className={tab.icon} style={{ marginRight: '8px', color: isActive ? '#711a19' : 'var(--color-gray)' }}></i>
                {tab.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: isActive ? '#991b1b' : 'var(--color-gray)', marginTop: '2px' }}>{tab.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Method 1: Standard Array Content */}
      {method === 'standard' && (
        <div style={{ backgroundColor: 'var(--bg-white)', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: '700' }}>
                Standard Array Assignment
              </h4>
              <p style={{ margin: '4px 0 0 0', color: 'var(--color-gray)', fontSize: '0.85rem' }}>
                Assign values 15, 14, 13, 12, 10, and 8 to your abilities (clear assignment to swap values)
              </p>
            </div>
            <button
              onClick={handleClearStandard}
              style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: 'var(--bg-white)', color: 'var(--color-gray)', border: '1px solid #cbd5e1', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-rotate-left"></i> Reset Assignments (Clear)
            </button>
          </div>

          {/* Explanation Banner for Standard Array */}
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.84rem', color: '#92400e', lineHeight: '1.5' }}>
            <i className="fa-solid fa-lightbulb" style={{ color: '#d97706', marginRight: '6px' }}></i>
            <strong>วิธีกำหนดค่า Standard Array:</strong> เลือกวางตัวเลข <strong>15, 14, 13, 12, 10, 8</strong> ลงในช่องสเตตัสทั้ง 6 ค่า แนะนำให้วางแต้มสูงสุด (15) ไว้ในสเตตัสหลักประจำคลาสของคุณ
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {STAT_KEYS.map(k => {
              const currentVal = baseAbilities[k];
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-white)', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontWeight: '700', color: 'var(--color-ink)', fontSize: '0.95rem' }}>{STAT_NAMES[k]}</span>
                  <CustomSelect
                    value={currentVal === '' || currentVal == null ? '' : currentVal}
                    onChange={(e) => handleStandardChange(k, e.target.value)}
                    style={{ width: '135px', padding: '6px', borderRadius: '6px', fontWeight: '700', fontSize: '0.95rem', border: '1px solid #94a3b8', color: 'var(--color-ink)', backgroundColor: 'var(--bg-white)' }}
                  >
                    <option value="">-- Unassigned --</option>
                    {STD_ARRAY.map(num => {
                      const isUsedByOther = STAT_KEYS.some(otherK => otherK !== k && Number(baseAbilities[otherK]) === num);
                      return (
                        <option key={num} value={num} disabled={isUsedByOther}>
                          {num} {isUsedByOther ? '(Assigned)' : ''}
                        </option>
                      );
                    })}
                  </CustomSelect>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Method 2: Point Buy Content */}
      {method === 'pointbuy' && (
        <div style={{ backgroundColor: 'var(--bg-white)', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: '700' }}>
                Point Buy Calculator
              </h4>
              <p style={{ margin: '4px 0 0 0', color: 'var(--color-gray)', fontSize: '0.85rem' }}>
                All scores begin at 8 and can be raised up to 15 (before background bonuses)
              </p>
            </div>
            <div style={{ backgroundColor: remainingPoints === 0 ? '#711a19' : remainingPoints < 0 ? '#991b1b' : 'var(--color-gray)', color: 'var(--bg-white)', padding: '6px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '0.9rem' }}>
              Remaining Points: {remainingPoints} / 27
            </div>
          </div>

          {/* Explanation Banner for Point Buy */}
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.84rem', color: '#92400e', lineHeight: '1.5' }}>
            <i className="fa-solid fa-coins" style={{ color: '#d97706', marginRight: '6px' }}></i>
            <strong>วิธีกำหนดค่า Point Buy:</strong> ทุกสเตตัสเริ่มที่ 8 แต้ม ใช้ปุ่ม <strong>[+]</strong> และ <strong>[-]</strong> ปรับเพิ่มลดแต้ม (สเตตัส 8-13 คิดค่าใช้จ่าย 1 แต้มต่อ 1 สเตตัส / สเตตัส 14-15 คิดค่าใช้จ่าย 2 แต้มต่อ 1 สเตตัส)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {STAT_KEYS.map(k => {
              const val = baseAbilities[k] || 8;
              const nextCost = (POINT_COSTS[val + 1] || 0) - (POINT_COSTS[val] || 0);
              const canIncrease = val < 15 && nextCost <= remainingPoints;
              const canDecrease = val > 8;

              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-white)', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--color-ink)', fontSize: '0.95rem' }}>{STAT_NAMES[k]}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>Point Cost: {POINT_COSTS[val]} pts</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handlePointBuyStep(k, -1)}
                      disabled={!canDecrease}
                      style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: canDecrease ? 'var(--bg-white)' : 'var(--bg-sidebar)', color: canDecrease ? 'var(--color-ink)' : 'var(--border-color)', fontWeight: 'bold', cursor: canDecrease ? 'pointer' : 'not-allowed', fontSize: '1.1rem' }}
                    >-</button>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800', width: '28px', textAlign: 'center', color: 'var(--color-ink)' }}>{val}</span>
                    <button
                      onClick={() => handlePointBuyStep(k, 1)}
                      disabled={!canIncrease}
                      style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: canIncrease ? 'var(--bg-white)' : 'var(--bg-sidebar)', color: canIncrease ? 'var(--color-ink)' : 'var(--border-color)', fontWeight: 'bold', cursor: canIncrease ? 'pointer' : 'not-allowed', fontSize: '1.1rem' }}
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Method 3: Manual Roll / Custom Input */}
      {method === 'roll' && (
        <div style={{ backgroundColor: 'var(--bg-white)', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: '700' }}>
                Manual Roll & Custom Input
              </h4>
              <p style={{ margin: '4px 0 0 0', color: 'var(--color-gray)', fontSize: '0.85rem' }}>
                Roll 4d6 dropping lowest, or input physical dice rolls (3-20)
              </p>
            </div>
            <button
              onClick={handleRollAll}
              style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-dice"></i> Roll All Abilities (4d6 Drop Lowest)
            </button>
          </div>

          {/* Explanation Banner for Manual Roll */}
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.84rem', color: '#92400e', lineHeight: '1.5' }}>
            <i className="fa-solid fa-dice-d20" style={{ color: '#d97706', marginRight: '6px' }}></i>
            <strong>วิธีกำหนดค่า Manual Roll:</strong> กดปุ่ม <em>"Roll All Abilities"</em> เพื่อทอยลูกเต๋าสามมิติ 4d6 ตัดลูกต่ำสุดอัตโนมัติ หรือกรอกตัวเลขสเตตัสที่คุณทอยได้จากลูกเต๋าจริงบนโต๊ะ (แต้มระหว่าง 3 ถึง 20) เข้ามาในช่อง
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {STAT_KEYS.map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-white)', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontWeight: '700', color: 'var(--color-ink)', fontSize: '0.95rem' }}>{STAT_NAMES[k]}</span>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={baseAbilities[k] || 8}
                  onChange={(e) => handleManualStatChange(k, e.target.value)}
                  style={{ width: '80px', padding: '6px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '1rem', fontWeight: '700', textAlign: 'center', color: 'var(--color-ink)', backgroundColor: 'var(--bg-white)' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Background ASI Section */}
      <div style={{ backgroundColor: 'var(--bg-white)', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <i className="fa-solid fa-star" style={{ color: '#711a19', fontSize: '1.1rem' }}></i>
          <h4 style={{ margin: 0, color: '#711a19', fontSize: '1.05rem', fontWeight: '800' }}>
            Background Ability Score Increases
          </h4>
        </div>
        <p style={{ margin: '0 0 16px 0', color: 'var(--color-gray)', fontSize: '0.85rem' }}>
          Your background grants ability score improvements to: <strong style={{ color: 'var(--color-ink)' }}>{allowedStats.map(s => STAT_SHORT[s]).join(', ')}</strong> (Choose either +2/+1 or +1/+1/+1 distribution)
        </p>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => updateBgBonuses('plus_two_one', asiChoices)}
            style={{ padding: '8px 16px', borderRadius: '6px', border: asiMode === 'plus_two_one' ? '2px solid #711a19' : '1px solid #cbd5e1', backgroundColor: asiMode === 'plus_two_one' ? '#fef2f2' : 'var(--bg-white)', color: asiMode === 'plus_two_one' ? '#711a19' : 'var(--color-gray)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            +2 / +1 Distribution (Choose 2 abilities)
          </button>
          <button
            onClick={() => updateBgBonuses('three_plus_one', asiChoices)}
            style={{ padding: '8px 16px', borderRadius: '6px', border: asiMode === 'three_plus_one' ? '2px solid #711a19' : '1px solid #cbd5e1', backgroundColor: asiMode === 'three_plus_one' ? '#fef2f2' : 'var(--bg-white)', color: asiMode === 'three_plus_one' ? '#711a19' : 'var(--color-gray)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            +1 / +1 / +1 Distribution (Choose 3 abilities)
          </button>
        </div>

        {/* Dropdown Allocators */}
        {asiMode === 'plus_two_one' ? (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontWeight: '700', color: 'var(--color-gray)', fontSize: '0.85rem', marginBottom: '6px' }}>Ability receiving +2 increase:</label>
              <CustomSelect
                value={asiChoices.plus2 || allowedStats[0]}
                onChange={(e) => {
                  const newPlus2 = e.target.value;
                  let newPlus1 = asiChoices.plus1 || allowedStats[1] || allowedStats[0];
                  if (newPlus1 === newPlus2) {
                    newPlus1 = allowedStats.find(s => s !== newPlus2) || newPlus1;
                  }
                  updateBgBonuses(asiMode, { ...asiChoices, plus2: newPlus2, plus1: newPlus1 });
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #94a3b8', fontWeight: '700', backgroundColor: 'var(--bg-white)', color: 'var(--color-ink)' }}
              >
                {allowedStats.map(s => (
                  <option key={s} value={s} disabled={s === (asiChoices.plus1 || allowedStats[1])}>{STAT_SHORT[s]} (+2)</option>
                ))}
              </CustomSelect>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontWeight: '700', color: 'var(--color-gray)', fontSize: '0.85rem', marginBottom: '6px' }}>Ability receiving +1 increase:</label>
              <CustomSelect
                value={asiChoices.plus1 || allowedStats[1] || allowedStats[0]}
                onChange={(e) => {
                  const newPlus1 = e.target.value;
                  let newPlus2 = asiChoices.plus2 || allowedStats[0];
                  if (newPlus2 === newPlus1) {
                    newPlus2 = allowedStats.find(s => s !== newPlus1) || newPlus2;
                  }
                  updateBgBonuses(asiMode, { ...asiChoices, plus2: newPlus2, plus1: newPlus1 });
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #94a3b8', fontWeight: '700', backgroundColor: 'var(--bg-white)', color: 'var(--color-ink)' }}
              >
                {allowedStats.map(s => (
                  <option key={s} value={s} disabled={s === (asiChoices.plus2 || allowedStats[0])}>{STAT_SHORT[s]} (+1)</option>
                ))}
              </CustomSelect>
            </div>
          </div>
        ) : allowedStats.length <= 3 ? (
          <div style={{ backgroundColor: 'var(--bg-white)', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#711a19', fontSize: '1.5rem' }}></i>
            <div>
              <div style={{ fontWeight: '800', color: 'var(--color-ink)', fontSize: '0.95rem' }}>
                Auto-Allocated +1 to All 3 Background Abilities
              </div>
              <div style={{ color: 'var(--color-gray)', fontSize: '0.85rem', marginTop: '4px' }}>
                Since your background grants increases to exactly three abilities ({allowedStats.map(s => STAT_SHORT[s]).join(', ')}), choosing +1/+1/+1 distributes +1 to each of them automatically without duplicates.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[0, 1, 2].map(idx => {
              const currentList = asiChoices.plus1_list || allowedStats.slice(0,3);
              return (
                <div key={idx}>
                  <label style={{ display: 'block', fontWeight: '700', color: 'var(--color-gray)', fontSize: '0.85rem', marginBottom: '6px' }}>Ability receiving +1 increase (#{idx + 1}):</label>
                  <CustomSelect
                    value={currentList[idx] || allowedStats[idx] || allowedStats[0]}
                    onChange={(e) => {
                      const newList = [...currentList];
                      newList[idx] = e.target.value;
                      updateBgBonuses(asiMode, { ...asiChoices, plus1_list: newList });
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #94a3b8', fontWeight: '700', backgroundColor: 'var(--bg-white)', color: 'var(--color-ink)' }}
                  >
                    {allowedStats.map(s => (
                      <option key={s} value={s} disabled={currentList.some((existing, i) => i !== idx && existing === s)}>
                        {STAT_SHORT[s]} (+1)
                      </option>
                    ))}
                  </CustomSelect>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Summary Table / Cards */}
      <div>
        <h4 style={{ margin: '0 0 14px 0', color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: '800' }}>
          Real-time Ability Score Summary
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {STAT_KEYS.map(k => {
            const isUnassigned = baseAbilities[k] === '' || baseAbilities[k] == null;
            const base = isUnassigned ? 8 : Number(baseAbilities[k]);
            const bg = bgBonus[k] || 0;
            const total = totalStats?.[k] || (base + bg);
            const featBonus = total - (base + bg);
            const mod = Math.floor((total - 10) / 2);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

            return (
              <div key={k} style={{ backgroundColor: 'var(--bg-white)', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid #e2e8f0', color: '#711a19', padding: '8px', textAlign: 'center', fontWeight: '800', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                  {STAT_SHORT[k]}
                </div>
                <div style={{ padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-ink)', lineHeight: '1' }}>{total}</div>
                  <div style={{ display: 'inline-block', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', color: 'var(--color-gray)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', marginTop: '6px' }}>
                    MOD {modStr}
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '12px', paddingTop: '8px', fontSize: '0.75rem', color: 'var(--color-gray)', textAlign: 'left' }}>
                    <div>• Base: <strong style={{ color: 'var(--color-gray)' }}>{isUnassigned ? '8 (Unassigned)' : base}</strong></div>
                    <div>• Background: <strong style={{ color: bg > 0 ? '#711a19' : 'var(--color-gray)' }}>{bg > 0 ? `+${bg}` : bg}</strong></div>
                    {featBonus !== 0 && <div>• Feats/Class: <strong style={{ color: '#711a19' }}>{featBonus > 0 ? `+${featBonus}` : featBonus}</strong></div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill Proficiencies & Modifiers Section */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-list-check" style={{ color: '#711a19' }}></i>
              Skill Proficiencies Summary
            </h4>
            <p style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.85rem' }}>
              Calculated skill modifiers based on ability scores, Proficiency Bonus (+{profBonus}), and Expertise.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gray)' }}>
            <span style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #475569', padding: '4px 8px', borderRadius: '6px' }}>
              <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i>Proficient (+{profBonus})
            </span>
            <span style={{ backgroundColor: '#fef2f2', border: '1px solid #991b1b', color: '#711a19', padding: '4px 8px', borderRadius: '6px' }}>
              <i className="fa-solid fa-star" style={{ marginRight: '4px' }}></i>Expertise (+{profBonus * 2})
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          {ALL_SKILLS_LIST.map(sk => {
            const statKey = SKILL_ABILITY_MAP[sk] || 'str';
            const isUnassigned = baseAbilities[statKey] === '' || baseAbilities[statKey] == null;
            const base = isUnassigned ? 8 : Number(baseAbilities[statKey]);
            const bg = bgBonus[statKey] || 0;
            const total = totalStats?.[statKey] || (base + bg);
            const statMod = Math.floor((total - 10) / 2);

            const isExpertise = activeExpertiseSkills.includes(sk);
            const isProficient = activeProficientSkills.includes(sk) || isExpertise;

            const skillMod = statMod + (isExpertise ? profBonus * 2 : isProficient ? profBonus : 0);
            const skillModStr = skillMod >= 0 ? `+${skillMod}` : `${skillMod}`;

            return (
              <div key={sk} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: isExpertise ? '#fef2f2' : isProficient ? 'var(--bg-white)' : 'var(--bg-white)',
                padding: '10px 14px', borderRadius: '8px',
                border: isExpertise ? '1px solid #991b1b' : isProficient ? '1px solid #475569' : '1px solid #cbd5e1'
              }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--color-ink)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{sk}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-gray)', backgroundColor: 'var(--border-color)', padding: '1px 6px', borderRadius: '4px' }}>
                      {STAT_SHORT[statKey]}
                    </span>
                    {sk === 'Stealth' && resolvedMechanics?.stealthDisadvantage && (
                      <span style={{ color: '#b91c1c', fontSize: '0.72rem', fontWeight: '800', backgroundColor: '#fef2f2', padding: '1px 6px', borderRadius: '4px', border: '1px solid #f87171' }}>
                        ⚠️ Disadvantage (Armor Penalty)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    {isExpertise ? (
                      <span style={{ color: '#711a19', fontWeight: '700' }}>
                        <i className="fa-solid fa-star" style={{ marginRight: '4px' }}></i>Expertise (+{profBonus * 2})
                      </span>
                    ) : isProficient ? (
                      <span style={{ color: 'var(--color-gray)', fontWeight: '700' }}>
                        <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i>Proficiency (+{profBonus})
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-gray)' }}>- Base ({statMod >= 0 ? `+${statMod}` : statMod})</span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.2rem', fontWeight: '800',
                  color: isExpertise ? '#711a19' : isProficient ? 'var(--color-ink)' : 'var(--color-gray)',
                  backgroundColor: 'var(--bg-white)', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '46px', textAlign: 'center'
                }}>
                  {skillModStr}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
