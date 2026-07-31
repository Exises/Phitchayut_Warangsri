// --- Helpers & Constants ---
export const ALL_SKILLS_LIST = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 
  'Sleight of Hand', 'Stealth', 'Survival'
];

export const SKILL_ABILITY_MAP = {
  'Acrobatics': 'dex',
  'Animal Handling': 'wis',
  'Arcana': 'int',
  'Athletics': 'str',
  'Deception': 'cha',
  'History': 'int',
  'Insight': 'wis',
  'Intimidation': 'cha',
  'Investigation': 'int',
  'Medicine': 'wis',
  'Nature': 'int',
  'Perception': 'wis',
  'Performance': 'cha',
  'Persuasion': 'cha',
  'Religion': 'int',
  'Sleight of Hand': 'dex',
  'Stealth': 'dex',
  'Survival': 'wis'
};

export const ARTISAN_TOOLS_LIST = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", 
  "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools", 
  "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools", 
  "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies", 
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", 
  "Weaver's Tools", "Woodcarver's Tools"
];

export const MUSICAL_INSTRUMENTS_LIST = [
  "Bagpipes", "Drum", "Dulcimer", "Flute", "Lute", 
  "Lyre", "Horn", "Pan flute", "Shawm", "Viol"
];

// --- Feat Helpers ---
export const STAT_OPTIONS = [
  { value: 'str', label: 'Strength' },
  { value: 'dex', label: 'Dexterity' },
  { value: 'con', label: 'Constitution' },
  { value: 'int', label: 'Intelligence' },
  { value: 'wis', label: 'Wisdom' },
  { value: 'cha', label: 'Charisma' }
];

export const getFeatConfig = (featId, dbData) => {
  if (!dbData || !dbData.feats) return { type: 'standard' };
  const feat = dbData.feats.find(f => f.feat_id === featId);
  if (!feat || !feat.stat_options) return { type: 'standard' };
  
  try {
      const options = typeof feat.stat_options === 'string' ? JSON.parse(feat.stat_options) : feat.stat_options;
      if (options && options.type) {
          return options; // returns { type: 'asi'|'half', choices: [...], points: 1|2, max: 20|30 }
      }
  } catch (e) {
      console.error("Failed to parse stat_options for feat:", featId, e);
  }
  
  return { type: 'standard' };
};

export const calculateTotalAbilities = (state, dbData) => {
  const stats = {
    str: Number(state.abilities?.base?.str) || 8,
    dex: Number(state.abilities?.base?.dex) || 8,
    con: Number(state.abilities?.base?.con) || 8,
    int: Number(state.abilities?.base?.int) || 8,
    wis: Number(state.abilities?.base?.wis) || 8,
    cha: Number(state.abilities?.base?.cha) || 8
  };
  const maxStats = { str: 20, dex: 20, con: 20, int: 20, wis: 20, cha: 20 };

  // 1. Add Background / Racial Bonuses
  const bgBonuses = state.abilities.backgroundBonus || state.abilities.racialBonus || {};
  Object.keys(bgBonuses).forEach(k => {
    stats[k] = (stats[k] || 8) + (bgBonuses[k] || 0);
  });

  // 2. Add Feat & ASI Bonuses
  (state.classData?.classes || []).forEach(cl => {
    Object.entries(cl.featureChoices || {}).forEach(([k, choices]) => {
      if (!k.startsWith('Ability Score Improvement') && !k.startsWith('Epic Boon')) return;
      
      choices.forEach(choiceObj => {
        if (!choiceObj || typeof choiceObj === 'string') return; // Ignore legacy or empty strings
        
        const { id, bonuses } = choiceObj;
        if (!id || !bonuses) return;
        
        const config = getFeatConfig(id, dbData);
        
        if (config.type === 'asi') {
          if (bonuses.mode === 'plus_two' || !bonuses.mode) {
            if (bonuses.stat1) stats[bonuses.stat1] += 2;
          } else if (bonuses.mode === 'plus_one_twice') {
            if (bonuses.stat1) stats[bonuses.stat1] += 1;
            if (bonuses.stat2) stats[bonuses.stat2] += 1;
          }
        } else if (config.type === 'half') {
          if (bonuses.stat1) stats[bonuses.stat1] += 1;
        }

        // Epic Boons can increase max limit to 30, but standard feats cap at 20
        if (id.startsWith('boon-')) {
          if (bonuses.stat1) maxStats[bonuses.stat1] = 30;
          if (bonuses.stat2) maxStats[bonuses.stat2] = 30;
        }
      });
    });
  });

  // 3. Add Global Feats Bonuses (e.g., from Background or other sources)
  (state.feats || []).forEach(feat => {
      if (!feat || !feat.id || !feat.bonuses) return;
      const config = getFeatConfig(feat.id, dbData);
      
      if (config.type === 'asi') {
        if (feat.bonuses.mode === 'plus_two' || !feat.bonuses.mode) {
          if (feat.bonuses.stat1) stats[feat.bonuses.stat1] += 2;
        } else if (feat.bonuses.mode === 'plus_one_twice') {
          if (feat.bonuses.stat1) stats[feat.bonuses.stat1] += 1;
          if (feat.bonuses.stat2) stats[feat.bonuses.stat2] += 1;
        }
      } else if (config.type === 'half') {
        if (feat.bonuses.stat1) stats[feat.bonuses.stat1] += 1;
      }
      
      if (feat.id.startsWith('boon-')) {
          if (feat.bonuses.stat1) maxStats[feat.bonuses.stat1] = 30;
          if (feat.bonuses.stat2) maxStats[feat.bonuses.stat2] = 30;
      }
  });

  // Apply maximum limits (usually 20)
  Object.keys(stats).forEach(k => {
    if (stats[k] > maxStats[k]) stats[k] = maxStats[k];
  });

  return stats;
};

