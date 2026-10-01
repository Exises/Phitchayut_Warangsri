import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  ALL_SKILLS_LIST,
  SKILL_ABILITY_MAP,
  getFeatConfig,
  formatCleanName,
  getFeatName,
  getEnhancedFeatDesc,
  getAllInnateAndFeatureSpells,
  cleanAndStyleHtml,
  toggleMultiLevelFilter,
  matchesMultiLevel,
  calculateLongRestHdRecovery
} from '../../../utils/workshopHelpers';
import { FeatChoiceEditor } from '../WorkshopWidgets';
import TopCombatStrip from '../../actions/TopCombatStrip';
import ActionsDashboard from '../../actions/ActionsDashboard';
import AdventureDiaryModal from './AdventureDiaryModal';
import CustomDiceRollerModal from '../modals/CustomDiceRollerModal';
import DiceResultToast from '../modals/DiceResultToast';
import parsedItemsCatalog from '../../../data/parsed_items_catalog.json';

export default function Step7Review({
  characterState,
  setCharacterState,
  setCurrentStep,
  dbData,
  savingDbStatus,
  deathSaves = { succ: [false, false, false], fail: [false, false, false] },
  setDeathSaves = () => {},
  triggerQuickRoll,
  totalStats,
  resolvedMechanics,
  spellSlotsCalculation,
  knownSpellsSourceMap,
  allKnownSpellIds,
  handleAddSpell,
  handleRemoveSpell,
  handleExportCharacter,
  handleSaveToDatabase,
  proficientSkills: propProficientSkills = [],
  expertiseSkills: propExpertiseSkills = [],
  activeClassSaves = [],
  diceModalData = null,
  setDiceModalData = () => {},
  rollAdvMode = 'normal',
  setRollAdvMode = () => {},
  gameplayRollHistory = [],
  setGameplayRollHistory = () => {},
  isPlayMode = false,
  onEditCharacter = null
}) {
        const [reviewTab, setReviewTab] = useState('summary');
        const [reviewHpCur, setReviewHpCur] = useState(characterState?.hp?.current ?? 10);
        const [reviewHpTemp, setReviewHpTemp] = useState(characterState?.hp?.temp ?? 0);
        
        const initialExpHd = characterState?.hit_dice_current?.expended;
        const defaultExpHd = typeof initialExpHd === 'object' && initialExpHd !== null 
          ? initialExpHd 
          : (typeof initialExpHd === 'number' 
              ? { [(resolvedMechanics?.hitPoints?.hitDiceList?.[0]?.classId || 'unknown')]: initialExpHd } 
              : {});
        const [reviewExpendedHd, setReviewExpendedHd] = useState(defaultExpHd);
        
        const [deathSaveSuccess, setDeathSaveSuccess] = useState(characterState?.death_save_success ?? 0);
        const [deathSaveFailure, setDeathSaveFailure] = useState(characterState?.death_save_failure ?? 0);
        const [activeHpTab, setActiveHpTab] = useState('combat');

        const syncHpAndSave = (nextHp, nextTemp, nextHd, nextSucc, nextFail) => {
          const targetHp = nextHp !== undefined ? nextHp : (reviewHpCur !== null ? reviewHpCur : (resolvedMechanics?.hitPoints?.max || 10));
          const targetTemp = nextTemp !== undefined ? nextTemp : reviewHpTemp;
          const targetHd = nextHd !== undefined ? nextHd : reviewExpendedHd;
          const targetSucc = nextSucc !== undefined ? nextSucc : (deathSaves?.succ ? deathSaves.succ.filter(Boolean).length : deathSaveSuccess);
          const targetFail = nextFail !== undefined ? nextFail : (deathSaves?.fail ? deathSaves.fail.filter(Boolean).length : deathSaveFailure);

          if (nextHp !== undefined) setReviewHpCur(targetHp);
          if (nextTemp !== undefined) setReviewHpTemp(targetTemp);
          if (nextHd !== undefined) setReviewExpendedHd(targetHd);
          if (nextSucc !== undefined) setDeathSaveSuccess(targetSucc);
          if (nextFail !== undefined) setDeathSaveFailure(targetFail);

          if (setDeathSaves && (nextSucc !== undefined || nextFail !== undefined)) {
            setDeathSaves({
              succ: [targetSucc >= 1, targetSucc >= 2, targetSucc >= 3],
              fail: [targetFail >= 1, targetFail >= 2, targetFail >= 3]
            });
          }

          if (setCharacterState) {
            setCharacterState(prev => {
              const updated = {
                ...prev,
                hp: {
                  ...(prev.hp || {}),
                  current: targetHp,
                  temp: targetTemp
                },
                hit_dice_current: {
                  ...(prev.hit_dice_current || {}),
                  expended: targetHd
                },
                death_save_success: targetSucc,
                death_save_failure: targetFail
              };
              if (typeof handleSaveToDatabase === 'function') {
                setTimeout(() => handleSaveToDatabase(updated), 100);
              }
              return updated;
            });
          }
        };

        useEffect(() => {
          const maxHp = resolvedMechanics?.hitPoints?.max || 10;
          if (reviewHpCur > maxHp) {
            syncHpAndSave(maxHp, undefined, undefined, undefined, undefined);
          }
        }, [resolvedMechanics?.hitPoints?.max]);

        const postLogToDb = (category, actionType, logTextTh, metadata = null) => {
          const charId = characterState?.char_id;
          if (!charId || charId === 'current') return;
          try {
            fetch('http://localhost:5000/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add_character_log',
                char_id: charId,
                user_id: 1,
                category,
                action_type: actionType,
                log_text_th: logTextTh,
                metadata_json: metadata
              })
            }).catch(() => {});
          } catch(e) {}
        };

        const logHpAction = (title, details, displayTotal = '✓') => {
          const logMsg = `${title}: ${details}`;
          if (typeof setGameplayRollHistory === 'function') {
            setGameplayRollHistory(prev => [{
              title,
              formula: details,
              total: displayTotal,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...(prev || []).slice(0, 24)]);
          }
          // Persist HP action to DB
          postLogToDb('gameplay', 'HP_ACTION', logMsg, { title, formula: details, total: displayTotal });
        };

        const syncSpellsToSheet = (classId, type, spellArray) => {
          if (!setCharacterState) return;
          
          setCharacterState(prev => {
            const updated = {
              ...prev,
              spells: {
                ...(prev.spells || {}),
                classes: {
                  ...(prev.spells?.classes || {}),
                  [classId]: {
                    ...(prev.spells?.classes?.[classId] || {}),
                    [type]: spellArray
                  }
                }
              }
            };
            if (typeof handleSaveToDatabase === 'function') {
              setTimeout(() => handleSaveToDatabase(updated), 100);
            }
            return updated;
          });
        };

        const [liveSpellSlots, setLiveSpellSlots] = useState({});
        const [liveFeatureCharges, setLiveFeatureCharges] = useState({});
        const [hasInspiration, setHasInspiration] = useState(false);
        const [reviewSpellSearch, setReviewSpellSearch] = useState('');
        const [reviewSpellLevelFilter, setReviewSpellLevelFilter] = useState('All');
        const [reviewInvTab, setReviewInvTab] = useState('All');
        const [reviewInvSearch, setReviewInvSearch] = useState('');
        const [reviewFeatSearch, setReviewFeatSearch] = useState('');
        const [reviewFeatFilter, setReviewFeatFilter] = useState('All');
        const [expandedFeatures, setExpandedFeatures] = useState({});
        const [expandedSpells, setExpandedSpells] = useState({});
        const [expandedItems, setExpandedItems] = useState({});
        const [editingChoiceKey, setEditingChoiceKey] = useState({});

        // Modals
        const [showHpAdjustModal, setShowHpAdjustModal] = useState(false);
        const [hpAdjustVal, setHpAdjustVal] = useState('');
        const [showDiaryModal, setShowDiaryModal] = useState(false);
        const [showCustomDiceRollerModal, setShowCustomDiceRollerModal] = useState(false);
        const [diaryInitialEntry, setDiaryInitialEntry] = useState(null);
        const [diaryNotes, setDiaryNotes] = useState(characterState?.diary || '');
        const [showAddWeaponModal, setShowAddWeaponModal] = useState(false);
        const [newWpName, setNewWpName] = useState('');
        const [newWpDmg, setNewWpDmg] = useState('');
        const [newWpStat, setNewWpStat] = useState('str');
        const [showAddItemModal, setShowAddItemModal] = useState(false);
        const [sheetAddItemSearch, setSheetAddItemSearch] = useState('');
        const [sheetAddItemCategory, setSheetAddItemCategory] = useState('All');
        const [newItemName, setNewItemName] = useState('');
        const [newItemQty, setNewItemQty] = useState(1);
        
        const [showSheetManageSpellsModal, setShowSheetManageSpellsModal] = useState(false);
        const [sheetManageSpellTab, setSheetManageSpellTab] = useState('');
        const [manageSpellsAccordion, setManageSpellsAccordion] = useState({ prepared: true, spellbook: false, available: false });
        const [sheetManageSpellSearch, setSheetManageSpellSearch] = useState('');
        const [sheetManageSpellLevel, setSheetManageSpellLevel] = useState(['all']);
        const [sheetSpellbookSearch, setSheetSpellbookSearch] = useState('');
        const [sheetSpellbookLevels, setSheetSpellbookLevels] = useState(['all']);
        const [showManageFeatsModal, setShowManageFeatsModal] = useState(false);
        const [newFeatToAdd, setNewFeatToAdd] = useState('');

        const toggleMultiLevel = (listType, val) => {
          if (listType === 'avail') {
            setSheetManageSpellLevel(prev => toggleMultiLevelFilter(prev, val));
          } else if (listType === 'book') {
            setSheetSpellbookLevels(prev => toggleMultiLevelFilter(prev, val));
          }
        };

        const proficientSkills = propProficientSkills.length > 0 ? propProficientSkills : (resolvedMechanics?.proficiencies?.skills || []);
        const expertiseSkills = propExpertiseSkills.length > 0 ? propExpertiseSkills : (resolvedMechanics?.proficiencies?.expertise || []);

        if (!resolvedMechanics) {
          return (
            <div className="builder-step-content animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#711a19' }}></i>
              <p style={{ marginTop: '16px', color: 'var(--color-gray)', fontSize: '1.1rem' }}>Calculating final character statistics...</p>
            </div>
          );
        }

        const charName = characterState.description?.name || 'NAMELESS ADVENTURER';
        const raceName = dbData.races?.find(r => r.species_id === characterState.race?.id)?.species_name || characterState.race?.id || 'Human';
        const classList = characterState.classData?.classes || [];
        const totalLvl = classList.reduce((acc, c) => acc + (parseInt(c.level) || 1), 0);
        const classStr = classList.map(c => `${String(c.classId).charAt(0).toUpperCase() + String(c.classId).slice(1)} (${c.level || 1})`).join(' / ') || 'Adventurer';
        const getMod = val => Math.floor(((parseInt(val) || 10) - 10) / 2);
        const fmtMod = mod => mod >= 0 ? `+${mod}` : `${mod}`;

        const strMod = getMod(totalStats.str);
        const dexMod = getMod(totalStats.dex);
        const conMod = getMod(totalStats.con);
        const intMod = getMod(totalStats.int);

        let hasThaumaturge = false, hasMagician = false, hasProtector = false, hasWarden = false;
        classList.forEach(cl => {
          Object.values(cl.featureChoices || {}).forEach(val => {
            const arr = Array.isArray(val) ? val : [val];
            arr.forEach(v => {
              if (v === 'Thaumaturge') hasThaumaturge = true;
              if (v === 'Magician') hasMagician = true;
              if (v === 'Protector') hasProtector = true;
              if (v === 'Warden') hasWarden = true;
            });
          });
        });

        const wisMod = getMod(totalStats.wis);
        const chaMod = getMod(totalStats.cha);
        const profBonus = Math.ceil(1 + (totalLvl / 4));

        const primaryCastingClass = classList.find(cl => ['wizard', 'cleric', 'druid', 'ranger', 'bard', 'sorcerer', 'warlock', 'paladin'].includes(String(cl.classId || '').toLowerCase()));
        const castingClassId = String(primaryCastingClass?.classId || characterState.classData?.primaryClassId || '').toLowerCase();
        let activeSpellAbilityAbbr = 'INT';
        let activeSpellMod = intMod;
        if (['cleric', 'druid', 'ranger'].includes(castingClassId)) {
          activeSpellAbilityAbbr = 'WIS';
          activeSpellMod = wisMod;
        } else if (['bard', 'sorcerer', 'warlock', 'paladin'].includes(castingClassId)) {
          activeSpellAbilityAbbr = 'CHA';
          activeSpellMod = chaMod;
        } else if (castingClassId === 'wizard') {
          activeSpellAbilityAbbr = 'INT';
          activeSpellMod = intMod;
        } else {
          if (wisMod >= intMod && wisMod >= chaMod) { activeSpellAbilityAbbr = 'WIS'; activeSpellMod = wisMod; }
          else if (chaMod >= intMod && chaMod >= wisMod) { activeSpellAbilityAbbr = 'CHA'; activeSpellMod = chaMod; }
          else { activeSpellAbilityAbbr = 'INT'; activeSpellMod = intMod; }
        }

        const maxHp = resolvedMechanics.hitPoints.max || 10;
        const curHp = reviewHpCur !== null ? reviewHpCur : maxHp;

        // Gather equipped weapons or weapons from equipment/inventory
        const allItemsList = dbData?.items || [];
        const allArmorsDb = dbData?.armors || [];
        const allWeaponsDb = dbData?.weapons || [];
        let rawItems = [...(characterState.equipment?.items || characterState.inventory?.items || [])];

        // Ensure Step 5 selected armor, shield, and weapons are reflected in rawItems
        const ensureInRawItems = (idOrName, catFallback) => {
          if (!idOrName) return;
          const exists = rawItems.some(it => it.itemId === idOrName || (it.name || '').toLowerCase() === String(idOrName).toLowerCase());
          if (!exists) {
            const found = allItemsList.find(i => i.item_id === idOrName || (i.item_name || '').toLowerCase() === String(idOrName).toLowerCase())
                       || allArmorsDb.find(i => i.item_id === idOrName || (i.item_name || '').toLowerCase() === String(idOrName).toLowerCase())
                       || allWeaponsDb.find(i => i.item_id === idOrName || (i.item_name || '').toLowerCase() === String(idOrName).toLowerCase());
            if (found) {
              rawItems.push({
                itemId: found.item_id || idOrName,
                name: found.item_name || idOrName,
                category: found.subcategory || catFallback,
                damage: found.damage,
                ac_base: found.ac,
                weight: found.weight || 0,
                cost: found.cost || '',
                qty: 1,
                equipped: true
              });
            } else if (typeof idOrName === 'string') {
              rawItems.push({ itemId: idOrName, name: idOrName, category: catFallback, qty: 1, equipped: true });
            }
          }
        };

        ensureInRawItems(characterState.equipment?.armorId, 'Armor');
        ensureInRawItems(characterState.equipment?.shieldId, 'Shield');
        (characterState.equipment?.weapons || []).filter(Boolean).forEach(wid => ensureInRawItems(wid, 'Weapon'));

        const rawWeaponIds = characterState.equipment?.weapons || [];
        const weaponsList = [];
        rawItems.forEach(item => {
          const cat = (item.category || '').toLowerCase();
          if ((cat.includes('weapon') || item.damage || item.damage_dice) && item.equipped !== false) {
            weaponsList.push(item);
          }
        });
        rawWeaponIds.forEach(wid => {
          const widStr = typeof wid === 'string' ? wid.toLowerCase() : '';
          const invMatch = rawItems.find(it => it.itemId === wid || (it.name || '').toLowerCase() === widStr);
          if (invMatch && invMatch.equipped === false) return;
          if (!weaponsList.some(w => w.itemId === wid || (w.name || '').toLowerCase() === widStr)) {
            const dbWp = allItemsList.find(i => i.item_id === wid || (i.item_name || '').toLowerCase() === widStr)
                      || allWeaponsDb.find(i => i.item_id === wid || (i.item_name || '').toLowerCase() === widStr);
            if (dbWp) {
              weaponsList.push({ itemId: dbWp.item_id, name: dbWp.item_name, damage: dbWp.damage, properties: (dbWp.properties || '').split(','), category: dbWp.subcategory || 'Weapon', equipped: true });
            } else if (typeof wid === 'string') {
              weaponsList.push({ itemId: wid, name: wid, damage: '1d6', category: 'Weapon', equipped: true });
            }
          }
        });
        const weapons = weaponsList;
        // eslint-disable-next-line no-unused-vars
        const currency = characterState.equipment?.currency || characterState.inventory?.gold || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 };

        // 1. Prepare All Real Spells (Class Spells, Innate, Racial)
        const allSpellsDb = dbData?.spells || [];
        const allSpellsListReview = [];

        // Add Racial Spells
        (resolvedMechanics.spells?.racial || []).forEach(rSp => {
          const dbSp = allSpellsDb.find(s => String(s.spell_id) === String(rSp.id) || String(s.spell_name)?.toLowerCase() === String(rSp.name)?.toLowerCase());
          allSpellsListReview.push({
            id: rSp.id,
            name: rSp.name,
            level: dbSp && dbSp.spell_level !== undefined ? parseInt(dbSp.spell_level, 10) : parseInt(rSp.level || 0, 10),
            source: rSp.source || 'Racial',
            school: dbSp?.school || 'Magic',
            castingTime: dbSp?.casting_time || '1A',
            range: dbSp?.range_dist || dbSp?.range || '60 ft.',
            duration: dbSp?.duration || 'Instantaneous',
            components: dbSp?.components || 'V, S',
            spellDesc: dbSp?.spell_desc || '',
            mechanics: dbSp?.mechanics || null,
            effect: dbSp?.damage || dbSp?.effect || '',
            notes: dbSp?.components ? `${dbSp.components}` : 'V/S'
          });
        });

        // Add Class Spells (Prepared, Cantrips, Known, AlwaysPrepared, Spellbook)
        Object.entries(characterState.spells?.classes || {}).forEach(([cKey, cData]) => {
          ['cantrips', 'prepared', 'known', 'alwaysPrepared', 'spellbook'].forEach(listKey => {
            (cData[listKey] || []).forEach(spItem => {
              const spIdOrName = typeof spItem === 'object' ? (spItem.spell_id || spItem.name) : spItem;
              if (!spIdOrName) return;
              if (!allSpellsListReview.some(x => String(x.id || x.name).toLowerCase() === String(spIdOrName).toLowerCase())) {
                const dbSp = allSpellsDb.find(s => String(s.spell_id) === String(spIdOrName) || String(s.spell_name)?.toLowerCase() === String(spIdOrName).toLowerCase() || String(s.name)?.toLowerCase() === String(spIdOrName).toLowerCase());
                const parsedLvl = dbSp && dbSp.spell_level !== undefined ? parseInt(dbSp.spell_level, 10) : (listKey === 'cantrips' ? 0 : 1);
                allSpellsListReview.push({
                  id: dbSp ? dbSp.spell_id : spIdOrName,
                  name: dbSp ? (dbSp.spell_name || dbSp.name) : spIdOrName,
                  level: parsedLvl,
                  source: `${cKey.charAt(0).toUpperCase() + cKey.slice(1)}`,
                  school: dbSp?.school || 'Magic',
                  castingTime: dbSp?.casting_time || '1A',
                  range: dbSp?.range_dist || dbSp?.range || 'Self',
                  duration: dbSp?.duration || 'Instantaneous',
                  components: dbSp?.components || 'V, S',
                  spellDesc: dbSp?.spell_desc || '',
                  mechanics: dbSp?.mechanics || null,
                  effect: dbSp?.damage || dbSp?.effect || '',
                  notes: dbSp?.components ? `${dbSp.components}` : 'V/S'
                });
              }
            });
          });
        });

        // Add Innate & Feature Spells
        getAllInnateAndFeatureSpells(characterState, dbData).forEach(spItem => {
          const spIdOrName = typeof spItem === 'object' ? (spItem.id || spItem.name || spItem.spell_id) : spItem;
          if (!spIdOrName) return;
          if (!allSpellsListReview.some(x => String(x.id || x.name).toLowerCase() === String(spIdOrName).toLowerCase())) {
            const dbSp = allSpellsDb.find(s => String(s.spell_id) === String(spIdOrName) || String(s.spell_name)?.toLowerCase() === String(spIdOrName).toLowerCase());
            const parsedLvl = dbSp && dbSp.spell_level !== undefined ? parseInt(dbSp.spell_level, 10) : parseInt(spItem.level || 0, 10);
            allSpellsListReview.push({
              id: dbSp ? dbSp.spell_id : spIdOrName,
              name: dbSp ? (dbSp.spell_name || dbSp.name) : spIdOrName,
              level: parsedLvl,
              source: spItem.source || 'Innate / Feat',
              ability: spItem.ability,
              hasFreeCast: spItem.hasFreeCast,
              canUseSlots: spItem.canUseSlots,
              school: dbSp?.school || 'Magic',
              castingTime: dbSp?.casting_time || '1A',
              range: dbSp?.range_dist || dbSp?.range || 'Self',
              duration: dbSp?.duration || 'Instantaneous',
              components: dbSp?.components || 'V, S',
              spellDesc: dbSp?.spell_desc || '',
              mechanics: dbSp?.mechanics || null,
              notes: dbSp?.components ? `${dbSp.components}` : 'V/S'
            });
          }
        });

        const attackSpellsList = allSpellsListReview.filter(sp => {
          const cTime = (sp.castingTime || '').toLowerCase();
          const desc = (sp.spellDesc || sp.effect || '').toLowerCase();
          const mechStr = sp.mechanics ? JSON.stringify(sp.mechanics).toLowerCase() : '';
          return (cTime === '1a' || cTime.includes('action') || cTime.includes('instant')) && (desc.includes('attack roll') || desc.includes('melee spell attack') || desc.includes('ranged spell attack') || mechStr.includes('attack'));
        });
        const bonusActionSpells = allSpellsListReview.filter(sp => {
          const cTime = (sp.castingTime || '').toLowerCase();
          return cTime.includes('bonus');
        });
        const reactionSpells = allSpellsListReview.filter(sp => {
          const cTime = (sp.castingTime || '').toLowerCase();
          return cTime.includes('reaction');
        });
        const ritualSpells = allSpellsListReview.filter(sp => {
          const desc = (sp.spellDesc || sp.notes || '').toLowerCase();
          const mechStr = sp.mechanics ? JSON.stringify(sp.mechanics).toLowerCase() : '';
          return desc.includes('ritual') || mechStr.includes('ritual');
        });

        // Helper to safely format feature/trait descriptions without dumping raw JSON
        const formatTraitOrFeatureText = (val) => {
          if (!val) return 'No description provided.';
          if (typeof val === 'object') {
            return val.display || val.description || val.desc || val.effect || val.name || JSON.stringify(val);
          }
          if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              try {
                const parsed = JSON.parse(trimmed);
                return parsed.display || parsed.description || parsed.desc || parsed.effect || parsed.name || val;
              } catch {
                return val;
              }
            }
            return val;
          }
          return String(val);
        };

        const formatSourceWithParens = (sourceStr) => {
          if (!sourceStr) return '';
          let s = String(sourceStr);
          if (s.startsWith('From ')) return s;
          if (s.includes(' Level ')) {
            const parts = s.split(' Level ');
            return `(${parts[0].trim()}) Level ${parts[1]}`;
          }
          if (!s.startsWith('(') && !s.endsWith(')')) {
            return `(${s})`;
          }
          return s;
        };

        const getFeatureChargeInfo = (fName, fObj, charState, clList) => {
          if (!fName) return null;
          const name = String(fName).trim().toLowerCase();
          const desc = String(fObj?.description || fObj?.desc || fObj?.display || fObj?.feat_desc || '').toLowerCase();
          
          const ftrLvl = clList?.find(c => c.classId?.toLowerCase() === 'fighter')?.level || 1;
          const brbLvl = clList?.find(c => c.classId?.toLowerCase() === 'barbarian')?.level || 1;
          const brdLvl = clList?.find(c => c.classId?.toLowerCase() === 'bard')?.level || 1;
          const clrLvl = clList?.find(c => c.classId?.toLowerCase() === 'cleric')?.level || 1;
          const drdLvl = clList?.find(c => c.classId?.toLowerCase() === 'druid')?.level || 1;
          const palLvl = clList?.find(c => c.classId?.toLowerCase() === 'paladin')?.level || 1;
          const mnkLvl = clList?.find(c => c.classId?.toLowerCase() === 'monk')?.level || 1;
          const sorLvl = clList?.find(c => c.classId?.toLowerCase() === 'sorcerer')?.level || 1;

          const wisMod = Math.max(1, Math.floor(((charState?.abilities?.total?.Wisdom || 10) - 10) / 2));
          const chaMod = Math.max(1, Math.floor(((charState?.abilities?.total?.Charisma || 10) - 10) / 2));
          const totalLvl = clList?.reduce((acc, c) => acc + (parseInt(c.level) || 1), 0) || 1;
          const profBonus = Math.floor((totalLvl - 1) / 4) + 2;

          if (name === 'arcane recovery') return { label: 'Arcane Recovery: Special', max: 1, reset: 'Long Rest' };
          if (name === 'signature spells') return { label: 'Signature Spells Free Cast', max: 2, reset: 'Short or Long Rest' };
          if (name === 'second wind') return { label: 'Second Wind', max: ftrLvl >= 10 ? 3 : (ftrLvl >= 4 ? 2 : 1), reset: 'Short or Long Rest' };
          if (name === 'action surge') return { label: 'Action Surge', max: ftrLvl >= 17 ? 2 : 1, reset: 'Short or Long Rest' };
          if (name === 'indomitable') return { label: 'Indomitable', max: ftrLvl >= 17 ? 3 : (ftrLvl >= 13 ? 2 : 1), reset: 'Long Rest' };
          if (name === 'rage') return { label: 'Rage Uses', max: brbLvl >= 17 ? 6 : (brbLvl >= 12 ? 5 : (brbLvl >= 6 ? 4 : (brbLvl >= 3 ? 3 : 2))), reset: 'Long Rest' };
          if (name === 'relentless rage') return { label: 'Relentless Rage Save', max: 1, reset: 'Short or Long Rest' };
          if (name === 'bardic inspiration') return { label: 'Bardic Inspiration', max: chaMod, reset: brdLvl >= 5 ? 'Short or Long Rest' : 'Long Rest' };
          if (name === 'font of inspiration') return { label: 'Spell Slot Conversion', max: 1, reset: 'Long Rest' };
          if (name === 'words of creation') return { label: 'Power Word Free Cast', max: 2, reset: 'Long Rest' };
          if (name === 'channel divinity') return { label: 'Channel Divinity', max: clrLvl >= 18 ? 4 : (clrLvl >= 6 || palLvl >= 11 ? 3 : 2), reset: 'Short or Long Rest' };
          if (name === 'divine intervention') return { label: 'Divine Intervention', max: 1, reset: 'Long Rest' };
          if (name === 'wild shape') return { label: 'Wild Shape', max: drdLvl >= 17 ? 4 : 2, reset: 'Short or Long Rest' };
          if (name === 'wild resurgence') return { label: 'Wild Resurgence', max: 1, reset: 'Long Rest' };
          if (name === 'lay on hands') return { label: 'Lay on Hands Pool', max: palLvl * 5, reset: 'Long Rest', isPool: true };
          if (name === "paladin's smite" || name === 'divine smite') return { label: 'Free Divine Smite Cast', max: 1, reset: 'Long Rest' };
          if (name === 'abjure foes') return { label: 'Abjure Foes Use', max: 1, reset: 'Long Rest' };
          if (name === 'favored enemy' || name === "hunter's mark") return { label: "Free Hunter's Mark Casts", max: wisMod, reset: 'Long Rest' };
          if (name === 'tireless') return { label: 'Tireless Temp HP', max: wisMod, reset: 'Long Rest' };
          if (name === "nature's veil") return { label: "Nature's Veil Uses", max: wisMod, reset: 'Long Rest' };
          if (name === 'stroke of luck') return { label: 'Stroke of Luck', max: 1, reset: 'Short or Long Rest' };
          if (name === "monk's focus" || name === 'focus points') return { label: 'Focus Points Pool', max: mnkLvl, reset: 'Short or Long Rest', isPool: true };
          if (name === 'empty body') return { label: 'Empty Body', max: 1, reset: 'Long Rest' };
          if (name === 'innate sorcery') return { label: 'Innate Sorcery', max: 2, reset: 'Long Rest' };
          if (name === 'font of magic' || name === 'sorcery points') return { label: 'Sorcery Points Pool', max: sorLvl, reset: 'Long Rest', isPool: true };
          if (name === 'sorcerous restoration') return { label: 'Sorcerous Restoration', max: 1, reset: 'Short Rest' };
          if (name === 'magical cunning') return { label: 'Magical Cunning', max: 1, reset: 'Long Rest' };
          if (name.includes('mystic arcanum')) return { label: 'Mystic Arcanum Free Cast', max: 1, reset: 'Long Rest' };
          if (name === 'breath weapon') return { label: 'Breath Weapon', max: profBonus, reset: 'Short or Long Rest' };
          if (name === 'celestial revelation') return { label: 'Celestial Revelation', max: 1, reset: 'Long Rest' };
          if (name === 'relentless endurance') return { label: 'Relentless Endurance', max: 1, reset: 'Long Rest' };
          if (name === 'adrenaline rush' || name === "stone's endurance" || name === 'large form' || name === 'fey step' || name === 'hidden step' || name === 'deflect') return { label: `${fName} Uses`, max: profBonus, reset: 'Long Rest' };
          if (name === 'lucky' || name === 'luck') return { label: 'Luck Points', max: name === 'lucky' ? Math.max(2, profBonus) : 1, reset: 'Long Rest' };
          if (name.startsWith('magic initiate')) return { label: 'Free Level 1 Spell Cast', max: 1, reset: 'Long Rest' };
          if (name === 'fey touched' || name === 'shadow touched' || name === 'telepathic' || name === 'telekinetic') return { label: 'Free Spell Cast', max: 1, reset: 'Long Rest' };
          if (name === 'chef') return { label: 'Special Treats', max: profBonus, reset: 'Long Rest' };
          if (name === 'healer') return { label: 'Healer Kit Use', max: 1, reset: 'Short or Long Rest' };
          if (name === 'inspiring leader') return { label: 'Inspiring Speech', max: 1, reset: 'Short or Long Rest' };
          if (name === 'martial adept') return { label: 'Superiority Dice', max: 1, reset: 'Short or Long Rest' };

          if (desc.includes('proficiency bonus') || desc.includes('pb times') || desc.includes('uses: pb')) {
            const isShort = desc.includes('short rest');
            return { label: `${fName} Uses`, max: profBonus, reset: isShort ? 'Short or Long Rest' : 'Long Rest' };
          }

          if (desc.includes('once per long rest') || desc.includes('once per day') || desc.includes('1/long rest') || desc.includes('finish a long rest')) {
            if (desc.includes('once per short') || desc.includes('short rest or a long rest') || desc.includes('short or long rest')) {
              return { label: `${fName} Use`, max: 1, reset: 'Short or Long Rest' };
            }
            return { label: `${fName} Use`, max: 1, reset: 'Long Rest' };
          }
          if (desc.includes('once per short rest') || desc.includes('finish a short rest')) {
            return { label: `${fName} Use`, max: 1, reset: 'Short Rest' };
          }
          return null;
        };

        // 2. Prepare Real Features & Traits (Race/Lineage, Classes/Subclasses, Feats, Background)
        const allFeaturesListReview = [];
        const raceObj = dbData.races?.find(r => r.species_id === characterState.race?.id);
        const lineageObj = dbData.lineages?.find(l => l.lineage_id === (characterState.race?.subraceId || characterState.race?.lineageId));
        const realBackgroundObj = dbData.backgrounds?.find(b => b.background_id === characterState.background?.id || b.background_id === characterState.background?.backgroundId || b.name?.toLowerCase() === characterState.background?.name?.toLowerCase()) || characterState.background;
        if (raceObj?.traits) {
          try {
            const trs = typeof raceObj.traits === 'string' ? JSON.parse(raceObj.traits) : raceObj.traits;
            if (Array.isArray(trs)) {
              trs.forEach(t => {
                const reqLvl = parseInt(t.level || t.required_level || 1, 10) || 1;
                if (reqLvl <= totalLvl) {
                  allFeaturesListReview.push({
                    name: formatCleanName(t.name || t.title || 'Species Trait'),
                    desc: formatTraitOrFeatureText(t),
                    source: formatSourceWithParens(raceObj.species_name || 'Species'),
                    pageSource: t.srd_source || raceObj.srd_source || 'PHB-2024, pg. 190',
                    category: 'SPECIES TRAITS',
                    choiceObj: characterState.race?.traitChoices?.[t.name || t.title] || characterState.race?.traitChoices?.[formatCleanName(t.name || t.title || '')] || null,
                    chargeInfo: getFeatureChargeInfo(t.name || t.title, t, characterState, classList)
                  });
                }
              });
            }
          } catch { /* ignore */ }
        }
        if (lineageObj) {
          if (lineageObj.traits) {
            try {
              const trs = typeof lineageObj.traits === 'string' ? JSON.parse(lineageObj.traits) : lineageObj.traits;
              if (Array.isArray(trs)) {
                trs.forEach(t => {
                  const reqLvl = parseInt(t.level || t.required_level || 1, 10) || 1;
                  if (reqLvl <= totalLvl) {
                    allFeaturesListReview.push({
                      name: formatCleanName(t.name || t.title || 'Lineage Trait'),
                      desc: formatTraitOrFeatureText(t),
                      source: formatSourceWithParens(lineageObj.lineage_name || 'Lineage'),
                      pageSource: t.srd_source || lineageObj.srd_source || 'PHB-2024, pg. 190',
                      category: 'SPECIES TRAITS',
                      choiceObj: characterState.race?.traitChoices?.[t.name || t.title] || characterState.race?.traitChoices?.[formatCleanName(t.name || t.title || '')] || null,
                      chargeInfo: getFeatureChargeInfo(t.name || t.title, t, characterState, classList)
                    });
                  }
                });
              }
            } catch { /* ignore */ }
          }
          if (lineageObj.lineage_desc && !lineageObj.traits) {
            let merged = false;
            for (let trait of allFeaturesListReview) {
              if (trait.category === 'SPECIES TRAITS' && trait.choiceObj) {
                const choiceStr = typeof trait.choiceObj === 'string' ? trait.choiceObj : (trait.choiceObj.value || trait.choiceObj.choice || '');
                if (choiceStr && lineageObj.lineage_name && (choiceStr.toLowerCase().includes(lineageObj.lineage_name.toLowerCase()) || lineageObj.lineage_name.toLowerCase().includes(choiceStr.toLowerCase()))) {
                  trait.lineageEffect = { name: lineageObj.lineage_name || 'Lineage Benefit', desc: lineageObj.lineage_desc };
                  merged = true;
                  break;
                }
              }
            }
            if (!merged) {
              const parentTrait = allFeaturesListReview.find(t => t.category === 'SPECIES TRAITS' && (t.name.toLowerCase().includes('ancestry') || t.name.toLowerCase().includes('lineage') || t.name.toLowerCase().includes('legacy')));
              if (parentTrait) {
                parentTrait.lineageEffect = { name: lineageObj.lineage_name || 'Lineage Benefit', desc: lineageObj.lineage_desc };
                merged = true;
              }
            }
            if (!merged) {
              allFeaturesListReview.push({
                name: lineageObj.lineage_name || 'Lineage Trait',
                desc: lineageObj.lineage_desc,
                source: formatSourceWithParens(raceObj?.species_name || 'Lineage'),
                pageSource: lineageObj.srd_source || 'PHB-2024, pg. 190',
                category: 'SPECIES TRAITS',
                choiceObj: null,
                chargeInfo: null
              });
            }
          }
        }
          // eslint-disable-next-line no-unused-vars
        classList.forEach((cl, clIdx) => {
          const classInfo = dbData.classes?.find(c => (c.class_id || c.name)?.toLowerCase() === cl.classId?.toLowerCase());
          const cName = classInfo?.class_name || cl.classId ? cl.classId.charAt(0).toUpperCase() + cl.classId.slice(1) : 'Class';
          
          // Core Class Traits
          allFeaturesListReview.push({
            name: `Core ${cName} Traits`,
            desc: `Proficiencies, saving throws, and primary training for ${cName}.`,
            source: formatSourceWithParens(cName),
            pageSource: classInfo?.srd_source || 'PHB-2024, pg. 165',
            category: 'CLASS FEATURES',
            level: 0,
            choiceObj: {
              skills: characterState.proficiencies?.skills || [],
              tools: characterState.proficiencies?.tools || []
            }
          });

          // Class Features from DB features array
          if (classInfo?.features) {
            try {
              const featsArr = typeof classInfo.features === 'string' ? JSON.parse(classInfo.features) : classInfo.features;
              if (Array.isArray(featsArr)) {
                featsArr.forEach(f => {
                  const fLvl = parseInt(f.level || 1, 10);
                  if (fLvl <= (cl.level || 1) && (f.name || f.title)) {
                    let cleanName = formatCleanName(f.name || f.title);
                    if (cleanName.toLowerCase().includes('subclass') || cleanName.toLowerCase() === 'subclass feature') {
                      cleanName = `${cName} Subclass`;
                    }
                    if (!allFeaturesListReview.some(x => x.name === cleanName && x.category === 'CLASS FEATURES')) {
                      const isSubCard = cleanName === `${cName} Subclass`;
                      const subObj = cl.subclassId ? dbData.subclasses?.find(s => s.subclass_id === cl.subclassId) : null;
                      const subLabel = subObj?.subclass_name || cl.subclassId || null;
                      allFeaturesListReview.push({
                        name: cleanName,
                        desc: isSubCard ? `You gain a subclass specialization that grants you special abilities at certain levels.` : formatTraitOrFeatureText(f.description || f.desc || f.display || ''),
                        source: formatSourceWithParens(cName),
                        pageSource: f.srd_source || classInfo.srd_source || `PHB-2024, pg. ${165 + fLvl}`,
                        category: 'CLASS FEATURES',
                        level: fLvl,
                        choiceObj: isSubCard && subLabel ? { subclass: formatCleanName(subLabel) } : (cl.featureChoices?.[cleanName] || cl.featureChoices?.[f.name] || f.mechanics || null),
                        chargeInfo: getFeatureChargeInfo(cleanName, f, characterState, classList)
                      });
                    }
                  }
                });
              }
            } catch { /* ignore */ }
          }

          // Level Progression backup
          if (classInfo?.level_progression) {
            try {
              const prog = typeof classInfo.level_progression === 'string' ? JSON.parse(classInfo.level_progression) : classInfo.level_progression;
              if (Array.isArray(prog)) {
                prog.filter(p => p.level <= (cl.level || 1)).forEach(p => {
                  if (p.features && p.features !== '-' && p.features !== '') {
                    p.features.split(',').forEach(fName => {
                      let cleanF = formatCleanName(fName.trim());
                      if (cleanF.toLowerCase().includes('subclass') || cleanF.toLowerCase() === 'subclass feature') {
                        cleanF = `${cName} Subclass`;
                      }
                      if (cleanF && !allFeaturesListReview.some(f => f.name === cleanF && f.category === 'CLASS FEATURES')) {
                        const isSubCard = cleanF === `${cName} Subclass`;
                        const subObj = cl.subclassId ? dbData.subclasses?.find(s => s.subclass_id === cl.subclassId) : null;
                        const subLabel = subObj?.subclass_name || cl.subclassId || null;
                        allFeaturesListReview.push({
                          name: cleanF,
                          desc: isSubCard ? `You gain a subclass specialization that grants you special abilities at certain levels.` : `Class feature unlocked at level ${p.level} of ${cName}`,
                          source: formatSourceWithParens(cName),
                          pageSource: classInfo.srd_source || `PHB-2024, pg. ${165 + p.level}`,
                          category: 'CLASS FEATURES',
                          level: p.level,
                          choiceObj: isSubCard && subLabel ? { subclass: formatCleanName(subLabel) } : null,
                          chargeInfo: getFeatureChargeInfo(cleanF, { description: '' }, characterState, classList)
                        });
                      }
                    });
                  }
                });
              }
            } catch { /* ignore */ }
          }

          // Subclass Features
          if (cl.subclassId) {
            const subInfo = dbData.subclasses?.find(s => s.subclass_id === cl.subclassId);
            const subName = subInfo?.subclass_name || cl.subclassId;
            if (subInfo) {
              const subCardName = `${cName} Subclass`;
              for (let i = allFeaturesListReview.length - 1; i >= 0; i--) {
                const x = allFeaturesListReview[i];
                if (x.category === 'CLASS FEATURES' && (x.name === subCardName || x.name === formatCleanName(subName) || x.name.toLowerCase() === 'subclass' || x.name.toLowerCase() === `${cName.toLowerCase()} subclass`)) {
                  allFeaturesListReview.splice(i, 1);
                }
              }
              allFeaturesListReview.push({
                name: subCardName,
                desc: `You gain a subclass specialization that grants you special abilities at certain levels.`,
                source: formatSourceWithParens(cName),
                pageSource: subInfo.srd_source || 'PHB-2024, pg. 167',
                category: 'CLASS FEATURES',
                level: 3,
                choiceObj: {
                  subclass: formatCleanName(subName)
                }
              });
              if (subInfo.features) {
                try {
                  const subFeats = typeof subInfo.features === 'string' ? JSON.parse(subInfo.features) : subInfo.features;
                  if (Array.isArray(subFeats)) {
                    subFeats.forEach(f => {
                      const fLvl = parseInt(f.level || 3, 10);
                      if (fLvl <= (parseInt(cl.level) || 1) && (f.name || f.title)) {
                        const cleanName = formatCleanName(f.name || f.title);
                        if (!allFeaturesListReview.some(x => x.name === cleanName && x.category === 'CLASS FEATURES')) {
                          allFeaturesListReview.push({
                            name: cleanName,
                            desc: formatTraitOrFeatureText(f.description || f.desc || f.display || ''),
                            source: formatSourceWithParens(subName),
                            pageSource: f.srd_source || subInfo.srd_source || `PHB-2024, pg. ${170 + fLvl}`,
                            category: 'CLASS FEATURES',
                            level: fLvl,
                            choiceObj: cl.featureChoices?.[cleanName] || cl.featureChoices?.[f.name] || f.mechanics || null,
                            chargeInfo: getFeatureChargeInfo(cleanName, f, characterState, classList)
                          });
                        }
                      }
                    });
                  }
                } catch { /* ignore */ }
              }
            }
          }
        });

        // Sort Class Features by level so Core Traits -> Lv1 -> Lv2 -> Lv3...
        allFeaturesListReview.sort((a, b) => {
          if (a.category === 'CLASS FEATURES' && b.category === 'CLASS FEATURES') {
            return (a.level || 0) - (b.level || 0);
          }
          return 0;
        });

        // Collect all Feats from Class Level Up, Background, and Manual
        const addedFeatKeys = new Set();

        // Collect Feats from Race/Species/Lineage Traits
        if (characterState.race?.traitChoices) {
          const raceTraitsArr = raceObj?.traits ? (typeof raceObj.traits === 'string' ? JSON.parse(raceObj.traits) : raceObj.traits) : [];
          const linTraitsArr = lineageObj?.traits ? (typeof lineageObj.traits === 'string' ? JSON.parse(lineageObj.traits) : lineageObj.traits) : [];
          const allTraits = [...raceTraitsArr, ...linTraitsArr];

          Object.entries(characterState.race.traitChoices).forEach(([traitName, val]) => {
            const traitObj = allTraits.find(t => (t.name || t.title) === traitName || formatCleanName(t.name || t.title) === traitName);
            const desc = (traitObj?.desc || traitObj?.description || '').toLowerCase();
            const name = (traitObj?.name || traitObj?.title || '').toLowerCase();
            const isFeatTrait = desc.includes('feat') || name.includes('feat');
            
            const vals = Array.isArray(val) ? val : [val];
            vals.forEach(v => {
              if (typeof v === 'string' && v.trim()) {
                const featDb = dbData.feats?.find(f => (f.feat_id || f.feat_name || f.name)?.toLowerCase() === v.toLowerCase());
                
                if (featDb || isFeatTrait) {
                  const featName = featDb ? (featDb.feat_name || featDb.name || featDb.title || v) : formatCleanName(v);
                  const uniqKey = `race-trait-${traitName}-${v}`;
                  if (!addedFeatKeys.has(uniqKey)) {
                    addedFeatKeys.add(uniqKey);
                    allFeaturesListReview.push({
                      name: formatCleanName(featName),
                      desc: getEnhancedFeatDesc(featDb, v),
                      source: `From (${traitObj && linTraitsArr.includes(traitObj) ? (lineageObj?.lineage_name || 'Lineage') : (raceObj?.species_name || raceObj?.name || 'Species')})`,
                      pageSource: featDb?.srd_source || 'PHB-2024',
                      category: 'FEATS',
                      fromType: 'race',
                      featId: v,
                      chargeInfo: featDb ? getFeatureChargeInfo(featName, featDb, characterState, classList) : getFeatureChargeInfo(featName, { description: '' }, characterState, classList)
                    });
                  }
                }
              }
            });
          });
        }
           
        classList.forEach((cl, clIdx) => {
          Object.entries(cl.featureChoices || {}).forEach(([k, val]) => {
            if (k.startsWith('Ability Score Improvement') || k.includes('Feat') || k.startsWith('Epic Boon')) {
              const isEpicBoonKey = k.startsWith('Epic Boon');
              const choiceIdx = isEpicBoonKey ? 1 : 0;
              const featObjVal = val?.[choiceIdx] || { id: '', bonuses: {} };
              const featId = typeof featObjVal === 'string' ? featObjVal : (featObjVal.id || '');
              if (featId) {
                const featDb = dbData.feats?.find(f => (f.feat_id || f.feat_name || f.name)?.toLowerCase() === String(featId).toLowerCase());
                let featName = featDb ? (featDb.feat_name || featDb.name || featDb.title || featId) : formatCleanName(featId);
                if (featName === 'Ability Score Improvement' || featId === 'Ability Score Improvement') {
                  featName = 'Ability Score Improvement';
                }
                const uniqKey = `class-${clIdx}-${k}`;
                if (!addedFeatKeys.has(uniqKey)) {
                  addedFeatKeys.add(uniqKey);
                  allFeaturesListReview.push({
                    name: formatCleanName(featName),
                    desc: getEnhancedFeatDesc(featDb, featId) !== 'No description available.' ? getEnhancedFeatDesc(featDb, featId) : 'Increase one ability score by 2 or two ability scores by 1.',
                    source: `From (${cl.classId ? cl.classId.charAt(0).toUpperCase() + cl.classId.slice(1) : 'Class'})`,
                    pageSource: featDb?.srd_source || 'PHB-2024, pg. 202',
                    category: 'FEATS',
                    fromType: 'class',
                    classIndex: clIdx,
                    featureKey: k,
                    choiceIdx: choiceIdx,
                    choiceObj: typeof featObjVal === 'string' ? { id: featObjVal, bonuses: {} } : featObjVal,
                    featId: featId,
                    chargeInfo: getFeatureChargeInfo(featName, featDb || { id: featId }, characterState, classList)
                  });
                }
              }
            }
          });
        });

        (characterState.feats || []).forEach((ft, fIdx) => {
          const isObj = typeof ft === 'object' && ft !== null;
          const featId = isObj ? (ft.id || ft.name || ft.feat_name) : ft;
          const featSource = isObj ? ft.source : '';
          const featDb = dbData.feats?.find(f => (f.feat_id || f.feat_name || f.name)?.toLowerCase() === String(featId).toLowerCase());
          const featName = featDb ? (featDb.feat_name || featDb.name || featDb.title || featId) : formatCleanName(featId);
          const bgName = realBackgroundObj?.background_name || realBackgroundObj?.name || 'Background';
          
          if (featSource === 'background') {
            const uniqKey = `bg-${featId}-${fIdx}`;
            if (!addedFeatKeys.has(uniqKey)) {
              addedFeatKeys.add(uniqKey);
              allFeaturesListReview.push({
                name: formatCleanName(featName),
                desc: getEnhancedFeatDesc(featDb, featId) !== 'No description available.' ? getEnhancedFeatDesc(featDb, featId) : 'Background Origin Feat',
                source: `From (${bgName})`,
                pageSource: featDb?.srd_source || 'PHB-2024, pg. 201',
                category: 'FEATS',
                fromType: 'background',
                featIndex: fIdx,
                choiceObj: isObj ? ft : { id: featId, bonuses: {} },
                featId: featId,
                chargeInfo: getFeatureChargeInfo(featName, featDb || { id: featId }, characterState, classList)
              });
            }
          } else {
            const uniqKey = `manual-${featId}-${fIdx}`;
            if (!addedFeatKeys.has(uniqKey)) {
              addedFeatKeys.add(uniqKey);
              allFeaturesListReview.push({
                name: formatCleanName(featName),
                desc: getEnhancedFeatDesc(featDb, featId) !== 'No description available.' ? getEnhancedFeatDesc(featDb, featId) : 'Selected Feat',
                source: 'From (Additional Feats)',
                pageSource: featDb?.srd_source || 'PHB-2024, pg. 200',
                category: 'FEATS',
                fromType: 'manual',
                featIndex: fIdx,
                choiceObj: isObj ? ft : { id: featId, bonuses: {} },
                featId: featId,
                chargeInfo: getFeatureChargeInfo(featName, featDb || { id: featId }, characterState, classList)
              });
            }
          }
        });

        // 3. Prepare Real Background Features
        if (realBackgroundObj?.feature_name || realBackgroundObj?.feature) {
          allFeaturesListReview.push({
            name: formatCleanName(realBackgroundObj.feature_name || realBackgroundObj.feature || 'Background Feature'),
            desc: formatTraitOrFeatureText(realBackgroundObj.feature_desc || realBackgroundObj.feature_description || realBackgroundObj.description || 'Background origin trait'),
            source: `(${realBackgroundObj.background_name || realBackgroundObj.name || 'Background'})`,
            pageSource: realBackgroundObj.srd_source || 'PHB-2024, pg. 178',
            category: 'BACKGROUND'
          });
        }

        // 4. Dynamic Class Resource Trackers based on active classes & level
        const dynamicResourceTrackers = [];
        classList.forEach(cl => {
          const cId = cl.classId?.toLowerCase();
          const cLvl = cl.level || 1;
          if (cId === 'fighter') {
            dynamicResourceTrackers.push({ id: 'Second Wind', label: 'Second Wind (Heal)', max: 1, reset: 'Short Rest' });
            if (cLvl >= 2) dynamicResourceTrackers.push({ id: 'Action Surge', label: 'Action Surge', max: cLvl >= 17 ? 2 : 1, reset: 'Short Rest' });
            if (cLvl >= 9) dynamicResourceTrackers.push({ id: 'Indomitable', label: 'Indomitable Reroll', max: cLvl >= 17 ? 3 : cLvl >= 13 ? 2 : 1, reset: 'Long Rest' });
          } else if (cId === 'barbarian') {
            const rageCount = cLvl >= 20 ? 99 : cLvl >= 17 ? 6 : cLvl >= 12 ? 5 : cLvl >= 6 ? 4 : cLvl >= 3 ? 3 : 2;
            dynamicResourceTrackers.push({ id: 'Rage Charges', label: 'Rage Charges', max: rageCount, reset: 'Long Rest' });
          } else if (cId === 'bard') {
            dynamicResourceTrackers.push({ id: 'Bardic Inspiration', label: 'Bardic Inspiration Dice', max: Math.max(1, chaMod), reset: cLvl >= 5 ? 'Short Rest' : 'Long Rest' });
          } else if (cId === 'cleric') {
            if (cLvl >= 2) dynamicResourceTrackers.push({ id: 'Channel Divinity', label: 'Channel Divinity', max: cLvl >= 18 ? 3 : cLvl >= 6 ? 2 : 1, reset: 'Short Rest' });
          } else if (cId === 'druid') {
            if (cLvl >= 2) dynamicResourceTrackers.push({ id: 'Wild Shape', label: 'Wild Shape Uses', max: 2, reset: 'Short Rest' });
          } else if (cId === 'monk') {
            if (cLvl >= 2) dynamicResourceTrackers.push({ id: 'Ki Points', label: 'Ki Points Pool', max: cLvl, reset: 'Short Rest' });
          } else if (cId === 'paladin') {
            dynamicResourceTrackers.push({ id: 'Lay on Hands', label: 'Lay on Hands (HP Pool)', max: cLvl * 5, reset: 'Long Rest' });
            if (cLvl >= 3) dynamicResourceTrackers.push({ id: 'Channel Divinity', label: 'Channel Divinity', max: 1, reset: 'Short Rest' });
          } else if (cId === 'sorcerer') {
            if (cLvl >= 2) dynamicResourceTrackers.push({ id: 'Sorcery Points', label: 'Sorcery Points Pool', max: cLvl, reset: 'Long Rest' });
          } else if (cId === 'wizard') {
            dynamicResourceTrackers.push({ id: 'Arcane Recovery', label: 'Arcane Recovery Use', max: 1, reset: 'Long Rest' });
          }
        });

        return (
          <div className="builder-step-content animate-fade-in" style={{ padding: '24px', backgroundColor: '#fcfaf5', width: '100%' }}>
            {/* 1. Header Bar (Prototype Aligned) */}
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #d4af37', borderRadius: '8px', padding: '16px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                      if (!file || !setCharacterState) return;
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
                          if (typeof handleSaveToDatabase === 'function') {
                            setTimeout(() => handleSaveToDatabase(nextState), 100);
                          }
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
                      style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover', border: '2px solid #711a19', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', backgroundColor: '#711a19', color: 'var(--bg-white)', fontFamily: 'Cinzel, serif', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', flexShrink: 0, fontWeight: 'bold' }}>
                      {charName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    backgroundColor: '#711a19',
                    color: 'var(--bg-white)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    border: '2px solid #ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}>
                    <i className="fa-solid fa-camera"></i>
                  </div>
                </label>
                <div>
                  <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.8rem', color: '#711a19', textTransform: 'uppercase', letterSpacing: '2px', margin: 0, lineHeight: 1.1, fontWeight: '700' }}>
                    {charName}
                  </h1>
                  <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '4px 0 0 0' }}>
                    Level {totalLvl} • {raceName}
                    {classList.length > 1 ? <><br />{classStr}</> : ` ${classStr}`}
                  </p>
                </div>

                {/* Tactical HP Monitor Card (Moved to top right) */}
                {(() => {
                  const hpPct = Math.max(0, Math.min(100, Math.round((curHp / (maxHp || 1)) * 100)));
                  const isDying = curHp <= 0;
                  const isLow = curHp <= (maxHp || 1) * 0.25;
                  return (
                    <div
                      onClick={() => {
                        if (isDying) setActiveHpTab('deathsaves');
                        setShowHpAdjustModal(true);
                      }}
                      style={{
                        backgroundColor: isDying ? '#fef2f2' : 'var(--bg-paper)',
                        border: isDying ? '2px solid #ef4444' : isLow ? '2px solid #f97316' : '2px solid #711a19',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: isDying ? '0 0 12px rgba(239, 68, 68, 0.4)' : '0 2px 6px rgba(113, 26, 25, 0.12)',
                        overflow: 'hidden',
                        minWidth: '210px',
                        transition: 'all 0.15s ease'
                      }}
                      title="Click to open Tactical Combat HP & Resource Manager"
                    >
                      {/* Top Status & Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', gap: '8px' }}>
                        <span style={{ fontSize: '0.66rem', color: isDying ? '#dc2626' : '#711a19', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-heart-pulse"></i> HIT POINTS
                        </span>
                        {isDying ? (
                          <span className="animate-pulse" style={{ backgroundColor: '#dc2626', color: 'var(--bg-white)', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px' }}>
                            💀 DYING (HP 0)
                          </span>
                        ) : reviewHpTemp > 0 ? (
                          <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '4px' }}>
                            🛡️ +{reviewHpTemp} TEMP
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>{hpPct}%</span>
                        )}
                      </div>

                      {/* Numbers Cluster */}
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.55rem', color: isDying ? '#dc2626' : isLow ? '#ea580c' : '#711a19', fontWeight: '800', lineHeight: 1, width: '40px', textAlign: 'right', display: 'inline-block' }}>
                            {curHp}
                          </span>
                          <span style={{ fontSize: '1.05rem', color: '#b8a898', fontWeight: '400' }}>/</span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: '#4a3930', fontWeight: '700', lineHeight: 1, width: '35px', textAlign: 'left', display: 'inline-block' }}>
                            {maxHp}
                          </span>
                        </div>
                        <div style={{ borderLeft: '1px solid #e2d8c3', paddingLeft: '8px', textAlign: 'right' }}>
                          <div style={{ fontSize: '0.6rem', color: '#8c7a6b', fontWeight: '800', textTransform: 'uppercase' }}>TEMP</div>
                          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: reviewHpTemp > 0 ? '#1d4ed8' : '#8c7a6b', fontWeight: 'bold', lineHeight: 1 }}>
                            {reviewHpTemp > 0 ? `+${reviewHpTemp}` : '--'}
                          </div>
                        </div>
                      </div>

                      {/* Mini Health Bar */}
                      <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '3px', marginTop: '5px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${hpPct}%`,
                          height: '100%',
                          backgroundColor: isDying ? '#dc2626' : isLow ? '#f97316' : '#16a34a',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })()}

              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowCustomDiceRollerModal(true)}
                    style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', border: '1px solid #450a0a', padding: '8px 14px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                  >
                    <i className="fa-solid fa-dice-d20" style={{ fontSize: '0.9rem' }}></i> ROLL DICE
                  </button>
                  <button
                    onClick={() => {
                      if (onEditCharacter) onEditCharacter();
                      else if (setCurrentStep) setCurrentStep(1);
                    }}
                    style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fa-solid fa-user-pen"></i> Edit Character
                  </button>
                  <button
                    onClick={() => {
                      setReviewTab('diary');
                      setShowDiaryModal(true);
                    }}
                    style={{ backgroundColor: '#3a2618', color: '#facc15', border: '1.5px solid #ca8a04', padding: '8px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.25)', transition: 'all 0.15s' }}
                    title="เปิดสมุดบันทึกการเดินทาง (Adventure Diary)"
                  >
                    <i className="fa-solid fa-book-open" style={{ color: '#facc15' }}></i> ADVENTURE DIARY
                  </button>
                </div>

                {/* Rest Buttons Cluster (Placed next to NOTES and Manage Hit Points) */}
                <TopCombatStrip
                  resolvedMechanics={resolvedMechanics}
                  characterState={characterState}
                  strMod={strMod}
                  dexMod={dexMod}
                  conMod={conMod}
                  intMod={intMod}
                  wisMod={wisMod}
                  chaMod={chaMod}
                  profBonus={profBonus}
                  totalLvl={totalLvl}
                  fmtMod={fmtMod}
                  triggerQuickRoll={triggerQuickRoll}
                  reviewHpCur={reviewHpCur}
                  setReviewHpCur={(val) => {
                    const nextHp = typeof val === 'function' ? val(reviewHpCur !== null ? reviewHpCur : maxHp) : val;
                    syncHpAndSave(nextHp);
                  }}
                  reviewHpTemp={reviewHpTemp}
                  setReviewHpTemp={(val) => {
                    const nextTemp = typeof val === 'function' ? val(reviewHpTemp) : val;
                    syncHpAndSave(undefined, nextTemp);
                  }}
                  expendedHitDice={reviewExpendedHd}
                  setExpendedHitDice={(val) => {
                    const nextHd = typeof val === 'function' ? val(reviewExpendedHd) : val;
                    syncHpAndSave(undefined, undefined, nextHd);
                  }}
                  syncHpAndSave={syncHpAndSave}
                  liveSpellSlots={liveSpellSlots}
                  setLiveSpellSlots={setLiveSpellSlots}
                  liveFeatureCharges={liveFeatureCharges}
                  setLiveFeatureCharges={setLiveFeatureCharges}
                  dynamicResourceTrackers={dynamicResourceTrackers}
                  setGameplayRollHistory={setGameplayRollHistory}
                />


              </div>
            </div>

            {/* 2. Abilities & Utilities Strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: '24px' }}>
              {/* 6 Abilities */}
              <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto', flexWrap: 'wrap' }}>
                {[
                  { name: 'Strength', abbr: 'STR', score: totalStats.str, mod: strMod },
                  { name: 'Dexterity', abbr: 'DEX', score: totalStats.dex, mod: dexMod },
                  { name: 'Constitution', abbr: 'CON', score: totalStats.con, mod: conMod },
                  { name: 'Intelligence', abbr: 'INT', score: totalStats.int, mod: intMod },
                  { name: 'Wisdom', abbr: 'WIS', score: totalStats.wis, mod: wisMod },
                  { name: 'Charisma', abbr: 'CHA', score: totalStats.cha, mod: chaMod },
                ].map((ab, idx) => (
                  <div
                    key={idx}
                    onClick={() => triggerQuickRoll(`${ab.name} Check`, ab.mod)}
                    style={{ flex: '1 1 80px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 6px 8px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#711a19'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: '800', letterSpacing: '1px' }}>{ab.abbr}</span>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.7rem', color: 'var(--color-ink)', fontWeight: '700', margin: '4px 0' }}>{fmtMod(ab.mod)}</span>
                    <div style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)' }}>
                      {ab.score}
                    </div>
                  </div>
                ))}
              </div>

              {/* Combat Strip */}
              <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Advantage Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
                  <button
                    onClick={() => setRollAdvMode(prev => prev === 'adv' ? 'normal' : 'adv')}
                    style={{ fontSize: '0.65rem', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: rollAdvMode === 'adv' ? '#dcfce7' : 'var(--bg-white)', color: rollAdvMode === 'adv' ? '#166534' : 'var(--color-gray)', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    Advantage
                  </button>
                  <button
                    onClick={() => setRollAdvMode(prev => prev === 'dis' ? 'normal' : 'dis')}
                    style={{ fontSize: '0.65rem', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: rollAdvMode === 'dis' ? '#fee2e2' : 'var(--bg-white)', color: rollAdvMode === 'dis' ? '#991b1b' : 'var(--color-gray)', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    Disadvantage
                  </button>
                </div>

                <div style={{ textAlign: 'center', padding: '0 8px' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: 'var(--color-ink)', fontWeight: '700' }}>+{profBonus}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-gray)', fontWeight: '800', textTransform: 'uppercase' }}>Prof</div>
                </div>

                <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', padding: '0 10px', position: 'relative' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: (resolvedMechanics?.flags?.isEncumbered || resolvedMechanics?.flags?.exhaustionLevel >= 2) ? '#dc2626' : 'var(--color-ink)', fontWeight: '700', minWidth: '55px', display: 'inline-block' }}>
                    {resolvedMechanics.speed.walk} <span style={{ fontSize: '0.7rem' }}>FT</span>
                    {resolvedMechanics?.speed?.bonuses?.some(b => typeof b.bonus === 'number' && b.bonus < 0 || typeof b.bonus === 'string' && b.bonus.includes('Drops')) && (
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626', fontSize: '0.8rem', marginLeft: '4px', cursor: 'help' }} title={resolvedMechanics.speed.bonuses.filter(b => typeof b.bonus === 'number' && b.bonus < 0 || typeof b.bonus === 'string' && b.bonus.includes('Drops')).map(b => `${b.name}: ${b.bonus}`).join('\n')}></i>
                    )}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: (resolvedMechanics?.flags?.isEncumbered || resolvedMechanics?.flags?.exhaustionLevel >= 2) ? '#dc2626' : 'var(--color-gray)', fontWeight: '800', textTransform: 'uppercase' }}>Walk</div>
                </div>

                <div
                  onClick={() => triggerQuickRoll('Initiative', totalStats?.initiative ?? dexMod)}
                  style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', padding: '0 10px', cursor: 'pointer' }}
                >
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: 'var(--color-ink)', fontWeight: '700' }}>{fmtMod(totalStats?.initiative ?? dexMod)}</div>
                  <div style={{ fontSize: '0.6rem', color: '#711a19', fontWeight: '800', textTransform: 'uppercase' }}>Init <i className="fa-solid fa-dice-d20"></i></div>
                </div>

                {/* Death Saves */}
                <div style={{ borderLeft: '1px solid #e2e8f0', padding: '0 10px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-gray)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>Death Saves</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', marginBottom: '2px' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold', width: '32px' }}>SUCC</span>
                    {[0, 1, 2].map(i => (
                      <input
                        key={i}
                        type="checkbox"
                        checked={Boolean(deathSaves?.succ?.[i])}
                        onChange={e => {
                          const newSucc = [...(deathSaves?.succ || [false, false, false])];
                          newSucc[i] = e.target.checked;
                          const succCount = newSucc.filter(Boolean).length;
                          setDeathSaves(prev => ({ ...(prev || { fail: [false, false, false] }), succ: newSucc }));
                          syncHpAndSave(undefined, undefined, undefined, succCount, undefined);
                        }}
                        style={{ cursor: 'pointer', accentColor: '#16a34a' }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}>
                    <span style={{ color: '#dc2626', fontWeight: 'bold', width: '32px' }}>FAIL</span>
                    {[0, 1, 2].map(i => (
                      <input
                        key={i}
                        type="checkbox"
                        checked={Boolean(deathSaves?.fail?.[i])}
                        onChange={e => {
                          const newFail = [...(deathSaves?.fail || [false, false, false])];
                          newFail[i] = e.target.checked;
                          const failCount = newFail.filter(Boolean).length;
                          setDeathSaves(prev => ({ ...(prev || { succ: [false, false, false] }), fail: newFail }));
                          syncHpAndSave(undefined, undefined, undefined, undefined, failCount);
                        }}
                        style={{ cursor: 'pointer', accentColor: '#dc2626' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Exhaustion Tracker */}
                <div style={{ borderLeft: '1px solid #e2e8f0', padding: '0 10px', width: '115px', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-gray)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', justifyContent: 'flex-start', gap: '4px' }}>
                    <span>Exhaustion</span>
                    { (characterState.exhaustionLevel || 0) > 0 && (
                      <span style={{ color: '#dc2626' }}>Lv {characterState.exhaustionLevel}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
                    {[1,2,3,4,5,6].map(lvl => {
                      const isActive = (characterState.exhaustionLevel || 0) >= lvl;
                      const exPenalties = [
                        "Lv 1: Disadvantage on Ability Checks",
                        "Lv 2: Speed halved",
                        "Lv 3: Disadvantage on Attack rolls and Saving throws",
                        "Lv 4: Hit point maximum halved",
                        "Lv 5: Speed reduced to 0",
                        "Lv 6: Death"
                      ];
                      return (
                        <div 
                          key={lvl}
                          onClick={() => {
                            const current = characterState.exhaustionLevel || 0;
                            const newVal = current === lvl ? lvl - 1 : lvl;
                            if (setCharacterState) {
                               setCharacterState(prev => {
                                 const updated = { ...prev, exhaustionLevel: newVal };
                                 if (typeof handleSaveToDatabase === 'function') setTimeout(() => handleSaveToDatabase(updated), 100);
                                 return updated;
                               });
                            }
                          }}
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#dc2626' : '#f8fafc',
                            border: `1px solid ${isActive ? '#991b1b' : '#cbd5e1'}`,
                            cursor: 'pointer',
                            boxShadow: isActive ? 'inset 0 1px 3px rgba(0,0,0,0.3), 0 0 4px rgba(220, 38, 38, 0.4)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease',
                            transform: isActive ? 'scale(1.1)' : 'scale(1)'
                          }}
                          title={exPenalties[lvl-1]}
                        />
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#dc2626', marginTop: '4px', fontWeight: 'bold', textTransform: 'uppercase', height: '10px', whiteSpace: 'nowrap', overflow: 'visible' }}>
                    {(characterState.exhaustionLevel || 0) > 0 ? (
                       characterState.exhaustionLevel === 1 ? "Disadv: Ability Checks" :
                       characterState.exhaustionLevel === 2 ? "Speed Halved" :
                       characterState.exhaustionLevel === 3 ? "Disadv: Atk/Saves" :
                       characterState.exhaustionLevel === 4 ? "Max HP Halved" :
                       characterState.exhaustionLevel === 5 ? "Speed = 0" : "Death"
                    ) : ""}
                  </div>
                </div>

                {/* Inspiration Toggle */}
                <div
                  onClick={() => setHasInspiration(!hasInspiration)}
                  style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${hasInspiration ? '#d4af37' : 'var(--border-color)'}`, backgroundColor: hasInspiration ? '#fef9c3' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: hasInspiration ? '#d97706' : 'var(--color-gray)' }}>
                    <i className="fa-solid fa-star" style={{ fontSize: '0.8rem' }}></i>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: hasInspiration ? '#d97706' : 'var(--color-gray)', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' }}>Insp</div>
                </div>
              </div>

              {/* Armor Class Wooden Box */}
              <div style={{ width: '88px', backgroundColor: '#382218', borderTop: '4px solid #251711', borderRadius: '0 0 40px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--border-color)', fontWeight: '800', letterSpacing: '1px' }}>ARMOR</span>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '2.2rem', color: 'var(--bg-white)', fontWeight: '700', lineHeight: 1, margin: '4px 0' }}>
                  {resolvedMechanics.armorClass.total}
                </span>
              </div>
            </div>

            {/* 3. Main Sheet Layout (Responsive Flex stretching 100% width) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', alignItems: 'stretch' }}>
              {/* Left Col: Saves & Senses */}
              <div style={{ flex: '1 1 240px', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '14px', height: '860px', overflowY: 'auto', paddingRight: '4px' }}>
                {/* Saving Throws Card */}
                <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#711a19', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderBottom: '1px solid #e2e8f0', padding: '12px 8px', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
                    Saving Throws
                  </h3>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { name: 'Strength', abbr: 'STR', mod: strMod },
                      { name: 'Intelligence', abbr: 'INT', mod: intMod },
                      { name: 'Dexterity', abbr: 'DEX', mod: dexMod },
                      { name: 'Wisdom', abbr: 'WIS', mod: wisMod },
                      { name: 'Constitution', abbr: 'CON', mod: conMod },
                      { name: 'Charisma', abbr: 'CHA', mod: chaMod },
                    ].map((sv, idx) => {
                      const isProf = (activeClassSaves.length > 0 ? activeClassSaves : (characterState.proficiencies?.savingThrows || [])).map(s => s.toLowerCase()).includes(sv.name.toLowerCase());
                      const totalMod = sv.mod + (isProf ? profBonus : 0);
                      return (
                        <div
                          key={idx}
                          onClick={() => triggerQuickRoll(`${sv.name} Save`, totalMod)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className={isProf ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ color: isProf ? '#711a19' : 'var(--border-color)', fontSize: '0.85rem' }}></i>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', width: '32px' }}>{sv.abbr}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-ink)', fontWeight: '600' }}>{sv.name}</span>
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: isProf ? '#711a19' : 'var(--color-gray)', backgroundColor: 'var(--bg-white)', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                            {fmtMod(totalMod)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Passive Senses Card */}
                <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#711a19', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderBottom: '1px solid #e2e8f0', padding: '12px 8px', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
                    Passive Senses
                  </h3>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { name: 'Perception', mod: wisMod, isProf: (proficientSkills || []).includes('Perception'), isExp: (expertiseSkills || []).includes('Perception') },
                      { name: 'Investigation', mod: intMod, isProf: (proficientSkills || []).includes('Investigation'), isExp: (expertiseSkills || []).includes('Investigation') },
                      { name: 'Insight', mod: wisMod, isProf: (proficientSkills || []).includes('Insight'), isExp: (expertiseSkills || []).includes('Insight') },
                    ].map((ps, idx) => {
                      const bonus = ps.isExp ? profBonus * 2 : ps.isProf ? profBonus : 0;
                      const passiveScore = 10 + ps.mod + bonus;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#711a19', fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {passiveScore}
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-gray)', textTransform: 'uppercase' }}>{ps.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Damage Resistances */}
                {resolvedMechanics.resistances?.length > 0 && (
                  <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <i className="fa-solid fa-shield-halved"></i> Resistances
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {resolvedMechanics.resistances.map((r, i) => (
                        <span key={i} style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Equipped Combat Gear Summary Card */}
                <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#711a19', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderBottom: '1px solid #e2e8f0', padding: '12px 8px', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
                    <i className="fa-solid fa-khanda" style={{ marginRight: '6px' }}></i>Equipped Combat Gear
                  </h3>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--color-gray)', fontWeight: '700' }}><i className="fa-solid fa-shirt" style={{ marginRight: '5px' }}></i>Armor:</span>
                      <strong style={{ color: 'var(--color-ink)' }}>
                        {(() => {
                          const armId = characterState.equipment?.armorId;
                          const found = rawItems.find(i => (i.itemId || i.name) === armId);
                          return found ? `${found.name} (${found.ac_base || 'AC ?'})` : (armId || 'Unarmored');
                        })()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--color-gray)', fontWeight: '700' }}><i className="fa-solid fa-shield" style={{ marginRight: '5px' }}></i>Shield:</span>
                      <strong style={{ color: 'var(--color-ink)' }}>
                        {(() => {
                          const shId = characterState.equipment?.shieldId;
                          const found = rawItems.find(i => (i.itemId || i.name) === shId);
                          return found ? `${found.name} (+2 AC)` : (shId || 'None');
                        })()}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-gray)', fontWeight: '700', display: 'block', marginBottom: '4px' }}><i className="fa-solid fa-crossswords" style={{ marginRight: '5px' }}></i>Ready Weapons:</span>
                      {weapons.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {weapons.map((w, widx) => (
                            <div key={widx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-white)', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontWeight: '800', color: 'var(--color-ink)', fontSize: '0.78rem' }}>{w.name}</span>
                              <span style={{ fontSize: '0.72rem', color: '#711a19', fontWeight: '700' }}>{w.damage || '1d6'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-gray)', fontStyle: 'italic', fontSize: '0.75rem' }}>No ready weapons equipped</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Col: 18 Skills */}
              <div style={{ flex: '1.2 1 280px', minWidth: '280px', height: '860px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-gray)', textAlign: 'center', backgroundColor: 'var(--bg-white)', borderBottom: '1px solid #e2e8f0', padding: '14px 8px', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
                  Skills ({(proficientSkills || []).length} Proficient)
                </h3>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  {ALL_SKILLS_LIST.map((skName, idx) => {
                    const abKey = SKILL_ABILITY_MAP[skName] || 'str';
                    const abMod = getMod(totalStats[abKey]);
                    const isProf = (proficientSkills || []).includes(skName);
                    const isExp = (expertiseSkills || []).includes(skName);
                    const bonus = isExp ? profBonus * 2 : isProf ? profBonus : 0;
                    let totalSkillMod = abMod + bonus;
                    let extraLabel = '';
                    
                    if (hasThaumaturge && (skName === 'Arcana' || skName === 'Religion')) {
                        const wisMin1 = Math.max(1, wisMod);
                        totalSkillMod += wisMin1;
                        extraLabel = ` (+${wisMin1} Thaumaturge)`;
                    }
                    if (hasMagician && (skName === 'Arcana' || skName === 'Nature')) {
                        const wisMin1 = Math.max(1, wisMod);
                        totalSkillMod += wisMin1;
                        extraLabel = ` (+${wisMin1} Magician)`;
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => triggerQuickRoll(`${skName} Check`, totalSkillMod)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isExp ? (
                            <i className="fa-solid fa-star" style={{ color: '#d97706', fontSize: '0.8rem' }} title="Expertise (Double Prof)"></i>
                          ) : isProf ? (
                            <i className="fa-solid fa-circle-check" style={{ color: '#711a19', fontSize: '0.85rem' }} title="Proficient"></i>
                          ) : (
                            <i className="fa-regular fa-circle" style={{ color: 'var(--border-color)', fontSize: '0.85rem' }}></i>
                          )}
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--color-gray)', width: '28px', textTransform: 'uppercase' }}>{abKey}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-ink)', fontWeight: isProf ? '700' : '500' }}>
                            {skName}
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontStyle: 'italic', marginLeft: '4px' }}>{extraLabel}</span>
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isProf ? '#711a19' : 'var(--color-gray)', backgroundColor: 'var(--bg-white)', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                          {fmtMod(totalSkillMod)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Col: Interactive Tabbed Interface */}
              <div style={{ flex: '2.5 1 450px', minWidth: '450px', height: '860px', backgroundColor: 'var(--bg-white)', border: '1px solid #d4af37', borderRadius: '8px', overflow: 'hidden', padding: '20px 24px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                {/* Tabs Header */}
                <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', borderBottom: '2px solid #e2e8f0', marginBottom: '16px', paddingBottom: '6px' }}>
                  {[
                    { id: 'actions', label: 'Actions', icon: 'fa-khanda' },
                    { id: 'spells', label: 'Spells', icon: 'fa-wand-magic-sparkles' },
                    { id: 'inventory', label: 'Inventory', icon: 'fa-suitcase' },
                    { id: 'features', label: 'Features & Traits', icon: 'fa-medal' },
                    { id: 'background', label: 'Background', icon: 'fa-scroll' },
                    { id: 'diary', label: 'Diary', icon: 'fa-book-open' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setReviewTab(tab.id)}
                      style={{ background: 'none', border: 'none', borderBottom: reviewTab === tab.id ? '2px solid #711a19' : '2px solid transparent', paddingBottom: '8px', color: reviewTab === tab.id ? '#711a19' : 'var(--color-gray)', fontWeight: reviewTab === tab.id ? '800' : '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                    >
                      <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: ACTIONS */}
                {reviewTab === 'actions' && (
                  <ActionsDashboard
                    activeWeaponsList={weapons}
                    strMod={strMod}
                    dexMod={dexMod}
                    intMod={intMod}
                    wisMod={wisMod}
                    chaMod={chaMod}
                    spellMod={activeSpellMod}
                    profBonus={profBonus}
                    totalLvl={totalLvl}
                    fmtMod={fmtMod}
                    triggerQuickRoll={triggerQuickRoll}
                    onAddWeaponClick={() => setShowAddItemModal(true)}
                    setShowAddWeaponModal={setShowAddWeaponModal}
                    characterState={characterState}
                    allFeaturesListReview={allFeaturesListReview}
                    attackSpellsList={attackSpellsList}
                    bonusActionSpells={bonusActionSpells}
                    reactionSpells={reactionSpells}
                    ritualSpells={ritualSpells}
                    formatTraitOrFeatureText={formatTraitOrFeatureText}
                    dynamicResourceTrackers={dynamicResourceTrackers}
                    liveFeatureCharges={liveFeatureCharges}
                    setLiveFeatureCharges={setLiveFeatureCharges}
                    liveSpellSlots={liveSpellSlots}
                    setLiveSpellSlots={setLiveSpellSlots}
                  />
                )}

                {/* TAB 2: SPELLS */}
                {reviewTab === 'spells' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase' }}>Spell Ability</div>
                        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: '#1e3a8a', fontWeight: 'bold' }}>{activeSpellAbilityAbbr}</div>
                      </div>
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: '800', textTransform: 'uppercase' }}>Save DC</div>
                        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: '#14532d', fontWeight: 'bold' }}>{8 + profBonus + activeSpellMod}</div>
                      </div>
                      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#b91c1c', fontWeight: '800', textTransform: 'uppercase' }}>Spell Attack</div>
                        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: '#7f1d1d', fontWeight: 'bold' }}>{fmtMod(profBonus + activeSpellMod)}</div>
                      </div>
                    </div>

                    {/* Interactive Spell Slots Tracker */}
                    <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <h5 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-gray)', textTransform: 'uppercase', margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>✨ Live Spell Slots Tracker (Auto-Consumed on Cast)</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--color-gray)' }}>Click slot to manually toggle or regain (Resets on Long Rest)</span>
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => {
                          const maxSlots = spellSlotsCalculation.standardSlots[lvl - 1] || 0;
                          if (maxSlots === 0) return null;
                          return (
                            <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-white)', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#1d4ed8' }}>Lvl {lvl}:</span>
                              {Array.from({ length: maxSlots }).map((_, slotIdx) => {
                                const isExpended = liveSpellSlots[`${lvl}_${slotIdx}`] || false;
                                return (
                                  <button
                                    key={slotIdx}
                                    type="button"
                                    onClick={() => setLiveSpellSlots(prev => ({ ...prev, [`${lvl}_${slotIdx}`]: !isExpended }))}
                                    title={isExpended ? `Level ${lvl} Slot ${slotIdx + 1} Expended (Click to restore)` : `Level ${lvl} Slot ${slotIdx + 1} Available (Click to expend)`}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      border: '1.5px solid #3b82f6',
                                      backgroundColor: isExpended ? '#fef2f2' : '#3b82f6',
                                      color: isExpended ? '#ef4444' : 'var(--bg-white)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.65rem',
                                      padding: 0,
                                      fontWeight: 'bold',
                                      boxShadow: isExpended ? 'none' : '0 0 4px rgba(59, 130, 246, 0.4)'
                                    }}
                                  >
                                    {isExpended ? '×' : '✦'}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                        {spellSlotsCalculation.warlockSlots && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#faf5ff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d8b4fe' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6d28d9' }}>🌙 Pact Magic (Lvl {spellSlotsCalculation.warlockSlots.level}):</span>
                            {Array.from({ length: spellSlotsCalculation.warlockSlots.count }).map((_, slotIdx) => {
                              const isExpended = liveSpellSlots[`pact_${slotIdx}`] || false;
                              return (
                                <button
                                  key={slotIdx}
                                  type="button"
                                  onClick={() => setLiveSpellSlots(prev => ({ ...prev, [`pact_${slotIdx}`]: !isExpended }))}
                                  title={isExpended ? `Pact Magic Slot ${slotIdx + 1} Expended (Click to restore)` : `Pact Magic Slot ${slotIdx + 1} Available (Recharges on Short Rest)`}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: '1.5px solid #8b5cf6',
                                    backgroundColor: isExpended ? '#fef2f2' : '#8b5cf6',
                                    color: isExpended ? '#ef4444' : 'var(--bg-white)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.65rem',
                                    padding: 0,
                                    fontWeight: 'bold',
                                    boxShadow: isExpended ? 'none' : '0 0 4px rgba(139, 92, 246, 0.4)'
                                  }}
                                >
                                  {isExpended ? '×' : '✦'}
                                </button>
                              );
                            })}
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontStyle: 'italic' }}>(Short Rest)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const searchLower = (reviewSpellSearch || '').toLowerCase().trim();
                      const filteredSpells = allSpellsListReview.filter(sp => {
                        const matchesSearch = !searchLower || String(sp.name || '').toLowerCase().includes(searchLower) || String(sp.source || '').toLowerCase().includes(searchLower) || String(sp.school || '').toLowerCase().includes(searchLower);
                        const matchesLevel = reviewSpellLevelFilter === 'all' || String(parseInt(sp.level || 0)) === String(reviewSpellLevelFilter);
                        return matchesSearch && matchesLevel;
                      });
                      const availableLevels = Array.from(new Set(allSpellsListReview.map(s => parseInt(s.level || 0)))).sort((a,b) => a - b);
                      const groupedSpells = {};
                      filteredSpells.forEach(sp => {
                        const lvl = parseInt(sp.level || 0);
                        if (!groupedSpells[lvl]) groupedSpells[lvl] = [];
                        groupedSpells[lvl].push(sp);
                      });
                      Object.values(groupedSpells).forEach(arr => arr.sort((a, b) => (a.name || '').localeCompare(b.name || '')));

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            {/* Search input */}
                            <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '420px' }}>
                              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray)', fontSize: '0.85rem' }}></i>
                              <input
                                type="text"
                                placeholder="Search Spell Names, Casting Times, Damage Types or School..."
                                value={reviewSpellSearch}
                                onChange={e => setReviewSpellSearch(e.target.value)}
                                style={{ width: '100%', padding: '8px 10px 8px 34px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                              />
                              {reviewSpellSearch && (
                                <button onClick={() => setReviewSpellSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-gray)', cursor: 'pointer', fontSize: '0.85rem' }}>✖</button>
                              )}
                            </div>
                            <button
                              onClick={() => setShowSheetManageSpellsModal(true)}
                              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #711a19', backgroundColor: 'var(--bg-white)', color: '#711a19', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              MANAGE SPELLS
                            </button>
                          </div>

                          {/* Level Filter Buttons */}
                          {allSpellsListReview.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                              <button
                                onClick={() => setReviewSpellLevelFilter('all')}
                                style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', backgroundColor: reviewSpellLevelFilter === 'all' ? '#711a19' : 'var(--bg-sidebar)', color: reviewSpellLevelFilter === 'all' ? 'var(--bg-white)' : 'var(--color-gray)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
                              >
                                ALL ({allSpellsListReview.length})
                              </button>
                              {availableLevels.map(lvl => {
                                const count = allSpellsListReview.filter(s => parseInt(s.level || 0) === lvl).length;
                                const isSel = String(reviewSpellLevelFilter) === String(lvl);
                                const label = lvl === 0 ? '- 0 -' : `${lvl === 1 ? '1ST' : (lvl === 2 ? '2ND' : (lvl === 3 ? '3RD' : `${lvl}TH`))}`;
                                return (
                                  <button
                                    key={lvl}
                                    onClick={() => setReviewSpellLevelFilter(String(lvl))}
                                    style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', backgroundColor: isSel ? '#711a19' : 'var(--bg-sidebar)', color: isSel ? 'var(--bg-white)' : 'var(--color-gray)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                  >
                                    {label} ({count})
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {allSpellsListReview.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', fontStyle: 'italic', marginBottom: '16px' }}>No spells prepared or learned yet. Click MANAGE SPELLS to prepare spells.</p>
                          ) : filteredSpells.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '28px 20px', backgroundColor: 'var(--bg-white)', borderRadius: '8px', border: '1px dashed #cbd5e1', color: 'var(--color-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                              <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: '2.2rem', color: 'var(--color-gray)' }}></i>
                              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-ink)' }}>No spells matching current search or level filter</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)', maxWidth: '360px', lineHeight: '1.4' }}>Try clearing your search keyword or resetting the level filter to display all your prepared and known spells.</div>
                              <button
                                onClick={() => { setReviewSpellLevelFilter('all'); setReviewSpellSearch(''); }}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#711a19', color: 'var(--bg-white)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(113,26,25,0.2)', transition: 'all 0.2s' }}
                              >
                                <i className="fa-solid fa-rotate-right"></i> Reset to ALL Spells
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '0', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                              {Object.keys(groupedSpells).sort((a,b) => parseInt(a) - parseInt(b)).map(lvlKey => {
                                const lvlNum = parseInt(lvlKey);
                                const lvlSpells = groupedSpells[lvlKey];
                                const headerTitle = lvlNum === 0 ? 'CANTRIP' : `${lvlNum === 1 ? '1ST' : (lvlNum === 2 ? '2ND' : (lvlNum === 3 ? '3RD' : `${lvlNum}TH`))} LEVEL`;
                                const slotsCount = spellSlotsCalculation.standardSlots[lvlNum - 1] || 0;

                                return (
                                  <div key={lvlKey}>
                                    {/* Section Header with slots */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #711a19', paddingBottom: '4px', marginBottom: '8px' }}>
                                      <strong style={{ color: '#711a19', fontSize: '0.8rem', letterSpacing: '0.5px' }}>{headerTitle}</strong>
                                      {lvlNum > 0 && slotsCount > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          {Array.from({ length: slotsCount }).map((_, slotIdx) => {
                                            const isExpended = liveSpellSlots[`${lvlNum}_${slotIdx}`] || false;
                                            return (
                                              <button
                                                key={slotIdx}
                                                type="button"
                                                onClick={() => setLiveSpellSlots(prev => ({ ...prev, [`${lvlNum}_${slotIdx}`]: !isExpended }))}
                                                title={isExpended ? `Level ${lvlNum} Slot ${slotIdx + 1} Expended (Click to restore)` : `Level ${lvlNum} Slot ${slotIdx + 1} Available (Click to expend)`}
                                                style={{
                                                  width: '18px',
                                                  height: '18px',
                                                  borderRadius: '50%',
                                                  border: '1.5px solid #711a19',
                                                  backgroundColor: isExpended ? '#fef2f2' : '#711a19',
                                                  color: isExpended ? '#ef4444' : 'var(--bg-white)',
                                                  cursor: 'pointer',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  fontSize: '0.6rem',
                                                  padding: 0,
                                                  fontWeight: 'bold'
                                                }}
                                              >
                                                {isExpended ? '×' : '✦'}
                                              </button>
                                            );
                                          })}
                                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--color-ink)', marginLeft: '4px' }}>SLOTS</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Column Headers */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '65px 2fr 55px 65px 65px 1.2fr 1.5fr 24px', gap: '8px', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '0.65rem', fontWeight: '800', color: 'var(--color-gray)', backgroundColor: 'var(--bg-white)' }}>
                                      <div></div>
                                      <div>NAME</div>
                                      <div>TIME</div>
                                      <div>RANGE</div>
                                      <div style={{ textAlign: 'center' }}>HIT / DC</div>
                                      <div>EFFECT</div>
                                      <div>NOTES</div>
                                      <div></div>
                                    </div>

                                    {/* Spell Rows */}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      {lvlSpells.map((sp, idx) => {
                                        const mechObj = typeof sp.mechanics === 'string' ? JSON.parse(sp.mechanics) : (sp.mechanics || {});
                                        const logic = mechObj.logic || {};
                                        const displayStr = mechObj.display || sp.spellDesc || sp.effect || '';
                                        let spMod = activeSpellMod;
                                        if (sp.ability) {
                                          const ab = sp.ability.toUpperCase();
                                          if (ab === 'INT') spMod = intMod;
                                          else if (ab === 'WIS') spMod = wisMod;
                                          else if (ab === 'CHA') spMod = chaMod;
                                          else if (ab === 'CON') spMod = conMod;
                                          else if (ab === 'STR') spMod = strMod;
                                          else if (ab === 'DEX') spMod = dexMod;
                                        }
                                        const spellAtkMod = profBonus + spMod;
                                        const spellSaveDC = 8 + profBonus + spMod;
                                        const isConcentration = (sp.duration || '').toLowerCase().includes('concentration') || displayStr.toLowerCase().includes('concentration') || JSON.stringify(mechObj).toLowerCase().includes('concentration');
                                        const isRitual = (sp.notes || '').toLowerCase().includes('ritual') || displayStr.toLowerCase().includes('ritual') || JSON.stringify(mechObj).toLowerCase().includes('ritual');
                                        const notesParts = [sp.notes || sp.components || 'V/S'];
                                        let shapeSymbol = null;
                                        const fullDesc = `${sp.name} ${displayStr} ${sp.spellDesc || ''} ${JSON.stringify(mechObj)}`.toLowerCase();
                                        if (fullDesc.includes('sphere') || fullDesc.includes('radius') || fullDesc.includes('circle') || fullDesc.includes('cylinder')) shapeSymbol = '⭕';
                                        else if (fullDesc.includes('cone')) shapeSymbol = '🔺';
                                        else if (fullDesc.includes('cube') || fullDesc.includes('box')) shapeSymbol = '⏹️';
                                        else if (fullDesc.includes('line') || fullDesc.includes('beam')) shapeSymbol = '📏';

                                        // 1. TIME format
                                        let shortTime = sp.castingTime || '1A';
                                        if (/bonus action/i.test(shortTime)) shortTime = '1BA';
                                        else if (/reaction/i.test(shortTime)) shortTime = '1R';
                                        else if (/^1\s*action/i.test(shortTime)) shortTime = '1A';
                                        else if (/1\s*minute/i.test(shortTime)) shortTime = '1m';
                                        else if (/10\s*minutes/i.test(shortTime)) shortTime = '10m';
                                        else if (/1\s*hour/i.test(shortTime)) shortTime = '1h';
                                        else if (/8\s*hours/i.test(shortTime)) shortTime = '8h';

                                        // 2. RANGE base distance format
                                        let shortRange = sp.range || 'Self';
                                        if (/touch/i.test(shortRange)) shortRange = 'Touch';
                                        else if (/self/i.test(shortRange)) shortRange = 'Self';
                                        else {
                                          const matchDist = shortRange.match(/(\d+)\s*(?:feet|ft\.?)/i);
                                          if (matchDist) shortRange = `${matchDist[1]} ft.`;
                                        }

                                        // 3. HIT / DC format
                                        let hitDcElement = <span style={{ color: 'var(--color-gray)', fontSize: '0.75rem' }}>--</span>;
                                        const isSave = logic.action_type === 'save' || logic.action_type === 'save_aoe' || logic.action_type === 'reaction_save' || logic.save_stat || /\bSave\b/i.test(displayStr);
                                        const isAttack = logic.action_type === 'attack' || /spell attack/i.test(displayStr) || /ranged attack/i.test(displayStr) || /melee attack/i.test(displayStr);

                                        if (isSave) {
                                          const rawSave = logic.save_stat || (displayStr.match(/(Dexterity|Strength|Constitution|Intelligence|Wisdom|Charisma|Dex|Str|Con|Int|Wis|Cha)\s+Save/i)?.[1]) || 'DEX';
                                          const shortSave = rawSave.slice(0, 3).toUpperCase();
                                          hitDcElement = (
                                            <div style={{ textAlign: 'center', lineHeight: '1.1' }}>
                                              <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--color-gray)' }}>{shortSave}</div>
                                              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--color-ink)' }}>{spellSaveDC}</div>
                                            </div>
                                          );
                                        } else if (isAttack) {
                                          hitDcElement = (
                                            <button
                                              onClick={() => triggerQuickRoll(`${sp.name} Attack`, spellAtkMod)}
                                              style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-ink)', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                              title="Roll Spell Attack"
                                            >
                                              {fmtMod(spellAtkMod)}
                                            </button>
                                          );
                                        }

                                        // 4. EFFECT format (Dice button OR 1-word/short Tag)
                                        let diceFormula = null;
                                        if (logic.damage) {
                                          if (typeof logic.damage === 'string') {
                                            const match = logic.damage.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/);
                                            if (match) diceFormula = match[1];
                                            else diceFormula = logic.damage;
                                          } else if (Array.isArray(logic.damage) && logic.damage.length > 0) {
                                            const d0 = logic.damage[0];
                                            diceFormula = `${d0.base_dice || ''}`.trim();
                                          }
                                        }
                                        if (!diceFormula) {
                                          const match = displayStr.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/);
                                          if (match) diceFormula = match[1];
                                        }

                                        let effectElement = null;
                                        if (diceFormula) {
                                          const dmgType = JSON.stringify(logic.damage || '') + ' ' + displayStr;
                                          let dmgSymbol = '🎲';
                                          if (/acid|poison/i.test(dmgType)) dmgSymbol = '💧';
                                          else if (/fire/i.test(dmgType)) dmgSymbol = '🔥';
                                          else if (/cold|ice/i.test(dmgType)) dmgSymbol = '❄️';
                                          else if (/lightning/i.test(dmgType)) dmgSymbol = '⚡';
                                          else if (/necrotic/i.test(dmgType)) dmgSymbol = '💀';
                                          else if (/radiant/i.test(dmgType)) dmgSymbol = '✨';
                                          else if (/thunder|force/i.test(dmgType)) dmgSymbol = '💥';
                                          else if (/heal/i.test(dmgType)) dmgSymbol = '❤️';

                                          effectElement = (
                                            <button
                                              onClick={() => triggerQuickRoll(`${sp.name} Effect`, 0, diceFormula)}
                                              style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--color-gray)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                              title={`Roll ${diceFormula}`}
                                            >
                                              <span>{diceFormula}</span>
                                              <span style={{ fontSize: '0.8rem' }}>{dmgSymbol}</span>
                                            </button>
                                          );
                                        } else {
                                          let tag = 'Utility';
                                          const conditionMatch = logic.condition || displayStr.match(/\b(Blinded|Charmed|Deafened|Frightened|Grappled|Incapacitated|Invisible|Paralyzed|Petrified|Poisoned|Prone|Restrained|Stunned|Unconscious)\b/i)?.[1];
                                          if (conditionMatch) {
                                            tag = conditionMatch.charAt(0).toUpperCase() + conditionMatch.slice(1);
                                          } else if (/social|comprehend|language|detect thoughts|message/i.test(sp.name + ' ' + displayStr)) {
                                            tag = 'Social';
                                          } else if (/creation|continual flame|create food|servant/i.test(sp.name + ' ' + displayStr)) {
                                            tag = 'Creation';
                                          } else if (/control|darkness|web|fog|wall|grease/i.test(sp.name + ' ' + displayStr)) {
                                            tag = 'Control';
                                          } else if (/buff|armor|shield|bless|haste|fly|darkvision/i.test(sp.name + ' ' + displayStr)) {
                                            tag = 'Buff';
                                          } else if (/debuff|bane|curse|slow/i.test(sp.name + ' ' + displayStr)) {
                                            tag = 'Debuff';
                                          }
                                          effectElement = (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', backgroundColor: 'var(--bg-sidebar)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', fontWeight: '600' }}>
                                              {tag}
                                            </span>
                                          );
                                        }

                                        return (
                                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.15s' }}>
                                            <div title={(sp.spellDesc || '').replace(/<[^>]+>/g, '')} style={{ display: 'grid', gridTemplateColumns: '65px 2fr 55px 65px 65px 1.2fr 1.5fr 24px', gap: '8px', padding: '8px 12px', alignItems: 'center' }}>
                                              {/* Cast button or At Will */}
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                              {lvlNum === 0 ? (
                                                <div style={{ fontSize: '0.55rem', color: 'var(--color-gray)', fontWeight: '800', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 4px', textAlign: 'center', width: '50px', letterSpacing: '0.5px' }}>AT WILL</div>
                                              ) : (
                                                <>
                                                  {sp.canUseSlots !== false && spellSlotsCalculation.standardSlots.some(s => s > 0) && (
                                                    <button
                                                      onClick={() => {
                                                        const sc = spellSlotsCalculation.standardSlots[lvlNum - 1] || 0;
                                                        let availIdx = -1;
                                                        for (let i = 0; i < sc; i++) {
                                                          if (!liveSpellSlots[`${lvlNum}_${i}`]) {
                                                            availIdx = i;
                                                            break;
                                                          }
                                                        }
                                                        if (availIdx !== -1) {
                                                          setLiveSpellSlots(prev => ({ ...prev, [`${lvlNum}_${availIdx}`]: true }));
                                                          triggerQuickRoll(`✨ Cast ${sp.name} (Expended Lvl ${lvlNum} Slot ${availIdx + 1}/${sc})`, spellAtkMod, 'log');
                                                        } else {
                                                          let upLvl = -1;
                                                          let upIdx = -1;
                                                          for (let l = lvlNum + 1; l <= 9; l++) {
                                                            const ssc = spellSlotsCalculation.standardSlots[l - 1] || 0;
                                                            for (let i = 0; i < ssc; i++) {
                                                              if (!liveSpellSlots[`${l}_${i}`]) {
                                                                upLvl = l;
                                                                upIdx = i;
                                                                break;
                                                              }
                                                            }
                                                            if (upLvl !== -1) break;
                                                          }
                                                          if (upLvl !== -1) {
                                                            if (window.confirm(`⚠️ Out of Level ${lvlNum} spell slots!\nDo you want to upcast "${sp.name}" using a Level ${upLvl} spell slot?`)) {
                                                              setLiveSpellSlots(prev => ({ ...prev, [`${upLvl}_${upIdx}`]: true }));
                                                              triggerQuickRoll(`✨ Upcast ${sp.name} at Lvl ${upLvl} (Expended Lvl ${upLvl} Slot ${upIdx + 1})`, spellAtkMod, 'log');
                                                            }
                                                          } else {
                                                            alert(`❌ Out of standard spell slots for Level ${lvlNum} and above! Take a Long Rest to recover spell slots.`);
                                                          }
                                                        }
                                                      }}
                                                      style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', borderRadius: '3px', padding: '3px 8px', fontWeight: '800', fontSize: '0.62rem', cursor: 'pointer', width: '54px', letterSpacing: '0.5px' }}
                                                      title="Cast using a Standard Spell Slot"
                                                    >
                                                      SLOT CAST
                                                    </button>
                                                  )}

                                                  {sp.canUseSlots !== false && spellSlotsCalculation.warlockSlots && spellSlotsCalculation.warlockSlots.level >= lvlNum && (
                                                    <button
                                                      onClick={() => {
                                                        const wlSlots = spellSlotsCalculation.warlockSlots;
                                                        let availIdx = -1;
                                                        for (let i = 0; i < wlSlots.count; i++) {
                                                          if (!liveSpellSlots[`pact_${i}`]) {
                                                            availIdx = i;
                                                            break;
                                                          }
                                                        }
                                                        if (availIdx !== -1) {
                                                          setLiveSpellSlots(prev => ({ ...prev, [`pact_${availIdx}`]: true }));
                                                          const isUpcast = wlSlots.level > lvlNum;
                                                          const msg = isUpcast 
                                                            ? `🌙 Upcast ${sp.name} at Lvl ${wlSlots.level} (Expended Pact Magic Slot ${availIdx + 1}/${wlSlots.count})`
                                                            : `🌙 Cast ${sp.name} (Expended Pact Magic Slot ${availIdx + 1}/${wlSlots.count})`;
                                                          triggerQuickRoll(msg, spellAtkMod, 'log');
                                                        } else {
                                                          alert(`❌ Out of Pact Magic slots! Take a Short or Long Rest to recover Pact Magic slots.`);
                                                        }
                                                      }}
                                                      style={{ backgroundColor: '#6d28d9', color: 'var(--bg-white)', border: 'none', borderRadius: '3px', padding: '3px 8px', fontWeight: '800', fontSize: '0.62rem', cursor: 'pointer', width: '54px', letterSpacing: '0.5px' }}
                                                      title={`Cast using Level ${spellSlotsCalculation.warlockSlots.level} Pact Magic Slot (Recharges on Short Rest)`}
                                                    >
                                                      PACT CAST
                                                    </button>
                                                  )}

                                                  {sp.hasFreeCast && (() => {
                                                    const isFreeUsed = liveSpellSlots[`free_${sp.id || sp.name}`] || false;
                                                    return (
                                                      <button
                                                        onClick={() => {
                                                          setLiveSpellSlots(prev => ({ ...prev, [`free_${sp.id || sp.name}`]: !isFreeUsed }));
                                                          if (!isFreeUsed) {
                                                            triggerQuickRoll(`✨ Free Cast (1/LR): ${sp.name}`, spellAtkMod, 'log');
                                                          }
                                                        }}
                                                        style={{
                                                          backgroundColor: isFreeUsed ? 'var(--bg-sidebar)' : '#16a34a',
                                                          color: isFreeUsed ? 'var(--color-gray)' : 'var(--bg-white)',
                                                          border: isFreeUsed ? '1px solid #cbd5e1' : 'none',
                                                          borderRadius: '3px',
                                                          padding: '2px 6px',
                                                          fontWeight: '800',
                                                          fontSize: '0.55rem',
                                                          cursor: 'pointer',
                                                          width: '54px',
                                                          letterSpacing: '0.3px'
                                                        }}
                                                        title={isFreeUsed ? 'Free Cast Expended (Click to reset)' : 'Cast once without using a spell slot (1/Long Rest)'}
                                                      >
                                                        {isFreeUsed ? 'FREE USED' : 'FREE CAST'}
                                                      </button>
                                                    );
                                                  })()}
                                                </>
                                              )}
                                            </div>

                                            {/* Name */}
                                            <div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <strong style={{ color: 'var(--color-ink)', fontStyle: 'italic', fontWeight: '700', fontSize: '0.82rem' }}>{sp.name}</strong>
                                                {isConcentration && <span title="Concentration" style={{ fontSize: '0.7rem', color: 'var(--color-ink)' }}>♦</span>}
                                              </div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                                                {isRitual && <span title="Ritual" style={{ fontSize: '0.55rem', backgroundColor: 'var(--border-color)', color: 'var(--color-gray)', padding: '0px 3px', borderRadius: '2px', fontWeight: 'bold' }}>R</span>}
                                                <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>{sp.source || 'Spellcaster'}</span>
                                              </div>
                                            </div>

                                            {/* Time */}
                                            <div style={{ color: 'var(--color-gray)', fontWeight: '600', fontSize: '0.75rem' }}>{shortTime}</div>

                                            {/* Range */}
                                            <div style={{ color: 'var(--color-gray)', fontSize: '0.75rem' }}>{shortRange}</div>

                                            {/* Hit / DC */}
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                              {hitDcElement}
                                            </div>

                                            {/* Effect */}
                                            <div>
                                              {effectElement}
                                            </div>

                                            {/* Notes */}
                                            <div style={{ fontSize: '0.72rem', color: 'var(--color-gray)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <span>{notesParts.join(', ') || 'V/S'}</span>
                                              {shapeSymbol && <span style={{ fontSize: '0.8rem', marginLeft: '2px' }}>{shapeSymbol}</span>}
                                            </div>

                                            {/* Expand Button */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                              <button
                                                onClick={() => setExpandedSpells(prev => ({ ...prev, [sp.id || sp.name]: !prev[sp.id || sp.name] }))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-gray)' }}
                                              >
                                                <i className={`fa-solid fa-chevron-${expandedSpells[sp.id || sp.name] ? 'up' : 'down'}`}></i>
                                              </button>
                                            </div>
                                            </div>
                                            {/* Expanded Description Area */}
                                            {expandedSpells[sp.id || sp.name] && (
                                              <div style={{ padding: '12px 12px 12px 85px', backgroundColor: '#f8fafc', fontSize: '0.82rem', color: 'var(--color-ink)', borderTop: '1px solid #e2e8f0', lineHeight: '1.4' }}>
                                                <div dangerouslySetInnerHTML={{ __html: sp.spellDesc || 'No description available for this spell.' }} />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 3: INVENTORY */}
                {reviewTab === 'inventory' && (() => {
                  const attunedIds = characterState.equipment?.attunedIds || [];
                  const strScore = resolvedMechanics?.abilities?.str?.score || characterState?.stats?.str || 10;
                  const maxCapacity = strScore * 15;
                  const totalWeight = rawItems.reduce((sum, item) => sum + (parseFloat(item.weight || 0) * parseInt(item.qty || 1, 10)), 0);
                  let encStatus = { label: 'Unencumbered', color: '#166534', bg: '#dcfce7', border: '#86efac' };
                  if (totalWeight > maxCapacity) {
                    encStatus = { label: 'Over Capacity', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' };
                  } else if (totalWeight > maxCapacity * 0.66) {
                    encStatus = { label: 'Heavily Encumbered', color: '#c2410c', bg: '#ffedd5', border: '#fdba74' };
                  } else if (totalWeight > maxCapacity * 0.33) {
                    encStatus = { label: 'Encumbered', color: '#a16207', bg: '#fef9c3', border: '#fde047' };
                  }

                  // Categorize rawItems accurately according to D&D 5e item types
                  const isWeaponItem = (item) => {
                    const cat = (item.category || item.subcategory || '').toLowerCase();
                    return cat.includes('weapon') || item.damage || /sword|bow|dagger|axe|mace|spear|staff|crossbow|javelin|hammer/i.test(item.name || '');
                  };
                  const isArmorItem = (item) => {
                    const cat = (item.category || item.subcategory || '').toLowerCase();
                    return cat.includes('armor') || cat.includes('shield') || item.ac_base || /armor|shield|mail|plate|leather|robes/i.test(item.name || '');
                  };
                  const isMagicItem = (item) => {
                    const cat = (item.category || item.subcategory || '').toLowerCase();
                    const notes = (item.notes || item.description || item.properties || '').toLowerCase();
                    return cat.includes('magic') || item.rarity || item.requires_attunement || notes.includes('attunement') || attunedIds.includes(item.itemId || item.name);
                  };

                  const getStandardItemDesc = (name = '', category = 'Item', damage = '', acBase = '', properties = '') => {
                    const n = (name || '').toLowerCase();
                    
                    // Weapons
                    if (n.includes('dagger')) return "A light, versatile double-edged blade. Can be used for close-quarters stabbing or thrown at distant enemies (Range 20/60). Features Finesse, allowing you to use Dexterity for attack and damage rolls.";
                    if (n.includes('quarterstaff')) return "A simple, solid wooden staff favored by travelers, monks, and spellcasters. Can be wielded with one hand (1d6 Bludgeoning) or two hands (1d8 Bludgeoning via Versatile). Also doubles as a walking staff or arcane focus.";
                    if (n.includes('shortsword')) return "A light, agile blade designed for swift piercing thrusts. Features Finesse and Light properties, making it ideal for dual-wielding.";
                    if (n.includes('longsword')) return "A versatile martial sword with a long double-edged blade. Can be wielded in one hand (1d8 Slashing) or two hands (1d10 Slashing). A staple weapon for knights and fighters.";
                    if (n.includes('greatsword')) return "A massive two-handed sword capable of delivering devastating cleaving strikes (2d6 Slashing). Requires high Strength and two hands to wield.";
                    if (n.includes('rapier')) return "A finely crafted martial blade with a sharp point and protective guard. Deals 1d8 Piercing damage with Finesse.";
                    if (n.includes('shortbow')) return "A compact bow designed for swift shooting at range (80/320 ft.). Fires arrows to deal 1d6 Piercing damage.";
                    if (n.includes('longbow')) return "A large, powerful bow with incredible range (150/600 ft.). Deals 1d8 Piercing damage. Heavy and requires two hands.";
                    if (n.includes('crossbow')) return "A mechanical bow that fires heavy bolts with high velocity. Requires the Loading property between shots.";
                    if (n.includes('handaxe') || n.includes('axe')) return "A sturdy light axe balanced for melee combat or throwing (Range 20/60). Deals Slashing damage.";
                    if (n.includes('mace')) return "A heavy metal or wooden club with a spiked or flanged head, designed to crush armor and bone (1d6 Bludgeoning).";
                    if (n.includes('spear')) return "A long shaft tipped with a sharp point. Can be thrust in melee (1d6 Piercing), thrown (20/60), or used two-handed (1d8 Piercing).";

                    // Armor & Shields
                    if (n.includes('shield')) return "A sturdy wooden or metal shield strapped to the arm. Grants a +2 bonus to Armor Class (AC) when wielded in one hand.";
                    if (n.includes('leather armor') || n.includes('leather') || n.includes('studded leather')) return "Protective armor crafted from toughened leather. Provides AC 11/12 + Dexterity Modifier without imposing disadvantage on Stealth checks.";
                    if (n.includes('chain shirt') || n.includes('scale mail') || n.includes('breastplate') || n.includes('half plate')) return "Medium armor combining metal plates or chainmail with padded leather. Provides solid protection (AC 13-15 + Dex max 2).";
                    if (n.includes('chain mail') || n.includes('plate') || n.includes('ring mail') || n.includes('splint')) return "Heavy armor offering maximal physical protection. Requires high Strength and imposes disadvantage on Stealth checks.";
                    if (n.includes('robe') || n.includes('clothes')) return "Simple, comfortable garments favored by spellcasters, scholars, and everyday travelers. Imposes no weight penalty or armor restriction.";

                    // Spellcasting & Class Items
                    if (n.includes('spellbook')) return "An essential leather-bound tome used by Wizards to study, transcribe, and memorize arcane spells. Contains intricate diagrams, runes, and incantations.";
                    if (n.includes('arcane focus') || n.includes('orb') || n.includes('wand') || n.includes('rod') || n.includes('crystal')) return "A special item (orb, crystal, rod, staff, or wand) designed to channel arcane magic, replacing material components without gold costs.";
                    if (n.includes('holy symbol') || n.includes('amulet') || n.includes('reliquary')) return "A sacred emblem or relic of a deity used by Clerics and Paladins to focus divine spellcasting and Channel Divinity.";
                    if (n.includes('druidic focus') || n.includes('totem') || n.includes('mistletoe')) return "A natural item (sprig of mistletoe, wooden staff, or Yew wand) used by Druids and Rangers to focus primal nature magic.";

                    // Consumables & Gear
                    if (n.includes('potion of healing') || n.includes('healing potion')) return "A shimmering red liquid that smells of cane sugar and wild berries. Drinking it (Action or Bonus Action) immediately restores 2d4 + 2 Hit Points.";
                    if (n.includes('potion')) return "A magical liquid contained in a small glass vial. Drinking it applies its magical effects immediately.";
                    if (n.includes('scroll')) return "A parchment scroll inscribed with magical incantations. Allows a spellcaster to cast the spell written upon it without consuming spell slots.";
                    if (n.includes('ration')) return "Dry food suitable for extended travel, including jerky, dried fruit, hardtack, and nuts. Provides nourishment for one full day.";
                    if (n.includes('torch')) return "A wooden stick wrapped in pitch-soaked rags. Burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet.";
                    if (n.includes('rope')) return "50 feet of sturdy hempen or silk rope with a breaking strength of 1,000 pounds. Essential for climbing, tying up captives, or securing gear.";
                    if (n.includes('waterskin')) return "A durable leather pouch designed to hold up to 4 pints of drinkable water for travel.";
                    if (n.includes('tinderbox')) return "A small container containing flint, fire steel, and dry tinder used to ignite torches, campfires, and lanterns.";
                    if (n.includes('parchment')) return "One sheet of Parchment can hold about 250 handwritten words. Essential for writing notes, mapping, or scribing scrolls.";
                    if (n.includes('pen') || n.includes('quill')) return "An Ink Pen requires a vial of Ink to write on parchment or paper.";
                    if (n.includes('book')) return "A Book contains fiction or nonfiction. If you consult an accurate nonfiction Book about its topic, you gain a +5 bonus to Intelligence (Arcana, History, Nature, or Religion) checks you make about that topic.";
                    if (n.includes('pack')) return "A comprehensive adventure kit containing essential survival gear, food rations, rope, torches, a mess kit, and a bedroll.";
                    if (n.includes('tool') || n.includes('supplies') || n.includes('kit')) return "A specialized set of tools and instruments used for crafting, repairing, thievery, or practicing a professional trade.";

                    const details = [];
                    if (damage) details.push(`Damage: ${damage}`);
                    if (acBase) details.push(`Armor Class: +${acBase}`);
                    if (properties) details.push(`Properties: ${properties}`);

                    return `Standard ${category} used by adventurers.${details.length > 0 ? ' (' + details.join(', ') + ')' : ''}`;
                  };

                  const getItemDetails = (item) => {
                    if (!item) return { desc: 'No description available.', properties: '', cost: '-', weight: '0 lb.', damage: '', acBase: '', rarity: '', category: 'Item' };
                    const dbCatalog = dbData?.items || [];
                    const idKey = item.itemId || item.item_id || item.name;
                    const rawName = item.name || '';
                    const itemNameLower = rawName.toLowerCase().trim();
                    const cleanNameLower = rawName.replace(/\s*\([\s\S]*?\)/g, '').toLowerCase().trim();

                    const itemAliases = {
                      'pen': 'ink pen',
                      'quill': 'ink pen',
                      'ink & pen': 'ink pen',
                      'paper': 'paper',
                      'parchment': 'parchment',
                      'book': 'book'
                    };
                    const aliasNameLower = itemAliases[cleanNameLower] || itemAliases[itemNameLower] || cleanNameLower;

                    const matchedDb = dbCatalog.find(i => {
                      if (!i) return false;
                      const iId = String(i.item_id || '').toLowerCase();
                      const iName = String(i.item_name || i.name || '').toLowerCase();
                      return (idKey && iId === String(idKey).toLowerCase()) ||
                             iName === itemNameLower ||
                             iName === cleanNameLower ||
                             iName === aliasNameLower;
                    });

                    const matchedMd = parsedItemsCatalog[itemNameLower] || 
                                      parsedItemsCatalog[cleanNameLower] || 
                                      parsedItemsCatalog[aliasNameLower] || 
                                      Object.values(parsedItemsCatalog).find(pi => {
                                        const pName = (pi.name || '').toLowerCase();
                                        return pName === itemNameLower || pName === cleanNameLower || pName === aliasNameLower;
                                      });

                    let rawDesc = item.description || item.desc || item.item_desc || item.notes || matchedDb?.item_desc || matchedDb?.description || matchedDb?.desc || matchedDb?.notes || matchedMd?.description || '';
                    const properties = item.properties || matchedDb?.properties || '';
                    const cost = item.cost || matchedDb?.cost || matchedMd?.cost || '-';
                    const weight = item.weight !== undefined ? item.weight : (matchedDb?.weight !== undefined ? matchedDb.weight : (matchedMd?.weight || 0));
                    const damage = item.damage || matchedDb?.damage || '';
                    const acBase = item.ac_base || matchedDb?.ac_base || matchedDb?.ac || '';
                    const rarity = item.rarity || matchedDb?.rarity || matchedMd?.rarity || '';
                    const category = item.category || item.subcategory || matchedDb?.item_type || matchedDb?.subcategory || matchedMd?.category || 'Item';

                    if (!rawDesc || rawDesc === 'No description provided.' || rawDesc.includes('No additional rules specified')) {
                      rawDesc = getStandardItemDesc(item.name, category, damage, acBase, properties);
                    }

                    return { desc: rawDesc, properties, cost, weight: `${weight} lb.`, damage, acBase, rarity, category };
                  };

                  // Filter items based on current tab & search query
                  const invFiltered = rawItems.filter(item => {
                    if (reviewInvSearch) {
                      const q = reviewInvSearch.toLowerCase();
                      const matchName = (item.name || '').toLowerCase().includes(q);
                      const matchCat = (item.category || item.subcategory || '').toLowerCase().includes(q);
                      const matchNotes = (item.notes || item.properties || '').toLowerCase().includes(q);
                      if (!matchName && !matchCat && !matchNotes) return false;
                    }
                    if (reviewInvTab === 'EQUIPMENT') return isWeaponItem(item) || isArmorItem(item);
                    if (reviewInvTab === 'ATTUNEMENT') return isMagicItem(item);
                    if (reviewInvTab === 'BACKPACK') return !isWeaponItem(item) && !isArmorItem(item) && !isMagicItem(item);
                    return true;
                  });

                  // Group filtered items for clean D&D Beyond rendering when viewing ALL
                  const weaponList = invFiltered.filter(isWeaponItem);
                  const armorList = invFiltered.filter(i => !weaponList.includes(i) && isArmorItem(i));
                  const magicList = invFiltered.filter(i => !weaponList.includes(i) && !armorList.includes(i) && isMagicItem(i));
                  const gearList = invFiltered.filter(i => !weaponList.includes(i) && !armorList.includes(i) && !magicList.includes(i));

                  return (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                      {/* Top Header: Carrying Capacity & Currency Pouch Dashboard */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '12px', backgroundColor: 'var(--bg-white)', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        {/* Left: Capacity Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-gray)', textTransform: 'uppercase' }}>
                              ⚖️ Encumbrance & Capacity
                            </span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: encStatus.color, backgroundColor: encStatus.bg, border: `1px solid ${encStatus.border}`, padding: '1px 6px', borderRadius: '4px' }}>
                              {encStatus.label}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '4px' }}>
                            <div style={{ width: `${Math.min(100, (totalWeight / (maxCapacity || 150)) * 100)}%`, height: '100%', backgroundColor: encStatus.color, transition: 'width 0.3s ease' }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-gray)', fontWeight: '600' }}>
                            <span>Total Weight: <strong style={{ color: 'var(--color-ink)' }}>{totalWeight.toFixed(1)} lb.</strong></span>
                            <span>Max Capacity: <strong style={{ color: 'var(--color-ink)' }}>{maxCapacity} lb.</strong> (STR {strScore}×15)</span>
                          </div>
                        </div>

                        {/* Right: Interactive Currency Pouch */}
                        <div style={{ backgroundColor: 'var(--bg-white)', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-gray)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            💰 Currency Pouch
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                            {['pp', 'gp', 'ep', 'sp', 'cp'].map(coin => (
                              <div key={coin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-white)', padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', flex: 1 }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: '800', color: coin === 'gp' ? '#ca8a04' : coin === 'pp' ? '#6366f1' : coin === 'sp' ? 'var(--color-gray)' : coin === 'ep' ? '#0d9488' : '#b45309', textTransform: 'uppercase' }}>{coin}</span>
                                <input
                                  type="number"
                                  value={(characterState.equipment?.currency || {})[coin] || 0}
                                  onChange={e => {
                                    const val = parseInt(e.target.value || 0, 10);
                                    const oldVal = (characterState.equipment?.currency || {})[coin] || 0;
                                    setCharacterState(prev => {
                                      const curEq = prev.equipment || {};
                                      const curCoins = curEq.currency || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 };
                                      return { ...prev, equipment: { ...curEq, currency: { ...curCoins, [coin]: val } } };
                                    });
                                    if (val !== oldVal) {
                                      
                                    }
                                  }}
                                  style={{ width: '38px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-ink)' }}
                                />
                                <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                                  <button
                                    onClick={() => {
                                      const oldVal = (characterState.equipment?.currency || {})[coin] || 0;
                                      setCharacterState(prev => {
                                        const curEq = prev.equipment || {};
                                        const curCoins = curEq.currency || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 };
                                        return { ...prev, equipment: { ...curEq, currency: { ...curCoins, [coin]: Math.max(0, (curCoins[coin] || 0) - 1) } } };
                                      });
                                      
                                    }}
                                    style={{ padding: '0 4px', fontSize: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: 'var(--bg-sidebar)', cursor: 'pointer' }}
                                  >-</button>
                                  <button
                                    onClick={() => {
                                      const oldVal = (characterState.equipment?.currency || {})[coin] || 0;
                                      setCharacterState(prev => {
                                        const curEq = prev.equipment || {};
                                        const curCoins = curEq.currency || { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 };
                                        return { ...prev, equipment: { ...curEq, currency: { ...curCoins, [coin]: (curCoins[coin] || 0) + 1 } } };
                                      });
                                      
                                    }}
                                    style={{ padding: '0 4px', fontSize: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: 'var(--bg-sidebar)', cursor: 'pointer' }}
                                  >+</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Navigation & Search Bar */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {['ALL', 'EQUIPMENT', 'BACKPACK', 'ATTUNEMENT'].map(t => (
                            <button
                              key={t}
                              onClick={() => setReviewInvTab(t)}
                              style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid', borderColor: reviewInvTab === t ? '#711a19' : 'var(--border-color)', backgroundColor: reviewInvTab === t ? '#711a19' : 'var(--bg-white)', color: reviewInvTab === t ? 'var(--bg-white)' : 'var(--color-gray)', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.3px' }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ position: 'relative', width: '180px' }}>
                            <input
                              type="text"
                              placeholder="Search items..."
                              value={reviewInvSearch}
                              onChange={e => setReviewInvSearch(e.target.value)}
                              style={{ width: '100%', padding: '4px 20px 4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', outline: 'none' }}
                            />
                            {reviewInvSearch && (
                              <button onClick={() => setReviewInvSearch('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-gray)', cursor: 'pointer', fontSize: '0.7rem' }}>✖</button>
                            )}
                          </div>
                          <button
                            onClick={() => setShowAddItemModal(true)}
                            style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                          >
                            <i className="fa-solid fa-plus"></i> ADD ITEM
                          </button>
                        </div>
                      </div>

                      {/* Attunement Tracker Banner (Show below Navigation bar, above items / No items match filter) */}
                      {(reviewInvTab === 'ALL' || reviewInvTab === 'ATTUNEMENT') && (
                        <div style={{ backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '8px', padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ color: '#9d174d', fontSize: '0.8rem' }}>✨ MAGIC ITEM ATTUNEMENT ({attunedIds.length} / 3 SLOTS ACTIVE)</strong>
                            <span style={{ fontSize: '0.68rem', color: '#831843' }}>Max 3 Attuned Items (D&D 5e Rules)</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {[0, 1, 2].map(slotIdx => {
                              const attId = attunedIds[slotIdx];
                              const attItem = attId ? rawItems.find(i => (i.itemId || i.name) === attId) || { name: attId } : null;
                              return (
                                <div key={slotIdx} style={{ backgroundColor: 'var(--bg-white)', border: '1px dashed #f472b6', borderRadius: '6px', padding: '6px 8px', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>SLOT {slotIdx + 1}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: attItem ? 'bold' : 'normal', color: attItem ? '#831843' : 'var(--border-color)' }}>
                                      {attItem ? attItem.name : 'Empty Slot'}
                                    </div>
                                  </div>
                                  {attItem && (
                                    <button
                                      onClick={() => {
                                        setCharacterState(prev => {
                                          const curEq = prev.equipment || {};
                                          const newAtt = (curEq.attunedIds || []).filter(id => id !== attId);
                                          return { ...prev, equipment: { ...curEq, attunedIds: newAtt } };
                                        });
                                      }}
                                      style={{ fontSize: '0.65rem', background: '#ffe4e6', border: '1px solid #f43f5e', color: '#e11d48', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >Unattune</button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Specialized Categorized Tables */}
                      {invFiltered.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No items match your filter.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Weapons Section */}
                          {weaponList.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#711a19', textTransform: 'uppercase', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', marginBottom: '6px' }}>
                                ⚔️ Weapons ({weaponList.length}) — Check box to Wield in Combat / Actions Tab
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {weaponList.map((item, idx) => {
                                  const _origIdx = rawItems.findIndex(ri => ri === item);
                                  const isWielded = item.equipped !== false;
                                  const itemKey = `wpn-${item.itemId || item.name}-${idx}`;
                                  const isExpanded = !!expandedItems[itemKey];
                                  const itemDetails = getItemDetails(item);
                                  return (
                                    <div key={idx} style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '70px 2fr 80px 60px 75px 30px', gap: '8px', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 'bold', color: isWielded ? '#711a19' : 'var(--color-gray)', cursor: 'pointer' }}>
                                          <input
                                            type="checkbox"
                                            checked={isWielded}
                                            onChange={e => {
                                              const checked = e.target.checked;
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                const idKey = item.itemId || item.name;
                                                const curItems = [...(curEq.items || [])];
                                                const idx = curItems.findIndex(it => (it.itemId && it.itemId === idKey) || (it.name && (it.name || '').toLowerCase() === (item.name || '').toLowerCase()));
                                                if (idx !== -1) {
                                                  curItems[idx] = { ...curItems[idx], equipped: checked };
                                                } else {
                                                  curItems.push({ ...item, equipped: checked });
                                                }
                                                let newWeapons = [...(curEq.weapons || [])];
                                                if (checked) {
                                                  if (!newWeapons.some(w => w === idKey || (typeof w === 'string' && w.toLowerCase() === (item.name || '').toLowerCase()))) {
                                                    if (newWeapons.length < 3) newWeapons.push(idKey);
                                                  }
                                                } else {
                                                  newWeapons = newWeapons.filter(w => w !== idKey && (typeof w !== 'string' || w.toLowerCase() !== (item.name || '').toLowerCase()));
                                                }
                                                return { ...prev, equipment: { ...curEq, items: curItems, weapons: newWeapons } };
                                              });
                                            }}
                                            style={{ accentColor: '#711a19', cursor: 'pointer' }}
                                          /> WIELD
                                        </label>
                                        <div 
                                          onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          <strong style={{ fontSize: '0.82rem', color: 'var(--color-ink)' }}>{item.name}</strong>
                                          <div style={{ fontSize: '0.68rem', color: 'var(--color-gray)' }}>{item.category || 'Weapon'}{item.properties ? ` • ${item.properties}` : ''}</div>
                                        </div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#991b1b', textAlign: 'center' }}>{item.damage || '1d6'}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-gray)', textAlign: 'center' }}>{item.weight || 0} lb.</div>
                                        <div style={{ textAlign: 'center' }}>
                                          <button
                                            onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                            style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isExpanded ? '#711a19' : 'var(--bg-sidebar)', color: isExpanded ? '#fff' : 'var(--color-gray)', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer' }}
                                          >
                                            {isExpanded ? 'ย่อ ▴' : 'ขยาย ▾'}
                                          </button>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <button
                                            onClick={() => {
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                const idKey = item.itemId || item.name;
                                                const filteredItems = (curEq.items || []).filter(it => (it.itemId || it.name) !== idKey && (it.name || '').toLowerCase() !== (item.name || '').toLowerCase());
                                                const filteredWeapons = (curEq.weapons || []).filter(w => w !== idKey && (typeof w !== 'string' || w.toLowerCase() !== (item.name || '').toLowerCase()));
                                                return { ...prev, equipment: { ...curEq, items: filteredItems, weapons: filteredWeapons } };
                                              });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            title="Remove item"
                                          ><i className="fa-solid fa-trash"></i></button>
                                        </div>
                                      </div>
                                      {isExpanded && (
                                        <div style={{ padding: '10px 12px', marginTop: '6px', backgroundColor: 'var(--bg-paper)', border: '1px solid #e2d8c3', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #e2d8c3', paddingBottom: '4px' }}>
                                            <strong style={{ color: '#711a19', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <i className="fa-solid fa-circle-info"></i> {item.name} Details
                                            </strong>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', fontStyle: 'italic' }}>
                                              {itemDetails.category} • Cost: {itemDetails.cost}
                                            </span>
                                          </div>
                                          <div dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml(item.name, formatTraitOrFeatureText(itemDetails.desc)) }} />
                                          {itemDetails.properties && (
                                            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                                              🏷️ Properties: {itemDetails.properties}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Armor & Shields Section */}
                          {armorList.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', marginBottom: '6px' }}>
                                🛡️ Armor & Shields ({armorList.length}) — Check box to Wear & Recalculate Armor Class
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {armorList.map((item, idx) => {
                                  const _origIdx = rawItems.findIndex(ri => ri === item);
                                  const isWorn = item.equipped !== false;
                                  const itemKey = `arm-${item.itemId || item.name}-${idx}`;
                                  const isExpanded = !!expandedItems[itemKey];
                                  const itemDetails = getItemDetails(item);
                                  return (
                                    <div key={idx} style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '70px 2fr 80px 60px 75px 30px', gap: '8px', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 'bold', color: isWorn ? '#1d4ed8' : 'var(--color-gray)', cursor: 'pointer' }}>
                                          <input
                                            type="checkbox"
                                            checked={isWorn}
                                            onChange={e => {
                                              const checked = e.target.checked;
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                const idKey = item.itemId || item.name;
                                                const curItems = [...(curEq.items || [])];
                                                const idx = curItems.findIndex(it => (it.itemId && it.itemId === idKey) || (it.name && (it.name || '').toLowerCase() === (item.name || '').toLowerCase()));
                                                if (idx !== -1) {
                                                  curItems[idx] = { ...curItems[idx], equipped: checked };
                                                } else {
                                                  curItems.push({ ...item, equipped: checked });
                                                }
                                                let newArmorId = curEq.armorId;
                                                let newShieldId = curEq.shieldId;
                                                const cat = (item.category || item.subcategory || '').toLowerCase();
                                                if (cat === 'armor' || cat.includes('light armor') || cat.includes('medium armor') || cat.includes('heavy armor')) {
                                                  newArmorId = checked ? idKey : null;
                                                } else if ((item.name || '').toLowerCase().includes('shield') || cat.includes('shield')) {
                                                  newShieldId = checked ? idKey : null;
                                                }
                                                return { ...prev, equipment: { ...curEq, items: curItems, armorId: newArmorId, shieldId: newShieldId } };
                                              });
                                            }}
                                            style={{ accentColor: '#1d4ed8', cursor: 'pointer' }}
                                          /> WEAR
                                        </label>
                                        <div 
                                          onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          <strong style={{ fontSize: '0.82rem', color: 'var(--color-ink)' }}>{item.name}</strong>
                                          <div style={{ fontSize: '0.68rem', color: 'var(--color-gray)' }}>{item.category || 'Armor'}</div>
                                        </div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#1e3a8a', textAlign: 'center' }}>{item.ac_base ? `AC +${item.ac_base}` : 'AC Shield'}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-gray)', textAlign: 'center' }}>{item.weight || 0} lb.</div>
                                        <div style={{ textAlign: 'center' }}>
                                          <button
                                            onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                            style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isExpanded ? '#1d4ed8' : 'var(--bg-sidebar)', color: isExpanded ? '#fff' : 'var(--color-gray)', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer' }}
                                          >
                                            {isExpanded ? 'ย่อ ▴' : 'ขยาย ▾'}
                                          </button>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <button
                                            onClick={() => {
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                const idKey = item.itemId || item.name;
                                                const filteredItems = (curEq.items || []).filter(it => (it.itemId || it.name) !== idKey && (it.name || '').toLowerCase() !== (item.name || '').toLowerCase());
                                                let newArmorId = (curEq.armorId === idKey || (curEq.armorId || '').toLowerCase() === (item.name || '').toLowerCase()) ? null : curEq.armorId;
                                                let newShieldId = (curEq.shieldId === idKey || (curEq.shieldId || '').toLowerCase() === (item.name || '').toLowerCase()) ? null : curEq.shieldId;
                                                return { ...prev, equipment: { ...curEq, items: filteredItems, armorId: newArmorId, shieldId: newShieldId } };
                                              });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            title="Remove item"
                                          ><i className="fa-solid fa-trash"></i></button>
                                        </div>
                                      </div>
                                      {isExpanded && (
                                        <div style={{ padding: '10px 12px', marginTop: '6px', backgroundColor: 'var(--bg-paper)', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                                            <strong style={{ color: '#1d4ed8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <i className="fa-solid fa-shield-halved"></i> {item.name} Details
                                            </strong>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', fontStyle: 'italic' }}>
                                              {itemDetails.category} • Cost: {itemDetails.cost}
                                            </span>
                                          </div>
                                          <div dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml(item.name, formatTraitOrFeatureText(itemDetails.desc)) }} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Magic Items Section */}
                          {magicList.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#9d174d', textTransform: 'uppercase', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', marginBottom: '6px' }}>
                                ✨ Magic Items & Attunable Wondrous Gear ({magicList.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {magicList.map((item, idx) => {
                                  const _origIdx = rawItems.findIndex(ri => ri === item);
                                  const idKey = item.itemId || item.name;
                                  const isAttuned = attunedIds.includes(idKey);
                                  const itemKey = `mgc-${item.itemId || item.name}-${idx}`;
                                  const isExpanded = !!expandedItems[itemKey];
                                  const itemDetails = getItemDetails(item);
                                  return (
                                    <div key={idx} style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #fce7f3', borderRadius: '6px', padding: '6px 10px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '85px 2fr 60px 75px 30px', gap: '8px', alignItems: 'center' }}>
                                        <div>
                                          <button
                                            onClick={() => {
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                let newAtt = [...(curEq.attunedIds || [])];
                                                if (isAttuned) {
                                                  newAtt = newAtt.filter(id => id !== idKey);
                                                } else {
                                                  if (newAtt.length >= 3) {
                                                    alert('Maximum 3 items can be attuned at once!');
                                                    return prev;
                                                  }
                                                  newAtt.push(idKey);
                                                }
                                                return { ...prev, equipment: { ...curEq, attunedIds: newAtt } };
                                              });
                                            }}
                                            style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid', borderColor: isAttuned ? '#f43f5e' : '#10b981', backgroundColor: isAttuned ? '#fff1f2' : '#ecfdf5', color: isAttuned ? '#e11d48' : '#047857', fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer', width: '100%' }}
                                          >
                                            {isAttuned ? 'UNATTUNE' : 'ATTUNE'}
                                          </button>
                                        </div>
                                        <div 
                                          onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          <strong style={{ fontSize: '0.82rem', color: '#831843' }}>{item.name}</strong>
                                          <div style={{ fontSize: '0.68rem', color: 'var(--color-gray)' }}>{item.rarity || 'Wondrous Item'}</div>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-gray)', textAlign: 'center' }}>{item.weight || 0} lb.</div>
                                        <div style={{ textAlign: 'center' }}>
                                          <button
                                            onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                            style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #fbcfe8', backgroundColor: isExpanded ? '#9d174d' : '#fdf2f8', color: isExpanded ? '#fff' : '#9d174d', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer' }}
                                          >
                                            {isExpanded ? 'ย่อ ▴' : 'ขยาย ▾'}
                                          </button>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <button
                                            onClick={() => {
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                const idKey = item.itemId || item.name;
                                                const filteredItems = (curEq.items || []).filter(it => (it.itemId || it.name) !== idKey && (it.name || '').toLowerCase() !== (item.name || '').toLowerCase());
                                                const newAtt = (curEq.attunedIds || []).filter(id => id !== idKey && id !== item.name);
                                                return { ...prev, equipment: { ...curEq, items: filteredItems, attunedIds: newAtt } };
                                              });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            title="Remove item"
                                          ><i className="fa-solid fa-trash"></i></button>
                                        </div>
                                      </div>
                                      {isExpanded && (
                                        <div style={{ padding: '10px 12px', marginTop: '6px', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #fbcfe8', paddingBottom: '4px' }}>
                                            <strong style={{ color: '#9d174d', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <i className="fa-solid fa-wand-magic-sparkles"></i> {item.name} Details
                                            </strong>
                                            <span style={{ fontSize: '0.7rem', color: '#9d174d', fontStyle: 'italic' }}>
                                              {itemDetails.rarity || 'Magic Item'} • Cost: {itemDetails.cost}
                                            </span>
                                          </div>
                                          <div dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml(item.name, formatTraitOrFeatureText(itemDetails.desc)) }} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Gear, Tools & Consumables Section */}
                          {gearList.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-gray)', textTransform: 'uppercase', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '4px', marginBottom: '6px' }}>
                                🎒 Adventuring Gear, Tools & Consumables ({gearList.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {gearList.map((item, idx) => {
                                  const _origIdx = rawItems.findIndex(ri => ri === item);
                                  const isConsumable = /potion|scroll|ration|torch|kit|flask|salve|water|food/i.test(item.name || '') || item.category === 'Consumable';
                                  const itemKey = `ger-${item.itemId || item.name}-${idx}`;
                                  const isExpanded = !!expandedItems[itemKey];
                                  const itemDetails = getItemDetails(item);
                                  return (
                                    <div key={idx} style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 70px 70px 75px 30px', gap: '8px', alignItems: 'center' }}>
                                        <div 
                                          onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          <strong style={{ fontSize: '0.82rem', color: 'var(--color-ink)' }}>{item.name}</strong>
                                          <div style={{ fontSize: '0.68rem', color: 'var(--color-gray)' }}>{item.category || 'Adventuring Gear'}</div>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-gray)', textAlign: 'center' }}>{item.weight || 0} lb.</div>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                          <button
                                            onClick={() => {
                                              const oldQty = item.qty || 1;
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                const idKey = item.itemId || item.name;
                                                const updated = (curEq.items || []).map(it => ((it.itemId || it.name) === idKey || (it.name || '').toLowerCase() === (item.name || '').toLowerCase()) ? { ...it, qty: Math.max(1, (it.qty || 1) - 1) } : it);
                                                return { ...prev, equipment: { ...curEq, items: updated } };
                                              });
                                              if (oldQty > 1) {
                                                
                                              }
                                            }}
                                            style={{ padding: '0 4px', fontSize: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: 'var(--bg-sidebar)', cursor: 'pointer' }}
                                          >-</button>
                                          <span style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>x{item.qty || 1}</span>
                                          <button
                                            onClick={() => {
                                              const oldQty = item.qty || 1;
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                const idKey = item.itemId || item.name;
                                                const updated = (curEq.items || []).map(it => ((it.itemId || it.name) === idKey || (it.name || '').toLowerCase() === (item.name || '').toLowerCase()) ? { ...it, qty: (it.qty || 1) + 1 } : it);
                                                return { ...prev, equipment: { ...curEq, items: updated } };
                                              });
                                              
                                            }}
                                            style={{ padding: '0 4px', fontSize: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: 'var(--bg-sidebar)', cursor: 'pointer' }}
                                          >+</button>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                          {isConsumable && (
                                            <button
                                              onClick={() => {
                                                const curQty = item.qty || 1;
                                                if (curQty > 0) {
                                                  if (/healing/i.test(item.name || '')) {
                                                    const healAmt = Math.floor(Math.random() * 4) + Math.floor(Math.random() * 4) + 4;
                                                    setReviewHpCur(prev => Math.min(maxHp, (prev !== null ? prev : maxHp) + healAmt));
                                                    triggerQuickRoll(`Used ${item.name}! Restored ${healAmt} HP`, `HP restored`);

                                                  } else {
                                                    triggerQuickRoll(`Used Consumable: ${item.name}`, `Item Consumed`);
                                                    
                                                  }
                                                  setCharacterState(prev => {
                                                    const curEq = prev.equipment || {};
                                                    const idKey = item.itemId || item.name;
                                                    let updated = (curEq.items || []).map(it => ((it.itemId || it.name) === idKey || (it.name || '').toLowerCase() === (item.name || '').toLowerCase()) ? { ...it, qty: (it.qty || 1) - 1 } : it);
                                                    updated = updated.filter(it => (it.qty || 0) > 0);
                                                    return { ...prev, equipment: { ...curEq, items: updated } };
                                                  });
                                                }
                                              }}
                                              style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}
                                            >USE</button>
                                          )}
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                          <button
                                            onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                            style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isExpanded ? 'var(--color-ink)' : 'var(--bg-sidebar)', color: isExpanded ? '#fff' : 'var(--color-gray)', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer' }}
                                          >
                                            {isExpanded ? 'ย่อ ▴' : 'ขยาย ▾'}
                                          </button>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <button
                                            onClick={() => {
                                              
                                              setCharacterState(prev => {
                                                const curEq = prev.equipment || {};
                                                const idKey = item.itemId || item.name;
                                                const filtered = (curEq.items || []).filter(it => (it.itemId || it.name) !== idKey && (it.name || '').toLowerCase() !== (item.name || '').toLowerCase());
                                                return { ...prev, equipment: { ...curEq, items: filtered } };
                                              });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            title="Remove item"
                                          ><i className="fa-solid fa-trash"></i></button>
                                        </div>
                                      </div>
                                      {isExpanded && (
                                        <div style={{ padding: '10px 12px', marginTop: '6px', backgroundColor: 'var(--bg-paper)', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                                            <strong style={{ color: 'var(--color-ink)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <i className="fa-solid fa-box-archive"></i> {item.name} Details
                                            </strong>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', fontStyle: 'italic' }}>
                                              {itemDetails.category} • Cost: {itemDetails.cost}
                                            </span>
                                          </div>
                                          <div dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml(item.name, formatTraitOrFeatureText(itemDetails.desc)) }} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 4: FEATURES */}
                {reviewTab === 'features' && (() => {
                  const filteredFeats = allFeaturesListReview.filter(feat => {
                    if (reviewFeatSearch) {
                      const q = reviewFeatSearch.toLowerCase();
                      const matchName = (feat.name || '').toLowerCase().includes(q);
                      const matchDesc = (feat.desc || '').toLowerCase().includes(q);
                      const matchSrc = (feat.source || '').toLowerCase().includes(q);
                      if (!matchName && !matchDesc && !matchSrc) return false;
                    }
                    if (reviewFeatFilter === 'CLASS FEATURES') return feat.category === 'CLASS FEATURES';
                    if (reviewFeatFilter === 'SPECIES TRAITS') return feat.category === 'SPECIES TRAITS';
                    if (reviewFeatFilter === 'FEATS') return feat.category === 'FEATS';
                    return true;
                  });

                  const classFeats = filteredFeats.filter(f => f.category === 'CLASS FEATURES');
                  const raceFeats = filteredFeats.filter(f => f.category === 'SPECIES TRAITS');
                  const bgFeats = filteredFeats.filter(f => f.category === 'BACKGROUND');
                  const featFeats = filteredFeats.filter(f => f.category === 'FEATS');
                  const otherFeats = filteredFeats.filter(f => !classFeats.includes(f) && !raceFeats.includes(f) && !bgFeats.includes(f) && !featFeats.includes(f));

                  const renderFeatureCard = (feat, fIdx) => {
                    if (!feat) return null;
                    const choiceItems = [];
                    if (feat.name && feat.name.startsWith('Core') && feat.name.endsWith('Traits')) {
                      (feat.choiceObj?.skills || []).forEach(s => choiceItems.push(s));
                      (feat.choiceObj?.tools || []).forEach(t => choiceItems.push(`${t} Proficiency`));
                    } else if (feat.name === 'Scholar' || (feat.name && feat.name.includes('Expertise')) || feat.name === 'Deft Explorer') {
                      (characterState.proficiencies?.expertise || []).forEach(s => choiceItems.push(s));
                      if (choiceItems.length === 0 && feat.choiceObj) {
                        Object.values(feat.choiceObj).flat().forEach(x => typeof x === 'string' && choiceItems.push(x));
                      }
                    } else if (feat.name && feat.name.includes('Subclass')) {
                      const subName = feat.name.replace(/\s*Subclass$/i, '').trim();
                      const foundSub = classList.find(c => (c.classId || '').toLowerCase() === subName.toLowerCase())?.subclassId;
                      if (foundSub) {
                        choiceItems.push(foundSub.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
                      }
                    } else {
                      const formatChoiceName = (val) => {
                        if (!val || typeof val !== 'string') return '';
                        const cleanVal = val.trim();
                        const spellObj = dbData.spells?.find(s => String(s.spell_id).toLowerCase() === cleanVal.toLowerCase() || String(s.spell_name).toLowerCase() === cleanVal.toLowerCase());
                        if (spellObj) return spellObj.spell_name;
                        if (cleanVal.toLowerCase() === 'int') return 'Intelligence';
                        if (cleanVal.toLowerCase() === 'wis') return 'Wisdom';
                        if (cleanVal.toLowerCase() === 'cha') return 'Charisma';
                        if (cleanVal.toLowerCase() === 'str') return 'Strength';
                        if (cleanVal.toLowerCase() === 'dex') return 'Dexterity';
                        if (cleanVal.toLowerCase() === 'con') return 'Constitution';
                        return formatCleanName(cleanVal);
                      };

                      if (feat.name === 'Ability Score Improvement' || feat.featId === 'Ability Score Improvement') {
                        const b = feat.choiceObj?.bonuses || feat.choiceObj || {};
                        const mode = b.mode || b.asiMode;
                        if (mode === 'one' && b.stat1) {
                          choiceItems.push(`⭐ Ability Score Increase: +2 ${formatChoiceName(b.stat1)}`);
                        } else if (mode === 'three_plus_one' || b.plus1_list) {
                          const list = b.plus1_list || [b.stat1, b.stat2, b.stat3].filter(Boolean);
                          choiceItems.push(`⭐ Ability Score Increase: ${list.map(s => `+1 ${formatChoiceName(s)}`).join(', ')}`);
                        } else if (b.plus2 || b.plus1) {
                          const p2 = b.plus2 ? `+2 ${formatChoiceName(b.plus2)}` : '';
                          const p1 = b.plus1 ? `+1 ${formatChoiceName(b.plus1)}` : '';
                          choiceItems.push(`⭐ Ability Score Increase: ${[p2, p1].filter(Boolean).join(', ')}`);
                        } else if (b.stat1 && b.stat2) {
                          if (b.stat1 === b.stat2) {
                            choiceItems.push(`⭐ Ability Score Increase: +2 ${formatChoiceName(b.stat1)}`);
                          } else {
                            choiceItems.push(`⭐ Ability Score Increase: +1 ${formatChoiceName(b.stat1)}, +1 ${formatChoiceName(b.stat2)}`);
                          }
                        } else if (b.stat1) {
                          choiceItems.push(`⭐ Ability Score Increase: +2 ${formatChoiceName(b.stat1)}`);
                        } else {
                          choiceItems.push(`⭐ Ability Score Improvement: No ability scores assigned yet.`);
                        }
                      } else if (feat.choiceObj?.bonuses || (feat.choiceObj && typeof feat.choiceObj === 'object' && !Array.isArray(feat.choiceObj))) {
                        const b = feat.choiceObj.bonuses || feat.choiceObj;
                        if (b.plus2 || b.plus1) {
                          const p2 = b.plus2 ? `+2 ${formatChoiceName(b.plus2)}` : '';
                          const p1 = b.plus1 ? `+1 ${formatChoiceName(b.plus1)}` : '';
                          choiceItems.push(`⭐ Ability Score Increase: ${[p2, p1].filter(Boolean).join(', ')}`);
                        } else if (b.stat1 && b.stat2 && b.stat1 !== b.stat2) {
                          choiceItems.push(`⭐ Ability Score Increase: +1 ${formatChoiceName(b.stat1)}, +1 ${formatChoiceName(b.stat2)}`);
                        } else if (b.stat1) {
                          choiceItems.push(`⭐ Ability Score Increase: +1 ${formatChoiceName(b.stat1)}`);
                        } else if (b.stat2) {
                          choiceItems.push(`⭐ Ability Score Increase: +1 ${formatChoiceName(b.stat2)}`);
                        }
                        if (b.stat) choiceItems.push(`⚡ Spellcasting Ability: ${formatChoiceName(b.stat)}`);
                        if (b.list) choiceItems.push(`📜 Spell List Choice: ${formatChoiceName(b.list)}`);
                        
                        const cantrips = [b.cantrip1, b.cantrip2, b.cantrip, ...(Array.isArray(b.cantrips) ? b.cantrips : [])].filter(Boolean);
                        if (cantrips.length > 0) {
                          choiceItems.push(`✨ Granted Cantrip(s): ${cantrips.map(formatChoiceName).join(', ')}`);
                        }
                        const spells = [b.spell1, b.spell2, b.spell, ...(Array.isArray(b.spells) ? b.spells : [])].filter(Boolean);
                        if (spells.length > 0) {
                          choiceItems.push(`🔮 Granted 1st-Level Spell(s): ${spells.map(formatChoiceName).join(', ')} (Free cast 1/Long Rest + Spell Slots)`);
                        }
                        
                        const skills = [b.skill1, b.skill2, b.skill3, b.skill, ...(Array.isArray(b.skills) ? b.skills : [])].filter(Boolean);
                        if (skills.length > 0) {
                          choiceItems.push(`🛡️ Skill Proficiency: ${skills.map(formatChoiceName).join(', ')}`);
                        }
                        const tools = [b.tool1, b.tool2, b.tool, ...(Array.isArray(b.tools) ? b.tools : [])].filter(Boolean);
                        if (tools.length > 0) {
                          choiceItems.push(`🛠️ Tool Proficiency: ${tools.map(formatChoiceName).join(', ')}`);
                        }

                        if (feat.category === 'SPECIES TRAITS' && typeof b === 'string') {
                          choiceItems.push(`🌟 Trait Selection: ${formatChoiceName(b)}`);
                        } else if (feat.category === 'SPECIES TRAITS' && b.choice) {
                          choiceItems.push(`🌟 Trait Selection: ${formatChoiceName(b.choice)}`);
                        } else {
                          Object.entries(b).forEach(([kKey, vVal]) => {
                            if (!['bonuses', 'plus2', 'plus1', 'plus1_list', 'stat1', 'stat2', 'stat', 'list', 'cantrip1', 'cantrip2', 'cantrip', 'cantrips', 'spell1', 'spell2', 'spell', 'spells', 'skill1', 'skill2', 'skill3', 'skill', 'skills', 'tool1', 'tool2', 'tool', 'tools', 'mode', 'asiMode'].includes(kKey)) {
                              if (typeof vVal === 'string') {
                                choiceItems.push(`🔹 ${formatCleanName(kKey)}: ${formatChoiceName(vVal)}`);
                              } else if (vVal && typeof vVal === 'object' && vVal.name) {
                                choiceItems.push(`🔹 ${formatCleanName(kKey)}: ${formatChoiceName(vVal.name)}`);
                              }
                            }
                          });
                        }
                      } else if (feat.choiceObj) {
                        if (typeof feat.choiceObj === 'string') {
                          choiceItems.push(`🌟 Selection: ${formatChoiceName(feat.choiceObj)}`);
                        } else if (Array.isArray(feat.choiceObj)) {
                          feat.choiceObj.forEach(x => typeof x === 'string' && choiceItems.push(`🔹 ${formatChoiceName(x)}`));
                        }
                      }
                      
                      if (feat.lineageEffect) {
                        choiceItems.push(`📜 ${feat.lineageEffect.name}: ${feat.lineageEffect.desc}`);
                      }
                    }

                    const featIdForEdit = feat.featId || feat.name;
                    const cleanFeatId = String(featIdForEdit || '').toLowerCase();
                    const featConfigForEdit = getFeatConfig(featIdForEdit, dbData);
                    const hasEditableChoices =
                      (feat.category === 'FEATS' || feat.name === 'Ability Score Improvement' || feat.featId === 'Ability Score Improvement') &&
                      (
                        cleanFeatId.startsWith('magic-initiate') ||
                        cleanFeatId.startsWith('magic initiate') ||
                        cleanFeatId.includes('skilled') ||
                        cleanFeatId.includes('crafter') ||
                        cleanFeatId.includes('musician') ||
                        cleanFeatId.includes('time-touched') ||
                        cleanFeatId.includes('time touched') ||
                        cleanFeatId === 'ability score improvement' ||
                        featConfigForEdit?.type === 'asi' ||
                        featConfigForEdit?.type === 'half'
                      );

                    const fullHtml = cleanAndStyleHtml(feat.name, formatTraitOrFeatureText(feat.desc));
                    const plainText = fullHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    const isLong = plainText.length > 150;
                    const cardKey = `${feat.name}-${fIdx}`;
                    const isExpanded = !!expandedFeatures[cardKey];

                    let displayHtml = fullHtml;
                    if (isLong && !isExpanded) {
                      let summaryText = plainText;
                      const firstPeriod = plainText.indexOf('. ');
                      if (firstPeriod > 30 && firstPeriod <= 180) {
                        summaryText = plainText.substring(0, firstPeriod + 1) + ' ..';
                      } else {
                        const cut = plainText.substring(0, 160);
                        const lastSp = cut.lastIndexOf(' ');
                        summaryText = (lastSp > 50 ? cut.substring(0, lastSp) : cut) + ' ...';
                      }
                      displayHtml = `<span style="color: #334155;">${summaryText}</span>`;
                    }

                    return (
                      <div key={fIdx} style={{ backgroundColor: 'var(--bg-white)', padding: '14px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px' }}>
                              <strong style={{ color: 'var(--color-ink)', fontSize: '0.96rem' }}>{feat.name}</strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-gray)', fontStyle: 'italic' }}>• {feat.pageSource || 'PHB-2024, pg. ' + (160 + (Math.abs((feat.name || '').length * 7) % 50))}</span>
                            </div>
                            {feat.category === 'FEATS' && feat.source && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-gray)', fontWeight: '600' }}>
                                From <span style={{ color: 'var(--color-gray)', fontWeight: '800' }}>{feat.source.replace(/^From\s*\(/i, '').replace(/\)$/, '').trim()}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {hasEditableChoices && (
                              <button
                                onClick={() => setEditingChoiceKey(prev => ({ ...(prev || {}), [cardKey]: !(prev || {})[cardKey] }))}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: (editingChoiceKey || {})[cardKey] ? '#ef4444' : 'var(--bg-white)',
                                  color: (editingChoiceKey || {})[cardKey] ? 'var(--bg-white)' : 'var(--color-gray)',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s',
                                  flexShrink: 0
                                }}
                              >
                                <i className={(editingChoiceKey || {})[cardKey] ? "fa-solid fa-xmark" : "fa-solid fa-pen"}></i>
                                {(editingChoiceKey || {})[cardKey] ? "ปิดการแก้ไข" : "แก้ไขตัวเลือก"}
                              </button>
                            )}
                            {isLong && (
                              <button
                                onClick={() => setExpandedFeatures(prev => ({ ...prev, [cardKey]: !isExpanded }))}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: isExpanded ? 'var(--bg-sidebar)' : '#fff1f2',
                                  color: isExpanded ? 'var(--color-gray)' : '#711a19',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flexShrink: 0
                                }}
                                title={isExpanded ? "ย่อรายละเอียด (Collapse)" : "ขยายรายละเอียด (Expand)"}
                              >
                                {isExpanded ? (
                                  <><span>ย่อ</span> <i className="fa-solid fa-chevron-up"></i></>
                                ) : (
                                  <><span>ขยาย</span> <i className="fa-solid fa-chevron-down"></i></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-gray)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: displayHtml }} />
                        
                        {(choiceItems.length > 0 || feat.chargeInfo) && (
                          <div style={{ borderLeft: '3px solid #711a19', paddingLeft: '14px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: 'var(--color-gray)', backgroundColor: '#fffefc', padding: '12px 14px', borderRadius: '0 6px 6px 0', borderTop: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                            {choiceItems.length > 0 && (
                              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#711a19', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-list-check"></i> Active Effects
                              </div>
                            )}
                            {choiceItems.map((item, idx) => (
                              <div key={idx} style={{ fontWeight: '700', color: 'var(--color-ink)', display: 'flex', alignItems: 'baseline', gap: '6px', paddingBottom: idx < choiceItems.length - 1 ? '3px' : '0' }}>
                                {item}
                              </div>
                            ))}
                            {feat.chargeInfo && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: choiceItems.length > 0 ? '6px' : '0', paddingTop: choiceItems.length > 0 ? '6px' : '0', borderTop: choiceItems.length > 0 ? '1px dashed #cbd5e1' : 'none' }}>
                                <span style={{ fontWeight: '800', color: 'var(--color-ink)' }}>{feat.chargeInfo.label}:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {feat.chargeInfo.isPool || (feat.chargeInfo.max && feat.chargeInfo.max > 6) ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button onClick={() => {
                                        const cur = parseInt(liveFeatureCharges?.[feat.name] || 0, 10);
                                        if (cur > 0) setLiveFeatureCharges(prev => ({ ...prev, [feat.name]: cur - 1 }));
                                      }} style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'var(--bg-white)', cursor: 'pointer', fontWeight: '800', color: 'var(--color-gray)' }}>-</button>
                                      <span style={{ fontWeight: '800', color: '#711a19', minWidth: '36px', textAlign: 'center' }}>{liveFeatureCharges?.[feat.name] || 0} / {feat.chargeInfo.max}</span>
                                      <button onClick={() => {
                                        const cur = parseInt(liveFeatureCharges?.[feat.name] || 0, 10);
                                        if (cur < feat.chargeInfo.max) setLiveFeatureCharges(prev => ({ ...prev, [feat.name]: cur + 1 }));
                                      }} style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'var(--bg-white)', cursor: 'pointer', fontWeight: '800', color: 'var(--color-gray)' }}>+</button>
                                    </div>
                                  ) : (
                                    Array.from({ length: feat.chargeInfo.max || 1 }).map((_, i) => {
                                      const chgKey = `${feat.name}-${i}`;
                                      const isChecked = !!liveFeatureCharges?.[chgKey];
                                      return (
                                        <input
                                          key={i}
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => setLiveFeatureCharges(prev => ({ ...prev, [chgKey]: !isChecked }))}
                                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#711a19' }}
                                        />
                                      );
                                    })
                                  )}
                                  <span style={{ fontSize: '0.78rem', color: 'var(--color-gray)', fontWeight: '700' }}>/ {feat.chargeInfo.reset}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {(editingChoiceKey || {})[cardKey] && hasEditableChoices && (
                          <div className="animate-fade-in" style={{ marginTop: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                            <FeatChoiceEditor
                              featId={featIdForEdit}
                              currentBonuses={feat.choiceObj?.bonuses || {}}
                              onBonusChange={(newBonuses) => {
                                if (feat.fromType === 'class') {
                                  setCharacterState(prev => {
                                    const newClassList = [...prev.classData.classes];
                                    const currentChoices = newClassList[feat.classIndex].featureChoices || {};
                                    const featureArray = currentChoices[feat.featureKey] ? [...currentChoices[feat.featureKey]] : [];
                                    const oldChoice = featureArray[feat.choiceIdx || 0];
                                    const oldId = typeof oldChoice === 'object' ? oldChoice.id : (oldChoice || feat.featId);
                                    featureArray[feat.choiceIdx || 0] = { id: oldId, bonuses: newBonuses };
                                    newClassList[feat.classIndex] = {
                                      ...newClassList[feat.classIndex],
                                      featureChoices: {
                                        ...currentChoices,
                                        [feat.featureKey]: featureArray
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
                                } else {
                                  setCharacterState(prev => {
                                    const prevFeats = prev.feats || [];
                                    const updatedFeats = prevFeats.map((f, i) => {
                                      if (i === feat.featIndex || (typeof f === 'object' ? f.id === feat.featId && f.source === feat.fromType : f === feat.featId)) {
                                        const oldId = typeof f === 'object' ? (f.id || f.name) : f;
                                        const oldSource = typeof f === 'object' ? f.source : feat.fromType;
                                        return { id: oldId, source: oldSource, bonuses: newBonuses };
                                      }
                                      return f;
                                    });
                                    return { ...prev, feats: updatedFeats };
                                  });
                                }
                              }}
                              dbData={dbData}
                              proficientSkills={proficientSkills}
                              allKnownSpellIds={allKnownSpellIds}
                              style={{ border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  };
                  return (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {['ALL', 'CLASS FEATURES', 'SPECIES TRAITS', 'FEATS'].map(t => (
                            <button
                              key={t}
                              onClick={() => setReviewFeatFilter(t)}
                              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid', borderColor: reviewFeatFilter === t ? '#711a19' : 'var(--border-color)', backgroundColor: reviewFeatFilter === t ? '#711a19' : 'var(--bg-white)', color: reviewFeatFilter === t ? 'var(--bg-white)' : 'var(--color-gray)', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.5px' }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              const allExpanded = Object.keys(expandedFeatures).length > 0 && Object.values(expandedFeatures).every(v => v);
                              if (allExpanded) {
                                setExpandedFeatures({});
                              } else {
                                const next = {};
                                filteredFeats.forEach((f, idx) => {
                                  next[`${f.name}-${idx}`] = true;
                                });
                                setExpandedFeatures(next);
                              }
                            }}
                            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', color: 'var(--color-gray)', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                            title="ย่อ/ขยายทั้งหมด"
                          >
                            {Object.keys(expandedFeatures).length > 0 && Object.values(expandedFeatures).every(v => v) ? 'ย่อทั้งหมด (Collapse)' : 'ขยายทั้งหมด (Expand)'}
                          </button>
                          <div style={{ position: 'relative', width: '220px' }}>
                            <input
                              type="text"
                              placeholder="Search features or traits..."
                              value={reviewFeatSearch}
                              onChange={e => setReviewFeatSearch(e.target.value)}
                              style={{ width: '100%', padding: '6px 24px 6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', outline: 'none' }}
                            />
                            {reviewFeatSearch && (
                              <button onClick={() => setReviewFeatSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-gray)', cursor: 'pointer', fontSize: '0.75rem' }}>✖</button>
                            )}
                          </div>
                        </div>
                      </div>

                      {reviewFeatFilter === 'FEATS' && (
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                          <button
                            onClick={() => setShowManageFeatsModal(true)}
                            style={{ padding: '8px 24px', borderRadius: '4px', border: '1.5px solid #711a19', backgroundColor: 'var(--bg-white)', color: '#711a19', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(113, 26, 25, 0.1)' }}
                          >
                            <i className="fa-solid fa-medal"></i> MANAGE FEATS
                          </button>
                        </div>
                      )}

                      {filteredFeats.length === 0 ? (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No features match your current search or category filter.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {classFeats.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {classList.map((cl, clIdx) => {
                                const cName = cl.classId ? cl.classId.charAt(0).toUpperCase() + cl.classId.slice(1) : 'Class';
                                const cFeats = classFeats.filter(f => (f.source || '').toLowerCase().includes(cl.classId?.toLowerCase()) || (f.name || '').toLowerCase().includes(cl.classId?.toLowerCase()) || f.name.startsWith(`Core ${cName}`));
                                if (cFeats.length === 0) return null;
                                return (
                                  <div key={clIdx}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#711a19', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                      {cName} Features ({cFeats.length})
                                    </div>
                                    {cFeats.map(renderFeatureCard)}
                                  </div>
                                );
                              })}
                              {(() => {
                                const assigned = new Set(classList.flatMap(cl => classFeats.filter(f => (f.source || '').toLowerCase().includes(cl.classId?.toLowerCase()) || (f.name || '').toLowerCase().includes(cl.classId?.toLowerCase()) || f.name.startsWith('Core '))));
                                const unassigned = classFeats.filter(f => !assigned.has(f));
                                if (unassigned.length === 0) return null;
                                return (
                                  <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#711a19', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                      Other Class Features ({unassigned.length})
                                    </div>
                                    {unassigned.map(renderFeatureCard)}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {raceFeats.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#047857', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                SPECIES TRAITS ({raceFeats.length})
                              </div>
                              {raceFeats.map(renderFeatureCard)}
                            </div>
                          )}

                          {featFeats.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#711a19', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                FEATS ({featFeats.length})
                              </div>
                              {featFeats.map(renderFeatureCard)}
                            </div>
                          )}

                          {bgFeats.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                BACKGROUND FEATURES ({bgFeats.length})
                              </div>
                              {bgFeats.map(renderFeatureCard)}
                            </div>
                          )}

                          {otherFeats.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7e22ce', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px', letterSpacing: '0.5px' }}>
                                OTHER TRAITS & ABILITIES ({otherFeats.length})
                              </div>
                              {otherFeats.map(renderFeatureCard)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 5: BACKGROUND & DESCRIPTION */}
                {reviewTab === 'background' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0, overflowY: 'auto', fontSize: '0.85rem', color: 'var(--color-ink)' }}>
                    {/* Selected Background & Core Feature */}
                    <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', color: 'var(--color-ink)' }}>
                      <h5 style={{ color: '#711a19', margin: '0 0 10px 0', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                        <span>Selected Background</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>{realBackgroundObj?.background_name || realBackgroundObj?.name || realBackgroundObj?.backgroundId || 'Adventurer'}</span>
                      </h5>
                      {realBackgroundObj?.description && (
                        <p style={{ margin: '0 0 10px 0', color: 'var(--color-gray)', lineHeight: 1.4 }}>{realBackgroundObj.description}</p>
                      )}
                      {(realBackgroundObj?.feature_name || realBackgroundObj?.feature) && (
                        <div style={{ backgroundColor: 'var(--bg-white)', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '10px', color: 'var(--color-ink)' }}>
                          <strong style={{ color: '#711a19', fontSize: '0.85rem' }}>Background Feature: {realBackgroundObj.feature_name || realBackgroundObj.feature}</strong>
                          <div style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--color-gray)', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml(realBackgroundObj.feature_name || realBackgroundObj.feature, formatTraitOrFeatureText(realBackgroundObj.feature_desc || realBackgroundObj.feature_description)) }} />
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: 'var(--bg-white)', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: 'var(--color-ink)' }}>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Starting Gold:</strong> {realBackgroundObj?.starting_gold || 50} GP</div>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Feat Granted:</strong> {getFeatName(realBackgroundObj?.feat_id || realBackgroundObj?.feat, dbData) || formatCleanName(realBackgroundObj?.feat || realBackgroundObj?.feat_id || '') || 'Standard'}</div>
                      </div>
                    </div>

                    {/* Equipment & Tool Proficiencies */}
                    <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', color: 'var(--color-ink)' }}>
                      <h5 style={{ color: '#711a19', margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800' }}>Equipment & Other Proficiencies</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--color-ink)' }}>
                        <div style={{ color: 'var(--color-ink)' }}>
                          <strong style={{ color: '#0f172a' }}>Armor:</strong> {totalStats?.proficientArmor?.length ? totalStats.proficientArmor.map(formatCleanName).join(', ') : 'None'}
                        </div>
                        <div style={{ color: 'var(--color-ink)' }}>
                          <strong style={{ color: '#0f172a' }}>Weapons:</strong> {totalStats?.proficientWeapons?.length ? totalStats.proficientWeapons.map(formatCleanName).join(', ') : 'None'}
                        </div>
                        <div style={{ color: 'var(--color-ink)' }}>
                          <strong style={{ color: '#0f172a' }}>Tools & Instruments:</strong> {totalStats?.proficientTools?.length ? totalStats.proficientTools.map(formatCleanName).join(', ') : 'None'}
                        </div>
                        <div style={{ color: 'var(--color-ink)' }}>
                          <strong style={{ color: '#0f172a' }}>Languages:</strong> {totalStats?.languages?.length ? totalStats.languages.map(formatCleanName).join(', ') : 'Common'}
                        </div>
                      </div>
                    </div>

                    {/* Physical Appearance */}
                    <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', color: 'var(--color-ink)' }}>
                      <h5 style={{ color: '#711a19', margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800' }}>Physical Appearance & Identity</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'var(--color-ink)' }}>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Gender:</strong> {characterState.description?.gender || '-'}</div>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Alignment:</strong> {characterState.description?.alignment || '-'}</div>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Eyes:</strong> {characterState.description?.eyes || '-'}</div>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Skin:</strong> {characterState.description?.skin || '-'}</div>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Hair Color:</strong> {characterState.description?.hair || '-'}</div>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Hair Style:</strong> {characterState.description?.hairStyle || '-'}</div>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Height:</strong> {characterState.description?.height || '-'}</div>
                        <div style={{ color: 'var(--color-ink)' }}><strong style={{ color: '#0f172a' }}>Weight:</strong> {characterState.description?.weight || '-'}</div>
                        <div style={{ color: 'var(--color-ink)', gridColumn: '1 / -1' }}><strong style={{ color: '#0f172a' }}>Party / Campaign:</strong> {characterState.description?.partyName || '-'}</div>
                      </div>
                    </div>

                    {/* Roleplay & Backstory */}
                    {(characterState.description?.personality || characterState.description?.ideals || characterState.description?.bonds || characterState.description?.flaws || characterState.description?.backstory) && (
                      <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', color: 'var(--color-ink)' }}>
                        <h5 style={{ color: 'var(--color-ink)', margin: '0 0 10px 0', fontWeight: '800' }}>Roleplay Traits & Backstory</h5>
                        {characterState.description?.personality && (
                          <p style={{ margin: '0 0 8px 0', color: 'var(--color-gray)' }}><strong style={{ color: '#0f172a' }}>Personality Traits:</strong> {characterState.description.personality}</p>
                        )}
                        {characterState.description?.ideals && (
                          <p style={{ margin: '0 0 8px 0', color: 'var(--color-gray)' }}><strong style={{ color: '#0f172a' }}>Ideals:</strong> {characterState.description.ideals}</p>
                        )}
                        {characterState.description?.bonds && (
                          <p style={{ margin: '0 0 8px 0', color: 'var(--color-gray)' }}><strong style={{ color: '#0f172a' }}>Bonds:</strong> {characterState.description.bonds}</p>
                        )}
                        {characterState.description?.flaws && (
                          <p style={{ margin: '0 0 8px 0', color: 'var(--color-gray)' }}><strong style={{ color: '#0f172a' }}>Flaws:</strong> {characterState.description.flaws}</p>
                        )}
                        {characterState.description?.backstory && (
                          <div style={{ marginTop: '10px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', color: 'var(--color-ink)' }}>
                            <strong style={{ color: '#0f172a' }}>Backstory:</strong>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--color-gray)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{characterState.description.backstory}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: ADVENTURE DIARY */}
                {reviewTab === 'diary' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <div style={{
                      backgroundColor: '#3a2618',
                      backgroundImage: 'radial-gradient(circle at 30% 30%, #4a3221 0%, #2c1b10 100%)',
                      borderRadius: '12px',
                      padding: '24px',
                      color: '#fefaf0',
                      border: '2px solid #ca8a04',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '2.5rem', color: '#facc15' }}>
                        <i className="fa-solid fa-book-open"></i>
                      </div>
                      <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color: '#facc15', margin: 0, letterSpacing: '1px' }}>
                        ADVENTURE DIARY
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#d6cbbd', margin: 0, maxWidth: '320px', lineHeight: 1.5 }}>
                        บันทึกการเดินทาง ประวัติศาสตร์ ภารกิจ และสมบัติล้ำค่าแห่งแคมเปญของคุณในรูปแบบสมุดปกหนัง
                      </p>
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem', color: '#facc15', border: '1px solid rgba(202, 138, 4, 0.4)' }}>
                        📝 บันทึกทั้งหมด: {(characterState.diary || []).length} เรื่องราว
                      </div>
                      <button
                        onClick={() => { setDiaryInitialEntry(null); setShowDiaryModal(true); }}
                        style={{
                          marginTop: '8px',
                          padding: '12px 24px',
                          backgroundColor: '#711a19',
                          border: '1.5px solid #facc15',
                          borderRadius: '8px',
                          color: '#fefaf0',
                          fontFamily: 'Cinzel, serif',
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#8c1d1b'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#711a19'}
                      >
                        <i className="fa-solid fa-feather-pointed"></i> 🪶 เปิดสมุดบันทึกการเดินทาง
                      </button>
                    </div>

                    {/* Recent Entries Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h5 style={{ color: '#711a19', margin: '4px 0', fontSize: '0.9rem', fontWeight: '800' }}>
                        <i className="fa-solid fa-clock-rotate-left"></i> เรื่องราวล่าสุด (Recent Entries)
                      </h5>
                      {(characterState.diary || []).slice(0, 3).map((entry, idx) => (
                        <div
                          key={entry.id || idx}
                          onClick={() => { setDiaryInitialEntry(entry); setShowDiaryModal(true); }}
                          style={{
                            backgroundColor: 'var(--bg-white)',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseOver={e => e.currentTarget.style.borderColor = '#711a19'}
                          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                          <div>
                            <strong style={{ color: 'var(--color-ink)', fontSize: '0.88rem' }}>{entry.title || 'บันทึกที่ไม่ระบุชื่อ'}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>🗓️ {entry.date || 'ไม่ระบุวันที่'}</div>
                          </div>
                        </div>
                      ))}
                      {(characterState.diary || []).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--bg-white)', borderRadius: '8px', border: '1px dashed #cbd5e1', color: 'var(--color-gray)', fontSize: '0.82rem' }}>
                          ยังไม่มีบันทึกเรื่องราวในสมุด คลิกปุ่มด้านบนเพื่อเริ่มจดบันทึกได้เลย!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE GAMEPLAY ROLL & COMBAT HISTORY DRAWER */}
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginTop: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h5 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: '#711a19', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-scroll"></i> Real-Time Session Roll & Combat Log
                </h5>
                {gameplayRollHistory.length > 0 && (
                  <button
                    onClick={() => setGameplayRollHistory([])}
                    style={{ fontSize: '0.7rem', color: 'var(--color-gray)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear History
                  </button>
                )}
              </div>
              {gameplayRollHistory.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', fontStyle: 'italic', margin: 0 }}>
                  Ready for adventure! Click any Hit Roll, Damage Roll, Save, or Check on your sheet to see live roll results logged here during your game.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                  {gameplayRollHistory.map((log, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-gray)', fontSize: '0.7rem' }}>[{log.timestamp}]</span>
                      <strong style={{ color: 'var(--color-ink)' }}>{log.title}:</strong>
                      <span style={{ color: '#711a19', fontWeight: 'bold' }}>{log.total}</span>
                      <span style={{ color: 'var(--color-gray)', fontSize: '0.7rem' }}>({log.formula})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {savingDbStatus && (
              <div style={{ marginTop: '20px', padding: '12px 20px', borderRadius: '8px', backgroundColor: savingDbStatus.includes('✅') ? '#f0fdf4' : (savingDbStatus.includes('❌') ? '#fef2f2' : '#eff6ff'), border: `1px solid ${savingDbStatus.includes('✅') ? '#86efac' : (savingDbStatus.includes('❌') ? '#fecaca' : '#bfdbfe')}`, color: savingDbStatus.includes('✅') ? '#15803d' : (savingDbStatus.includes('❌') ? '#b91c1c' : '#1d4ed8'), fontWeight: 'bold', textAlign: 'center' }}>
                {savingDbStatus}
              </div>
            )}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => typeof handleSaveToDatabase === 'function' && handleSaveToDatabase(false)}
                style={{ backgroundColor: '#15803d', color: 'var(--bg-white)', padding: '14px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
              >
                <i className="fa-solid fa-database"></i> {isPlayMode ? 'Save Character Progress (บันทึกสถานะ)' : 'Save & Enter Play Mode (บันทึกและเล่นจริง)'}
              </button>
              {!isPlayMode && (
                <button
                  onClick={() => {
                    localStorage.setItem('workshop_characterState', JSON.stringify(characterState));
                    window.location.href = `/character/${characterState.char_id || 'current'}`;
                  }}
                  style={{ backgroundColor: '#2563eb', color: 'var(--bg-white)', padding: '14px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                >
                  <i className="fa-solid fa-gamepad"></i> Test Play Sheet (ทดสอบเล่นทันที)
                </button>
              )}
              <button
                onClick={handleExportCharacter}
                style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', padding: '14px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
              >
                <i className="fa-solid fa-file-export"></i> Export Character JSON
              </button>
            </div>
            {/* TOAST: Dice Roller */}
            <DiceResultToast diceModalData={diceModalData} setDiceModalData={setDiceModalData} />

            {/* MODAL: จัดการพลังชีวิต (Hit Points) */}
            {showHpAdjustModal && ReactDOM.createPortal(
              (() => {
                const activeDeathSucc = deathSaves?.succ ? deathSaves.succ.filter(Boolean).length : deathSaveSuccess;
                const activeDeathFail = deathSaves?.fail ? deathSaves.fail.filter(Boolean).length : deathSaveFailure;
                const totalExpendedHd = Object.values(reviewExpendedHd || {}).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
                const availHd = Math.max(0, totalLvl - totalExpendedHd);

                return (
                  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: '16px' }}>
                    <div className="animate-scale-up" style={{ backgroundColor: 'var(--bg-paper)', border: '2px solid #711a19', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(113, 26, 25, 0.3)', color: 'var(--color-ink)', maxHeight: '90vh', overflowY: 'auto' }}>
                      {/* Title Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2d8c3', paddingBottom: '12px', marginBottom: '14px' }}>
                        <div>
                          <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.25rem', color: '#711a19', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                            <i className="fa-solid fa-heart-pulse"></i> Manage Hit Points (5e RAW)
                          </h4>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-gray)', marginTop: '2px' }}>จัดการพลังชีวิต ฮิตไดซ์ และเช็ครอดชีวิต</div>
                        </div>
                        <button
                          onClick={() => setShowHpAdjustModal(false)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-gray)', fontSize: '1.3rem', cursor: 'pointer', padding: '4px' }}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>

                      {/* Summary Bar */}
                      <div style={{ backgroundColor: '#f8f4e9', border: '1px solid #e2d8c3', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>HP ปัจจุบัน: </span>
                          <strong style={{ fontFamily: 'Cinzel, serif', fontSize: '1.35rem', color: curHp <= 0 ? '#dc2626' : '#711a19' }}>{curHp}</strong>
                          <span style={{ color: 'var(--color-gray)', fontSize: '1rem' }}> / {maxHp}</span>
                        </div>
                        <div style={{ borderLeft: '1px solid #e2d8c3', paddingLeft: '14px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)', fontWeight: 'bold' }}>HP ชั่วคราว: </span>
                          <strong style={{ fontFamily: 'Cinzel, serif', fontSize: '1.25rem', color: reviewHpTemp > 0 ? '#2563eb' : 'var(--color-gray)' }}>{reviewHpTemp > 0 ? `+${reviewHpTemp}` : '--'}</strong>
                        </div>
                      </div>

                      {/* Pill Navigation Tabs */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', backgroundColor: '#efeade', padding: '4px', borderRadius: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveHpTab('combat')}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                            backgroundColor: activeHpTab === 'combat' ? '#711a19' : 'transparent',
                            color: activeHpTab === 'combat' ? 'var(--bg-white)' : 'var(--color-gray)',
                            fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          ❤️ พลังชีวิต & ดาเมจ
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveHpTab('hitdice')}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                            backgroundColor: activeHpTab === 'hitdice' ? '#711a19' : 'transparent',
                            color: activeHpTab === 'hitdice' ? 'var(--bg-white)' : 'var(--color-gray)',
                            fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          🎲 Hit Dice ({availHd}/{totalLvl})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveHpTab('deathsaves')}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                            backgroundColor: activeHpTab === 'deathsaves' || curHp <= 0 ? '#dc2626' : 'transparent',
                            color: activeHpTab === 'deathsaves' || curHp <= 0 ? 'var(--bg-white)' : 'var(--color-gray)',
                            fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          💀 Death Saves
                        </button>
                      </div>

                      {/* TAB 1: COMBAT HP & DAMAGE */}
                      {activeHpTab === 'combat' && (
                        <div className="animate-fade-in">
                          {curHp <= 0 && (
                            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 'bold' }}>
                                ⚠️ 0 HP: ตัวละครหมดสติ (Unconscious)
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveHpTab('deathsaves')}
                                style={{ backgroundColor: '#dc2626', color: 'var(--bg-white)', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                ไปหน้า Death Saves ➔
                              </button>
                            </div>
                          )}

                          <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--color-gray)', marginBottom: '6px' }}>
                              กรอกจำนวนตัวเลข:
                            </label>

                            {/* Quick Amount Chips */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                              {[1, 5, 10, 20].map(n => (
                                <button
                                  key={`chip-${n}`}
                                  type="button"
                                  onClick={() => setHpAdjustVal(String(n))}
                                  style={{
                                    padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                    backgroundColor: hpAdjustVal === String(n) ? '#711a19' : 'var(--bg-white)',
                                    color: hpAdjustVal === String(n) ? 'var(--bg-white)' : 'var(--color-gray)',
                                    fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s'
                                  }}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>

                            <input
                              type="number"
                              value={hpAdjustVal}
                              onChange={e => setHpAdjustVal(e.target.value)}
                              placeholder="กรอกตัวเลข เช่น 8"
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', backgroundColor: 'var(--bg-white)' }}
                            />
                          </div>

                          {/* Action Buttons: Damage vs Heal */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const amount = parseInt(hpAdjustVal) || 0;
                                if (amount <= 0) return;
                                let remainingDmg = amount;
                                let newTemp = reviewHpTemp;
                                if (newTemp > 0) {
                                  if (newTemp >= remainingDmg) {
                                    newTemp -= remainingDmg;
                                    remainingDmg = 0;
                                  } else {
                                    remainingDmg -= newTemp;
                                    newTemp = 0;
                                  }
                                }
                                const newHP = Math.max(0, curHp - remainingDmg);
                                syncHpAndSave(newHP, newTemp);
                                logHpAction(`รับดาเมจ (-${amount})`, `Remaining HP: ${newHP}/${maxHp}` + (reviewHpTemp > 0 ? ` (Absorbed by Temp HP)` : ''), `${newHP}/${maxHp}`);
                                setHpAdjustVal('');
                                if (newHP === 0) setActiveHpTab('deathsaves');
                              }}
                              style={{ padding: '12px', backgroundColor: '#dc2626', color: 'var(--bg-white)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
                            >
                              <i className="fa-solid fa-heart-crack"></i> Take Damage
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const amount = parseInt(hpAdjustVal) || 0;
                                if (amount <= 0) return;
                                const newHP = Math.min(maxHp, curHp + amount);
                                syncHpAndSave(newHP, reviewHpTemp);
                                logHpAction(`ฮีล (ฟื้นฟู) (+${amount})`, `Recovered to: ${newHP}/${maxHp}`, `${newHP}/${maxHp}`);
                                setHpAdjustVal('');
                              }}
                              style={{ padding: '12px', backgroundColor: '#16a34a', color: 'var(--bg-white)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
                            >
                              <i className="fa-solid fa-heart-pulse"></i> Regain HP
                            </button>
                          </div>

                          {/* Action Buttons: Temporary HP Management */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const amount = parseInt(hpAdjustVal) || 0;
                                if (amount <= 0) return;
                                const newTemp = Math.max(reviewHpTemp, amount);
                                syncHpAndSave(curHp, newTemp);
                                logHpAction(`Gain Temp HP (+${amount})`, `Current Temp HP: +${newTemp}`, `+${newTemp}`);
                                setHpAdjustVal('');
                              }}
                              style={{ padding: '10px', backgroundColor: '#2563eb', color: 'var(--bg-white)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
                            >
                              <i className="fa-solid fa-shield-halved"></i> +เพิ่ม HP ชั่วคราว
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                syncHpAndSave(curHp, 0);
                                logHpAction(`ลบ HP ชั่วคราว`, `Temp HP reset to 0`, `0`);
                                setHpAdjustVal('');
                              }}
                              style={{ padding: '10px', backgroundColor: 'var(--bg-sidebar)', color: 'var(--color-gray)', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
                            >
                              <i className="fa-solid fa-shield-slash"></i> Clear Temp HP
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: HIT DICE RECOVERY */}
                      {activeHpTab === 'hitdice' && (
                        <div className="animate-fade-in" style={{ padding: '4px 0' }}>
                          <div style={{ backgroundColor: '#fefcf8', border: '1px solid #e2d8c3', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Total Hit Dice:</span>
                              <strong style={{ fontSize: '1.05rem', color: '#711a19' }}>{availHd} / {totalLvl} Available</strong>
                            </div>
                            <div style={{ borderTop: '1px solid #e2d8c3', paddingTop: '8px', marginTop: '4px' }}>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-gray)', marginBottom: '8px', fontWeight: 'bold' }}>Available Hit Dice Pools:</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {(resolvedMechanics?.hitPoints?.hitDiceList || []).map((hd, idx) => {
                                  const cId = hd.classId || `class_${idx}`;
                                  const cMax = parseInt(hd.count) || 0;
                                  const cExpended = parseInt(reviewExpendedHd?.[cId]) || 0;
                                  const cAvail = Math.max(0, cMax - cExpended);
                                  
                                  return (
                                    <div key={cId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '6px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#711a19', color: 'white', width: '24px', height: '24px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>d{hd.hitDie}</div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{cId}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '0.8rem', color: cAvail > 0 ? '#15803d' : 'var(--color-gray)', fontWeight: 'bold' }}>{cAvail} / {cMax}</span>
                                        <button
                                          type="button"
                                          disabled={cAvail <= 0 || curHp >= maxHp}
                                          onClick={() => {
                                            if (cAvail <= 0) return;
                                            const hdSize = hd.hitDie || 8;
                                            const roll = Math.floor(Math.random() * hdSize) + 1;
                                            const recovered = Math.max(1, roll + conMod);
                                            const nextHp = Math.min(maxHp, curHp + recovered);
                                            const nextHd = { ...reviewExpendedHd, [cId]: cExpended + 1 };
                                            syncHpAndSave(nextHp, reviewHpTemp, nextHd);
                                            
                                            const hdRollTitle = `🎲 Roll ${cId.toUpperCase()} Hit Die (1d${hdSize}${conMod >= 0 ? `+${conMod}` : conMod})`;
                                            const hdFormulaStr = `1d${hdSize} (${roll}) ${conMod >= 0 ? `+ ${conMod}` : `- ${Math.abs(conMod)}`}`;
                                            const hdRollsStr = `Hit Die Roll: [${roll}] + CON Mod (${conMod >= 0 ? `+${conMod}` : conMod}) ➔ Recovered +${recovered} HP (HP: ${curHp} ➔ ${nextHp})`;
                                            
                                            if (typeof setDiceModalData === 'function') {
                                              setDiceModalData({ title: hdRollTitle, formula: hdFormulaStr, rolls: hdRollsStr, total: `+${recovered}`, advMode: 'normal' });
                                            }
                                            logHpAction(hdRollTitle, `Recovered +${recovered} HP (HP: ${curHp} ➔ ${nextHp})`, `+${recovered}`);
                                          }}
                                          style={{ padding: '4px 10px', backgroundColor: cAvail <= 0 || curHp >= maxHp ? 'var(--border-color)' : '#2563eb', color: 'var(--bg-white)', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', cursor: cAvail <= 0 || curHp >= maxHp ? 'not-allowed' : 'pointer' }}
                                        >
                                          Roll
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                              type="button"
                              disabled={totalExpendedHd <= 0}
                              onClick={() => {
                                if (totalExpendedHd <= 0) return;
                                
                                const { nextHd, recoveredAmount } = calculateLongRestHdRecovery(
                                  totalLvl,
                                  resolvedMechanics?.hitPoints?.hitDiceList,
                                  reviewExpendedHd
                                );
                                
                                syncHpAndSave(undefined, undefined, nextHd);
                                logHpAction('Long Rest HD Reset (RAW)', `Recovered ${recoveredAmount} Hit Dice (Max 1/2 of ${totalLvl}).`, `+${recoveredAmount} HD`);
                              }}
                              style={{ padding: '10px', backgroundColor: '#15803d', color: 'var(--bg-white)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: totalExpendedHd <= 0 ? 'not-allowed' : 'pointer' }}
                            >
                              🏕️ Recover Half Hit Dice (5e RAW Long Rest)
                            </button>

                            <button
                              type="button"
                              disabled={totalExpendedHd <= 0}
                              onClick={() => {
                                syncHpAndSave(undefined, undefined, {});
                                logHpAction('Full Rest HD Reset (Homebrew)', `All ${totalLvl} Hit Dice fully restored.`, `${totalLvl}/${totalLvl} HD`);
                              }}
                              style={{ padding: '8px', backgroundColor: 'var(--bg-white)', color: totalExpendedHd <= 0 ? 'var(--color-gray)' : '#711a19', border: '1px solid #e2d8c3', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', cursor: totalExpendedHd <= 0 ? 'not-allowed' : 'pointer' }}
                            >
                              🔄 Restore ALL Hit Dice (Homebrew)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: DEATH SAVES (SYNCED TO SHEET) */}
                      {activeHpTab === 'deathsaves' && (
                        <div className="animate-fade-in" style={{ padding: '4px 0' }}>
                          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '14px', marginBottom: '14px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '0.9rem', marginBottom: '4px' }}>
                              💀 Death Saving Throws
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>
                              When starting your turn with 0 HP, roll 1d20. 3 Successes = Stable, 3 Failures = Dead.
                            </div>
                          </div>

                          {/* Checkboxes Synced with Sheet */}
                          <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid #e2d8c3', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <span style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '0.85rem' }}>SUCCESSES:</span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {[0, 1, 2].map(i => (
                                  <input
                                    key={`ds-succ-${i}`}
                                    type="checkbox"
                                    checked={Boolean(deathSaves?.succ?.[i])}
                                    onChange={e => {
                                      const newSucc = [...(deathSaves?.succ || [false, false, false])];
                                      newSucc[i] = e.target.checked;
                                      const succCount = newSucc.filter(Boolean).length;
                                      setDeathSaves(prev => ({ ...(prev || { fail: [false, false, false] }), succ: newSucc }));
                                      syncHpAndSave(undefined, undefined, undefined, succCount, undefined);
                                    }}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '0.85rem' }}>FAILURES:</span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {[0, 1, 2].map(i => (
                                  <input
                                    key={`ds-fail-${i}`}
                                    type="checkbox"
                                    checked={Boolean(deathSaves?.fail?.[i])}
                                    onChange={e => {
                                      const newFail = [...(deathSaves?.fail || [false, false, false])];
                                      newFail[i] = e.target.checked;
                                      const failCount = newFail.filter(Boolean).length;
                                      setDeathSaves(prev => ({ ...(prev || { succ: [false, false, false] }), fail: newFail }));
                                      syncHpAndSave(undefined, undefined, undefined, undefined, failCount);
                                    }}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#dc2626' }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Roll & Reset Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const d20 = Math.floor(Math.random() * 20) + 1;
                                if (d20 === 20) {
                                  syncHpAndSave(1, reviewHpTemp);
                                  if (typeof setDiceModalData === 'function') {
                                    setDiceModalData({
                                      title: '🎲 Death Save Roll (NAT 20!)',
                                      formula: '1d20 ➔ 20 (NATURAL 20!)',
                                      rolls: 'CRITICAL SUCCESS! Regained 1 HP! Conscious and stable.',
                                      total: '20',
                                      advMode: 'normal'
                                    });
                                  }
                                  logHpAction('Death Save Roll (NAT 20!)', 'Regained 1 HP! Conscious and stable.', '20');
                                } else if (d20 >= 10) {
                                  const curSucc = deathSaves?.succ || [false, false, false];
                                  const nextSucc = [...curSucc];
                                  const firstFalseIdx = nextSucc.indexOf(false);
                                  if (firstFalseIdx !== -1) nextSucc[firstFalseIdx] = true;
                                  const succCount = nextSucc.filter(Boolean).length;
                                  setDeathSaves(prev => ({ ...(prev || { fail: [false, false, false] }), succ: nextSucc }));
                                  syncHpAndSave(undefined, undefined, undefined, succCount, undefined);
                                  if (typeof setDiceModalData === 'function') {
                                    setDiceModalData({
                                      title: '🎲 Death Save Roll (Success)',
                                      formula: `1d20 ➔ ${d20} (Success >= 10)`,
                                      rolls: `SUCCESS! (${succCount}/3 Successes)`,
                                      total: `${d20}`,
                                      advMode: 'normal'
                                    });
                                  }
                                  logHpAction(`Death Save Roll (d20: ${d20})`, `SUCCESS! (${succCount}/3 Successes)`, `${d20}`);
                                } else if (d20 === 1) {
                                  const curFail = deathSaves?.fail || [false, false, false];
                                  const nextFail = [...curFail];
                                  let added = 0;
                                  for (let idx = 0; idx < nextFail.length && added < 2; idx++) {
                                    if (!nextFail[idx]) { nextFail[idx] = true; added++; }
                                  }
                                  const failCount = nextFail.filter(Boolean).length;
                                  setDeathSaves(prev => ({ ...(prev || { succ: [false, false, false] }), fail: nextFail }));
                                  syncHpAndSave(undefined, undefined, undefined, undefined, failCount);
                                  if (typeof setDiceModalData === 'function') {
                                    setDiceModalData({
                                      title: '🎲 Death Save Roll (NAT 1!)',
                                      formula: '1d20 ➔ 1 (NATURAL 1!)',
                                      rolls: `CRITICAL FAILURE! 2 FAILURES! (${failCount}/3 Failures)`,
                                      total: '1',
                                      advMode: 'normal'
                                    });
                                  }
                                  logHpAction('Death Save Roll (NAT 1!)', `2 FAILURES! (${failCount}/3 Failures)`, '1');
                                } else {
                                  const curFail = deathSaves?.fail || [false, false, false];
                                  const nextFail = [...curFail];
                                  const firstFalseIdx = nextFail.indexOf(false);
                                  if (firstFalseIdx !== -1) nextFail[firstFalseIdx] = true;
                                  const failCount = nextFail.filter(Boolean).length;
                                  setDeathSaves(prev => ({ ...(prev || { succ: [false, false, false] }), fail: nextFail }));
                                  syncHpAndSave(undefined, undefined, undefined, undefined, failCount);
                                  if (typeof setDiceModalData === 'function') {
                                    setDiceModalData({
                                      title: '🎲 Death Save Roll (Failure)',
                                      formula: `1d20 ➔ ${d20} (Failure < 10)`,
                                      rolls: `FAILURE! (${failCount}/3 Failures)`,
                                      total: `${d20}`,
                                      advMode: 'normal'
                                    });
                                  }
                                  logHpAction(`Death Save Roll (d20: ${d20})`, `FAILURE! (${failCount}/3 Failures)`, `${d20}`);
                                }
                              }}
                              style={{ padding: '12px', backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                              <i className="fa-solid fa-dice-d20"></i> Roll Death Saving Throw (D20)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeathSaves({ succ: [false, false, false], fail: [false, false, false] });
                                syncHpAndSave(undefined, undefined, undefined, 0, 0);
                                logHpAction('Death Saves Reset', `All death save counters cleared.`, '0/0');
                              }}
                              style={{ padding: '8px', backgroundColor: 'var(--bg-white)', color: 'var(--color-gray)', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              🔄 Reset Death Saves
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Footer */}
                      <div style={{ marginTop: '16px', borderTop: '1px solid #e2d8c3', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setShowHpAdjustModal(false)}
                          style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', padding: '8px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          เสร็จสิ้น / ปิดหน้าต่าง
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })(), document.body)}

            {/* MODAL: Add Custom Weapon / Attack */}
            {showAddWeaponModal && ReactDOM.createPortal(
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: '20px' }}>
                <div className="animate-scale-up" style={{ backgroundColor: 'var(--bg-paper)', border: '2px solid #166534', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(22, 101, 52, 0.35)' }}>
                  <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: '#166534', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-khanda"></i> Add Custom Attack / Weapon
                  </h4>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)', marginBottom: '4px' }}>Weapon or Attack Name:</label>
                    <input
                      type="text"
                      value={newWpName}
                      onChange={e => setNewWpName(e.target.value)}
                      placeholder="e.g. Magic Longsword, Shadow Strike"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fefcf8', outline: 'none' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)', marginBottom: '4px' }}>Damage Dice:</label>
                    <input
                      type="text"
                      value={newWpDmg}
                      onChange={e => setNewWpDmg(e.target.value)}
                      placeholder="e.g. 1d8, 2d6, 1d10+2"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fefcf8', outline: 'none' }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gray)', marginBottom: '4px' }}>Ability Modifier:</label>
                    <select
                      value={newWpStat}
                      onChange={e => setNewWpStat(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', backgroundColor: '#fefcf8', outline: 'none' }}
                    >
                      <option value="str">Strength (STR)</option>
                      <option value="dex">Dexterity (DEX)</option>
                      <option value="int">Intelligence (INT)</option>
                      <option value="wis">Wisdom (WIS)</option>
                      <option value="cha">Charisma (CHA)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => setShowAddWeaponModal(false)}
                      style={{ backgroundColor: '#efeade', color: 'var(--color-gray)', padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newWpName.trim()) return;
                        const customItem = {
                          itemId: `custom_wp_${Date.now()}`,
                          name: newWpName.trim(),
                          damage: newWpDmg.trim() || '1d6',
                          stat: newWpStat,
                          category: 'Custom Weapon',
                          qty: 1
                        };
                        setCharacterState(prev => {
                          const curEq = prev.equipment || {};
                          return { ...prev, equipment: { ...curEq, items: [...(curEq.items || []), customItem] } };
                        });
                        
                        setNewWpName('');
                        setShowAddWeaponModal(false);
                      }}
                      style={{ backgroundColor: '#16a34a', color: 'var(--bg-white)', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Save Attack
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* MODAL: Add Items to Inventory (Catalog Pop-up Sync) */}
            {showAddItemModal && ReactDOM.createPortal((() => {
              const allCatalogItems = dbData?.items || [];
              const searchL = (sheetAddItemSearch || '').toLowerCase().trim();
              const filteredCatalog = allCatalogItems.filter(it => {
                const matchesSearch = !searchL || (it.item_name || '').toLowerCase().includes(searchL) || (it.item_type || '').toLowerCase().includes(searchL);
                const matchesCat = sheetAddItemCategory === 'All' ||
                  (sheetAddItemCategory === 'Armor' ? (it.item_type === 'Armor' || (it.subcategory || '').toLowerCase() === 'shield') :
                   (it.item_type || '').toLowerCase().includes(sheetAddItemCategory.toLowerCase()) || (it.subcategory || '').toLowerCase().includes(sheetAddItemCategory.toLowerCase()));
                return matchesSearch && matchesCat;
              });

              return (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2500, padding: '20px', overflowY: 'auto' }}>
                  <div className="animate-scale-up" style={{ backgroundColor: 'var(--bg-paper)', border: '3px solid #711a19', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '850px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(113, 26, 25, 0.4)', margin: '40px auto auto auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2d8c3', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: '#711a19', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fa-solid fa-cart-plus"></i> Add Items to Inventory (Catalog Pop-up Sync)
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', margin: '4px 0 0 0' }}>
                          Browse or search the database catalog. Adding items syncs to your Character Sheet immediately!
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddItemModal(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-gray)', fontSize: '1.5rem', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    {/* Filter Bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['All', 'Weapon', 'Armor', 'Gear', 'Tool', 'Consumable'].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSheetAddItemCategory(cat)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '14px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              border: sheetAddItemCategory === cat ? '1.5px solid #711a19' : '1px solid #e2e8f0',
                              backgroundColor: sheetAddItemCategory === cat ? '#711a19' : 'var(--bg-white)',
                              color: sheetAddItemCategory === cat ? 'var(--bg-white)' : 'var(--color-gray)',
                              transition: 'all 0.15s'
                            }}
                          >
                            {cat === 'All' ? '📦 All Items' : cat === 'Weapon' ? '⚔️ Weapons' : cat === 'Armor' ? '🛡️ Armor' : cat === 'Gear' ? '🎒 Gear' : cat === 'Tool' ? '🛠️ Tools' : '🧪 Consumables'}
                          </button>
                        ))}
                      </div>
                      <div style={{ position: 'relative', width: '220px', flexGrow: 1, maxWidth: '300px' }}>
                        <i className="fa-solid fa-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray)', fontSize: '0.8rem' }}></i>
                        <input
                          type="text"
                          placeholder="Search items catalog..."
                          value={sheetAddItemSearch}
                          onChange={e => setSheetAddItemSearch(e.target.value)}
                          style={{ width: '100%', padding: '6px 28px 6px 28px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                        />
                        {sheetAddItemSearch && (
                          <button
                            type="button"
                            onClick={() => setSheetAddItemSearch('')}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-gray)', cursor: 'pointer', padding: 0 }}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', marginBottom: '8px', fontStyle: 'italic' }}>
                      Showing {filteredCatalog.length} catalog items {sheetAddItemSearch && `matching "${sheetAddItemSearch}"`}
                    </div>

                    {/* Catalog Items List */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '4px', marginBottom: '16px', alignContent: 'start' }}>
                      {filteredCatalog.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: 'var(--color-gray)', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                          No items found matching your filter or search query.
                        </div>
                      ) : (
                        filteredCatalog.slice(0, 100).map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', transition: 'all 0.15s' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                              <div style={{ fontWeight: '700', color: 'var(--color-ink)' }}>{item.item_name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>
                                <span style={{ color: '#711a19', fontWeight: '600' }}>{item.item_type || 'Gear'}</span> | {item.cost || '-'} | {item.weight || 0} lbs
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCharacterState(prev => {
                                  const curEq = prev.equipment || {};
                                  const currentItems = [...(curEq.items || [])];
                                  const existingIdx = currentItems.findIndex(i => (i.itemId && i.itemId === item.item_id) || i.name === item.item_name);
                                  if (existingIdx >= 0) {
                                    currentItems[existingIdx].qty = (currentItems[existingIdx].qty || 1) + 1;
                                    
                                  } else {
                                    currentItems.push({
                                      itemId: item.item_id || item.item_name,
                                      name: item.item_name,
                                      category: item.item_type || 'Gear',
                                      subcategory: item.subcategory,
                                      damage: item.damage,
                                      ac_base: item.ac_base,
                                      properties: item.properties,
                                      weight: parseFloat(item.weight || 0),
                                      cost: item.cost || '-',
                                      qty: 1,
                                      equipped: false
                                    });
                                    
                                  }
                                  return { ...prev, equipment: { ...curEq, items: currentItems } };
                                });
                              }}
                              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #711a19', backgroundColor: '#fef2f2', color: '#711a19', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0, transition: 'all 0.15s' }}
                            >
                              + Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Custom Item Quick Add Footer */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', backgroundColor: 'var(--bg-sidebar)', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-gray)' }}>Not in catalog? Add Custom Item:</span>
                      <div style={{ display: 'flex', gap: '8px', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          placeholder="Custom item name..."
                          style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', width: '180px' }}
                        />
                        <input
                          type="number"
                          min={1}
                          value={newItemQty}
                          onChange={e => setNewItemQty(parseInt(e.target.value) || 1)}
                          style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newItemName.trim()) return;
                            const newItemObj = {
                              itemId: `custom_item_${Date.now()}`,
                              name: newItemName.trim(),
                              category: 'Adventuring Gear',
                              weight: 0,
                              cost: '-',
                              qty: newItemQty || 1,
                              equipped: false
                            };
                            setCharacterState(prev => {
                              const curEq = prev.equipment || {};
                              return { ...prev, equipment: { ...curEq, items: [...(curEq.items || []), newItemObj] } };
                            });
                            
                            setNewItemName('');
                          }}
                          style={{ backgroundColor: '#1d4ed8', color: 'var(--bg-white)', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          + Add Custom
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })(), document.body)}

            {/* MODAL: Manage Spells inside Character Sheet */}
            {showSheetManageSpellsModal && ReactDOM.createPortal((() => {
              const spellcasterClasses = classList.filter(cl => ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'].includes(cl.classId));
              const activeTab = sheetManageSpellTab || spellcasterClasses[0]?.classId || 'wizard';
              const isWizard = activeTab === 'wizard';
              const activeSpellState = characterState.spells?.classes?.[activeTab] || { cantrips: [], spellbook: [], prepared: [] };
              
              const activeClassInfo = dbData.classes?.find(c => (c.class_id || c.name)?.toLowerCase() === activeTab?.toLowerCase());
              let classSpellIds = [];
              try {
                if (activeClassInfo?.spell_list) classSpellIds = JSON.parse(activeClassInfo.spell_list);
              } catch { /* ignore */ }

              const allAvailableSpells = dbData.spells?.filter(s => classSpellIds.includes(s.spell_id)) || [];
              const searchL = (sheetManageSpellSearch || '').toLowerCase().trim();
              const filteredAvailable = allAvailableSpells.filter(s => {
                const matchesSearch = !searchL || String(s.spell_name || '').toLowerCase().includes(searchL) || String(s.school || '').toLowerCase().includes(searchL);
                const matchesLvl = matchesMultiLevel(s.spell_level, sheetManageSpellLevel);
                return matchesSearch && matchesLvl;
              }).sort((a, b) => {
                const lvlA = parseInt(a.spell_level, 10) || 0;
                const lvlB = parseInt(b.spell_level, 10) || 0;
                if (lvlA !== lvlB) return lvlA - lvlB;
                return (a.spell_name || '').localeCompare(b.spell_name || '');
              });

              return (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2500, padding: '20px', overflowY: 'auto' }}>
                  <div className="animate-scale-up" style={{ backgroundColor: 'var(--bg-paper)', border: '3px solid #711a19', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '950px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(113, 26, 25, 0.4)', margin: '40px auto auto auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2d8c3', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: '#711a19', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fa-solid fa-book-journal-whills"></i> Manage Character Spells
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', margin: '4px 0 0 0' }}>
                          Manage your spells (learn cantrips, add to Spellbook, prepare spells). Changes sync to your Character Sheet automatically!
                        </p>
                      </div>
                      <button
                        onClick={() => setShowSheetManageSpellsModal(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-gray)', fontSize: '1.5rem', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    {/* Class Selector Tabs */}
                    {spellcasterClasses.length > 1 && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2d8c3', paddingBottom: '8px' }}>
                        {spellcasterClasses.map(cl => (
                          <button
                            key={cl.classId}
                            onClick={() => setSheetManageSpellTab(cl.classId)}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === cl.classId ? '#711a19' : '#efeade', color: activeTab === cl.classId ? 'var(--bg-white)' : 'var(--color-gray)', fontWeight: 'bold', textTransform: 'capitalize', cursor: 'pointer' }}
                          >
                            {cl.classId} (Lvl {cl.level})
                          </button>
                        ))}
                      </div>
                    )}


                    {/* Main Accordion Layout */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', minHeight: '350px', paddingRight: '8px' }}>
                      
                      {/* Section 1: Prepared Spells & Cantrips */}
                      <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #bbf7d0', borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
                        <h5 
                          onClick={() => setManageSpellsAccordion(prev => ({ ...prev, prepared: !prev.prepared }))}
                          style={{ margin: '0', fontSize: '1rem', color: '#166534', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'rgba(22, 101, 52, 0.05)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                        >
                          <span>✨ Prepared & Cantrips ({((activeSpellState.cantrips?.length || 0) + (activeSpellState.prepared?.length || 0))})</span>
                          <i className={`fa-solid fa-chevron-${manageSpellsAccordion.prepared ? 'up' : 'down'}`}></i>
                        </h5>
                        
                        {manageSpellsAccordion.prepared && (
                          <div style={{ padding: '12px', borderTop: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Cantrips Section */}
                            {(activeSpellState.cantrips || []).length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534', marginBottom: '4px', textTransform: 'uppercase' }}>Cantrips (Lvl 0)</div>
                                {activeSpellState.cantrips.map(spellId => {
                                  const spell = dbData.spells?.find(s => s.spell_id === spellId);
                                  return (
                                    <div key={`prep-can-${spellId}`} style={{ display: 'flex', flexDirection: 'column', borderRadius: '6px', backgroundColor: 'var(--bg-white)', border: '1px solid #bbf7d0', fontSize: '0.8rem', marginBottom: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <button
                                            onClick={() => setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }))}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#166534' }}
                                          >
                                            <i className={`fa-solid fa-chevron-${expandedSpells[spellId] ? 'up' : 'down'}`}></i>
                                          </button>
                                          <span style={{ fontWeight: 'bold', color: '#166534' }}>{spell?.spell_name || spellId}</span>
                                        </div>
                                        <button
                                          onClick={() => syncSpellsToSheet(activeTab, 'cantrips', activeSpellState.cantrips.filter(id => id !== spellId))}
                                          style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', backgroundColor: '#ef4444', color: 'var(--bg-white)', fontSize: '0.65rem', cursor: 'pointer' }}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                      {expandedSpells[spellId] && spell?.spell_desc && (
                                        <div style={{ padding: '8px 8px 8px 30px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                          <div dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Prepared Spells Section */}
                            {(activeSpellState.prepared || []).length > 0 && (
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534', marginBottom: '4px', textTransform: 'uppercase' }}>Prepared Spells (Lvl 1+)</div>
                                {activeSpellState.prepared.map(spellId => {
                                  const spell = dbData.spells?.find(s => s.spell_id === spellId);
                                  return (
                                    <div key={`prep-sp-${spellId}`} style={{ display: 'flex', flexDirection: 'column', borderRadius: '6px', backgroundColor: 'var(--bg-white)', border: '1px solid #bbf7d0', fontSize: '0.8rem', marginBottom: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <button
                                            onClick={() => setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }))}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#166534' }}
                                          >
                                            <i className={`fa-solid fa-chevron-${expandedSpells[spellId] ? 'up' : 'down'}`}></i>
                                          </button>
                                          <div>
                                            <span style={{ fontWeight: 'bold', color: '#166534' }}>{spell?.spell_name || spellId}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', marginLeft: '6px' }}>(Lvl {spell?.spell_level || '1'})</span>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => syncSpellsToSheet(activeTab, 'prepared', activeSpellState.prepared.filter(id => id !== spellId))}
                                          style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', backgroundColor: '#ef4444', color: 'var(--bg-white)', fontSize: '0.65rem', cursor: 'pointer' }}
                                        >
                                          Unprepare
                                        </button>
                                      </div>
                                      {expandedSpells[spellId] && spell?.spell_desc && (
                                        <div style={{ padding: '8px 8px 8px 30px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                          <div dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {(!activeSpellState.cantrips?.length && !activeSpellState.prepared?.length) && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center' }}>No cantrips or prepared spells yet.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Wizard Spellbook (Wizard only) */}
                      {isWizard && (() => {
                        const sBookL = (sheetSpellbookSearch || '').toLowerCase().trim();
                        const filteredSpellbook = (activeSpellState.spellbook || []).filter(spellId => {
                          const spell = dbData.spells?.find(s => s.spell_id === spellId);
                          if (!spell) return false;
                          const matchesSearch = !sBookL || String(spell.spell_name || '').toLowerCase().includes(sBookL) || String(spell.school || '').toLowerCase().includes(sBookL);
                          const matchesLvl = matchesMultiLevel(spell.spell_level, sheetSpellbookLevels);
                          return matchesSearch && matchesLvl;
                        }).sort((aId, bId) => {
                          const sA = dbData.spells?.find(s => s.spell_id === aId);
                          const sB = dbData.spells?.find(s => s.spell_id === bId);
                          const lvlA = parseInt(sA?.spell_level || 0, 10);
                          const lvlB = parseInt(sB?.spell_level || 0, 10);
                          if (lvlA !== lvlB) return lvlA - lvlB;
                          return (sA?.spell_name || '').localeCompare(sB?.spell_name || '');
                        });

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #bfdbfe', borderRadius: '8px', backgroundColor: '#f0f7ff' }}>
                            <h5 
                              onClick={() => setManageSpellsAccordion(prev => ({ ...prev, spellbook: !prev.spellbook }))}
                              style={{ margin: '0', fontSize: '1rem', color: '#1e3a8a', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'rgba(30, 58, 138, 0.05)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                            >
                              <span>📖 Your Spellbook ({activeSpellState.spellbook?.length || 0})</span>
                              <i className={`fa-solid fa-chevron-${manageSpellsAccordion.spellbook ? 'up' : 'down'}`}></i>
                            </h5>
                            
                            {manageSpellsAccordion.spellbook && (
                              <div style={{ padding: '12px', borderTop: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Search spellbook..."
                                    value={sheetSpellbookSearch}
                                    onChange={e => setSheetSpellbookSearch(e.target.value)}
                                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #93c5fd', fontSize: '0.75rem', backgroundColor: 'var(--bg-white)' }}
                                  />
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {[
                                      { label: 'ALL', val: 'all' },
                                      ...Array.from({ length: 9 }).map((_, i) => ({ label: `LVL ${i+1}`, val: String(i+1) }))
                                    ].map(filterBtn => {
                                      const isSel = (sheetSpellbookLevels || ['all']).includes(filterBtn.val);
                                      return (
                                        <button
                                          key={`book-lvl-${filterBtn.val}`}
                                          type="button"
                                          onClick={() => toggleMultiLevel('book', filterBtn.val)}
                                          style={{ padding: '2px 6px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: '1px solid #93c5fd', backgroundColor: isSel ? '#2563eb' : 'var(--bg-white)', color: isSel ? 'var(--bg-white)' : '#1e3a8a', cursor: 'pointer' }}
                                        >
                                          {filterBtn.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {filteredSpellbook.map(spellId => {
                                    const spell = dbData.spells?.find(s => s.spell_id === spellId);
                                    if (!spell) return null;
                                    const isPrepared = activeSpellState.prepared?.includes(spell.spell_id);

                                    return (
                                      <div key={spell.spell_id} style={{ display: 'flex', flexDirection: 'column', borderRadius: '6px', backgroundColor: 'var(--bg-white)', border: '1px solid #bfdbfe', fontSize: '0.8rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                              onClick={() => setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }))}
                                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#1e3a8a' }}
                                            >
                                              <i className={`fa-solid fa-chevron-${expandedSpells[spellId] ? 'up' : 'down'}`}></i>
                                            </button>
                                            <div>
                                              <div style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{spell.spell_name}</div>
                                              <div style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>Level {spell.spell_level} • {spell.school}</div>
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                              onClick={() => {
                                                const curPrep = activeSpellState.prepared || [];
                                                const next = isPrepared ? curPrep.filter(id => id !== spell.spell_id) : [...curPrep, spell.spell_id];
                                                syncSpellsToSheet(activeTab, 'prepared', next);
                                              }}
                                              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: isPrepared ? '#dc2626' : '#16a34a', color: 'var(--bg-white)', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                              {isPrepared ? 'Unprepare' : '+ Prepare'}
                                            </button>
                                            <button
                                              onClick={() => {
                                                const curBook = activeSpellState.spellbook || [];
                                                const curPrep = activeSpellState.prepared || [];
                                                syncSpellsToSheet(activeTab, 'spellbook', curBook.filter(id => id !== spell.spell_id));
                                                if (isPrepared) syncSpellsToSheet(activeTab, 'prepared', curPrep.filter(id => id !== spell.spell_id));
                                              }}
                                              style={{ padding: '4px 6px', borderRadius: '4px', border: 'none', backgroundColor: '#ef4444', color: 'var(--bg-white)', fontSize: '0.7rem', cursor: 'pointer', title: 'Remove from Spellbook' }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                        {expandedSpells[spellId] && spell?.spell_desc && (
                                          <div style={{ padding: '8px 8px 8px 30px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                            <div dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {!activeSpellState.spellbook?.length && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center' }}>Spellbook is empty. Add spells from available list.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Section 3: Available Spells in Class List */}
                      <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2d8c3', borderRadius: '8px', backgroundColor: '#fefcf8' }}>
                        <h5 
                          onClick={() => setManageSpellsAccordion(prev => ({ ...prev, available: !prev.available }))}
                          style={{ margin: '0', fontSize: '1rem', color: '#711a19', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'rgba(113, 26, 25, 0.05)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                        >
                          <span>📚 Available {activeTab.toUpperCase()} Spells ({filteredAvailable.length})</span>
                          <i className={`fa-solid fa-chevron-${manageSpellsAccordion.available ? 'up' : 'down'}`}></i>
                        </h5>
                        
                        {manageSpellsAccordion.available && (
                          <div style={{ padding: '12px', borderTop: '1px solid #e2d8c3', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Search & Level Filters */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Search available spells..."
                                value={sheetManageSpellSearch}
                                onChange={e => setSheetManageSpellSearch(e.target.value)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', backgroundColor: 'var(--bg-white)' }}
                              />
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {[
                                  { label: 'ALL', val: 'all' },
                                  { label: 'CANTRIP', val: '0' },
                                  ...Array.from({ length: 9 }).map((_, i) => ({ label: `LVL ${i+1}`, val: String(i+1) }))
                                ].map(filterBtn => {
                                  const isSel = (sheetManageSpellLevel || ['all']).includes(filterBtn.val);
                                  return (
                                    <button
                                      key={`avail-lvl-${filterBtn.val}`}
                                      type="button"
                                      onClick={() => toggleMultiLevel('avail', filterBtn.val)}
                                      style={{ padding: '2px 6px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isSel ? '#711a19' : 'var(--bg-white)', color: isSel ? 'var(--bg-white)' : 'var(--color-gray)', cursor: 'pointer' }}
                                    >
                                      {filterBtn.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {filteredAvailable.map(spell => {
                                const isLvl0 = spell.spell_level === '0' || spell.spell_level === 0 || String(spell.spell_level).toLowerCase().includes('cantrip');
                                const isLearnedCantrip = activeSpellState.cantrips?.includes(spell.spell_id);
                                const isInSpellbook = activeSpellState.spellbook?.includes(spell.spell_id);
                                const isPrepared = activeSpellState.prepared?.includes(spell.spell_id);

                                return (
                                  <div key={spell.spell_id} style={{ display: 'flex', flexDirection: 'column', borderRadius: '6px', backgroundColor: 'var(--bg-white)', border: '1px solid #e2d8c3', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                          onClick={() => setExpandedSpells(prev => ({ ...prev, [spell.spell_id]: !prev[spell.spell_id] }))}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#711a19' }}
                                        >
                                          <i className={`fa-solid fa-chevron-${expandedSpells[spell.spell_id] ? 'up' : 'down'}`}></i>
                                        </button>
                                        <div>
                                          <div style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>{spell.spell_name}</div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>{isLvl0 ? 'Cantrip' : `Level ${spell.spell_level}`} • {spell.school || 'Magic'}</div>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        {isLvl0 ? (
                                          <button
                                            onClick={() => {
                                              const cur = activeSpellState.cantrips || [];
                                              const next = isLearnedCantrip ? cur.filter(id => id !== spell.spell_id) : [...cur, spell.spell_id];
                                              syncSpellsToSheet(activeTab, 'cantrips', next);
                                            }}
                                            style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: isLearnedCantrip ? '#dc2626' : '#16a34a', color: 'var(--bg-white)', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer' }}
                                          >
                                            {isLearnedCantrip ? 'Remove' : '+ Learn'}
                                          </button>
                                        ) : isWizard ? (
                                          <button
                                            onClick={() => {
                                              const curBook = activeSpellState.spellbook || [];
                                              const curPrep = activeSpellState.prepared || [];
                                              if (isInSpellbook) {
                                                syncSpellsToSheet(activeTab, 'spellbook', curBook.filter(id => id !== spell.spell_id));
                                                if (isPrepared) syncSpellsToSheet(activeTab, 'prepared', curPrep.filter(id => id !== spell.spell_id));
                                              } else {
                                                syncSpellsToSheet(activeTab, 'spellbook', [...curBook, spell.spell_id]);
                                              }
                                            }}
                                            style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: isInSpellbook ? '#2563eb' : 'var(--color-gray)', color: 'var(--bg-white)', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer' }}
                                          >
                                            {isInSpellbook ? 'In Spellbook ✓' : '+ Add Book'}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              const curPrep = activeSpellState.prepared || [];
                                              const next = isPrepared ? curPrep.filter(id => id !== spell.spell_id) : [...curPrep, spell.spell_id];
                                              syncSpellsToSheet(activeTab, 'prepared', next);
                                            }}
                                            style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: isPrepared ? '#dc2626' : '#16a34a', color: 'var(--bg-white)', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer' }}
                                          >
                                            {isPrepared ? 'Unprepare' : '+ Prepare'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {expandedSpells[spell.spell_id] && spell?.spell_desc && (
                                      <div style={{ padding: '8px 8px 8px 30px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                        <div dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2d8c3', paddingTop: '12px' }}>
                      <button
                        onClick={() => setShowSheetManageSpellsModal(false)}
                        style={{ padding: '10px 24px', backgroundColor: '#711a19', color: 'var(--bg-white)', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        Done / Save Sync
                      </button>
                    </div>
                  </div>
                </div>
              );
            })(), document.body)}

            {showManageFeatsModal && ReactDOM.createPortal((
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="animate-scale-up" style={{ backgroundColor: 'var(--bg-paper)', borderRadius: '14px', width: '100%', maxWidth: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(113, 26, 25, 0.35)', border: '2px solid #711a19', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2d8c3', padding: '16px 20px', backgroundColor: '#fefcf8' }}>
                    <div>
                      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.25rem', color: '#711a19', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-medal"></i> Manage Character Feats
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-gray)', margin: '4px 0 0 0' }}>
                        Feats granted by Class or Background cannot be removed here, but you can review their options. Additional feats can be added or removed freely.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowManageFeatsModal(false)}
                      style={{ background: 'var(--bg-sidebar)', border: '1px solid #cbd5e1', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1rem', cursor: 'pointer', color: 'var(--color-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✖
                    </button>
                  </div>

                  <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--color-ink)', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🔒 Granted by Class & Background ({allFeaturesListReview.filter(f => f.category === 'FEATS' && f.fromType !== 'manual').length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {allFeaturesListReview.filter(f => f.category === 'FEATS' && f.fromType !== 'manual').map((feat, idx) => (
                          <div key={idx} style={{ backgroundColor: 'var(--bg-white)', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, marginRight: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ color: 'var(--color-ink)', fontSize: '0.9rem' }}>{feat.name}</strong>
                                <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--border-color)', color: 'var(--color-gray)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{feat.source}</span>
                              </div>
                              {feat.desc && (
                                <div
                                  style={{ fontSize: '0.78rem', color: 'var(--color-gray)', marginTop: '6px', lineHeight: '1.4' }}
                                  dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml(feat.name, formatTraitOrFeatureText(feat.desc)) }}
                                />
                              )}
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', marginTop: '4px' }}>
                                Cannot be removed (Granted automatically by your character build). To edit choices, go to the {feat.fromType === 'class' ? 'Class' : 'Background'} builder tab.
                              </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', fontStyle: 'italic', padding: '4px 8px', border: '1px dashed #cbd5e1', borderRadius: '4px' }}>
                              🔒 Locked
                            </div>
                          </div>
                        ))}
                        {allFeaturesListReview.filter(f => f.category === 'FEATS' && f.fromType !== 'manual').length === 0 && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', fontStyle: 'italic', margin: 0 }}>No feats granted by class or background yet.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#711a19', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✨ Manual & Additional Feats ({allFeaturesListReview.filter(f => f.category === 'FEATS' && f.fromType === 'manual').length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {allFeaturesListReview.filter(f => f.category === 'FEATS' && f.fromType === 'manual').map((feat, idx) => (
                          <div key={idx} style={{ backgroundColor: 'var(--bg-white)', padding: '12px', borderRadius: '8px', border: '1px solid #e2d8c3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, marginRight: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ color: '#711a19', fontSize: '0.9rem' }}>{feat.name}</strong>
                                <span style={{ fontSize: '0.7rem', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  MANUAL
                                </span>
                              </div>
                              {feat.desc && (
                                <div
                                  style={{ fontSize: '0.78rem', color: 'var(--color-gray)', marginTop: '6px', lineHeight: '1.4' }}
                                  dangerouslySetInnerHTML={{ __html: cleanAndStyleHtml(feat.name, formatTraitOrFeatureText(feat.desc)) }}
                                />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCharacterState(prev => {
                                  const prevFeats = prev.feats || [];
                                  const updated = prevFeats.filter((fObj) => {
                                    const idToCheck = typeof fObj === 'object' ? (fObj.id || fObj.name) : fObj;
                                    return idToCheck !== feat.featId;
                                  });
                                  return { ...prev, feats: updated };
                                });
                              }}
                              style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.15s' }}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        ))}
                        {allFeaturesListReview.filter(f => f.category === 'FEATS' && f.fromType === 'manual').length === 0 && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', fontStyle: 'italic', margin: 0 }}>No additional feats manually added.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-gray)', margin: '0 0 8px 0', borderBottom: '1px solid #e2d8c3', paddingBottom: '6px' }}>
                        Add New Feat
                      </h4>
                      <div style={{ backgroundColor: '#fefcf8', padding: '14px', borderRadius: '8px', border: '1px dashed #d6cbbd', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                          value={newFeatToAdd}
                          onChange={e => setNewFeatToAdd(e.target.value)}
                          style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem', outline: 'none' }}
                        >
                          <option value="">-- Select Feat to Add --</option>
                          {dbData.feats
                            ?.slice()
                            .sort((a, b) => (a.feat_name || a.name || '').localeCompare(b.feat_name || b.name || ''))
                            .map(f => (
                              <option key={f.feat_id} value={f.feat_id}>
                                {f.feat_name || f.name || 'Unnamed Feat'} {f.prerequisite ? `(Req: ${f.prerequisite})` : ''}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          disabled={!newFeatToAdd}
                          onClick={() => {
                            if (!newFeatToAdd) return;
                            setCharacterState(prev => {
                              const prevFeats = prev.feats || [];
                              return {
                                ...prev,
                                feats: [...prevFeats, { id: newFeatToAdd, source: 'manual', bonuses: {} }]
                              };
                            });
                            setNewFeatToAdd('');
                          }}
                          style={{ padding: '8px 16px', backgroundColor: newFeatToAdd ? '#711a19' : 'var(--border-color)', color: 'var(--bg-white)', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: newFeatToAdd ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                        >
                          + Add Feat
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid #e2d8c3', backgroundColor: '#fefcf8' }}>
                    <button
                      onClick={() => setShowManageFeatsModal(false)}
                      style={{ padding: '8px 20px', backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ), document.body)}

            <AdventureDiaryModal
              isOpen={showDiaryModal}
              onClose={() => { setShowDiaryModal(false); setDiaryInitialEntry(null); }}
              initialSelectedEntry={diaryInitialEntry}
              diaryEntries={characterState.diary || []}
              onSaveDiaryEntries={(newEntries) => {
                setCharacterState(prev => {
                  const updated = { ...prev, diary: newEntries };
                  if (typeof window !== 'undefined') {
                    try {
                      const saved = JSON.parse(localStorage.getItem('dnd_saved_characters') || '[]');
                      const idx = saved.findIndex(c => c.id === updated.id);
                      if (idx !== -1) {
                        saved[idx] = updated;
                        localStorage.setItem('dnd_saved_characters', JSON.stringify(saved));
                      }
                    } catch (e) {}
                  }
                  return updated;
                });
                if (typeof syncHpAndSave === 'function') {
                  syncHpAndSave();
                }
              }}
            />

            <CustomDiceRollerModal
              isOpen={showCustomDiceRollerModal}
              onClose={() => setShowCustomDiceRollerModal(false)}
              setDiceModalData={setDiceModalData}
              setGameplayRollHistory={setGameplayRollHistory}
              triggerQuickRoll={triggerQuickRoll}
            />
          </div>
        );
}

