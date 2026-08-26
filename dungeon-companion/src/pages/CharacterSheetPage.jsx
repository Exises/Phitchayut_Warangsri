import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Step7Review from '../components/workshop/steps/Step7Review';
import useCharacterCalculations from '../hooks/useCharacterCalculations';
import WorkshopModals from '../components/workshop/modals/WorkshopModals';
import CharacterLogsDrawer from '../components/workshop/modals/CharacterLogsDrawer';
import { useDice3D } from '../components/dice3d/Dice3DProvider';

import { enrichSpellsCatalog } from '../utils/workshopHelpers';

export default function CharacterSheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { roll3D, isReady } = useDice3D();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbData, setDbData] = useState({ races: [], classes: [], backgrounds: [], items: [], spells: [], feats: [] });
  const [savingDbStatus, setSavingDbStatus] = useState('');
  const [deathSaves, setDeathSaves] = useState({ succ: [false, false, false], fail: [false, false, false] });
  const [diceModalData, setDiceModalData] = useState(null);
  const [rollAdvMode, setRollAdvMode] = useState('normal');
  const [gameplayRollHistory, setGameplayRollHistory] = useState([]);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

  // -------------------------------------------------------------
  // [NEW] 3-in-1 Auto-Save & Checkpoint Suite (Professional TTRPG Engine)
  // -------------------------------------------------------------
  
  const addCharacterLog = async (category, actionType, logTextTh, metadata = null) => {
    if (!id) return;
    try {
      await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_character_log',
          char_id: id,
          user_id: 1,
          category,
          action_type: actionType,
          log_text_th: logTextTh,
          metadata_json: metadata
        })
      });
    } catch (e) {
      console.error("Log error:", e);
    }
  };

  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving' | 'saved' | 'offline'
  const [lastSavedTime, setLastSavedTime] = useState('');
  const isInitialMountRef = React.useRef(true);

  const [characterState, setCharacterState] = useState({
    char_id: id,
    race: { id: null, lineageId: null, asiChoices: {}, traits: [], languages: [], traitChoices: {} },
    classData: { classes: [], primaryClassId: null },
    background: { id: null, originalSkills: [] },
    feats: [],
    abilities: {
      method: 'standard',
      base: { str: '', dex: '', con: '', int: '', wis: '', cha: '' },
      backgroundBonus: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      racialBonus: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      final: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      modifiers: { str: -1, dex: -1, con: -1, int: -1, wis: -1, cha: -1 }
    },
    equipment: { mode: 'standard', armorId: null, shieldId: null, weapons: [], items: [], currency: { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 } },
    spells: { innate: [], classes: {} },
    description: { name: 'Unnamed Hero', alignment: 'True Neutral' },
    hp: { max: 10, current: 10, temp: 0 },
    hit_dice_current: {}
  });

  // Load Master CC Data & Character from DB
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const ccRes = await fetch('http://localhost:5000/api?action=get_cc_data');
        const ccJson = await ccRes.json();
        if (ccJson) {
          ccJson.spells = enrichSpellsCatalog(ccJson.spells || []);
        }
        setDbData(ccJson);

        if (id && id !== 'current') {
          const u = JSON.parse(localStorage.getItem('dnd_user') || '{}');
          const uid = u.user_id || '';
          const charRes = await fetch(`http://localhost:5000/api?action=get_character_by_id&id=${id}&user_id=${uid}`);
          const charObj = await charRes.json();
          if (charObj && !charObj.error) {
            if (charObj.build_data && typeof charObj.build_data === 'object' && Object.keys(charObj.build_data).length > 0) {
              setCharacterState({ ...charObj.build_data, char_id: charObj.char_id });
            } else {
              // Hydrate from columns if build_data not found
              setCharacterState(prev => ({
                ...prev,
                char_id: charObj.char_id,
                description: {
                  ...prev.description,
                  name: charObj.char_name || prev.description?.name,
                  alignment: charObj.char_alignment || prev.description?.alignment
                },
                race: {
                  ...prev.race,
                  id: charObj.species_id || prev.race?.id,
                  lineageId: charObj.lineage_id || prev.race?.lineageId
                },
                background: {
                  ...prev.background,
                  id: charObj.background_id || prev.background?.id
                },
                classData: {
                  ...prev.classData,
                  primaryClassId: charObj.primary_class_id || prev.classData?.primaryClassId,
                  classes: charObj.classes_data || prev.classData?.classes || []
                },
                hp: {
                  ...prev.hp,
                  max: charObj.hp_max || prev.hp?.max || 10,
                  current: charObj.hp_current !== undefined ? charObj.hp_current : (charObj.hp_max || 10)
                },
                spells: charObj.spellcasting_data || prev.spells || { innate: [], classes: {} },
                equipment: charObj.inventory || prev.equipment || {},
                feats: charObj.feats_data || prev.feats || []
              }));
            }
          } else {
            setError('ไม่พบตัวละครรหัส: ' + id);
          }
        } else {
          // Fallback check localstorage for workshop state
          const localState = localStorage.getItem('workshop_characterState');
          if (localState) {
            try { setCharacterState(JSON.parse(localState)); } catch { /* ignore */ }
          }
        }
      } catch (err) {
        console.error('Error loading play sheet:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลตัวละคร');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [id]);

  const {
    totalStats,
    resolvedMechanics,
    spellSlotsCalculation,
    knownSpellsSourceMap,
    allKnownSpellIds,
    proficientSkills,
    expertiseSkills,
    activeClassSaves
  } = useCharacterCalculations(characterState, dbData);

  const triggerQuickRoll = (label, modValue, diceStr = '1d20') => {
    if (diceStr === 'log') {
      setGameplayRollHistory(prev => [{
        title: label,
        formula: 'Action',
        total: '✓',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }, ...prev.slice(0, 24)]);
      addCharacterLog('gameplay', 'ACTION_LOG', `${label}`, { action: label });
      return;
    }

    if (typeof modValue === 'string' && isNaN(Number(modValue.replace(/[\+\-\s]/g, '')))) {
      const numMatch = modValue.match(/[+-]?\d+(?:\/\d+)?/);
      const displayTotal = numMatch ? numMatch[0] : '✓';
      setGameplayRollHistory(prev => [{
        title: label,
        formula: modValue,
        total: displayTotal,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }, ...prev.slice(0, 24)]);
      return;
    }
    const modNum = parseInt(modValue) || 0;

    if (isReady && roll3D) {
      if (diceStr !== '1d20' && typeof diceStr === 'string' && (diceStr.toLowerCase().startsWith('flat') || !diceStr.includes('d'))) {
        const numMatch = diceStr.match(/\d+/);
        const baseVal = numMatch ? parseInt(numMatch[0], 10) : 1;
        const total = Math.max(1, baseVal + modNum);
        const formulaStr = `Flat ${baseVal} ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`;
        setDiceModalData({
          title: label,
          formula: formulaStr,
          rolls: `Base Damage (${baseVal}) + Modifier (${modNum >= 0 ? `+${modNum}` : modNum})`,
          total,
          advMode: 'normal'
        });
        setGameplayRollHistory(prev => [{
          title: label,
          formula: formulaStr,
          total,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }, ...prev.slice(0, 24)]);
        addCharacterLog('gameplay', 'DICE_ROLL', `ทอย ${label}: ได้ผลรวม ${total} (${formulaStr})`, { label, formula: formulaStr, total });
        return;
      }

      let notationToRoll = diceStr;
      let isD20Roll = false;

      const match = diceStr.match(/^(\d+)d(\d+)/i);
      if (match) {
        notationToRoll = `${match[1]}d${match[2]}`;
        if (match[2] === '20' && parseInt(match[1]) === 1) isD20Roll = true;
      } else if (!diceStr.includes('d') && !diceStr.includes('D')) {
        notationToRoll = '1d20';
        isD20Roll = true;
      }
      
      // If we are rolling a d20 check and advantage/disadvantage is active, roll 2 dice!
      if (isD20Roll && rollAdvMode !== 'normal') {
        notationToRoll = '2d20';
      }

      roll3D({
        notation: notationToRoll,
        onComplete: (res) => {
          if (isD20Roll) {
            const roll1 = res?.rolls?.[0] || Math.floor(Math.random() * 20) + 1;
            const roll2 = res?.rolls?.[1] || Math.floor(Math.random() * 20) + 1; // Used if adv/dis
            let chosenRoll = roll1;
            if (rollAdvMode === 'adv') chosenRoll = Math.max(roll1, roll2);
            if (rollAdvMode === 'dis') chosenRoll = Math.min(roll1, roll2);
            const total = chosenRoll + modNum;
            
            const formulaDesc = rollAdvMode !== 'normal' 
              ? `1d20 (${roll1}, ${roll2} [${rollAdvMode === 'adv'?'Adv':'Dis'}]) ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`
              : `1d20 (${chosenRoll}) ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`;
            
            const rollsDesc = rollAdvMode !== 'normal'
              ? `Dice [${roll1}, ${roll2}] -> [${chosenRoll}] + Mod [${modNum >= 0 ? `+${modNum}` : modNum}]`
              : `Dice [${chosenRoll}] + Mod [${modNum >= 0 ? `+${modNum}` : modNum}]`;

            setDiceModalData({
              title: label,
              formula: formulaDesc,
              rolls: rollsDesc,
              total,
              advMode: rollAdvMode
            });
            setGameplayRollHistory(prev => [{
              title: label,
              formula: formulaDesc,
              total,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...prev.slice(0, 24)]);
            addCharacterLog('gameplay', 'DICE_ROLL', `ทอย ${label}: ได้ผลรวม ${total} (${formulaDesc})`, { label, formula: formulaDesc, total, advMode: rollAdvMode });
          } else {
            const match = diceStr.match(/^(\d+)d(\d+)(.*)$/i);
            const count = match ? parseInt(match[1]) || 1 : 1;
            const sides = match ? parseInt(match[2]) || 6 : 6;
            const physicalRolls = res?.rolls || [];
            let subTotal = physicalRolls.reduce((a, b) => a + Number(b), 0);
            if (physicalRolls.length === 0) {
              for (let i = 0; i < count; i++) {
                const r = Math.floor(Math.random() * sides) + 1;
                physicalRolls.push(r);
                subTotal += r;
              }
            }
            let bonus = modNum;
            if (match && match[3]) {
              const extraNum = parseInt(match[3]);
              if (!isNaN(extraNum)) bonus = extraNum;
            }
            const total = Math.max(1, subTotal + bonus);
            const formulaStr = `${count}d${sides} (${physicalRolls.join(', ')}) ${bonus >= 0 ? `+ ${bonus}` : `- ${Math.abs(bonus)}`}`;
            setDiceModalData({
              title: label,
              formula: formulaStr,
              rolls: `Dice [${physicalRolls.join(', ')}] = ${subTotal} | Mod [${bonus >= 0 ? `+${bonus}` : bonus}]`,
              total,
              advMode: 'normal'
            });
            setGameplayRollHistory(prev => [{
              title: label,
              formula: formulaStr,
              total,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...prev.slice(0, 24)]);
            addCharacterLog('gameplay', 'DICE_ROLL', `ทอย ${label}: ได้ผลรวม ${total} (${formulaStr})`, { label, formula: formulaStr, total });
          }
        }
      });
      return;
    }

    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    let chosenRoll = roll1;
    if (rollAdvMode === 'adv') chosenRoll = Math.max(roll1, roll2);
    if (rollAdvMode === 'dis') chosenRoll = Math.min(roll1, roll2);

    let total = chosenRoll + modNum;
    if (diceStr !== '1d20') {
      if (typeof diceStr === 'string' && (diceStr.toLowerCase().startsWith('flat') || !diceStr.includes('d'))) {
        const numMatch = diceStr.match(/\d+/);
        const baseVal = numMatch ? parseInt(numMatch[0], 10) : 1;
        const total = Math.max(1, baseVal + modNum);
        const formulaStr = `Flat ${baseVal} ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`;
        setDiceModalData({
          title: label,
          formula: formulaStr,
          rolls: `Base Damage (${baseVal}) + Modifier (${modNum >= 0 ? `+${modNum}` : modNum})`,
          total,
          advMode: 'normal'
        });
        setGameplayRollHistory(prev => [{
          title: label,
          formula: formulaStr,
          total,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }, ...prev.slice(0, 24)]);
        addCharacterLog('gameplay', 'DICE_ROLL', `ทอย ${label}: ได้ผลรวม ${total} (${formulaStr})`, { label, formula: formulaStr, total });
        return;
      }
      const match = diceStr.match(/^(\d+)d(\d+)(.*)$/);
      if (match) {
        const count = parseInt(match[1]) || 1;
        const sides = parseInt(match[2]) || 6;
        let subTotal = 0;
        const rolls = [];
        for (let i = 0; i < count; i++) {
          const r = Math.floor(Math.random() * sides) + 1;
          rolls.push(r);
          subTotal += r;
        }
        let bonus = modNum;
        if (match[3]) {
          const extraNum = parseInt(match[3]);
          if (!isNaN(extraNum)) bonus = extraNum;
        }
        total = Math.max(1, subTotal + bonus);
        const rollsStr = rolls.join(' + ') + (bonus >= 0 ? ` + ${bonus}` : ` - ${Math.abs(bonus)}`);
        setDiceModalData({
          title: label,
          formula: diceStr,
          rolls: rollsStr,
          total,
          advMode: 'normal'
        });
        setGameplayRollHistory(prev => [{
          title: label,
          formula: diceStr,
          total,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }, ...prev.slice(0, 24)]);
        addCharacterLog('gameplay', 'DICE_ROLL', `ทอย ${label}: ได้ผลรวม ${total} (${diceStr})`, { label, formula: diceStr, total });
        return;
      }
    }
    const formulaStr = `1d20 (${rollAdvMode === 'adv' ? `${roll1}, ${roll2} [Adv]` : rollAdvMode === 'dis' ? `${roll1}, ${roll2} [Dis]` : roll1}) ${modNum >= 0 ? `+ ${modNum}` : `- ${Math.abs(modNum)}`}`;
    setDiceModalData({
      title: label,
      formula: formulaStr,
      rolls: `Base Roll: ${chosenRoll}`,
      total,
      advMode: rollAdvMode
    });
    setGameplayRollHistory(prev => [{
      title: label,
      formula: formulaStr,
      total,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }, ...prev.slice(0, 24)]);
    addCharacterLog('gameplay', 'DICE_ROLL', `ทอย ${label}: ได้ผลรวม ${total} (${formulaStr})`, { label, formula: formulaStr, total });
  };

  const handleAddSpell = (classId, listType, spell) => {
    const isCantrip = String(spell.spell_level) === '0';
    const targetList = isCantrip ? 'cantrips' : listType;
    setCharacterState(prev => {
      const prevSpells = prev.spells || { innate: [], classes: {} };
      const prevClasses = prevSpells.classes || {};
      const classSpells = prevClasses[classId] || { cantrips: [], spellbook: [], prepared: [] };
      const newList = [...(classSpells[targetList] || [])];
      if (!newList.includes(spell.spell_id)) newList.push(spell.spell_id);
      return {
        ...prev,
        spells: { ...prevSpells, classes: { ...prevClasses, [classId]: { ...classSpells, [targetList]: newList } } }
      };
    });
  };

  const handleRemoveSpell = (classId, listType, spellId) => {
    setCharacterState(prev => {
      const prevSpells = prev.spells || { innate: [], classes: {} };
      const prevClasses = prevSpells.classes || {};
      const classSpells = prevClasses[classId] || { cantrips: [], spellbook: [], prepared: [] };
      return {
        ...prev,
        spells: {
          ...prevSpells,
          classes: {
            ...prevClasses,
            [classId]: {
              ...classSpells,
              cantrips: listType === 'cantrips' ? (classSpells.cantrips || []).filter(i => i !== spellId) : classSpells.cantrips,
              spellbook: listType === 'spellbook' ? (classSpells.spellbook || []).filter(i => i !== spellId) : classSpells.spellbook,
              prepared: (listType === 'spellbook' || listType === 'prepared') ? (classSpells.prepared || []).filter(i => i !== spellId) : classSpells.prepared,
              known: listType === 'known' ? (classSpells.known || []).filter(i => i !== spellId) : classSpells.known
            }
          }
        }
      };
    });
  };

  const handleSaveToDatabase = async (isSilent = false, overrideState = null) => {
    const silent = typeof isSilent === 'boolean' && isSilent === true;
    const currentState = overrideState || characterState;
    if (!silent) setSavingDbStatus('⏳ กำลังบันทึกสถานะตัวละครลงฐานข้อมูล...');
    else setAutoSaveStatus('saving');
    const totalLvl = (currentState.classData?.classes || []).reduce((sum, c) => sum + (parseInt(c.level) || 1), 0) || 1;
    try {
      const payload = {
        action: 'save_character',
        char_id: currentState.char_id || null,
        user_id: (() => {
          try {
            const u = JSON.parse(localStorage.getItem('dnd_user'));
            if (u && u.user_id) return parseInt(u.user_id) || (currentState.user_id ? parseInt(currentState.user_id) : 1);
          } catch (e) {}
          return currentState.user_id ? parseInt(currentState.user_id) : 1;
        })(),
        char_name: currentState.description?.name || 'Unnamed Hero',
        species_id: currentState.race?.id,
        lineage_id: currentState.race?.subraceId || currentState.race?.lineageId,
        background_id: currentState.background?.id || currentState.background?.backgroundId || null,
        primary_class_id: currentState.classData?.classes?.[0]?.classId,
        classes_data: currentState.classData?.classes || [],
        char_alignment: currentState.description?.alignment || 'True Neutral',
        char_level: totalLvl,
        hp_max: resolvedMechanics?.hitPoints?.max || 10,
        hp_current: currentState.hp?.current !== undefined ? currentState.hp?.current : (resolvedMechanics?.hitPoints?.max || 10),
        str_score: totalStats.str,
        dex_score: totalStats.dex,
        con_score: totalStats.con,
        int_score: totalStats.int,
        wis_score: totalStats.wis,
        cha_score: totalStats.cha,
        proficiencies_choices: { skills: currentState.proficiencies?.skills || [], tools: currentState.proficiencies?.tools || [] },
        spellcasting_data: currentState.spells || {},
        inventory: currentState.equipment || {},
        currency: currentState.equipment?.currency || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 },
        feats_data: currentState.feats || [],
        hit_dice_current: currentState.hit_dice_current || {},
        base_ac: resolvedMechanics?.armorClass?.value || 10,
        build_data: currentState
      };
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (!silent) {
          setSavingDbStatus('✅ บันทึกสถานะตัวละครลงฐานข้อมูลและ LocalStorage เรียบร้อยแล้ว!');
          setTimeout(() => setSavingDbStatus(''), 4500);
        }
        setAutoSaveStatus('saved');
        const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        setLastSavedTime(nowStr);
        const targetCharId = data.char_id || currentState.char_id || id;
        if (data.char_id && !currentState.char_id) {
          setCharacterState(prev => ({ ...prev, char_id: data.char_id }));
        }

        // Post Real DB Logs for Build & Inventory categories on save
        if (targetCharId && targetCharId !== 'current') {
          const name = currentState.description?.name || 'Hero';
          const lvl = (currentState.classData?.classes || []).reduce((sum, c) => sum + (parseInt(c.level) || 1), 0) || 1;
          const curr = currentState.equipment?.currency || { gp: 50, sp: 0, cp: 0 };
          
          if (!silent) {
            // Build Log
            fetch('http://localhost:5000/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add_character_log',
                char_id: targetCharId,
                user_id: 1,
                category: 'build',
                action_type: 'SAVE_CHARACTER',
                log_text_th: `บันทึกสถานะตัวละคร ${name} (Level ${lvl}) ลงฐานข้อมูลเรียบร้อย`,
                metadata_json: { char_name: name, level: lvl }
              })
            }).catch(() => {});

            // Inventory Log
            fetch('http://localhost:5000/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add_character_log',
                char_id: targetCharId,
                user_id: 1,
                category: 'inventory',
                action_type: 'SAVE_INVENTORY',
                log_text_th: `บันทึกและอัปเดตทรัพย์สินในกระเป๋า (เหรียญทอง: ${curr.gp || 0} GP, ${curr.sp || 0} SP, ${curr.cp || 0} CP)`,
                metadata_json: { currency: curr }
              })
            }).catch(() => {});
          }
        }
      } else {
        if (!silent) setSavingDbStatus('❌ บันทึกไม่สำเร็จ: ' + (data.message || 'Unknown error'));
        setAutoSaveStatus('offline');
      }
    } catch (err) {
      console.error("Save to DB Error:", err);
      if (!silent) setSavingDbStatus(`❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${err.message} (บันทึกลง LocalStorage แล้ว)`);
      setAutoSaveStatus('offline');
    }
  };

  // Debounced Auto-Save Engine
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (loading || error) return;

    try {
      const saved = JSON.parse(localStorage.getItem('dnd_saved_characters') || '[]');
      const idx = saved.findIndex(c => c.id === characterState.id || c.char_id === characterState.char_id);
      if (idx !== -1) {
        saved[idx] = { ...characterState, updated_at: new Date().toISOString() };
        localStorage.setItem('dnd_saved_characters', JSON.stringify(saved));
      }
    } catch {}

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      handleSaveToDatabase(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, [characterState, loading, error]);


  const handleExportCharacter = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(characterState, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${characterState.description?.name || 'Character'}_PlaySheet.json`);
    dlAnchor.click();
  };

  const handleEditInWorkshop = () => {
    localStorage.setItem('workshop_load_char_id', characterState.char_id || id);
    localStorage.setItem('workshop_currentStep', JSON.stringify(1));
    navigate(`/workshop?autoOpen=true&load_char_id=${characterState.char_id || id}&step=1`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', backgroundColor: '#fdfcf7', color: 'var(--color-ink)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#711a19', marginBottom: '16px' }}></i>
        <h3 style={{ fontFamily: 'Cinzel, serif', color: '#711a19' }}>กำลังโหลด Character Play Sheet...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', backgroundColor: '#fdfcf7', color: 'var(--color-ink)' }}>
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '16px' }}></i>
        <h2 style={{ fontFamily: 'Cinzel, serif', color: '#711a19' }}>เกิดข้อผิดพลาด</h2>
        <p style={{ color: 'var(--color-gray)' }}>{error}</p>
        <button
          onClick={() => navigate('/sheets')}
          style={{ marginTop: '20px', backgroundColor: '#711a19', color: 'var(--bg-white)', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <i className="fa-solid fa-arrow-left"></i> กลับสู่คลังตัวละคร
        </button>
      </div>
    );
  }

  const charName = characterState.description?.name || 'Unnamed Hero';
  const totalLvl = (characterState.classData?.classes || []).reduce((sum, c) => sum + (parseInt(c.level) || 1), 0) || 1;
  const classSummary = (characterState.classData?.classes || [])
    .map(c => `${c.classId?.charAt(0).toUpperCase() + c.classId?.slice(1)} (${c.level})`)
    .join(' / ') || 'Classless';

  return (
    <div className="character-sheet-page-wrapper" style={{ minHeight: 'calc(100vh - 80px)', backgroundColor: '#fdfcf7' }}>
      {/* Restored Header Bar (Without PLAY MODE badge and Workshop Edit button) */}
      <div style={{
        backgroundColor: 'var(--bg-white)',
        borderBottom: '2px solid #711a19',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 500
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/sheets')}
            style={{
              backgroundColor: '#711a19',
              color: 'var(--bg-white)',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> คลังตัวละคร
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <label
              style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
              title="คลิกเพื่อเปลี่ยนหรืออัปโหลดรูปโปรไฟล์ตัวละคร"
            >
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      const MAX_SIZE = 350;
                      let width = img.width;
                      let height = img.height;
                      if (width > height) {
                        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                      } else {
                        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                      }
                      canvas.width = width; canvas.height = height;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(img, 0, 0, width, height);
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                      const nextState = {
                        ...characterState,
                        description: {
                          ...(characterState.description || {}),
                          avatarUrl: dataUrl
                        }
                      };
                      setCharacterState(nextState);
                      setTimeout(() => handleSaveToDatabase(nextState), 100);
                    };
                    img.src = event.target.result;
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {characterState.description?.avatarUrl ? (
                <img
                  src={characterState.description.avatarUrl}
                  alt="Character Avatar"
                  style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', border: '2px solid #711a19', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '48px', height: '48px', backgroundColor: '#711a19', color: 'var(--bg-white)', fontFamily: 'Cinzel, serif', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', flexShrink: 0, fontWeight: 'bold' }}>
                  <i className="fa-solid fa-dragon" style={{ fontSize: '1.3rem' }}></i>
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: '-3px',
                right: '-3px',
                backgroundColor: '#711a19',
                color: 'var(--bg-white)',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                border: '1.5px solid #ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                <i className="fa-solid fa-camera"></i>
              </div>
            </label>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: '#711a19' }}>
                {charName}
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-gray)', marginTop: '3px', fontWeight: '600' }}>
                <span>Level {totalLvl} {classSummary}</span>
                <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                <span>{characterState.description?.alignment || 'True Neutral'}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Visual Auto-Save Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: autoSaveStatus === 'saving' ? '#fef9c3' : autoSaveStatus === 'offline' ? '#fee2e2' : '#f0fdf4',
            border: `1px solid ${autoSaveStatus === 'saving' ? '#facc15' : autoSaveStatus === 'offline' ? '#f87171' : '#86efac'}`,
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: '600',
            color: autoSaveStatus === 'saving' ? '#854d0e' : autoSaveStatus === 'offline' ? '#b91c1c' : '#166534',
            transition: 'all 0.3s ease'
          }}>
            {autoSaveStatus === 'saving' && (
              <><i className="fa-solid fa-arrows-rotate fa-spin" style={{ color: '#ca8a04' }}></i> กำลังบันทึกอัตโนมัติ...</>
            )}
            {autoSaveStatus === 'saved' && (
              <><i className="fa-solid fa-cloud-check" style={{ color: '#16a34a' }}></i> บันทึกแล้ว ({lastSavedTime || 'ล่าสุด'})</>
            )}
            {autoSaveStatus === 'offline' && (
              <><i className="fa-solid fa-cloud-slash" style={{ color: '#dc2626' }}></i> บันทึกลงเครื่อง (รอซิงค์)</>
            )}
          </div>

          <button
            onClick={() => setShowLogsDrawer(true)}
            style={{
              backgroundColor: '#711a19',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(113, 26, 25, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-dice-d20"></i> ประวัติการทอยเต๋า
          </button>
          <button
            onClick={handleExportCharacter}
            style={{
              backgroundColor: 'var(--bg-white)',
              color: 'var(--color-gray)',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <i className="fa-solid fa-file-export" style={{ color: '#711a19' }}></i> Export Sheet
          </button>
        </div>
      </div>

      {/* Main Sheet Body */}
      <div style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 16px' }}>
        <Step7Review
          characterState={characterState}
          setCharacterState={setCharacterState}
          setCurrentStep={null}
          dbData={dbData}
          savingDbStatus={savingDbStatus}
          deathSaves={deathSaves}
          setDeathSaves={setDeathSaves}
          triggerQuickRoll={triggerQuickRoll}
          totalStats={totalStats}
          resolvedMechanics={resolvedMechanics}
          spellSlotsCalculation={spellSlotsCalculation}
          knownSpellsSourceMap={knownSpellsSourceMap}
          allKnownSpellIds={allKnownSpellIds}
          handleAddSpell={handleAddSpell}
          handleRemoveSpell={handleRemoveSpell}
          handleExportCharacter={handleExportCharacter}
          handleSaveToDatabase={handleSaveToDatabase}
          proficientSkills={proficientSkills}
          expertiseSkills={expertiseSkills}
          activeClassSaves={activeClassSaves}
          diceModalData={diceModalData}
          setDiceModalData={setDiceModalData}
          rollAdvMode={rollAdvMode}
          setRollAdvMode={setRollAdvMode}
          gameplayRollHistory={gameplayRollHistory}
          setGameplayRollHistory={setGameplayRollHistory}
          isPlayMode={true}
          onEditCharacter={handleEditInWorkshop}
        />
      </div>

      {/* Modals for Quick Roll / Dice / Level up (if any) */}
      <CharacterLogsDrawer
        isOpen={showLogsDrawer}
        onClose={() => setShowLogsDrawer(false)}
        charId={characterState?.char_id || id}
        localLogs={gameplayRollHistory}
      />
      <WorkshopModals
        diceModalData={diceModalData}
        setDiceModalData={setDiceModalData}
        previewClassId={null}
        setPreviewClassId={() => {}}
        previewRaceId={null}
        setPreviewRaceId={() => {}}
        showFullClassInfo={null}
        setShowFullClassInfo={() => {}}
        showFeatDetails={null}
        setShowFeatDetails={() => {}}
        levelConfirm={null}
        setLevelConfirm={() => {}}
        classToDeleteIndex={null}
        setClassToDeleteIndex={() => {}}
        dbData={dbData}
        characterState={characterState}
        setCharacterState={setCharacterState}
      />



    </div>
  );
}

