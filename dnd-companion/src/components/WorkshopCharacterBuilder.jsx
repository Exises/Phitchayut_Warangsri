import React, { useState, useEffect, useMemo } from 'react';
import useLocalStorageState from '../hooks/useLocalStorageState';
import useCharacterCalculations from '../hooks/useCharacterCalculations';
import WARLOCK_INVOCATIONS from '../data/warlock_invocations.json';
import { resolveCharacterMechanics } from '../utils/mechanicsResolver';
import TopCombatStrip from './actions/TopCombatStrip';
import ActionsDashboard from './actions/ActionsDashboard';
import {
  ALL_SKILLS_LIST,
  calculateTotalAbilities,
  getAllInnateAndFeatureSpells,
  deduplicateSubclasses,
  enrichSpellsCatalog
} from '../utils/workshopHelpers';
import Step1Race from './workshop/steps/Step1Race';
import Step2Class from './workshop/steps/Step2Class';
import Step3Background from './workshop/steps/Step3Background';
import Step4Abilities from './workshop/steps/Step4Abilities';
import Step5Equipment from './workshop/steps/Step5Equipment';
import Step6Details from './workshop/steps/Step6Details';
import Step7Review from './workshop/steps/Step7Review';
import WorkshopModals from './workshop/modals/WorkshopModals';
import { useDice3D } from './dice3d/Dice3DProvider';

// Initial Global State based on our Implementation Plan
const initialCharacterState = {
  race: { 
    id: null, 
    lineageId: null, 
    asiChoices: {}, 
    traits: [], 
    languages: [],
    traitChoices: {}, 
    lineageSpellAbility: null, 
    lineageSpellChoice: null,
    sizeChoice: null
  },
  classData: {
    classes: [], // e.g. { classId: 'fighter', subclassId: null, level: 1, hitDie: 10, featureChoices: {} }
    primaryClassId: null,
  },
  background: { id: null, asiRules: null, originalSkills: [], alternativeSkills: {}, toolChoices: [] },
  feats: [],
  abilities: {
    method: 'standard', // standard, pointbuy, roll
    base: { str: '', dex: '', con: '', int: '', wis: '', cha: '' },
    backgroundBonus: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    racialBonus: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    final: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    modifiers: { str: -1, dex: -1, con: -1, int: -1, wis: -1, cha: -1 }
  },
  equipment: { mode: 'standard', armorId: null, shieldId: null, weapons: [], items: [], currency: { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 } },
  derivedStats: {
    hpMax: 0, ac: 10, speed: 30, initiative: 0, proficiencyBonus: 2, passivePerception: 10, senses: []
  },
  proficiencies: {
    savingThrows: [], skills: [], expertise: [], tools: [], languages: []
  },
  spells: {
    innate: [], // For Race/Lineage/Feats
    classes: {} // Keyed by classId: { cantrips: [], spellbook: [], prepared: [] }
  },
  description: { name: '', avatarUrl: '', alignment: '', age: '', height: '', weight: '', personality: '', ideals: '', bonds: '', flaws: '' }
};

const STEPS = [
  { id: 1, title: 'Race', labelThai: 'เผ่าพันธุ์', icon: 'fa-dna', desc: 'Species & Lineage' },
  { id: 2, title: 'Class', labelThai: 'คลาสอาชีพ', icon: 'fa-khanda', desc: 'Class & Progression' },
  { id: 3, title: 'Background', labelThai: 'ประวัติ', icon: 'fa-book-journal-whills', desc: 'Origin & Training' },
  { id: 4, title: 'Abilities', labelThai: 'ค่าพลัง', icon: 'fa-dice-d20', desc: 'Ability Scores' },
  { id: 5, title: 'Equipment', labelThai: 'อุปกรณ์', icon: 'fa-shield-halved', desc: 'Gear & Inventory' },
  { id: 6, title: 'Details', labelThai: 'รายละเอียด', icon: 'fa-feather-pointed', desc: 'Identity & Backstory' },
  { id: 7, title: 'Review', labelThai: 'สรุปตัวละคร', icon: 'fa-clipboard-check', desc: 'Summary & Export' }
];

// Helper utilities and widgets extracted to src/utils/workshopHelpers.js and src/components/workshop/WorkshopWidgets.jsx