export const formatCleanName = (nameStr) => {
  if (!nameStr) return '';
  let s = String(nameStr).trim();
  s = s.replace(/[-_]/g, ' ');
  const smallWords = new Set(['of', 'and', 'the', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'a', 'an']);
  const acronyms = new Set(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'HP', 'AC', 'DC', 'NPC', 'PC', 'PHB', 'SRD', 'DM', 'ID', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']);
  s = s.split(/\s+/).map((word, idx) => {
    const upperWord = word.toUpperCase();
    if (acronyms.has(upperWord)) return upperWord;
    if (idx > 0 && smallWords.has(word.toLowerCase())) {
      return word.toLowerCase();
    }
    if (word.startsWith('(') && word.length > 1) {
      return '(' + word.charAt(1).toUpperCase() + word.slice(2).toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
  s = s.replace(/Magic Initiate\s*\(?([A-Za-z]+)\)?/i, (match, p1) => `Magic Initiate (${p1.charAt(0).toUpperCase() + p1.slice(1).toLowerCase()})`);
  s = s.replace(/Fighting Style\s*[:(-]?\s*([A-Za-z]+)\)?/i, (match, p1) => `Fighting Style: ${p1.charAt(0).toUpperCase() + p1.slice(1).toLowerCase()}`);
  return s;
};

export const getFeatName = (featId, dbData) => {
  if (!featId) return '';
  const cleanId = String(featId).toLowerCase().replace(/[-_]/g, '');
  const featDb = dbData?.feats?.find(f => {
    const fId = String(f.feat_id || '').toLowerCase().replace(/[-_]/g, '');
    const fName = String(f.feat_name || f.name || '').toLowerCase().replace(/[-_]/g, '');
    return fId === cleanId || fName === cleanId || cleanId.startsWith(fId) || fId.startsWith(cleanId);
  });
  return formatCleanName(featDb?.feat_name || featDb?.name || featId);
};

export const getEnhancedFeatDesc = (featDb, featId) => {
  const idStr = String(featDb?.feat_id || featDb?.feat_name || featDb?.name || featId || '').toLowerCase();
  
  if (idStr.includes('magic-initiate') || idStr.includes('magic initiate')) {
    let listName = 'Cleric, Druid, or Wizard';
    if (idStr.includes('cleric')) listName = 'Cleric';
    else if (idStr.includes('druid')) listName = 'Druid';
    else if (idStr.includes('wizard')) listName = 'Wizard';
    return `You gain the following benefits:<ul><li><strong>Two Cantrips.</strong> You learn two cantrips of your choice from the ${listName} spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat's spells.</li><li><strong>Level 1 Spell.</strong> Choose a level 1 spell from the ${listName} spell list. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.</li><li><strong>Spell Change.</strong> Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.</li><li><strong>Repeatable.</strong> You can take this feat more than once, but you must choose a different spell list each time.</li></ul>`;
  }

  if (idStr.includes('lucky')) {
    return `You gain the following benefits:<ul><li><strong>Luck Points.</strong> You have a number of Luck Points equal to your Proficiency Bonus. You regain all expended Luck Points when you finish a Long Rest.</li><li><strong>Advantage.</strong> Immediately after you roll a d20 for a D20 Test, you can spend 1 Luck Point to give yourself Advantage on the roll.</li><li><strong>Disadvantage.</strong> When a creature rolls a d20 for an attack roll against you, you can spend 1 Luck Point to give Disadvantage to that roll.</li></ul>`;
  }

  if (idStr.includes('alert')) {
    return `You gain the following benefits:<ul><li><strong>Initiative Proficiency.</strong> You add your Proficiency Bonus to your Initiative rolls.</li><li><strong>Initiative Swap.</strong> Immediately after rolling Initiative, you can swap your Initiative roll with the Initiative roll of one willing ally who is within 10 feet of you and not Incapacitated.</li></ul>`;
  }

  if (idStr.includes('crafter')) {
    return `You gain the following benefits:<ul><li><strong>Tool Proficiency.</strong> You gain proficiency with three different Artisan's Tools of your choice.</li><li><strong>Discount.</strong> Whenever you buy a nonmagical item, you receive a 20 percent discount on it.</li><li><strong>Fast Crafting.</strong> When you craft an item using Artisan's Tools, the crafting time is reduced by 20 percent.</li></ul>`;
  }

  if (idStr.includes('healer')) {
    return `You gain the following benefits:<ul><li><strong>Battle Medic.</strong> As an action, you can spend one use of a Healer's Kit to tend to a creature within 5 feet. That creature can expend one of its Hit Dice, and you roll that die. The creature regains HP equal to the roll plus your Proficiency Bonus.</li><li><strong>Healing Rerolls.</strong> Whenever you roll a die to determine the number of HP restored by a spell or feat, you can reroll a 1 on the die.</li></ul>`;
  }

  if (idStr.includes('musician')) {
    return `You gain the following benefits:<ul><li><strong>Instrument Training.</strong> You gain proficiency with three Musical Instruments of your choice.</li><li><strong>Inspiring Song.</strong> As part of a Short or Long Rest, you can play a musical instrument to inspire up to a number of allies equal to your Proficiency Bonus. Each inspired ally gains Heroic Inspiration.</li></ul>`;
  }

  if (idStr.includes('savage attacker') || idStr.includes('savage-attacker')) {
    return `You've trained to deal particularly damaging strikes. Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll against the target.`;
  }

  if (idStr.includes('skilled')) {
    return `You gain proficiency in any combination of three skills or tools of your choice.<br/><em>Repeatable.</em> You can take this feat more than once.`;
  }

  if (idStr.includes('tavern brawler') || idStr.includes('tavern-brawler')) {
    return `You gain the following benefits:<ul><li><strong>Enhanced Unarmed Strike.</strong> When you hit with an Unarmed Strike, you can deal 1d4 + Strength modifier damage instead of normal damage.</li><li><strong>Damage Rerolls.</strong> Whenever you roll a 1 on a damage die for an Unarmed Strike, you can reroll that die.</li><li><strong>Push/Grapple.</strong> When you hit with an Unarmed Strike as part of the Attack action, you can push the target 5 feet away or give them the Grappled condition.</li></ul>`;
  }

  if (idStr.includes('tough')) {
    return `Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.`;
  }

  const dbDesc = featDb?.description || featDb?.feat_desc || featDb?.display;
  if (dbDesc && dbDesc !== 'No description available.') return dbDesc;

  return 'No description available.';
};

export const getAllInnateAndFeatureSpells = (characterState, dbData) => {
  if (!characterState || !dbData) return [];
  const harvested = [];
  const seenIds = new Set();

  const addSpell = (spellId, source, ability = 'int', hasFreeCast = true, canUseSlots = true) => {
    if (!spellId || typeof spellId !== 'string') return;
    const cleanId = spellId.toLowerCase().trim();
    if (!cleanId || cleanId.length < 2) return;
    const mdSp = parsedSpellsCatalog[cleanId] || Object.values(parsedSpellsCatalog).find(ps => ps.name.toLowerCase() === cleanId);
    const dbSp = dbData.spells?.find(s => String(s.spell_id || '').toLowerCase() === cleanId || String(s.spell_name || '').toLowerCase() === cleanId) || (mdSp ? {
      spell_id: mdSp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      spell_name: mdSp.name,
      spell_level: mdSp.level,
      school: mdSp.school,
      casting_time: mdSp.casting_time,
      spell_range: mdSp.range,
      components: mdSp.components,
      duration: mdSp.duration,
      description: mdSp.description
    } : null);
    if (!dbSp) return;
    const parsedLvl = parseInt(dbSp.spell_level || 0, 10);
    const uniqueKey = `${dbSp.spell_id}_${source}`;
    if (!seenIds.has(uniqueKey)) {
      seenIds.add(uniqueKey);
      harvested.push({
        id: dbSp.spell_id,
        name: dbSp.spell_name || dbSp.name,
        level: parsedLvl,
        ability: ability || 'int',
        source: source || 'Innate / Feat',
        hasFreeCast: parsedLvl === 0 ? false : (hasFreeCast !== undefined ? hasFreeCast : true),
        canUseSlots: canUseSlots !== undefined ? canUseSlots : true
      });
    }
  };

  const totalLvl = (characterState.classData?.classes || characterState.classes || []).reduce((acc, c) => acc + (parseInt(c.level, 10) || 1), 0) || 1;

  // 1. Racial / Lineage Innate Spells
  if (Array.isArray(characterState.spells?.innate)) {
    characterState.spells.innate.forEach(spItem => {
      const spId = typeof spItem === 'object' ? (spItem.spell_id || spItem.name || spItem.id) : spItem;
      const ability = typeof spItem === 'object' ? (spItem.ability || spItem.stat || 'int') : 'int';
      const source = typeof spItem === 'object' ? (spItem.source || 'Species / Lineage') : 'Species / Lineage';
      addSpell(spId, source, ability, true, true);
    });
  }

  // 1b. Racial / Species Trait Choices (e.g. High Elf cantrip choice)
  if (characterState.race?.traitChoices) {
    Object.values(characterState.race.traitChoices).forEach(val => {
      const vals = Array.isArray(val) ? val : [val];
      vals.forEach(v => {
        if (typeof v === 'string' && v.trim()) {
          addSpell(v, `Species (${characterState.race.id || 'Race'})`, 'int', true, true);
        }
      });
    });
  }
  if (characterState.race?.lineageSpellChoice) {
    addSpell(characterState.race.lineageSpellChoice, `Lineage (${characterState.race.lineageId || 'Race'})`, 'int', true, true);
  }

  // 1c. DB Racial & Lineage Granted Spells
  const raceObj = dbData.races?.find(r => r.species_id === characterState.race?.id || r.name?.toLowerCase() === characterState.race?.id?.toLowerCase());
  const lineageObj = dbData.lineages?.find(l => l.lineage_id === characterState.race?.lineageId || l.lineage_id === characterState.race?.subraceId);
  const raceSpellAbility = characterState.race?.lineageSpellAbility || 'int';

  if (raceObj?.granted_spells) {
    try {
      const gSp = typeof raceObj.granted_spells === 'string' ? JSON.parse(raceObj.granted_spells) : raceObj.granted_spells;
      if (Array.isArray(gSp)) {
        gSp.forEach(s => {
          const reqLvl = parseInt(s.level || s.required_level || 1, 10) || 1;
          if (reqLvl <= totalLvl) {
            const spId = s.spell_id || s.name || s.spell_name;
            addSpell(spId, `Species (${raceObj.species_name || raceObj.name || 'Race'})`, s.ability || raceSpellAbility, true, true);
          }
        });
      }
    } catch { /* ignore */ }
  }
  if (raceObj?.traits) {
    try {
      const traits = typeof raceObj.traits === 'string' ? JSON.parse(raceObj.traits) : raceObj.traits;
      if (Array.isArray(traits)) {
        traits.forEach(t => {
          const reqLvl = parseInt(t.level || t.required_level || 1, 10) || 1;
          if (reqLvl <= totalLvl && t.logic && Array.isArray(t.logic.granted_spells)) {
            t.logic.granted_spells.forEach(s => {
              const spId = typeof s === 'string' ? s : (s.spell_id || s.name);
              const spLvl = typeof s === 'object' ? (parseInt(s.level || s.required_level || reqLvl, 10) || reqLvl) : reqLvl;
              if (spLvl <= totalLvl) {
                addSpell(spId, `Species (${raceObj.species_name || raceObj.name || 'Race'})`, raceSpellAbility, true, true);
              }
            });
          }
        });
      }
    } catch { /* ignore */ }
  }
  if (lineageObj?.granted_spells) {
    try {
      const gSp = typeof lineageObj.granted_spells === 'string' ? JSON.parse(lineageObj.granted_spells) : lineageObj.granted_spells;
      if (Array.isArray(gSp)) {
        gSp.forEach(s => {
          const reqLvl = parseInt(s.level || s.required_level || 1, 10) || 1;
          if (reqLvl <= totalLvl) {
            if (s.is_choice && characterState.race?.lineageSpellChoice) {
              addSpell(characterState.race.lineageSpellChoice, `Lineage (${lineageObj.lineage_name || lineageObj.name || 'Lineage'})`, raceSpellAbility, true, true);
            } else if (!s.is_choice) {
              const spId = s.spell_id || s.name || s.spell_name;
              addSpell(spId, `Lineage (${lineageObj.lineage_name || lineageObj.name || 'Lineage'})`, s.ability || raceSpellAbility, true, true);
            }
          }
        });
      }
    } catch { /* ignore */ }
  }

  // Helper to harvest from a feat bonus object
  const harvestFeatBonuses = (featId, bonuses, sourceLabel) => {
    if (!bonuses || typeof bonuses !== 'object') return;
    const ability = bonuses.stat || bonuses.spellcastingAbility || bonuses.ability || 'int';
    const cleanFeat = String(featId || '').toLowerCase();

    if (bonuses.cantrip1) addSpell(bonuses.cantrip1, sourceLabel, ability, false, true);
    if (bonuses.cantrip2) addSpell(bonuses.cantrip2, sourceLabel, ability, false, true);
    if (bonuses.spell1) addSpell(bonuses.spell1, sourceLabel, ability, true, true);
    if (bonuses.spell2) addSpell(bonuses.spell2, sourceLabel, ability, true, true);

    Object.entries(bonuses).forEach(([bKey, bVal]) => {
      if ((bKey.startsWith('cantrip') || bKey.startsWith('spell') || bKey.startsWith('bonusSpell') || bKey.startsWith('learnedSpell')) && typeof bVal === 'string' && bVal.trim()) {
        const isCantrip = bKey.startsWith('cantrip');
        addSpell(bVal, sourceLabel, ability, !isCantrip, true);
      } else if (Array.isArray(bVal)) {
        bVal.forEach(item => {
          if (typeof item === 'string' && item.trim()) {
            addSpell(item, sourceLabel, ability, true, true);
          }
        });
      }
    });

    if (cleanFeat.includes('fey-touched') || cleanFeat.includes('fey touched')) {
      addSpell('misty-step', sourceLabel, ability, true, true);
    }
    if (cleanFeat.includes('shadow-touched') || cleanFeat.includes('shadow touched')) {
      addSpell('invisibility', sourceLabel, ability, true, true);
    }
    if (cleanFeat.includes('telepathic')) {
      addSpell('detect-thoughts', sourceLabel, ability, true, true);
    }
    if (cleanFeat.includes('telekinetic')) {
      addSpell('mage-hand', sourceLabel, ability, false, true);
    }
  };

  // 2. Background Origin Feats
  const bgFeats = characterState.background?.originFeats || characterState.background?.feats || [];
  if (Array.isArray(bgFeats)) {
    bgFeats.forEach(f => {
      const fId = typeof f === 'object' ? (f.featId || f.id || f.name) : f;
      const fBonuses = typeof f === 'object' ? (f.bonuses || f.choices || {}) : {};
      const featName = getFeatName(fId, dbData);
      harvestFeatBonuses(fId, fBonuses, `Background Feat (${featName})`);
    });
  }

  // 3. General Feats
  const genFeats = characterState.feats || [];
  if (Array.isArray(genFeats)) {
    genFeats.forEach(f => {
      const fId = typeof f === 'object' ? (f.featId || f.id || f.name) : f;
      const fBonuses = typeof f === 'object' ? (f.bonuses || f.choices || {}) : {};
      const featName = getFeatName(fId, dbData);
      const isBg = typeof f === 'object' && f.source === 'background';
      harvestFeatBonuses(fId, fBonuses, isBg ? `Background Feat (${featName})` : `Feat (${featName})`);
    });
  }

  // 4. Class Feature Choices, Magical Discoveries, Level-up Feats & Subclasses
  const classList = characterState.classData?.classes || characterState.classes || [];
  classList.forEach(cl => {
    const className = dbData.classes?.find(c => c.class_id === cl.classId)?.class_name || cl.classId || 'Class';
    if (cl.classId === 'bard' && cl.level >= 20) {
      addSpell('power-word-kill', `${className} (Level 20)`, 'cha', true, true);
      addSpell('power-word-heal', `${className} (Level 20)`, 'cha', true, true);
    }
    const choices = cl.featureChoices || {};
    Object.entries(choices).forEach(([k, v]) => {
      if (k.startsWith('Magical Discoveries') && Array.isArray(v)) {
        v.forEach(spId => addSpell(spId, `${className} Feature (Magical Discoveries)`, 'cha', false, true));
      } else if (k.startsWith('Spell Mastery') && Array.isArray(v)) {
        v.forEach(spId => addSpell(spId, `${className} Feature (Spell Mastery)`, 'int', true, true));
      } else if (k.startsWith('Signature Spells') && Array.isArray(v)) {
        v.forEach(spId => addSpell(spId, `${className} Feature (Signature Spells)`, 'int', true, true));
      } else if (Array.isArray(v)) {
        v.forEach(item => {
          if (typeof item === 'string' && item.trim()) {
            addSpell(item, `${className} Feature (${k})`, 'cha', true, true);
          } else if (item && typeof item === 'object') {
            const fId = item.id || item.featId || item.name;
            const fBon = item.bonuses || item.choices || {};
            if (fId) {
              const featName = getFeatName(fId, dbData) || fId;
              harvestFeatBonuses(fId, fBon, `${className} Feat (${featName})`);
            } else {
              harvestFeatBonuses(k, item, `${className} Feature (${k})`);
            }
          }
        });
      } else if (typeof v === 'object' && v !== null) {
        const fId = v.id || v.featId || v.name;
        const fBon = v.bonuses || v.choices || {};
        if (fId) {
          const featName = getFeatName(fId, dbData) || fId;
          harvestFeatBonuses(fId, fBon, `${className} Feat (${featName})`);
        } else {
          harvestFeatBonuses(k, v, `${className} Feature (${k.split('_')[0]})`);
        }
      } else if (typeof v === 'string' && v.trim()) {
        addSpell(v, `${className} Feature (${k})`, 'int', true, true);
      }
    });

    if (cl.subclassId && dbData.subclasses) {
      const subInfo = dbData.subclasses.find(s => s.subclass_id === cl.subclassId);
      const subName = subInfo?.subclass_name || cl.subclassId;
      const subSpellsRaw = subInfo?.spells || subInfo?.granted_spells;
      if (subSpellsRaw) {
        try {
          const parsed = typeof subSpellsRaw === 'string' ? JSON.parse(subSpellsRaw) : subSpellsRaw;
          if (Array.isArray(parsed)) {
            parsed.forEach(s => {
              const reqLvl = parseInt(s.level || s.required_level || 1, 10) || 1;
              if (reqLvl <= (parseInt(cl.level, 10) || 1)) {
                const spId = typeof s === 'string' ? s : (s.spell_id || s.name);
                addSpell(spId, `${className} Subclass (${subName})`, 'cha', true, true);
              }
            });
          }
        } catch { /* ignore */ }
      }
      if (subInfo?.features) {
        try {
          const subFeats = typeof subInfo.features === 'string' ? JSON.parse(subInfo.features) : subInfo.features;
          if (Array.isArray(subFeats)) {
            subFeats.forEach(sf => {
              const sfLvl = parseInt(sf.level || 1, 10) || 1;
              if (sfLvl <= (parseInt(cl.level, 10) || 1) && sf.spells) {
                const sfSpRaw = typeof sf.spells === 'string' ? JSON.parse(sf.spells) : sf.spells;
                if (Array.isArray(sfSpRaw)) {
                  sfSpRaw.forEach(spId => addSpell(spId, `${subName} (${sf.name || sf.title || 'Feature'})`, 'cha', true, true));
                }
              }
            });
          }
        } catch { /* ignore */ }
      }
    }

    const classInfo = dbData.classes?.find(c => c.class_id === cl.classId || c.name?.toLowerCase() === cl.classId?.toLowerCase());
    if (classInfo?.features) {
      try {
        const clFeats = typeof classInfo.features === 'string' ? JSON.parse(classInfo.features) : classInfo.features;
        if (Array.isArray(clFeats)) {
          clFeats.forEach(cf => {
            const cfLvl = parseInt(cf.level || 1, 10) || 1;
            if (cfLvl <= (parseInt(cl.level, 10) || 1) && cf.spells) {
              const cfSpRaw = typeof cf.spells === 'string' ? JSON.parse(cf.spells) : cf.spells;
              if (Array.isArray(cfSpRaw)) {
                cfSpRaw.forEach(spId => addSpell(spId, `${className} (${cf.name || cf.title || 'Feature'})`, 'int', true, true));
              }
            }
          });
        }
      } catch { /* ignore */ }
    }
  });

  return harvested;
};

export const deduplicateSubclasses = (subclasses, currentSelectedId = null) => {
  if (!Array.isArray(subclasses)) return subclasses;
  const map = new Map();
  subclasses.forEach(sc => {
    const key = `${sc.class_id}_${sc.subclass_name}`.toLowerCase().trim();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, sc);
    } else {
      if (sc.subclass_id === currentSelectedId) {
        map.set(key, sc);
      } else if (existing.subclass_id !== currentSelectedId) {
        const scScore = (sc.srd_source ? 2 : 0) + (sc.subclass_id.includes('sorcery') || sc.srd_source?.includes('5.2') ? 1 : 0);
        const exScore = (existing.srd_source ? 2 : 0) + (existing.subclass_id.includes('sorcery') || existing.srd_source?.includes('5.2') ? 1 : 0);
        if (scScore > exScore) {
          map.set(key, sc);
        }
      }
    }
  });
  return Array.from(map.values());
};

export const purgeOnLevelDowngrade = (classObj, newLevel) => {
  const updated = { ...classObj, level: newLevel };
  if (newLevel < 3) {
    updated.subclassId = null;
  }
  const currentChoices = classObj.featureChoices || {};
  const updatedChoices = {};
  for (const [key, val] of Object.entries(currentChoices)) {
    const match = key.match(/_Lv(\d+)$/);
    if (match) {
      const featLevel = parseInt(match[1], 10);
      if (featLevel <= newLevel) {
        if (key === 'Metamagic_Lv2' && Array.isArray(val)) {
          const quota = newLevel >= 17 ? 6 : (newLevel >= 10 ? 4 : 2);
          updatedChoices[key] = val.slice(0, quota);
        } else {
          updatedChoices[key] = val;
        }
      }
    } else {
      updatedChoices[key] = val;
    }
  }
  updated.featureChoices = updatedChoices;
  return updated;
};

export const stripAppendixFromFeature = (rawHtml) => {
  if (!rawHtml || typeof rawHtml !== 'string') return rawHtml;
  if (!rawHtml.includes('Metamagic Options') && !rawHtml.includes('Spell List') && !rawHtml.includes('Eldritch Invocation')) return rawHtml;

  const match = rawHtml.match(/(?:<p[^>]*>\s*)?###\s*(?:Metamagic Options|Eldritch Invocation Options|[A-Za-z\s]+Spell List)/i);
  if (match) {
    return rawHtml.substring(0, match.index).trim();
  }
  return rawHtml;
};

export const cleanAndStyleHtml = (fName, rawHtml) => {
  if (!rawHtml) return '';
  let html = rawHtml;

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/_([^_]+)_/g, '<em style="font-weight: 600; color: #1e293b;">$1</em>');
  html = html.replace(/\n\n/g, '<br/><br/>');
  html = html.replace(/>(?:\s*n\s*)+</g, '><');
  html = stripAppendixFromFeature(html);

  if (fName === 'Channel Divinity' && html.includes('Breaking Your Oath')) {
    const saveRule = '<p style="margin-top: 14px; margin-bottom: 0; color: #4b5563;"><strong>Channel Divinity Saving Throws.</strong> If a Channel Divinity effect requires a saving throw, the DC equals the spell save DC from this class\'s Spellcasting feature.</p>';
    
    html = html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i, (match, bContent) => {
      let cleaned = bContent
        .replace(/###\s*Breaking Your Oath(<br\s*\/?>)?/i, '')
        .replace(/&gt;(<br\s*\/?>)?/g, '')
        .replace(/If a Channel Divinity effect requires a saving throw[\s\S]*/i, '')
        .trim();
      
      return `<div style="background: linear-gradient(135deg, #2a1b1b 0%, #1a1414 100%); border: 1px solid #572929; border-left: 4px solid #8b0000; border-radius: 4px; padding: 16px 18px; margin: 16px 0; color: #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">` +
        `<div style="color: #ef4444; font-family: var(--font-header, serif); font-size: 1.05rem; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #3f1f1f; padding-bottom: 8px;">` +
          `<i class="fa-solid fa-heart-crack"></i> Breaking Your Oath` +
        `</div>` +
        `<div style="font-size: 0.88rem; line-height: 1.6; color: #d1c5c5;">${cleaned}</div>` +
      `</div>`;
    });

    if (!html.includes('Channel Divinity Saving Throws')) {
      html += saveRule;
    }
  }

  if (html.includes('<table') || html.includes('<thead')) {
    if (html.includes('<thead') && !html.includes('<table')) {
      html = html.replace(/(<thead[\s\S]*?<\/tbody>)/gi, '<table>$1</table>');
    }
    html = html.replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, '');
    html = html.replace(/<p>\s*(<table[\s\S]*?<\/table>)\s*<\/p>/gi, '$1');
    html = html.replace(/<tr>\s*(?:<td>\s*<\/td>|<th>\s*<\/th>|\s)*<\/tr>/gi, '');

    html = html.replace(/<table\b[^>]*>/gi, '<table style="width: 100%; border-collapse: collapse; margin: 12px 0 16px 0; border: 1px solid #94a3b8; text-align: left; font-size: 0.85rem; background-color: white;">');
    html = html.replace(/<th\b[^>]*>/gi, '<th style="padding: 8px 12px; border: 1px solid #94a3b8; background-color: #1e293b; color: white; font-weight: 600; text-align: left;">');
    html = html.replace(/<td\b[^>]*>/gi, '<td style="padding: 8px 12px; border: 1px solid #94a3b8; color: #1e293b;">');
  }

  return html;
};

export const toggleMultiLevelFilter = (currentLevels, targetLvl) => {
  if (targetLvl === 'all') return ['all'];
  let list = Array.isArray(currentLevels) ? [...currentLevels] : [currentLevels];
  list = list.filter(l => l !== 'all');
  if (list.includes(String(targetLvl))) {
    list = list.filter(l => l !== String(targetLvl));
  } else {
    list.push(String(targetLvl));
  }
  return list.length === 0 ? ['all'] : list;
};

export const matchesMultiLevel = (spellLevelVal, filterLevels) => {
  const list = Array.isArray(filterLevels) ? filterLevels : [filterLevels];
  if (list.includes('all')) return true;
  const sLvl = String(spellLevelVal || 0);
  return list.some(l => l === 'cantrip' ? sLvl === '0' : sLvl === String(l));
};

export const formatTableFeatureNames = (clsName, level, features) => {
  const cName = clsName ? clsName.charAt(0).toUpperCase() + clsName.slice(1).toLowerCase() : '';
  const cid = clsName ? clsName.toLowerCase() : '';
  const lvlNum = typeof level === 'object' && level !== null ? parseInt(level.level) : parseInt(level);

  const blankLevels = {
    bard: [11, 13, 15, 17],
    cleric: [9, 11, 13, 15, 18],
    druid: [9, 11, 13, 17],
    paladin: [13, 17],
    sorcerer: [9, 11, 13, 15],
    warlock: [5, 7, 18],
    wizard: [7, 11, 13, 15, 17]
  };

  if (blankLevels[cid]?.includes(lvlNum)) {
    return '—';
  }

  const subclassLevels = {
    barbarian: [6, 10, 14],
    bard: [6, 14],
    cleric: [6, 17],
    druid: [6, 10, 14],
    fighter: [6, 10, 15],
    monk: [6, 11, 17],
    paladin: [7, 15],
    ranger: [7, 11, 15],
    rogue: [9, 13, 17],
    sorcerer: [6, 14, 18],
    warlock: [6, 10, 14],
    wizard: [6, 10, 14]
  };

  if ((!features || features.length === 0) && subclassLevels[cid]?.includes(lvlNum)) {
    return 'Subclass feature';
  }
  if (!features || features.length === 0) {
    return '—';
  }

  let names = features.map(f => {
    let name = typeof f === 'string' ? f : (f.name || '');
    name = name.replace(/\s*\((?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+uses?\)/gi, '')
               .replace(/\s*\([dD]\d+\)/g, '')
               .replace(new RegExp(`\\s*\\(${cName}\\)`, 'gi'), '');
    return name.trim();
  }).filter(Boolean);

  if (lvlNum === 3) {
    const subName = `${cName} Subclass`;
    names = names.map(n => {
      if (['primal path', 'bardic college', 'divine domain', 'druid circle', 'martial archetype', 'monastic tradition', 'sacred oath', 'ranger archetype', 'roguish archetype', 'sorcerous origin', 'otherworldly patron', 'arcane tradition'].includes(n.toLowerCase()) || n.toLowerCase().includes('subclass')) {
        return subName;
      }
      return n;
    });
    if (!names.includes(subName)) {
      names.unshift(subName);
    }
  }

  if (subclassLevels[cid]?.includes(lvlNum)) {
    names = names.map(n => {
      if (n.toLowerCase().includes('subclass') || n.toLowerCase().includes('tradition') || n.toLowerCase().includes('circle') || n.toLowerCase().includes('domain') || n.toLowerCase().includes('path') || n.toLowerCase().includes('college') || n.toLowerCase().includes('archetype') || n.toLowerCase().includes('oath') || n.toLowerCase().includes('patron') || n.toLowerCase().includes('origin')) {
        return 'Subclass feature';
      }
      return n;
    });
    if (names.length === 0) names = ['Subclass feature'];
  }

  if (cid === 'fighter') {
    names = names.map(n => {
      if (n === 'Action Surge') {
        if (lvlNum === 2) return 'Action Surge (one use)';
        if (lvlNum === 17) return 'Action Surge (two uses)';
      }
      if (n === 'Indomitable') {
        if (lvlNum === 9) return 'Indomitable (one use)';
        if (lvlNum === 13) return 'Indomitable (two uses)';
        if (lvlNum === 17) return 'Indomitable (three uses)';
      }
      return n;
    });
  }

  if (cid === 'monk' && lvlNum === 4) {
    if (names.includes('Slow Fall') && names.includes('Ability Score Improvement')) {
      return 'Ability Score Improvement, Slow Fall';
    }
  }

  names = [...new Set(names)];
  return names.length > 0 ? names.join(', ') : '—';
};

import parsedSpellsCatalog from '../data/parsed_spells_catalog.json';

export const enrichSpellsCatalog = (rawSpells = []) => {
  const spellMap = new Map();

  // 1. Add all DB spells
  (rawSpells || []).forEach(s => {
    if (s && (s.spell_id || s.spell_name || s.name)) {
      const key = String(s.spell_id || s.spell_name || s.name).toLowerCase().trim();
      spellMap.set(key, s);
    }
  });

  // 2. Add or enrich with all 342 Markdown spells from parsed_spells_catalog.json
  Object.values(parsedSpellsCatalog).forEach(mdSp => {
    const key = mdSp.name.toLowerCase().trim();
    const id = mdSp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const existing = spellMap.get(key) || spellMap.get(id);

    if (existing) {
      const currentDesc = existing.description || existing.spell_desc || '';
      if (!currentDesc || currentDesc.length < 15 || currentDesc.includes('No description')) {
        existing.description = mdSp.description;
        existing.spell_desc = mdSp.description;
      }
      if (!existing.casting_time && mdSp.casting_time) existing.casting_time = mdSp.casting_time;
      if (!existing.spell_range && mdSp.range) existing.spell_range = mdSp.range;
      if (!existing.range && mdSp.range) existing.range = mdSp.range;
      if (!existing.components && mdSp.components) existing.components = mdSp.components;
      if (!existing.duration && mdSp.duration) existing.duration = mdSp.duration;
      if (!existing.school && mdSp.school) existing.school = mdSp.school;
      if (!existing.classes && mdSp.classes) existing.classes = mdSp.classes;
      if (existing.spell_level === undefined && mdSp.level !== undefined) existing.spell_level = mdSp.level;
    } else {
      spellMap.set(key, {
        spell_id: id,
        spell_name: mdSp.name,
        name: mdSp.name,
        spell_level: mdSp.level,
        level: mdSp.level,
        school: mdSp.school,
        classes: mdSp.classes,
        casting_time: mdSp.casting_time,
        spell_range: mdSp.range,
        range: mdSp.range,
        components: mdSp.components,
        duration: mdSp.duration,
        description: mdSp.description,
        spell_desc: mdSp.description
      });
    }
  });

  return Array.from(spellMap.values());
};
