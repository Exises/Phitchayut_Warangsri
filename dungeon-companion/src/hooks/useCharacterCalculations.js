import { useMemo } from 'react';
import { resolveCharacterMechanics } from '../utils/mechanicsResolver';
import {
  ALL_SKILLS_LIST,
  calculateTotalAbilities,
  getAllInnateAndFeatureSpells
} from '../utils/workshopHelpers';

export default function useCharacterCalculations(characterState, dbData) {
  const totalStats = useMemo(() => calculateTotalAbilities(characterState, dbData), [characterState, dbData]);

  const resolvedMechanics = useMemo(() => {
    return resolveCharacterMechanics({ ...characterState, abilities: totalStats }, dbData);
  }, [characterState, totalStats, dbData]);

  const spellSlotsCalculation = useMemo(() => {
    const classList = characterState.classData?.classes || characterState.classes || [];
    let totalLevel = 0;
    const spellcastingClasses = classList.filter(cl => {
      const cid = (cl.classId || '').toLowerCase();
      const scid = (cl.subclassId || '').toLowerCase();
      const lvl = parseInt(cl.level) || 1;
      if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard', 'artificer'].includes(cid)) return true;
      if (['paladin', 'ranger'].includes(cid) && lvl >= 2) return true;
      if ((scid.includes('eldritch') || scid.includes('trickster')) && lvl >= 3) return true;
      return false;
    });
    const isMultiSpellcaster = spellcastingClasses.length > 1;

    classList.forEach(cl => {
      const cid = (cl.classId || '').toLowerCase();
      const scid = (cl.subclassId || '').toLowerCase();
      const lvl = parseInt(cl.level) || 1;
      if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(cid)) {
        totalLevel += lvl;
      } else if (['paladin', 'ranger'].includes(cid)) {
        if (!isMultiSpellcaster) {
          totalLevel += lvl >= 2 ? Math.ceil(lvl / 2) : 0;
        } else {
          totalLevel += Math.floor(lvl / 2);
        }
      } else if (cid === 'artificer') {
        totalLevel += Math.ceil(lvl / 2);
      } else if (scid.includes('eldritch') || scid.includes('trickster')) {
        if (!isMultiSpellcaster) {
          totalLevel += lvl >= 3 ? Math.ceil(lvl / 3) : 0;
        } else {
          totalLevel += Math.floor(lvl / 3);
        }
      }
    });

    const MULTICLASS_SLOTS = {
      1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2],
      9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1],
      13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1],
      16: [4, 3, 3, 3, 2, 1, 1, 1], 17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    };

    const standardSlots = MULTICLASS_SLOTS[Math.min(totalLevel, 20)] || [];
    
    const warlockClass = classList.find(cl => cl.classId === 'warlock');
    let warlockSlots = null;
    if (warlockClass) {
       const wlInfo = dbData.classes?.find(c => c.class_id === 'warlock');
       if (wlInfo?.level_progression) {
          try {
            const wlProg = JSON.parse(wlInfo.level_progression);
            const currentWl = wlProg.find(p => p.level === parseInt(warlockClass.level, 10))?.class_specific;
            if (currentWl && currentWl.slots && currentWl.slot_level) {
              warlockSlots = { count: parseInt(currentWl.slots, 10), level: parseInt(currentWl.slot_level, 10) };
            }
          } catch { /* ignore */ }
       }
    }
    return { casterLevel: totalLevel, standardSlots, warlockSlots };
  }, [characterState.classData?.classes, characterState.classes, dbData]);

  const knownSpellsSourceMap = useMemo(() => {
    const sourceMap = new Map();
    const harvested = getAllInnateAndFeatureSpells(characterState, dbData);
    harvested.forEach(s => {
      const cleanId = String(s.id || '').toLowerCase();
      if (cleanId && !sourceMap.has(cleanId)) {
        sourceMap.set(cleanId, s.source || 'Innate / Feat');
      }
    });
    const classesSpells = characterState.spells?.classes || {};
    Object.entries(classesSpells).forEach(([cKey, cObj]) => {
      const className = cKey.charAt(0).toUpperCase() + cKey.slice(1);
      ['cantrips', 'spellbook', 'prepared', 'known'].forEach(listKey => {
        if (cObj?.[listKey]) {
          cObj[listKey].forEach(id => {
            const cleanId = String(id || '').toLowerCase();
            if (cleanId && !sourceMap.has(cleanId)) {
              sourceMap.set(cleanId, `${className} Spell`);
            }
          });
        }
      });
    });
    return sourceMap;
  }, [characterState, dbData]);

  const allKnownSpellIds = useMemo(() => {
    const harvested = getAllInnateAndFeatureSpells(characterState, dbData);
    const ids = new Set(harvested.map(s => String(s.id || '').toLowerCase()).filter(Boolean));
    const classesSpells = characterState.spells?.classes || {};
    Object.values(classesSpells).forEach(cObj => {
      if (cObj?.cantrips) cObj.cantrips.forEach(id => ids.add(String(id).toLowerCase()));
      if (cObj?.spellbook) cObj.spellbook.forEach(id => ids.add(String(id).toLowerCase()));
      if (cObj?.prepared) cObj.prepared.forEach(id => ids.add(String(id).toLowerCase()));
      if (cObj?.known) cObj.known.forEach(id => ids.add(String(id).toLowerCase()));
    });
    return Array.from(ids);
  }, [characterState, dbData]);

  const { proficientSkills, expertiseSkills, activeClassSaves, proficientArmor, proficientWeapons, proficientTools, languages } = useMemo(() => {
    const proficiencies = new Set();
    const expertise = new Set();
    const savingThrowsSet = new Set((characterState.proficiencies?.savingThrows || []).map(s => s.toLowerCase()));
    const armorSet = new Set();
    const weaponsSet = new Set();
    const toolsSet = new Set();
    const languagesSet = new Set();

    // 1. Class Base Skills & Saving Throws
    (characterState.proficiencies?.skills || []).forEach(s => proficiencies.add(s));
    (characterState.classData?.classes || []).forEach((cl, idx) => {
       const cInfo = dbData.classes?.find(c => c.class_id === cl.classId);
       if (!cInfo) return;
       
       if (idx === 0) {
         // --- Primary Class ---
         if (cInfo.core_traits) {
           try {
             const traits = typeof cInfo.core_traits === 'string' ? JSON.parse(cInfo.core_traits) : cInfo.core_traits;
             if (Array.isArray(traits?.saving_throws)) {
               traits.saving_throws.forEach(s => savingThrowsSet.add(String(s).toLowerCase()));
             } else if (typeof traits?.saving_throws === 'string') {
               traits.saving_throws.split(',').forEach(s => savingThrowsSet.add(s.trim().toLowerCase()));
             }
           } catch { /* ignore */ }
         }
         if (cInfo.proficiencies) {
           try {
             const profs = typeof cInfo.proficiencies === 'string' ? JSON.parse(cInfo.proficiencies) : cInfo.proficiencies;
             if (profs?.granted?.armor) profs.granted.armor.forEach(a => armorSet.add(a));
             if (profs?.granted?.weapons) profs.granted.weapons.forEach(w => weaponsSet.add(w));
             if (profs?.granted?.tools) profs.granted.tools.forEach(t => toolsSet.add(t));
           } catch { /* ignore */ }
         }
       } else {
         // --- Multiclass ---
         if (cInfo.core_traits) {
           try {
             const traits = typeof cInfo.core_traits === 'string' ? JSON.parse(cInfo.core_traits) : cInfo.core_traits;
             if (traits.multiclass && Array.isArray(traits.multiclass.proficiencies_gained)) {
               traits.multiclass.proficiencies_gained.forEach(p => {
                 const pLower = p.toLowerCase();
                 if (pLower.includes('armor') || pLower.includes('shield')) {
                    if (pLower.includes('light')) armorSet.add('Light');
                    if (pLower.includes('medium')) armorSet.add('Medium');
                    if (pLower.includes('heavy')) armorSet.add('Heavy');
                    if (pLower.includes('shield')) armorSet.add('Shields');
                 }
                 else if (pLower.includes('weapon')) {
                    if (pLower.includes('simple')) weaponsSet.add('Simple');
                    if (pLower.includes('martial')) weaponsSet.add('Martial');
                    else weaponsSet.add(p); // Specific weapon e.g. "Longsword"
                 }
                 else if (ALL_SKILLS_LIST.map(s => s.toLowerCase()).includes(pLower)) {
                    proficiencies.add(p);
                 }
                 else {
                    toolsSet.add(p);
                 }
               });
             }
           } catch { /* ignore */ }
         }
       }
    });

    // 2. Background Base Skills
    (characterState.background?.originalSkills || []).forEach(s => {
       const replaced = characterState.background?.replacedSkills?.[s];
       if (replaced) proficiencies.add(replaced);
       else proficiencies.add(s);
    });
    if ((!characterState.background?.originalSkills || characterState.background.originalSkills.length === 0) && characterState.background?.id) {
       const bgObj = dbData.backgrounds?.find(b => b.background_id === characterState.background.id);
       if (bgObj?.skill_proficiencies) {
          try {
             const parsed = typeof bgObj.skill_proficiencies === 'string' ? JSON.parse(bgObj.skill_proficiencies) : bgObj.skill_proficiencies;
             const bgSkills = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.granted) ? parsed.granted : (Array.isArray(parsed?.logic?.granted) ? parsed.logic.granted : []));
             bgSkills.forEach(s => {
               if (typeof s === 'string' && ALL_SKILLS_LIST.includes(s)) {
                 const replaced = characterState.background?.replacedSkills?.[s];
                 if (replaced) proficiencies.add(replaced);
                 else proficiencies.add(s);
               }
             });
          } catch { /* ignore */ }
       }
    }

    // 3. Class Features & Expertise
    (characterState.classData?.classes || []).forEach(cl => {
      Object.entries(cl.featureChoices || {}).forEach(([k, v]) => {
         const items = Array.isArray(v) ? v : (typeof v === 'object' && v !== null ? Object.values(v) : [v]);
         if (k.startsWith('Expertise') || k.startsWith('Scholar') || k.startsWith('Deft Explorer')) {
             items.forEach(s => {
                 if (typeof s === 'string' && ALL_SKILLS_LIST.includes(s)) {
                     expertise.add(s);
                     proficiencies.add(s);
                 }
             });
         } else {
             items.forEach(s => {
                if (typeof s === 'string' && ALL_SKILLS_LIST.includes(s)) proficiencies.add(s);
             });
         }
      });
    });

    // 4. Universal Feats Harvester (Global, Race, Background, and Class Feats)
    const extractFeatBonuses = (featObj) => {
      if (!featObj || typeof featObj !== 'object') return;
      const b = featObj.bonuses || (featObj.id ? featObj.bonuses : featObj);
      if (b) {
        if (b.skill1) proficiencies.add(b.skill1);
        if (b.skill2) proficiencies.add(b.skill2);
        if (b.skill3) proficiencies.add(b.skill3);
        if (b.tool1) proficiencies.add(b.tool1);
        if (b.tool2) proficiencies.add(b.tool2);
        if (b.tool3) proficiencies.add(b.tool3);
      }
    };

    const allFeatsList = [
       ...(characterState.feats || []),
       ...(characterState.background?.originFeats || characterState.background?.feats || []),
       ...(characterState.race?.feats || [])
    ];
    allFeatsList.forEach(extractFeatBonuses);

    // Harvest Feat choices selected inside Class Features (e.g. Level 4/8/12 Class Feats)
    (characterState.classData?.classes || []).forEach(cl => {
      Object.values(cl.featureChoices || {}).forEach(val => {
        const items = Array.isArray(val) ? val : [val];
        items.forEach(item => {
          if (item && typeof item === 'object') {
            extractFeatBonuses(item);
          }
        });
      });
    });

    // 5. Race & Lineage Trait Choices (e.g. Elf Keen Senses) & Granted Skills
    if (characterState.race) {
       Object.values(characterState.race.traitChoices || {}).forEach(val => {
          if (typeof val === 'string' && ALL_SKILLS_LIST.includes(val)) {
             proficiencies.add(val);
          } else if (Array.isArray(val)) {
             val.forEach(v => { if (typeof v === 'string' && ALL_SKILLS_LIST.includes(v)) proficiencies.add(v); });
          }
       });

       const raceObj = dbData.races?.find(r => r.species_id === characterState.race.id);
       if (raceObj && raceObj.traits) {
          try {
             const traits = typeof raceObj.traits === 'string' ? JSON.parse(raceObj.traits) : raceObj.traits;
             if (Array.isArray(traits)) {
                traits.forEach(t => {
                   if (t.logic && t.logic.granted && Array.isArray(t.logic.granted)) {
                      t.logic.granted.forEach(g => { if (typeof g === 'string' && ALL_SKILLS_LIST.includes(g)) proficiencies.add(g); });
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
                         t.logic.granted.forEach(g => { if (typeof g === 'string' && ALL_SKILLS_LIST.includes(g)) proficiencies.add(g); });
                      }
                   });
                }
             } catch { /* ignore */ }
          }
       }
    }

    return {
       proficientSkills: Array.from(proficiencies),
       expertiseSkills: Array.from(expertise),
       activeClassSaves: Array.from(savingThrowsSet),
       proficientArmor: Array.from(armorSet),
       proficientWeapons: Array.from(weaponsSet),
       proficientTools: Array.from(toolsSet),
       languages: Array.from(languagesSet)
    };
  }, [characterState, dbData]);

  return {
    totalStats: {
      ...totalStats,
      proficientSkills,
      expertiseSkills,
      activeClassSaves,
      proficientArmor,
      proficientWeapons,
      proficientTools,
      languages
    },
    resolvedMechanics,
    spellSlotsCalculation,
    knownSpellsSourceMap,
    allKnownSpellIds,
    proficientSkills,
    expertiseSkills,
    activeClassSaves
  };
}