function WorkshopCharacterBuilder({ onCancel }) {
  const { roll3D, isReady } = useDice3D();
  const [currentStep, setCurrentStep] = useLocalStorageState('workshop_currentStep', () => {
    const params = new URLSearchParams(window.location.search);
    const stepInUrl = parseInt(params.get('step'), 10);
    if (stepInUrl >= 1 && stepInUrl <= 7) return stepInUrl;
    const saved = localStorage.getItem('workshop_currentStep');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(currentStep));
    window.history.replaceState({}, '', url);
  }, [currentStep]);
  const [characterState, setCharacterState] = useLocalStorageState('workshop_characterState', initialCharacterState);
  const [loading, setLoading] = useState(true);
  const [previewRaceId, setPreviewRaceId] = useState(null);
  const [confirmChangeRace, setConfirmChangeRace] = useState(false);
  const [previewClassId, setPreviewClassId] = useState(null);
  const [showFullClassInfo, setShowFullClassInfo] = useState(false);
  const [showFeatDetails, setShowFeatDetails] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  const [isSpellbookView, setIsSpellbookView] = useState(false);
  const [activeSpellClassTab, setActiveSpellClassTab] = useState('');
  const [spellSearchTerm, setSpellSearchTerm] = useState('');
  const [spellFilterLevel, setSpellFilterLevel] = useState(['all']);
  const [spellFilterSchool, setSpellFilterSchool] = useState('all');
  const [spellbookSearchTerm, setSpellbookSearchTerm] = useState('');
  const [spellbookFilterLevels, setSpellbookFilterLevels] = useState(['all']);
  const [classToDeleteIndex, setClassToDeleteIndex] = useState(null);
  const [levelConfirm, setLevelConfirm] = useState(null);
  const [bgSearchTerm, setBgSearchTerm] = useState('');
  const [bgStatFilter, setBgStatFilter] = useState([]);
  const [bgFeatFilter, setBgFeatFilter] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');

  // Step 7 Review Sheet State & Interactive Helpers
  const [reviewTab, setReviewTab] = useState('actions');
  const [reviewHpCur, setReviewHpCur] = useState(null);
  const [reviewHpTemp, setReviewHpTemp] = useState(0);
  const [deathSaves, setDeathSaves] = useState({ succ: [false, false, false], fail: [false, false, false] });
  const [hasInspiration, setHasInspiration] = useState(false);
  const [rollAdvMode, setRollAdvMode] = useState('normal'); // 'normal', 'adv', 'dis'
  const [reviewActionFilter, setReviewActionFilter] = useState('All');
  const [diceModalData, setDiceModalData] = useState(null);
  const [showHpAdjustModal, setShowHpAdjustModal] = useState(false);
  const [hpAdjustVal, setHpAdjustVal] = useState('');
  const [shortRestsCount, setShortRestsCount] = useState(2);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [diaryNotes, setDiaryNotes] = useLocalStorageState('workshop_diaryNotes', '');

  // Real Gameplay Interactive State
  const [liveSpellSlots, setLiveSpellSlots] = useState({});
  const [liveFeatureCharges, setLiveFeatureCharges] = useState({});
  const [reviewSpellLevelFilter, setReviewSpellLevelFilter] = useState('all');
  const [reviewSpellSearch, setReviewSpellSearch] = useState('');
  const [reviewInvTab, setReviewInvTab] = useState('ALL');
  const [reviewInvSearch, setReviewInvSearch] = useState('');
  const [reviewFeatFilter, setReviewFeatFilter] = useState('ALL');
  const [reviewFeatSearch, setReviewFeatSearch] = useState('');
  const [expandedFeatures, setExpandedFeatures] = useState({});
  const [editingChoiceKey, setEditingChoiceKey] = useState({});
  const [showSheetManageSpellsModal, setShowSheetManageSpellsModal] = useState(false);
  const [showManageFeatsModal, setShowManageFeatsModal] = useState(false);
  const [newFeatToAdd, setNewFeatToAdd] = useState('');
  const [sheetManageSpellTab, setSheetManageSpellTab] = useState(null);
  const [sheetManageSpellSearch, setSheetManageSpellSearch] = useState('');
  const [sheetManageSpellLevel, setSheetManageSpellLevel] = useState(['all']);
  const [sheetSpellbookSearch, setSheetSpellbookSearch] = useState('');
  const [sheetSpellbookLevels, setSheetSpellbookLevels] = useState(['all']);
  const [showAddWeaponModal, setShowAddWeaponModal] = useState(false);
  const [newWpName, setNewWpName] = useState('');
  const [newWpDmg, setNewWpDmg] = useState('1d8');
  const [newWpStat, setNewWpStat] = useState('str');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [sheetAddItemSearch, setSheetAddItemSearch] = useState('');
  const [sheetAddItemCategory, setSheetAddItemCategory] = useState('All');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [gameplayRollHistory, setGameplayRollHistory] = useState([]);

  const triggerQuickRoll = (label, modValue, diceStr = '1d20') => {
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
          } else {
            const match = diceStr.match(/^(\d+)d(\d+)(.*)$/i);
            const count = match ? parseInt(match[1]) || 1 : 1;
            const sides = match ? parseInt(match[2]) || 6 : 6;
            const physicalRolls = res?.rolls || [];
            let subTotal = physicalRolls.reduce((a, b) => a + b, 0);
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
  };

  // Lock background scroll when modals open
  useEffect(() => {
    const isModalOpen = Boolean(previewRaceId || previewClassId || showFullClassInfo || levelConfirm || classToDeleteIndex !== null);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [previewRaceId, previewClassId, showFullClassInfo, levelConfirm, classToDeleteIndex]);

  // Master API Data
  const [dbData, setDbData] = useState({ races: [], classes: [], backgrounds: [], items: [], spells: [], feats: [] });

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


  // --- Spell Management Handlers ---
  const handleAddSpell = (classId, listType, spell) => {
    const isCantrip = String(spell.spell_level) === '0';
    const targetList = isCantrip ? 'cantrips' : listType; // listType: 'spellbook', 'prepared'

    setCharacterState(prev => {
      const prevSpells = prev.spells || { innate: [], classes: {} };
      const prevClasses = prevSpells.classes || {};
      const classSpells = prevClasses[classId] || { cantrips: [], spellbook: [], prepared: [] };
      const newList = [...(classSpells[targetList] || [])];
      
      if (!newList.includes(spell.spell_id)) {
        newList.push(spell.spell_id);
      }

      return {
        ...prev,
        spells: {
          ...prevSpells,
          classes: {
            ...prevClasses,
            [classId]: {
              ...classSpells,
              [targetList]: newList
            }
          }
        }
      };
    });
  };

  const handleRemoveSpell = (classId, listType, spellId) => {
    setCharacterState(prev => {
      const prevSpells = prev.spells || { innate: [], classes: {} };
      const prevClasses = prevSpells.classes || {};
      const classSpells = prevClasses[classId] || { cantrips: [], spellbook: [], prepared: [] };
      
      const newCantrips = (classSpells.cantrips || []).filter(id => id !== spellId);
      const newSpellbook = (classSpells.spellbook || []).filter(id => id !== spellId);
      const newPrepared = (classSpells.prepared || []).filter(id => id !== spellId);

      return {
        ...prev,
        spells: {
          ...prevSpells,
          classes: {
            ...prevClasses,
            [classId]: {
              ...classSpells,
              cantrips: listType === 'cantrips' ? newCantrips : classSpells.cantrips,
              spellbook: listType === 'spellbook' ? newSpellbook : classSpells.spellbook,
              // If removing from spellbook, we must also remove from prepared.
              // If removing from prepared, we only remove from prepared.
              prepared: (listType === 'spellbook' || listType === 'prepared') ? newPrepared : classSpells.prepared,
              known: listType === 'known' ? (classSpells.known || []).filter(id => id !== spellId) : classSpells.known
            }
          }
        }
      };
    });
  };
  // ----------------------------------

  useEffect(() => {
    fetch('http://localhost:5000/api?action=get_cc_data')
      .then(res => res.json())
      .then(async data => {
        const enrichedSpells = enrichSpellsCatalog(data?.spells || []);
        setDbData(prev => ({ ...prev, ...data, spells: enrichedSpells }));
        setLoading(false);

        // Check if there is a request to load a character from DB
        const params = new URLSearchParams(window.location.search);
        const loadId = params.get('load_char_id') || localStorage.getItem('workshop_load_char_id');
        if (loadId) {
          localStorage.removeItem('workshop_load_char_id');
          try {
            const charRes = await fetch(`http://localhost:5000/api?action=get_character_by_id&id=${loadId}`);
            const charObj = await charRes.json();
            if (charObj && !charObj.error) {
              if (charObj.build_data && typeof charObj.build_data === 'object' && Object.keys(charObj.build_data).length > 0) {
                setCharacterState({ ...charObj.build_data, char_id: charObj.char_id });
              } else {
                // Fallback hydration for legacy characters without build_data
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
                    classes: Array.isArray(charObj.classes_data) ? charObj.classes_data : prev.classData?.classes
                  },
                  spells: typeof charObj.spellcasting_data === 'object' ? charObj.spellcasting_data : prev.spells,
                  equipment: typeof charObj.inventory === 'object' ? charObj.inventory : prev.equipment,
                  feats: Array.isArray(charObj.feats_data) ? charObj.feats_data : prev.feats
                }));
              }
              // If review step requested via URL or localStorage
              const stepParam = params.get('step') || localStorage.getItem('workshop_currentStep');
              if (stepParam) {
                setCurrentStep(parseInt(stepParam) || 1);
              }
            }
          } catch (e) {
            console.error('Failed to load character by ID:', e);
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch builder data:', err);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    // Validation before moving to the next step
    if (currentStep === 1) {
      if (!characterState.race.id) {
        alert("Please select a species (race).");
        return;
      }
      const selectedRace = dbData.races?.find(r => r.species_id === characterState.race.id);
      if (selectedRace && selectedRace.size && selectedRace.size.includes(' or ') && !characterState.race.sizeChoice) {
        alert("Please choose your character's size.");
        return;
      }
      
      // Validate Trait Choices
      if (selectedRace && selectedRace.traits) {
        try {
          const traits = JSON.parse(selectedRace.traits);
          for (let t of traits) {
            const hasDirectOptions = t.logic && (t.logic.type === 'choice' || t.logic.type === 'proficiency') && t.logic.options;
            const hasNestedOptions = t.logic && t.logic.choices && t.logic.choices.options;
            if (hasDirectOptions || hasNestedOptions) {
              if (!characterState.race.traitChoices?.[t.name]) {
                alert(`Please make a selection for ${t.name}.`);
                return;
              }
            }
          }
        } catch { /* ignore */ }
      }

      const availableLineages = dbData.lineages?.filter(l => l.species_id === characterState.race.id) || [];
      if (availableLineages.length > 0) {
        if (!characterState.race.lineageId) {
          alert("Please select a lineage or subrace.");
          return;
        }
        
        // Validate Lineage Spells
        const selLineage = availableLineages.find(l => l.lineage_id === characterState.race.lineageId);
        if (selLineage && selLineage.granted_spells) {
          try {
            const spells = JSON.parse(selLineage.granted_spells);
            const requiresAbilityChoice = spells.some(s => s.ability && s.ability.includes('or '));
            const choiceSpell = spells.find(s => s.is_choice === 1);
            if (requiresAbilityChoice && !characterState.race.lineageSpellAbility) {
              alert("Please choose a Spellcasting Ability for your lineage spells.");
              return;
            }
            if (choiceSpell && !characterState.race.lineageSpellChoice) {
              alert("Please select your lineage spell.");
              return;
            }
          } catch { /* ignore */ }
        }
      }

      if (!characterState.race.languages || characterState.race.languages.length === 0) {
        alert("Please choose at least 1 language (up to 2 languages).");
        return;
      }
    }
    
    if (currentStep === 2) {
      const classList = characterState.classData.classes;
      if (classList.length === 0) {
        alert("Please select your primary class.");
        return;
      }
      
      for (let i = 0; i < classList.length; i++) {
        const cl = classList[i];
        const classInfo = dbData.classes?.find(c => c.class_id === cl.classId);
        const availableSubclasses = deduplicateSubclasses(dbData.subclasses?.filter(sc => sc.class_id === cl.classId) || [], cl.subclassId);
        
        // For simplicity, if there are subclasses available, require selection at level 3 onwards
        if (cl.level >= 3 && availableSubclasses.length > 0 && !cl.subclassId) {
          alert(`Please select a subclass for ${classInfo?.class_name || cl.classId}.`);
          return;
        }
      }
    }
    
    if (currentStep === 3) {
      if (!characterState.background?.id) {
        alert("Please select a background.");
        return;
      }
    }

    if (currentStep < STEPS.length) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleStepJump = (targetStepId) => {
    if (targetStepId === currentStep) return;
    if (targetStepId < currentStep) {
      setCurrentStep(targetStepId);
      return;
    }
    if (currentStep === 1 || targetStepId > 1) {
      if (!characterState.race.id) {
        alert("Please select a species (race) first.");
        return;
      }
      const selectedRace = dbData.races?.find(r => r.species_id === characterState.race.id);
      if (selectedRace && selectedRace.size && selectedRace.size.includes(' or ') && !characterState.race.sizeChoice) {
        alert("Please choose your character's size first.");
        return;
      }
      const availableLineages = dbData.lineages?.filter(l => l.species_id === characterState.race.id) || [];
      if (availableLineages.length > 0 && !characterState.race.lineageId) {
        alert("Please select a lineage or subrace first.");
        return;
      }
      if (!characterState.race.languages || characterState.race.languages.length === 0) {
        alert("Please choose at least 1 language first.");
        return;
      }
    }
    if (currentStep <= 2 && targetStepId > 2) {
      const classList = characterState.classData?.classes || [];
      if (classList.length === 0) {
        alert("Please select your primary class first.");
        return;
      }
      for (let i = 0; i < classList.length; i++) {
        const cl = classList[i];
        const classInfo = dbData.classes?.find(c => c.class_id === cl.classId);
        const availableSubclasses = deduplicateSubclasses(dbData.subclasses?.filter(sc => sc.class_id === cl.classId) || [], cl.subclassId);
        if (cl.level >= 3 && availableSubclasses.length > 0 && !cl.subclassId) {
          alert(`Please select a subclass for ${classInfo?.class_name || cl.classId} first.`);
          return;
        }
      }
    }
    if (currentStep <= 3 && targetStepId > 3) {
      if (!characterState.background?.id) {
        alert("Please select a background first.");
        return;
      }
    }
    setCurrentStep(targetStepId);
  };

  const handleExportCharacter = () => {
    const exportData = {
      ...characterState,
      abilities: totalStats,
      resolvedMechanics,
      racialSpells: resolvedMechanics?.spells?.racial || []
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `character_${characterState.race?.id || 'dnd'}_lv${characterState.classData?.classes?.reduce((a, b) => a + (parseInt(b.level)||1), 0) || 1}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [savingDbStatus, setSavingDbStatus] = useState('');
  const handleSaveToDatabase = async () => {
    setSavingDbStatus('กำลังบันทึกลงฐานข้อมูล...');
    const totalLvl = (characterState.classData?.classes || []).reduce((sum, c) => sum + (parseInt(c.level) || 1), 0) || 1;
    try {
      const payload = {
        action: 'save_character',
        char_id: characterState.char_id || null,
        user_id: (() => {
          try {
            const u = JSON.parse(localStorage.getItem('dnd_user'));
            if (u && u.user_id) return parseInt(u.user_id) || 1;
          } catch (e) {}
          return characterState.user_id ? parseInt(characterState.user_id) : 1;
        })(),
        char_name: characterState.description?.name || 'Unnamed Hero',
        species_id: characterState.race?.id,
        lineage_id: characterState.race?.subraceId || characterState.race?.lineageId,
        background_id: characterState.background?.id || characterState.background?.backgroundId || null,
        primary_class_id: characterState.classData?.classes?.[0]?.classId,
        classes_data: characterState.classData?.classes || [],
        char_alignment: characterState.description?.alignment || 'True Neutral',
        char_level: totalLvl,
        hp_max: resolvedMechanics?.hitPoints?.max || 10,
        hp_current: reviewHpCur !== null ? reviewHpCur : (resolvedMechanics?.hitPoints?.max || 10),
        str_score: totalStats.str,
        dex_score: totalStats.dex,
        con_score: totalStats.con,
        int_score: totalStats.int,
        wis_score: totalStats.wis,
        cha_score: totalStats.cha,
        proficiencies_choices: {
          skills: characterState.proficiencies?.skills || [],
          tools: characterState.proficiencies?.tools || []
        },
        spellcasting_data: characterState.spells || {},
        inventory: characterState.equipment || characterState.inventory || {},
        currency: characterState.equipment?.currency || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 },
        feats_data: characterState.feats || [],
        hit_dice_current: characterState.hit_dice_current || {},
        death_save_success: characterState.death_save_success || 0,
        death_save_failure: characterState.death_save_failure || 0,
        inspiration: characterState.inspiration || 0,
        exhaustion_level: characterState.exhaustion_level || 0,
        base_ac: resolvedMechanics?.armorClass?.value || 10,
        build_data: characterState,
        play_data: { reviewHpCur: reviewHpCur !== null ? reviewHpCur : (resolvedMechanics?.hitPoints?.max || 10) }
      };
      const res = await fetch('http://localhost:5000/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSavingDbStatus('✅ บันทึกตัวละครลงฐานข้อมูลเรียบร้อยแล้ว! กำลังนำคุณไปยังแผ่นตัวละคร...');
        const targetId = data.char_id || characterState.char_id;
        
        // Log Character Save event to database
        if (targetId) {
          try {
            await fetch('http://localhost:5000/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add_character_log',
                char_id: targetId,
                user_id: 1,
                category: 'build',
                action_type: 'SAVE_CHARACTER',
                log_text_th: `บันทึกอัปเดตตัวละคร ${characterState.description?.name || 'ตัวละคร'} (Level ${totalLvl}) ในเวิร์คช็อปสำเร็จ`,
                metadata_json: { char_name: characterState.description?.name, level: totalLvl }
              })
            });
          } catch(e) {}
        }
        
        // Clear local draft so new session starts fresh
        localStorage.removeItem('workshop_characterState');
        localStorage.removeItem('workshop_currentStep');

        setTimeout(() => {
          setSavingDbStatus('');
          if (targetId) {
            window.location.href = `/character/${targetId}`;
          } else {
            window.location.href = '/sheets';
          }
        }, 1200);
      } else {
        setSavingDbStatus('❌ บันทึกไม่สำเร็จ: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error("Save to DB Error:", err);
      setSavingDbStatus(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ${err.message}`);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <Step1Race
            characterState={characterState}
            setCharacterState={setCharacterState}
            dbData={dbData}
            loading={loading}
            previewRaceId={previewRaceId}
            setPreviewRaceId={setPreviewRaceId}
            confirmChangeRace={confirmChangeRace}
            setConfirmChangeRace={setConfirmChangeRace}
            totalStats={totalStats}
            resolvedMechanics={resolvedMechanics}
            proficientSkills={proficientSkills}
          />
        );
      case 2:
        return (
          <Step2Class
            characterState={characterState}
            setCharacterState={setCharacterState}
            dbData={dbData}
            loading={loading}
            previewClassId={previewClassId}
            setPreviewClassId={setPreviewClassId}
            showFullClassInfo={showFullClassInfo}
            setShowFullClassInfo={setShowFullClassInfo}
            showFeatDetails={showFeatDetails}
            setShowFeatDetails={setShowFeatDetails}
            setClassToDeleteIndex={setClassToDeleteIndex}
            setLevelConfirm={setLevelConfirm}
            isSpellbookView={isSpellbookView}
            setIsSpellbookView={setIsSpellbookView}
            activeSpellClassTab={activeSpellClassTab}
            setActiveSpellClassTab={setActiveSpellClassTab}
            spellSearchTerm={spellSearchTerm}
            setSpellSearchTerm={setSpellSearchTerm}
            spellFilterLevel={spellFilterLevel}
            setSpellFilterLevel={setSpellFilterLevel}
            spellFilterSchool={spellFilterSchool}
            setSpellFilterSchool={setSpellFilterSchool}
            spellbookSearchTerm={spellbookSearchTerm}
            setSpellbookSearchTerm={setSpellbookSearchTerm}
            spellbookFilterLevels={spellbookFilterLevels}
            setSpellbookFilterLevels={setSpellbookFilterLevels}
            totalStats={totalStats}
            resolvedMechanics={resolvedMechanics}
            spellSlotsCalculation={spellSlotsCalculation}
            knownSpellsSourceMap={knownSpellsSourceMap}
            allKnownSpellIds={allKnownSpellIds}
            handleAddSpell={handleAddSpell}
            handleRemoveSpell={handleRemoveSpell}
            proficientSkills={proficientSkills}
            expertiseSkills={expertiseSkills}
            activeClassSaves={activeClassSaves}
          />
        );
      case 3:
        return (
          <Step3Background
            characterState={characterState}
            setCharacterState={setCharacterState}
            dbData={dbData}
            showFeatDetails={showFeatDetails}
            setShowFeatDetails={setShowFeatDetails}
            bgSearchTerm={bgSearchTerm}
            setBgSearchTerm={setBgSearchTerm}
            bgStatFilter={bgStatFilter}
            setBgStatFilter={setBgStatFilter}
            bgFeatFilter={bgFeatFilter}
            setBgFeatFilter={setBgFeatFilter}
            totalStats={totalStats}
            resolvedMechanics={resolvedMechanics}
            proficientSkills={proficientSkills}
            expertiseSkills={expertiseSkills}
            allKnownSpellIds={allKnownSpellIds}
          />
        );
      case 4:
        return (
          <Step4Abilities
            characterState={characterState}
            setCharacterState={setCharacterState}
            dbData={dbData}
            totalStats={totalStats}
            resolvedMechanics={resolvedMechanics}
            proficientSkills={proficientSkills}
            expertiseSkills={expertiseSkills}
            activeClassSaves={activeClassSaves}
          />
        );
      case 5:
        return (
          <Step5Equipment
            characterState={characterState}
            setCharacterState={setCharacterState}
            dbData={dbData}
            totalStats={totalStats}
            catalogSearch={catalogSearch}
            setCatalogSearch={setCatalogSearch}
            catalogCategory={catalogCategory}
            setCatalogCategory={setCatalogCategory}
          />
        );
      case 6:
        return (
          <Step6Details
            characterState={characterState}
            setCharacterState={setCharacterState}
          />
        );
      case 7:
        return (
          <Step7Review
            characterState={characterState}
            setCharacterState={setCharacterState}
            setCurrentStep={setCurrentStep}
            dbData={dbData}
            savingDbStatus={savingDbStatus}
            deathSaves={deathSaves}
            setDeathSaves={setDeathSaves}
            triggerQuickRoll={triggerQuickRoll}
            totalStats={totalStats}
            resolvedMechanics={resolvedMechanics}
            proficientSkills={proficientSkills}
            expertiseSkills={expertiseSkills}
            activeClassSaves={activeClassSaves}
            spellSlotsCalculation={spellSlotsCalculation}
            knownSpellsSourceMap={knownSpellsSourceMap}
            allKnownSpellIds={allKnownSpellIds}
            handleAddSpell={handleAddSpell}
            handleRemoveSpell={handleRemoveSpell}
            handleExportCharacter={handleExportCharacter}
            handleSaveToDatabase={handleSaveToDatabase}
            reviewTab={reviewTab}
            setReviewTab={setReviewTab}
            reviewHpCur={reviewHpCur}
            setReviewHpCur={setReviewHpCur}
            reviewHpTemp={reviewHpTemp}
            setReviewHpTemp={setReviewHpTemp}
            hasInspiration={hasInspiration}
            setHasInspiration={setHasInspiration}
            rollAdvMode={rollAdvMode}
            setRollAdvMode={setRollAdvMode}
            reviewActionFilter={reviewActionFilter}
            setReviewActionFilter={setReviewActionFilter}
            diceModalData={diceModalData}
            setDiceModalData={setDiceModalData}
            showHpAdjustModal={showHpAdjustModal}
            setShowHpAdjustModal={setShowHpAdjustModal}
            hpAdjustVal={hpAdjustVal}
            setHpAdjustVal={setHpAdjustVal}
            shortRestsCount={shortRestsCount}
            setShortRestsCount={setShortRestsCount}
            showDiaryModal={showDiaryModal}
            setShowDiaryModal={setShowDiaryModal}
            diaryNotes={diaryNotes}
            setDiaryNotes={setDiaryNotes}
            liveSpellSlots={liveSpellSlots}
            setLiveSpellSlots={setLiveSpellSlots}
            liveFeatureCharges={liveFeatureCharges}
            setLiveFeatureCharges={setLiveFeatureCharges}
            reviewSpellLevelFilter={reviewSpellLevelFilter}
            setReviewSpellLevelFilter={setReviewSpellLevelFilter}
            reviewSpellSearch={reviewSpellSearch}
            setReviewSpellSearch={setReviewSpellSearch}
            reviewInvTab={reviewInvTab}
            setReviewInvTab={setReviewInvTab}
            reviewInvSearch={reviewInvSearch}
            setReviewInvSearch={setReviewInvSearch}
            reviewFeatFilter={reviewFeatFilter}
            setReviewFeatFilter={setReviewFeatFilter}
            reviewFeatSearch={reviewFeatSearch}
            setReviewFeatSearch={setReviewFeatSearch}
            expandedFeatures={expandedFeatures}
            setExpandedFeatures={setExpandedFeatures}
            editingChoiceKey={editingChoiceKey}
            setEditingChoiceKey={setEditingChoiceKey}
            showSheetManageSpellsModal={showSheetManageSpellsModal}
            setShowSheetManageSpellsModal={setShowSheetManageSpellsModal}
            showManageFeatsModal={showManageFeatsModal}
            setShowManageFeatsModal={setShowManageFeatsModal}
            newFeatToAdd={newFeatToAdd}
            setNewFeatToAdd={setNewFeatToAdd}
            sheetManageSpellTab={sheetManageSpellTab}
            setSheetManageSpellTab={setSheetManageSpellTab}
            sheetManageSpellSearch={sheetManageSpellSearch}
            setSheetManageSpellSearch={setSheetManageSpellSearch}
            sheetManageSpellLevel={sheetManageSpellLevel}
            setSheetManageSpellLevel={setSheetManageSpellLevel}
            sheetSpellbookSearch={sheetSpellbookSearch}
            setSheetSpellbookSearch={setSheetSpellbookSearch}
            sheetSpellbookLevels={sheetSpellbookLevels}
            setSheetSpellbookLevels={setSheetSpellbookLevels}
            showAddWeaponModal={showAddWeaponModal}
            setShowAddWeaponModal={setShowAddWeaponModal}
            newWpName={newWpName}
            setNewWpName={setNewWpName}
            newWpDmg={newWpDmg}
            setNewWpDmg={setNewWpDmg}
            newWpStat={newWpStat}
            setNewWpStat={setNewWpStat}
            showAddItemModal={showAddItemModal}
            setShowAddItemModal={setShowAddItemModal}
            sheetAddItemSearch={sheetAddItemSearch}
            setSheetAddItemSearch={setSheetAddItemSearch}
            sheetAddItemCategory={sheetAddItemCategory}
            setSheetAddItemCategory={setSheetAddItemCategory}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            newItemQty={newItemQty}
            setNewItemQty={setNewItemQty}
            gameplayRollHistory={gameplayRollHistory}
            setGameplayRollHistory={setGameplayRollHistory}
          />
        );
      default: return null;
    }
  };

  return (
    <div className="character-builder-wrapper">
      {/* Header & Stepper (Prototype Aligned) */}
      <div className="builder-header">
        <div className="builder-header-top">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontFamily: 'Cinzel, serif', fontSize: '1.6rem', fontWeight: 'bold', color: '#711a19', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <i className="fa-solid fa-compass-drafting" style={{ color: '#711a19' }}></i> 
                WORKSHOP CHARACTER BUILDER
            </h2>
            <button onClick={onCancel} className="btn-cancel-builder">
                <i className="fa-solid fa-xmark"></i> EXIT WORKSHOP
            </button>
        </div>
        
        <div className="stepper-container">
            {STEPS.map((step) => (
                <div 
                  key={step.id} 
                  className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                  onClick={() => handleStepJump(step.id)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepJump(step.id); }}
                >
                    <div className="step-icon-wrapper">
                        {step.id}
                    </div>
                    <div className="step-label">
                        <span className="step-text uppercase tracking-wider">{step.title}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="builder-body">
          {renderStepContent()}
      </div>

      {/* Footer Navigation */}
      
      {/* Enhanced Clear Step Footer Navigation */}
      {(() => {
        const prevStep = STEPS.find(s => s.id === currentStep - 1);
        const currentStepObj = STEPS.find(s => s.id === currentStep) || STEPS[0];
        const nextStep = STEPS.find(s => s.id === currentStep + 1);
        const percent = Math.round((currentStep / STEPS.length) * 100);

        return (
          <div className="builder-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-white)', padding: '16px 20px', borderTop: '2px solid #e2e8f0', flexWrap: 'nowrap', gap: '15px', position: 'relative', minHeight: '70px' }}>
            {/* Prev Button with Named Previous Step */}
            <button 
              className="btn-builder-prev" 
              onClick={handlePrev} 
              disabled={currentStep === 1}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: currentStep === 1 ? '#f1f5f9' : 'var(--bg-white)',
                color: currentStep === 1 ? '#94a3b8' : 'var(--color-ink)',
                fontWeight: 'bold',
                fontSize: '0.88rem',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> 
              {currentStep === 1 ? 'กลับหน้าแรก' : `ย้อนกลับ (${prevStep.title} - ${prevStep.labelThai})`}
            </button>
            
            {/* Middle Progress Badge & Step Number Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#711a19', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-flag-checkered"></i>
                <span>Step {currentStep} จาก {STEPS.length}: <strong>{currentStepObj.title} ({currentStepObj.labelThai})</strong></span>
                <span style={{ backgroundColor: '#fef2f2', color: '#711a19', padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{percent}%</span>
              </div>
              
              {/* Numbered Step Pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {STEPS.map(s => {
                  const isCurrent = currentStep === s.id;
                  const isDone = currentStep > s.id;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => handleStepJump(s.id)}
                      title={`Step ${s.id}: ${s.title} (${s.labelThai})`}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: isCurrent ? '#711a19' : (isDone ? '#15803d' : '#e2e8f0'),
                        color: (isCurrent || isDone) ? '#ffffff' : '#64748b',
                        transition: 'all 0.2s',
                        boxShadow: isCurrent ? '0 0 0 2px #fecaca' : 'none'
                      }}
                    >
                      {isDone ? <i className="fa-solid fa-check" style={{ fontSize: '0.65rem' }}></i> : s.id}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Button with Named Next Step */}
            {currentStep < STEPS.length ? (
              <button 
                className="btn-builder-next" 
                onClick={handleNext}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#711a19',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(113, 26, 25, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                <span>ถัดไป: Step {nextStep.id} {nextStep.title} ({nextStep.labelThai})</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            ) : (
              <button 
                onClick={handleSaveToDatabase}
                className="btn-builder-submit"
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(21, 128, 61, 0.2)'
                }}
              >
                <i className="fa-solid fa-floppy-disk"></i>
                <span>{savingDbStatus.startsWith('กำลัง') ? savingDbStatus : 'บันทึกตัวละครเสร็จสมบูรณ์'}</span>
              </button>
            )}
          </div>
        );
      })()}

      <WorkshopModals
        classToDeleteIndex={classToDeleteIndex}
        setClassToDeleteIndex={setClassToDeleteIndex}
        previewClassId={previewClassId}
        setPreviewClassId={setPreviewClassId}
        showFullClassInfo={showFullClassInfo}
        setShowFullClassInfo={setShowFullClassInfo}
        levelConfirm={levelConfirm}
        setLevelConfirm={setLevelConfirm}
        characterState={characterState}
        setCharacterState={setCharacterState}
        dbData={dbData}
      />
            {/* --- DEBUG VIEW --- */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        <button 
          onClick={() => setShowDebug(!showDebug)}
          style={{ backgroundColor: 'var(--color-ink)', color: 'var(--bg-white)', padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
        >
          <i className="fa-solid fa-bug" style={{ marginRight: '8px' }}></i>
          {showDebug ? 'Hide Debug View' : 'Show Real-time Debug View'}
        </button>
        {showDebug && (
          <div style={{ position: 'absolute', bottom: '50px', right: '0', width: '400px', maxHeight: '500px', overflowY: 'auto', backgroundColor: 'var(--color-ink)', color: '#10b981', padding: '15px', borderRadius: '8px', boxShadow: '0 10px 15px rgba(0,0,0,0.3)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--bg-white)' }}>characterState & Resolved Mechanics</h4>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {JSON.stringify({ ...characterState, abilities: totalStats, resolvedMechanics }, null, 2)}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
}

export default WorkshopCharacterBuilder;

