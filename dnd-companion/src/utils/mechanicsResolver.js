/**
 * Mechanics Resolver Engine
 * Calculates real-time combat stats (AC, HP, Speed, Attacks, Resistances, Proficiencies)
 * based on character state, class progression, and selected feature choices.
 */
import { ALL_SKILLS_LIST } from './workshopHelpers.js';

export const resolveUnarmedStrike = (characterState) => {
  const abilities = characterState?.abilities || {};
  const getMod = (val) => Math.floor(((parseInt(val) || 10) - 10) / 2);
  const strMod = getMod(abilities.str);
  const dexMod = getMod(abilities.dex);

  const classList = characterState?.classData?.classes || [];
  let totalLevel = 0;
  let monkLevel = 0;
  let hasUnarmedFighting = false;

  classList.forEach(cl => {
    const lvl = parseInt(cl.level) || 1;
    totalLevel += lvl;
    const cId = String(cl.classId || '').toLowerCase();
    if (cId === 'monk') {
      monkLevel += lvl;
    }
    Object.values(cl.featureChoices || {}).forEach(val => {
      const arr = Array.isArray(val) ? val : [val];
      arr.forEach(v => {
        const str = (typeof v === 'object' && v?.name ? v.name : String(v || '')).toLowerCase();
        if (str.includes('unarmed fighting')) hasUnarmedFighting = true;
      });
    });
  });

  const profBonus = Math.max(2, Math.ceil(totalLevel / 4) + 1);

  // Check feats
  const allFeats = [
    ...(characterState?.feats || []),
    ...(characterState?.background?.originFeats || characterState?.background?.feats || [])
  ];
  let hasTavernBrawler = false;
  allFeats.forEach(f => {
    const name = (typeof f === 'object' && f?.name ? f.name : String(f || '')).toLowerCase();
    if (name.includes('tavern brawler') || name.includes('unarmed fighting')) {
      if (name.includes('tavern brawler')) hasTavernBrawler = true;
      if (name.includes('unarmed fighting')) hasUnarmedFighting = true;
    }
  });

  // Check race / lineage for natural weapons
  const raceId = String(characterState?.race?.id || characterState?.race?.name || '').toLowerCase();
  const lineageId = String(characterState?.race?.lineageId || '').toLowerCase();
  const raceStr = `${raceId} ${lineageId}`;

  // Priority resolution
  let diceStr = 'Flat 1';
  let damageType = 'Bludgeoning';
  let sourceNote = 'Standard Unarmed Strike';
  let useDex = false;

  if (monkLevel > 0) {
    useDex = dexMod > strMod;
    let die = '1d6';
    if (monkLevel >= 17) die = '1d12';
    else if (monkLevel >= 11) die = '1d10';
    else if (monkLevel >= 5) die = '1d8';
    
    diceStr = die;
    damageType = 'Bludgeoning';
    sourceNote = `Martial Arts (Monk Lvl ${monkLevel})`;
  } else if (hasUnarmedFighting) {
    diceStr = '1d8';
    damageType = 'Bludgeoning';
    sourceNote = 'Unarmed Fighting Style';
  } else if (hasTavernBrawler) {
    diceStr = '1d4';
    damageType = 'Bludgeoning';
    sourceNote = 'Tavern Brawler Feat';
  } else if (raceStr.includes('tabaxi') || raceStr.includes('cat')) {
    useDex = dexMod > strMod;
    diceStr = '1d6';
    damageType = 'Slashing';
    sourceNote = 'Tabaxi Claws';
  } else if (raceStr.includes('lizardfolk')) {
    diceStr = '1d6';
    damageType = 'Slashing';
    sourceNote = 'Lizardfolk Bite';
  } else if (raceStr.includes('minotaur')) {
    diceStr = '1d6';
    damageType = 'Piercing';
    sourceNote = 'Minotaur Horns';
  } else if (raceStr.includes('centaur')) {
    diceStr = '1d6';
    damageType = 'Bludgeoning';
    sourceNote = 'Centaur Hooves';
  } else if (raceStr.includes('satyr')) {
    diceStr = '1d6';
    damageType = 'Bludgeoning';
    sourceNote = 'Satyr Ram';
  } else if (raceStr.includes('aarakocra')) {
    useDex = dexMod > strMod;
    diceStr = '1d6';
    damageType = 'Slashing';
    sourceNote = 'Aarakocra Talons';
  } else if (raceStr.includes('leonin')) {
    diceStr = '1d4';
    damageType = 'Slashing';
    sourceNote = 'Leonin Claws';
  }

  const activeStatMod = useDex ? dexMod : strMod;
  const hitBonus = activeStatMod + profBonus;
  const dmgMod = activeStatMod;

  return {
    diceStr,
    damage: diceStr,
    damageType,
    sourceNote,
    useDex,
    hitBonus,
    attackBonus: hitBonus,
    dmgMod,
    activeStatMod
  };
};

export const resolveSpellcasting = (characterState, dbData, profBonus = 2, abilities = {}) => {
  const classList = characterState?.classData?.classes || characterState?.classes || [];
  let totalLevel = 0;
  let spellcastingAbility = 'Intelligence';
  let spellcastingClassesCount = 0;

  classList.forEach(cl => {
    const cid = (cl.classId || '').toLowerCase();
    const lvl = parseInt(cl.level, 10) || 1;
    if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard', 'warlock'].includes(cid)) {
      spellcastingClassesCount++;
      if (cid === 'wizard') spellcastingAbility = 'Intelligence';
      else if (['cleric', 'druid'].includes(cid)) spellcastingAbility = 'Wisdom';
      else spellcastingAbility = 'Charisma';
    } else if (['paladin', 'ranger'].includes(cid) && lvl >= 2) {
      spellcastingClassesCount++;
      spellcastingAbility = cid === 'paladin' ? 'Charisma' : 'Wisdom';
    }
  });

  const isMultiSpellcaster = spellcastingClassesCount > 1;
  classList.forEach(cl => {
    const cid = (cl.classId || '').toLowerCase();
    const scid = (cl.subclassId || '').toLowerCase();
    const lvl = parseInt(cl.level, 10) || 1;
    if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(cid)) {
      totalLevel += lvl;
    } else if (['paladin', 'ranger'].includes(cid)) {
      totalLevel += isMultiSpellcaster ? Math.floor(lvl / 2) : (lvl >= 2 ? Math.ceil(lvl / 2) : 0);
    } else if (cid === 'artificer') {
      totalLevel += Math.ceil(lvl / 2);
    } else if (scid.includes('eldritch') || scid.includes('trickster')) {
      totalLevel += isMultiSpellcaster ? Math.floor(lvl / 3) : (lvl >= 3 ? Math.ceil(lvl / 3) : 0);
    }
  });

  const MULTICLASS_SLOTS = {
    1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2],
    9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1],
    16: [4, 3, 3, 3, 2, 1, 1, 1], 17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
  };

  const slots = MULTICLASS_SLOTS[Math.min(totalLevel, 20)] || [];
  
  const warlockClass = classList.find(cl => (cl.classId || '').toLowerCase() === 'warlock');
  let pactSlots = null;
  if (warlockClass) {
    const lvl = parseInt(warlockClass.level, 10) || 1;
    const PACT_SLOTS_BY_LEVEL = {
      1: { count: 1, level: 1 }, 2: { count: 2, level: 1 }, 3: { count: 2, level: 2 }, 4: { count: 2, level: 2 },
      5: { count: 2, level: 3 }, 6: { count: 2, level: 3 }, 7: { count: 2, level: 4 }, 8: { count: 2, level: 4 },
      9: { count: 2, level: 5 }, 10: { count: 2, level: 5 }, 11: { count: 3, level: 5 }, 12: { count: 3, level: 5 },
      13: { count: 3, level: 5 }, 14: { count: 3, level: 5 }, 15: { count: 3, level: 5 }, 16: { count: 3, level: 5 },
      17: { count: 4, level: 5 }, 18: { count: 4, level: 5 }, 19: { count: 4, level: 5 }, 20: { count: 4, level: 5 }
    };
    pactSlots = PACT_SLOTS_BY_LEVEL[Math.min(lvl, 20)] || { count: 1, level: 1 };
  }

  const getMod = (val) => Math.floor(((parseInt(val, 10) || 10) - 10) / 2);
  const modKey = `${spellcastingAbility.toLowerCase().slice(0, 3)}Mod`;
  let abilityVal = abilities?.[spellcastingAbility.toLowerCase()] ?? abilities?.[spellcastingAbility] ?? 10;
  const spellMod = abilities?.[modKey] !== undefined ? abilities[modKey] : getMod(abilityVal);
  const saveDC = 8 + profBonus + spellMod;
  const attackBonus = profBonus + spellMod;

  let finalSlots = slots;
  if (warlockClass && slots.length === 0) {
    finalSlots = [0, 0, 0, 0, pactSlots ? pactSlots.count : 0];
  }

  return {
    casterLevel: totalLevel,
    slots: finalSlots,
    pactSlots,
    saveDC,
    attackBonus,
    ability: spellcastingAbility
  };
};


export const resolveCharacterMechanics = (characterState, dbData) => {
  if (!characterState) return null;

  // 1. Calculate ability modifiers
  const abilities = characterState.abilities || {};
  const getMod = (val) => Math.floor(((parseInt(val) || 10) - 10) / 2);
  const strVal = abilities.str ?? abilities.Strength ?? abilities?.total?.Strength ?? 10;
  const dexVal = abilities.dex ?? abilities.Dexterity ?? abilities?.total?.Dexterity ?? 10;
  const conVal = abilities.con ?? abilities.Constitution ?? abilities?.total?.Constitution ?? 10;
  const intVal = abilities.int ?? abilities.Intelligence ?? abilities?.total?.Intelligence ?? 10;
  const wisVal = abilities.wis ?? abilities.Wisdom ?? abilities?.total?.Wisdom ?? 10;
  const chaVal = abilities.cha ?? abilities.Charisma ?? abilities?.total?.Charisma ?? 10;
  const strMod = getMod(strVal);
  const dexMod = getMod(dexVal);
  const conMod = getMod(conVal);
  const intMod = getMod(intVal);
  const wisMod = getMod(wisVal);
  const chaMod = getMod(chaVal);


  // 2. Gather all active classes, levels, hit dice, features, and feature choices
  const raceId = characterState.race?.id || 'human';
  const raceInfo = dbData?.races?.find(r => r.species_id === raceId || r.name?.toLowerCase() === raceId.toLowerCase());

  const classList = characterState.classData?.classes || [];
  let totalLevel = 0;
  const hitDiceList = [];
  const activeFeatureNames = new Set();
  const allChoicesMap = {}; // key -> array of chosen values

  classList.forEach((cl) => {
    const lvl = parseInt(cl.level) || 1;
    totalLevel += lvl;
    const hitDie = parseInt(cl.hitDie) || 8;
    hitDiceList.push({ classId: cl.classId, level: lvl, count: lvl, hitDie });

    // Find class info in dbData
    const classInfo = dbData?.classes?.find(c => c.class_id === cl.classId || c.name?.toLowerCase() === cl.classId?.toLowerCase());
    if (classInfo) {
      // Add base features up to current class level
      if (Array.isArray(classInfo.features)) {
        classInfo.features.forEach(f => {
          if ((parseInt(f.level) || 1) <= lvl && f.name) {
            activeFeatureNames.add(f.name.toLowerCase().trim());
          }
        });
      }
      // Add subclass features up to current class level
      if (cl.subclassId) {
        const subInfo = dbData?.subclasses?.find(s => s.subclass_id === cl.subclassId || s.subclass_name === cl.subclassId);
        if (subInfo && subInfo.features) {
          try {
            const subFeats = typeof subInfo.features === 'string' ? JSON.parse(subInfo.features) : subInfo.features;
            if (Array.isArray(subFeats)) {
              subFeats.forEach(f => {
                if ((parseInt(f.level) || 1) <= lvl && (f.name || f.title)) {
                  activeFeatureNames.add((f.name || f.title).toLowerCase().trim());
                }
              });
            }
          } catch { /* ignore */ }
        }
      }
    }

    // Collect choices
    Object.entries(cl.featureChoices || {}).forEach(([key, val]) => {
      const cleanKey = key.toLowerCase().trim();
      if (!allChoicesMap[cleanKey]) allChoicesMap[cleanKey] = [];
      const valArray = Array.isArray(val) ? val : [val];
      valArray.forEach(v => {
        if (typeof v === 'string' && v.trim()) {
          const cleanVal = v.trim();
          allChoicesMap[cleanKey].push(cleanVal);
          activeFeatureNames.add(cleanVal.toLowerCase());
        } else if (v && typeof v === 'object' && v.name) {
          allChoicesMap[cleanKey].push(v.name);
          activeFeatureNames.add(v.name.toLowerCase());
        }
      });
    });
  });

  // Also check global feats if any
  const globalFeats = characterState.feats || [];
  globalFeats.forEach(f => {
    if (typeof f === 'string') activeFeatureNames.add(f.toLowerCase().trim());
    else if (f && f.name) activeFeatureNames.add(f.name.toLowerCase().trim());
  });

  // Also check race traits & traitChoices up to totalLevel
  if (raceInfo && raceInfo.traits) {
    try {
      const parsed = typeof raceInfo.traits === 'string' ? JSON.parse(raceInfo.traits) : raceInfo.traits;
      if (Array.isArray(parsed)) {
        parsed.forEach(t => {
          if (t && (t.name || t.title) && (parseInt(t.level || t.required_level || 1, 10) || 1) <= totalLevel) {
            activeFeatureNames.add((t.name || t.title).toLowerCase().trim());
          }
        });
      }
    } catch { /* ignore */ }
  }
  const lineageObjForTraits = dbData?.lineages?.find(l => l.lineage_id === characterState.race?.lineageId || l.lineage_id === characterState.race?.subraceId);
  if (lineageObjForTraits && lineageObjForTraits.traits) {
    try {
      const parsed = typeof lineageObjForTraits.traits === 'string' ? JSON.parse(lineageObjForTraits.traits) : lineageObjForTraits.traits;
      if (Array.isArray(parsed)) {
        parsed.forEach(t => {
          if (t && (t.name || t.title) && (parseInt(t.level || t.required_level || 1, 10) || 1) <= totalLevel) {
            activeFeatureNames.add((t.name || t.title).toLowerCase().trim());
          }
        });
      }
    } catch { /* ignore */ }
  }
  Object.values(characterState.race?.traitChoices || {}).forEach(val => {
    if (typeof val === 'string') activeFeatureNames.add(val.toLowerCase().trim());
    else if (Array.isArray(val)) val.forEach(v => { if (typeof v === 'string') activeFeatureNames.add(v.toLowerCase().trim()); });
  });

  const hasFeature = (name) => {
    const target = name.toLowerCase().trim();
    for (let item of activeFeatureNames) {
      if (item.includes(target)) return true;
    }
    return false;
  };

  // -------------------------------------------------------------
  // 3. ARMOR CLASS (AC Resolution & Max Stacking Rule)
  // -------------------------------------------------------------
  // Rule: You cannot stack base AC formulas. We calculate all candidate base ACs and take Math.max.
  const acCandidates = [];

  // Candidate 1: Standard Unarmored
  acCandidates.push({
    name: "Unarmored (Base)",
    value: 10 + dexMod,
    formula: `10 + DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`
  });

  // Candidate 2: Armor of Shadows (Warlock Invocation) or Draconic Resilience (Sorcerer)
  if (hasFeature("armor of shadows") || hasFeature("mage armor")) {
    acCandidates.push({
      name: "Armor of Shadows / Mage Armor",
      value: 13 + dexMod,
      formula: `13 + DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`
    });
  }
  if (hasFeature("draconic resilience") || classList.some(c => (c.subclassId || '').toLowerCase().includes('draconic') && (parseInt(c.level, 10) || 1) >= 1)) {
    acCandidates.push({
      name: "Draconic Resilience",
      value: 13 + dexMod,
      formula: `13 + DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`
    });
  }


  // Candidate 3: Unarmored Defense (Monk) -> 10 + DEX + WIS
  if (hasFeature("unarmored defense") || classList.some(c => (c.classId || '').toLowerCase() === 'monk')) {
    acCandidates.push({
      name: "Unarmored Defense (Monk)",
      value: 10 + dexMod + wisMod,
      formula: `10 + DEX (${dexMod >= 0 ? '+' : ''}${dexMod}) + WIS (${wisMod >= 0 ? '+' : ''}${wisMod})`
    });
  }
  // Candidate 4: Unarmored Defense (Barbarian) -> 10 + DEX + CON
  if (hasFeature("unarmored defense") || classList.some(c => (c.classId || '').toLowerCase() === 'barbarian')) {
    acCandidates.push({
      name: "Unarmored Defense (Barbarian)",
      value: 10 + dexMod + conMod,
      formula: `10 + DEX (${dexMod >= 0 ? '+' : ''}${dexMod}) + CON (${conMod >= 0 ? '+' : ''}${conMod})`
    });
  }
  // Candidate from Equipped Armor (Checking explicit armorId or any item marked equipped === true in inventory/gear)
  const STANDARD_ARMORS = [
    { item_id: 'padded', item_name: 'Padded Armor', ac: '11 + DEX', subcategory: 'Light Armor' },
    { item_id: 'leather', item_name: 'Leather Armor', ac: '11 + DEX', subcategory: 'Light Armor' },
    { item_id: 'studded-leather', item_name: 'Studded Leather Armor', ac: '12 + DEX', subcategory: 'Light Armor' },
    { item_id: 'hide', item_name: 'Hide Armor', ac: '12 + DEX (max 2)', subcategory: 'Medium Armor' },
    { item_id: 'chain-shirt', item_name: 'Chain Shirt', ac: '13 + DEX (max 2)', subcategory: 'Medium Armor' },
    { item_id: 'scale-mail', item_name: 'Scale Mail', ac: '14 + DEX (max 2)', subcategory: 'Medium Armor' },
    { item_id: 'breastplate', item_name: 'Breastplate', ac: '14 + DEX (max 2)', subcategory: 'Medium Armor' },
    { item_id: 'half-plate', item_name: 'Half Plate Armor', ac: '15 + DEX (max 2)', subcategory: 'Medium Armor' },
    { item_id: 'ring-mail', item_name: 'Ring Mail', ac: '14', subcategory: 'Heavy Armor' },
    { item_id: 'chain-mail', item_name: 'Chain Mail', ac: '16', subcategory: 'Heavy Armor' },
    { item_id: 'splint', item_name: 'Splint Armor', ac: '17', subcategory: 'Heavy Armor' },
    { item_id: 'plate', item_name: 'Plate Armor', ac: '18', subcategory: 'Heavy Armor' },
    { item_id: 'shield', item_name: 'Shield', ac: '+2', subcategory: 'Shield' }
  ];
  const allAvailableItems = [...(dbData?.items || []), ...(dbData?.armors || []), ...STANDARD_ARMORS];
  const allInvItems = [...(characterState.inventory?.items || []), ...(characterState.equipment?.items || [])];
  const invEquippedArmor = allInvItems.find(i => i.equipped === true && (i.category === 'Armor' || i.item_type === 'Armor' || (i.subcategory || '').toLowerCase().includes('armor') || i.ac));
  const invEquippedShield = allInvItems.find(i => i.equipped === true && ((i.name || i.item_name || '').toLowerCase().includes('shield') || i.subcategory === 'Shield'));

  const armorId = characterState.equipment?.armorId;
  const shieldId = characterState.equipment?.shieldId;
  let equippedArmor = armorId ? allAvailableItems.find(i => i.item_id === armorId || (i.item_name || '').toLowerCase() === String(armorId).toLowerCase() || (i.name || '').toLowerCase() === String(armorId).toLowerCase()) : null;
  if (!equippedArmor && invEquippedArmor) {
    equippedArmor = allAvailableItems.find(i => i.item_id === invEquippedArmor.itemId || (i.item_name || '').toLowerCase() === (invEquippedArmor.name || invEquippedArmor.item_name || '').toLowerCase()) || invEquippedArmor;
  }
  let equippedShield = shieldId ? allAvailableItems.find(i => i.item_id === shieldId || (i.item_name || '').toLowerCase() === String(shieldId).toLowerCase() || (i.name || '').toLowerCase() === String(shieldId).toLowerCase()) : null;
  if (!equippedShield && invEquippedShield) {
    equippedShield = allAvailableItems.find(i => i.item_id === invEquippedShield.itemId || (i.item_name || '').toLowerCase() === (invEquippedShield.name || invEquippedShield.item_name || '').toLowerCase()) || invEquippedShield;
  }

  let wearingArmor = false;
  let stealthDisadvantage = false;
  let strengthReqPenalty = 0;

  if (equippedArmor) {
    wearingArmor = true;
    let armorBase = 10;
    const acStr = String(equippedArmor.ac || '');
    const numMatch = acStr.match(/^(\d+)/);
    if (numMatch) {
      armorBase = parseInt(numMatch[1], 10);
    }
    const sub = (equippedArmor.subcategory || equippedArmor.item_type || '').toLowerCase();
    let armorACValue = armorBase;
    let armorFormula = `${armorBase}`;
    if (sub.includes('light')) {
      armorACValue = armorBase + dexMod;
      armorFormula = `${armorBase} + DEX (${dexMod >= 0 ? '+' : ''}${dexMod})`;
    } else if (sub.includes('medium')) {
      const maxMedDex = hasFeature("medium armor master") ? 3 : 2;
      const medDex = Math.min(dexMod, maxMedDex);
      armorACValue = armorBase + medDex;
      armorFormula = `${armorBase} + DEX max ${maxMedDex} (${medDex >= 0 ? '+' : ''}${medDex})`;
    } else if (sub.includes('heavy')) {
      armorACValue = armorBase;
      armorFormula = `${armorBase} (Heavy Armor)`;
    }
    acCandidates.push({
      name: equippedArmor.item_name,
      value: armorACValue,
      formula: armorFormula
    });

    if ((equippedArmor.stealth || '').toLowerCase().includes('disadvantage')) {
      stealthDisadvantage = true;
    }
    if (equippedArmor.strength_req) {
      const reqNumMatch = String(equippedArmor.strength_req).match(/(\d+)/);
      if (reqNumMatch) {
        const reqStr = parseInt(reqNumMatch[1], 10);
        const charStr = parseInt(abilities.str || 10, 10);
        if (charStr < reqStr) {
          strengthReqPenalty = 10;
        }
      }
    }
  }

  // Find the candidate with the highest Base AC
  let bestBaseAC = acCandidates[0];
  acCandidates.forEach(cand => {
    if (cand.value > bestBaseAC.value) {
      bestBaseAC = cand;
    }
  });

  // Flat AC Bonuses (Stackable)
  const acBonuses = [];
  let flatACBonus = 0;

  // Fighting Style: Defense (+1 AC while wearing armor)
  if (hasFeature("defense") || (allChoicesMap['fighting style'] && allChoicesMap['fighting style'].some(s => s.toLowerCase().includes('defense')))) {
    if (wearingArmor || !characterState.equipment) {
      flatACBonus += 1;
      acBonuses.push({ name: "Fighting Style: Defense", bonus: 1, condition: "Requires Armor" });
    }
  }

  if (equippedShield) {
    const shieldACStr = String(equippedShield.ac || '+2');
    const shieldMatch = shieldACStr.match(/\+?(\d+)/);
    const shieldBonus = shieldMatch ? parseInt(shieldMatch[1], 10) : 2;
    flatACBonus += shieldBonus;
    acBonuses.push({ name: equippedShield.item_name, bonus: shieldBonus });
  }

  const totalAC = bestBaseAC.value + flatACBonus;

  const armorClass = {
    base: bestBaseAC.value,
    total: totalAC,
    formula: bestBaseAC.formula,
    baseSource: bestBaseAC.name,
    bonuses: acBonuses
  };

  // -------------------------------------------------------------
  // 4. HIT POINTS (HP Resolution)
  // -------------------------------------------------------------
  let baseHP = 0;
  hitDiceList.forEach((hd, idx) => {
    const avgRoll = Math.floor(hd.hitDie / 2) + 1;
    const lvl = parseInt(hd.level || hd.count) || 1;
    if (idx === 0) {
      baseHP += hd.hitDie + conMod;
      if (lvl > 1) {
        baseHP += (avgRoll + conMod) * (lvl - 1);
      }
    } else {
      baseHP += (avgRoll + conMod) * lvl;
    }
  });

  const hpBonuses = [];
  let flatHPBonus = 0;

  // Draconic Resilience / Dwarven Toughness -> +1 HP per level
  if (hasFeature("draconic resilience") || classList.some(c => (c.subclassId || '').toLowerCase().includes('draconic') && (parseInt(c.level, 10) || 1) >= 1)) {
    const sorcLevel = classList.find(c => c.classId === 'sorcerer')?.level || totalLevel;
    const bonus = sorcLevel * 1;
    flatHPBonus += bonus;
    hpBonuses.push({ name: "Draconic Resilience", bonus, perLevel: 1 });
  }
  if (hasFeature("dwarven toughness") || (raceInfo && raceInfo.species_id === 'dwarf') || (characterState.race?.id || '').toLowerCase() === 'dwarf') {
    const bonus = totalLevel * 1;
    flatHPBonus += bonus;
    hpBonuses.push({ name: "Dwarven Toughness", bonus, perLevel: 1 });
  }

  // Tough Feat -> +2 HP per level
  if (hasFeature("tough")) {
    const bonus = totalLevel * 2;
    flatHPBonus += bonus;
    hpBonuses.push({ name: "Tough Feat", bonus, perLevel: 2 });
  }

  const exhaustionLevel = parseInt(characterState.exhaustionLevel || 0, 10);
  let exhaustionMaxHPMultiplier = exhaustionLevel >= 4 ? 0.5 : 1;

  const hitPoints = {
    max: Math.max(1, Math.floor((baseHP + flatHPBonus) * exhaustionMaxHPMultiplier)),
    conBonusTotal: conMod * totalLevel,
    hitDiceList,
    bonuses: hpBonuses
  };

  // -------------------------------------------------------------
  // 5. SPEED (Movement Speed Resolution)
  // -------------------------------------------------------------
  let baseSpeed = parseInt(raceInfo?.speed) || 30;

  const speedBonuses = [];
  let flatSpeedBonus = 0;

  // Barbarian Fast Movement (+10 ft at Lv 5+)
  if (hasFeature("fast movement")) {
    flatSpeedBonus += 10;
    speedBonuses.push({ name: "Fast Movement", bonus: 10 });
  }

  // Monk Unarmored Movement
  if (hasFeature("unarmored movement")) {
    const monkLevel = classList.find(c => c.classId === 'monk')?.level || 0;
    let monkBonus = 0;
    if (monkLevel >= 18) monkBonus = 30;
    else if (monkLevel >= 14) monkBonus = 25;
    else if (monkLevel >= 10) monkBonus = 20;
    else if (monkLevel >= 6) monkBonus = 15;
    else if (monkLevel >= 2) monkBonus = 10;

    if (monkBonus > 0) {
      flatSpeedBonus += monkBonus;
      speedBonuses.push({ name: "Unarmored Movement", bonus: monkBonus });
    }
  }

  if (strengthReqPenalty > 0) {
    flatSpeedBonus -= strengthReqPenalty;
    speedBonuses.push({ name: "Heavy Armor (Strength < Requirement)", bonus: -strengthReqPenalty });
  }

  const lineageLowerSpeed = (characterState.race?.lineageId || characterState.race?.subraceId || '').toLowerCase();
  if (lineageLowerSpeed.includes('wood')) {
    flatSpeedBonus += 5;
    speedBonuses.push({ name: "Wood Elf Lineage Speed", bonus: 5 });
  }

  // --- Encumbrance ---
  let totalWeight = 0;
  const allAvailableForWeight = [...(dbData?.items || []), ...(dbData?.armors || []), ...STANDARD_ARMORS, ...(dbData?.weapons || [])];
  (characterState.equipment?.weapons || []).forEach(wId => {
    const wObj = allAvailableForWeight.find(i => i.item_id === wId || i.item_name === wId);
    if (wObj) totalWeight += parseInt(wObj.weight || 0, 10);
  });
  if (equippedArmor) totalWeight += parseInt(equippedArmor.weight || 0, 10);
  if (equippedShield) totalWeight += parseInt(equippedShield.weight || 6, 10);
  (characterState.inventory?.items || characterState.equipment?.items || []).forEach(it => {
    totalWeight += (parseInt(it.weight || 0, 10) * parseInt(it.qty || 1, 10));
  });

  const maxCapacity = strVal * 15;
  let isOverCapacity = totalWeight > maxCapacity;
  let isHeavilyEncumbered = totalWeight > (strVal * 10) && !isOverCapacity;
  let isEncumbered = totalWeight > (strVal * 5) && !isHeavilyEncumbered && !isOverCapacity;

  if (isHeavilyEncumbered) {
    flatSpeedBonus -= 20;
    speedBonuses.push({ name: "Heavily Encumbered", bonus: -20 });
  } else if (isEncumbered) {
    flatSpeedBonus -= 10;
    speedBonuses.push({ name: "Encumbered", bonus: -10 });
  }

  let finalWalkSpeed = Math.max(5, baseSpeed + flatSpeedBonus);
  if (isOverCapacity) {
    finalWalkSpeed = 5;
    speedBonuses.push({ name: "Over Capacity", bonus: "Drops to 5 ft." });
  }

  // --- Exhaustion ---
  if (exhaustionLevel >= 5) {
    finalWalkSpeed = 0;
    speedBonuses.push({ name: `Exhaustion Level ${exhaustionLevel}`, bonus: "Drops to 0 ft." });
  } else if (exhaustionLevel >= 2) {
    finalWalkSpeed = Math.floor(finalWalkSpeed / 2);
    speedBonuses.push({ name: `Exhaustion Level ${exhaustionLevel}`, bonus: "Speed Halved" });
  }

  const speed = {
    walk: finalWalkSpeed,
    base: baseSpeed,
    bonuses: speedBonuses
  };

  // -------------------------------------------------------------
  // 6. EXTRA ATTACKS (Combat Attacks Resolution)
  // -------------------------------------------------------------
  let totalAttacksPerAction = 1;
  const attackNotes = [];

  // Fighter Extra Attack scaling (Lv 11 = 3, Lv 20 = 4)
  const fighterLevel = classList.find(c => c.classId === 'fighter')?.level || 0;
  if (fighterLevel >= 20) {
    totalAttacksPerAction = Math.max(totalAttacksPerAction, 4);
    attackNotes.push("Extra Attack (Fighter Lv.20) -> 4 Attacks");
  } else if (fighterLevel >= 11) {
    totalAttacksPerAction = Math.max(totalAttacksPerAction, 3);
    attackNotes.push("Extra Attack (Fighter Lv.11) -> 3 Attacks");
  } else if (fighterLevel >= 5) {
    totalAttacksPerAction = Math.max(totalAttacksPerAction, 2);
    attackNotes.push("Extra Attack (Fighter Lv.5) -> 2 Attacks");
  }

  // Barbarian / Paladin / Ranger Extra Attack at Lv 5
  if (classList.some(c => ['barbarian', 'paladin', 'ranger', 'monk'].includes(c.classId) && c.level >= 5)) {
    totalAttacksPerAction = Math.max(totalAttacksPerAction, 2);
    attackNotes.push("Extra Attack (Lv.5) -> 2 Attacks");
  }

  // General check for Extra Attack feature (covers Subclasses like College of Valor/Swords, Bladesinger, or Invocations like Thirsting Blade)
  if ((hasFeature("extra attack") || hasFeature("thirsting blade")) && totalAttacksPerAction < 2) {
    totalAttacksPerAction = 2;
    attackNotes.push("Extra Attack Feature -> 2 Attacks");
  }

  const combatAttacks = {
    perAction: totalAttacksPerAction,
    notes: attackNotes
  };

  // -------------------------------------------------------------
  // 7. DAMAGE RESISTANCES & IMMUNITIES
  // -------------------------------------------------------------
  const resistancesSet = new Set();
  const immunitiesSet = new Set();

  // Check race resistances (Tiefling, Dwarf, Dragonborn, etc.)
  const activeRaceId = (raceInfo?.species_id || characterState.race?.id || '').toLowerCase();
  if (activeRaceId === 'tiefling' || (characterState.race?.id || '').toLowerCase() === 'tiefling') {
    resistancesSet.add("Fire (Tiefling)");
  }
  if (activeRaceId === 'dwarf' || (characterState.race?.id || '').toLowerCase().includes('dwarf')) {
    resistancesSet.add("Poison (Dwarf)");
  }
  if (activeRaceId === 'dragonborn' || (characterState.race?.id || '').toLowerCase() === 'dragonborn') {
    let ancestry = characterState.race?.traitChoices?.['Draconic Ancestry'] || characterState.race?.traitChoices?.['draconic ancestry'] || characterState.race?.lineageId || '';
    if (!ancestry && characterState.race?.traitChoices) {
      Object.values(characterState.race.traitChoices).forEach(v => {
        if (typeof v === 'string' && /black|copper|blue|bronze|brass|gold|red|green|silver|white/i.test(v)) {
          ancestry = v;
        }
      });
    }
    const ancLower = ancestry.toLowerCase();
    if (ancLower.includes('black') || ancLower.includes('copper')) resistancesSet.add("Acid (Draconic Ancestry)");
    else if (ancLower.includes('blue') || ancLower.includes('bronze')) resistancesSet.add("Lightning (Draconic Ancestry)");
    else if (ancLower.includes('brass') || ancLower.includes('gold') || ancLower.includes('red')) resistancesSet.add("Fire (Draconic Ancestry)");
    else if (ancLower.includes('green')) resistancesSet.add("Poison (Draconic Ancestry)");
    else if (ancLower.includes('silver') || ancLower.includes('white')) resistancesSet.add("Cold (Draconic Ancestry)");
  }

  const allTraitsToCheck = [];
  if (raceInfo?.traits) {
    try {
      const traitsArr = typeof raceInfo.traits === 'string' ? JSON.parse(raceInfo.traits) : raceInfo.traits;
      if (Array.isArray(traitsArr)) allTraitsToCheck.push(...traitsArr);
    } catch {
      allTraitsToCheck.push({ desc: typeof raceInfo.traits === 'string' ? raceInfo.traits : '' });
    }
  }
  const lineageObjRes = dbData?.lineages?.find(l => l.lineage_id === characterState.race?.lineageId || l.lineage_id === characterState.race?.subraceId);
  if (lineageObjRes?.traits) {
    try {
      const lTraits = typeof lineageObjRes.traits === 'string' ? JSON.parse(lineageObjRes.traits) : lineageObjRes.traits;
      if (Array.isArray(lTraits)) allTraitsToCheck.push(...lTraits);
    } catch {
      allTraitsToCheck.push({ desc: typeof lineageObjRes.traits === 'string' ? lineageObjRes.traits : '' });
    }
  }

  allTraitsToCheck.forEach(t => {
    const tStr = JSON.stringify(t).toLowerCase();
    if (tStr.includes("resistance to acid") && !Array.from(resistancesSet).some(r => r.includes("Acid"))) resistancesSet.add("Acid (Species Trait)");
    if (tStr.includes("resistance to cold") && !Array.from(resistancesSet).some(r => r.includes("Cold"))) resistancesSet.add("Cold (Species Trait)");
    if (tStr.includes("resistance to fire") && !Array.from(resistancesSet).some(r => r.includes("Fire"))) resistancesSet.add("Fire (Species Trait)");
    if (tStr.includes("resistance to force") && !Array.from(resistancesSet).some(r => r.includes("Force"))) resistancesSet.add("Force (Species Trait)");
    if (tStr.includes("resistance to lightning") && !Array.from(resistancesSet).some(r => r.includes("Lightning"))) resistancesSet.add("Lightning (Species Trait)");
    if (tStr.includes("resistance to necrotic") && !Array.from(resistancesSet).some(r => r.includes("Necrotic"))) resistancesSet.add("Necrotic (Species Trait)");
    if (tStr.includes("resistance to poison") && !Array.from(resistancesSet).some(r => r.includes("Poison"))) resistancesSet.add("Poison (Species Trait)");
    if (tStr.includes("resistance to psychic") && !Array.from(resistancesSet).some(r => r.includes("Psychic"))) resistancesSet.add("Psychic (Species Trait)");
    if (tStr.includes("resistance to radiant") && !Array.from(resistancesSet).some(r => r.includes("Radiant"))) resistancesSet.add("Radiant (Species Trait)");
    if (tStr.includes("resistance to thunder") && !Array.from(resistancesSet).some(r => r.includes("Thunder"))) resistancesSet.add("Thunder (Species Trait)");
  });

  if (hasFeature("infernal constitution")) {
    resistancesSet.add("Cold (Infernal Constitution)");
    resistancesSet.add("Poison (Infernal Constitution)");
  }

  // Check choices for Fiendish Resilience / Elemental Affinity
  Object.entries(allChoicesMap).forEach(([k, choices]) => {
    if (k.includes('fiendish resilience')) {
      choices.forEach(c => resistancesSet.add(`${c} (Fiendish Resilience)`));
    }
  });

  // 8. RACIAL & LINEAGE SPELLS
  const racialSpellsList = [];
  const lineageId = characterState.race?.lineageId;
  const spellAbility = characterState.race?.lineageSpellAbility || 'CHA';

  if (lineageId && dbData?.lineages) {
    const lineageObj = dbData.lineages.find(l => l.lineage_id === lineageId);
    if (lineageObj && lineageObj.granted_spells) {
      try {
        const gSpells = typeof lineageObj.granted_spells === 'string' ? JSON.parse(lineageObj.granted_spells) : lineageObj.granted_spells;
        if (Array.isArray(gSpells)) {
          gSpells.forEach(s => {
            const reqLevel = parseInt(s.level || s.required_level || 1, 10) || 1;
            if (reqLevel <= totalLevel) {
              if (s.is_choice === 1 || s.is_choice === true) {
                const chosenId = characterState.race?.lineageSpellChoice;
                if (chosenId) {
                  const spObj = dbData?.spells?.find(sp => String(sp.spell_id) === String(chosenId) || sp.spell_name === chosenId);
                  racialSpellsList.push({
                    id: chosenId,
                    name: spObj ? spObj.spell_name : chosenId,
                    level: spObj ? spObj.spell_level : (s.choice_level || 0),
                    source: `Race (${lineageObj.lineage_name || lineageId})`,
                    ability: spellAbility
                  });
                }
              } else {
                const spId = s.spell_id || s.name || s.spell_name;
                const spObj = dbData?.spells?.find(sp => String(sp.spell_id) === String(spId) || sp.spell_name === spId);
                racialSpellsList.push({
                  id: spId,
                  name: spObj ? spObj.spell_name : (s.name || s.spell_name || spId),
                  level: spObj ? spObj.spell_level : (s.level || 0),
                  source: `Race (${lineageObj.lineage_name || lineageId})`,
                  ability: s.ability || spellAbility
                });
              }
            }
          });
        }
      } catch { /* ignore */ }
    }
  }

  if (raceInfo && raceInfo.granted_spells) {
    try {
      const gSpells = typeof raceInfo.granted_spells === 'string' ? JSON.parse(raceInfo.granted_spells) : raceInfo.granted_spells;
      if (Array.isArray(gSpells)) {
        gSpells.forEach(s => {
          const reqLevel = parseInt(s.level || s.required_level || 1, 10) || 1;
          if (reqLevel <= totalLevel) {
            const spId = s.spell_id || s.name || s.spell_name;
            const spObj = dbData?.spells?.find(sp => String(sp.spell_id) === String(spId) || sp.spell_name === spId);
            if (!racialSpellsList.some(r => r.id === spId)) {
              racialSpellsList.push({
                id: spId,
                name: spObj ? spObj.spell_name : (s.name || s.spell_name || spId),
                level: spObj ? spObj.spell_level : (s.level || 0),
                source: `Race (${raceInfo.species_name || raceId})`,
                ability: s.ability || spellAbility
              });
            }
          }
        });
      }
    } catch { /* ignore */ }
  }

  if (raceInfo && raceInfo.traits) {
    try {
      const traits = typeof raceInfo.traits === 'string' ? JSON.parse(raceInfo.traits) : raceInfo.traits;
      if (Array.isArray(traits)) {
        traits.forEach(t => {
          const traitLevel = parseInt(t.level || t.required_level || 1, 10) || 1;
          if (traitLevel <= totalLevel && t.logic && t.logic.granted_spells && Array.isArray(t.logic.granted_spells)) {
            t.logic.granted_spells.forEach(s => {
              const spId = typeof s === 'string' ? s : (s.spell_id || s.name);
              const spLevelReq = typeof s === 'object' ? (parseInt(s.level || s.required_level || traitLevel, 10) || traitLevel) : traitLevel;
              if (spLevelReq <= totalLevel) {
                const spObj = dbData?.spells?.find(sp => String(sp.spell_id) === String(spId) || sp.spell_name === spId);
                if (!racialSpellsList.some(r => r.id === spId)) {
                  racialSpellsList.push({
                    id: spId,
                    name: spObj ? spObj.spell_name : spId,
                    level: spObj ? spObj.spell_level : 0,
                    source: `Race (${raceInfo.species_name || raceId})`,
                    ability: spellAbility
                  });
                }
              }
            });
          }
        });
      }
    } catch { /* ignore */ }
  }

  if (characterState.race?.traitChoices) {
    Object.values(characterState.race.traitChoices).forEach(val => {
      const vals = Array.isArray(val) ? val : [val];
      vals.forEach(v => {
        if (typeof v === 'string' && v.trim()) {
          const spObj = dbData?.spells?.find(sp => String(sp.spell_id).toLowerCase() === v.toLowerCase().trim() || sp.spell_name?.toLowerCase() === v.toLowerCase().trim());
          if (spObj && !racialSpellsList.some(r => r.id === spObj.spell_id)) {
            racialSpellsList.push({
              id: spObj.spell_id,
              name: spObj.spell_name,
              level: spObj.spell_level || 0,
              source: `Species (${raceInfo?.species_name || characterState.race.id || 'Species'})`,
              ability: spellAbility
            });
          }
        }
      });
    });
  }

  // Calculate combined skill proficiencies, expertise, and saving throws
  const proficienciesSet = new Set();
  const expertiseSet = new Set();
  const savingThrowsSet = new Set((characterState.proficiencies?.savingThrows || []).map(s => String(s).toLowerCase()));

  // 1. Base / direct skills
  (characterState.proficiencies?.skills || []).forEach(s => {
    if (typeof s === 'string' && ALL_SKILLS_LIST.includes(s)) proficienciesSet.add(s);
  });

  // 1b. Race Trait Choices (e.g. Human Skillful)
  if (characterState.race?.traitChoices) {
    Object.values(characterState.race.traitChoices).forEach(val => {
      const vals = Array.isArray(val) ? val : [val];
      vals.forEach(v => {
        if (typeof v === 'string' && ALL_SKILLS_LIST.includes(v)) proficienciesSet.add(v);
      });
    });
  }

  // 2. Class saving throws (Primary class index 0)
  (characterState.classData?.classes || []).forEach((cl, idx) => {
    if (idx !== 0) return;
    const cInfo = dbData?.classes?.find(c => c.class_id === cl.classId || c.name?.toLowerCase() === cl.classId?.toLowerCase());
    if (cInfo?.core_traits) {
      try {
        const traits = typeof cInfo.core_traits === 'string' ? JSON.parse(cInfo.core_traits) : cInfo.core_traits;
        if (Array.isArray(traits?.saving_throws)) {
          traits.saving_throws.forEach(s => savingThrowsSet.add(String(s).toLowerCase()));
        } else if (typeof traits?.saving_throws === 'string') {
          traits.saving_throws.split(',').forEach(s => savingThrowsSet.add(s.trim().toLowerCase()));
        }
      } catch { /* ignore */ }
    }
  });

  // 3. Background base & replaced skills
  (characterState.background?.originalSkills || []).forEach(s => {
    const replaced = characterState.background?.replacedSkills?.[s];
    if (replaced && ALL_SKILLS_LIST.includes(replaced)) proficienciesSet.add(replaced);
    else if (ALL_SKILLS_LIST.includes(s)) proficienciesSet.add(s);
  });
  if ((!characterState.background?.originalSkills || characterState.background.originalSkills.length === 0) && characterState.background?.id) {
    const bgObj = dbData?.backgrounds?.find(b => b.background_id === characterState.background.id || b.name?.toLowerCase() === characterState.background.id?.toLowerCase());
    if (bgObj?.skill_proficiencies) {
      try {
        const parsed = typeof bgObj.skill_proficiencies === 'string' ? JSON.parse(bgObj.skill_proficiencies) : bgObj.skill_proficiencies;
        const bgSkills = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.granted) ? parsed.granted : (Array.isArray(parsed?.logic?.granted) ? parsed.logic.granted : []));
        bgSkills.forEach(s => {
          if (typeof s === 'string' && ALL_SKILLS_LIST.includes(s)) {
            const replaced = characterState.background?.replacedSkills?.[s];
            if (replaced && ALL_SKILLS_LIST.includes(replaced)) proficienciesSet.add(replaced);
            else proficienciesSet.add(s);
          }
        });
      } catch { /* ignore */ }
    }
  }

  // 4. Class Features & Expertise (Scholar, Expertise, etc.)
  (characterState.classData?.classes || []).forEach(cl => {
    Object.entries(cl.featureChoices || {}).forEach(([k, v]) => {
      const items = Array.isArray(v) ? v : (typeof v === 'object' && v !== null ? Object.values(v) : [v]);
      if (k.startsWith('Expertise') || k.startsWith('Scholar') || k.startsWith('Deft Explorer')) {
        items.forEach(s => {
          if (typeof s === 'string' && ALL_SKILLS_LIST.includes(s)) {
            expertiseSet.add(s);
            proficienciesSet.add(s);
          }
        });
      } else {
        items.forEach(s => {
          if (typeof s === 'string' && ALL_SKILLS_LIST.includes(s)) proficienciesSet.add(s);
        });
      }
    });
  });

  // 5. Universal Feats Harvester (Global, Race, Background, and Class Feats)
  const extractFeatBonusesToResolver = (featObj) => {
    if (!featObj || typeof featObj !== 'object') return;
    const b = featObj.bonuses || (featObj.id ? featObj.bonuses : featObj);
    if (b) {
      ['skill1', 'skill2', 'skill3'].forEach(k => {
        if (b[k] && ALL_SKILLS_LIST.includes(b[k])) proficienciesSet.add(b[k]);
      });
    }
  };

  const allFeatsList = [
    ...(characterState.feats || []),
    ...(characterState.background?.originFeats || characterState.background?.feats || []),
    ...(characterState.race?.feats || [])
  ];
  allFeatsList.forEach(extractFeatBonusesToResolver);

  // Harvest Feat choices selected inside Class Features (e.g. Level 4/8/12 Class Feats)
  (characterState.classData?.classes || []).forEach(cl => {
    Object.values(cl.featureChoices || {}).forEach(val => {
      const items = Array.isArray(val) ? val : [val];
      items.forEach(item => {
        if (item && typeof item === 'object') {
          extractFeatBonusesToResolver(item);
        }
      });
    });
  });

  // 6. Race & Lineage Trait Choices & Granted Skills
  if (characterState.race) {
    Object.values(characterState.race.traitChoices || {}).forEach(val => {
      if (typeof val === 'string' && ALL_SKILLS_LIST.includes(val)) {
        proficienciesSet.add(val);
      } else if (Array.isArray(val)) {
        val.forEach(v => { if (typeof v === 'string' && ALL_SKILLS_LIST.includes(v)) proficienciesSet.add(v); });
      }
    });

    const raceObj = dbData?.races?.find(r => r.species_id === characterState.race.id || r.name?.toLowerCase() === characterState.race.id?.toLowerCase());
    if (raceObj && raceObj.traits) {
      try {
        const traits = typeof raceObj.traits === 'string' ? JSON.parse(raceObj.traits) : raceObj.traits;
        if (Array.isArray(traits)) {
          traits.forEach(t => {
            if (t.logic && t.logic.granted && Array.isArray(t.logic.granted)) {
              t.logic.granted.forEach(g => { if (typeof g === 'string' && ALL_SKILLS_LIST.includes(g)) proficienciesSet.add(g); });
            }
          });
        }
      } catch { /* ignore */ }
    }

    if (characterState.race.lineageId) {
      const lineageObj = dbData?.lineages?.find(l => l.lineage_id === characterState.race.lineageId || l.lineage_name === characterState.race.lineageId);
      if (lineageObj && lineageObj.traits) {
        try {
          const traits = typeof lineageObj.traits === 'string' ? JSON.parse(lineageObj.traits) : lineageObj.traits;
          if (Array.isArray(traits)) {
            traits.forEach(t => {
              if (t.logic && t.logic.granted && Array.isArray(t.logic.granted)) {
                t.logic.granted.forEach(g => { if (typeof g === 'string' && ALL_SKILLS_LIST.includes(g)) proficienciesSet.add(g); });
              }
            });
          }
        } catch { /* ignore */ }
      }
    }
  }

  let darkvision = 0;
  const raceLower = (raceInfo?.species_id || characterState.race?.id || '').toLowerCase();
  const lineageLower = (characterState.race?.lineageId || characterState.race?.subraceId || '').toLowerCase();
  const fullRaceLinStr = `${raceLower} ${lineageLower}`;

  if (fullRaceLinStr.includes('drow') || fullRaceLinStr.includes('deep gnome') || hasFeature("superior darkvision") || hasFeature("devil's sight")) {
    darkvision = 120;
  } else if (/elf|dwarf|tiefling|orc|gnome|half-elf|half-orc|tabaxi|aasimar/i.test(fullRaceLinStr) || hasFeature("darkvision")) {
    darkvision = 60;
  } else if (raceInfo?.darkvision) {
    darkvision = parseInt(raceInfo.darkvision, 10) || 60;
  }

  const profBonus = Math.max(2, Math.ceil((totalLevel || 1) / 4) + 1);

  const skillsMap = {};
  ALL_SKILLS_LIST.forEach(skill => {
    const isProf = proficienciesSet.has(skill);
    const isExp = expertiseSet.has(skill);
    let abil = 'wis';
    if (['Athletics'].includes(skill)) abil = 'str';
    else if (['Acrobatics', 'Sleight of Hand', 'Stealth'].includes(skill)) abil = 'dex';
    else if (['Arcana', 'History', 'Investigation', 'Nature', 'Religion'].includes(skill)) abil = 'int';
    else if (['Deception', 'Intimidation', 'Performance', 'Persuasion'].includes(skill)) abil = 'cha';
    const mod = abil === 'str' ? strMod : abil === 'dex' ? dexMod : abil === 'int' ? intMod : abil === 'cha' ? chaMod : wisMod;
    const bonus = mod + (isExp ? profBonus * 2 : isProf ? profBonus : 0);
    skillsMap[skill] = { proficient: isProf, expertise: isExp, bonus, modifier: mod };
  });

  const weaponsList = [];
  allInvItems.forEach(item => {
    if (item && typeof item === 'object' && item.equipped !== false) {
      const cat = (item.category || item.subcategory || item.item_type || '').toLowerCase();
      const props = Array.isArray(item.properties) ? item.properties : typeof item.properties === 'string' ? item.properties.split(',').map(s=>s.trim()) : [];
      const propsLower = props.map(p => p.toLowerCase());
      if (cat.includes('weapon') || item.damage || item.damage_dice || propsLower.includes('finesse') || propsLower.includes('heavy')) {
        let isFinesse = propsLower.some(p => p.includes('finesse'));
        let isRanged = propsLower.some(p => p.includes('ranged') || p.includes('thrown') || p.includes('ammunition') || cat.includes('ranged'));
        let modUsed = isRanged ? dexMod : isFinesse ? Math.max(strMod, dexMod) : strMod;
        let attackBonus = profBonus + modUsed;
        weaponsList.push({
          itemId: item.itemId || item.item_id || item.name,
          name: item.name || item.item_name || 'Weapon',
          damage: item.damage || item.damage_dice || '1d6',
          properties: props,
          attackBonus: attackBonus,
          modUsed: modUsed
        });
      }
    }
  });

  const spellcastingStats = resolveSpellcasting(characterState, dbData, profBonus, { str: strVal, dex: dexVal, con: conVal, int: intVal, wis: wisVal, cha: chaVal, strMod, dexMod, conMod, intMod, wisMod, chaMod });
  const allGlobalFeats = [
    ...(characterState.feats || []),
    ...(characterState.background?.originFeats || characterState.background?.feats || [])
  ];

  const mechanicsFlags = {
    stealthDisadvantage,
    hasUnarmedFighting: hasFeature("unarmored fighting") || allGlobalFeats.some(f => f && (typeof f === 'string' ? f : (f.name || '')).toLowerCase().includes("unarmed fighting")),
    hasTavernBrawler: allGlobalFeats.some(f => f && (typeof f === 'string' ? f : (f.name || '')).toLowerCase().includes("tavern brawler")),
    hasDualWielder: allGlobalFeats.some(f => f && (typeof f === 'string' ? f : (f.name || '')).toLowerCase().includes("dual wielder")),
    exhaustionLevel,
    isEncumbered,
    isHeavilyEncumbered,
    isOverCapacity,
    totalWeight,
    maxCapacity
  };

  return {
    armorClass,
    hitPoints,
    speed,
    combatAttacks: {
      ...combatAttacks,
      weapons: weaponsList,
      unarmedStrike: resolveUnarmedStrike(characterState)
    },
    stealthDisadvantage,
    abilityModifiers: { str: strMod, dex: dexMod, con: conMod, int: intMod, wis: wisMod, cha: chaMod },
    proficiencyBonus: profBonus,
    profBonus,
    resistances: Array.from(resistancesSet),
    immunities: Array.from(immunitiesSet),
    senses: {
      darkvision,
      passivePerception: 10 + wisMod + (proficienciesSet.has('Perception') ? (expertiseSet.has('Perception') ? profBonus * 2 : profBonus) : 0),
      passiveInvestigation: 10 + intMod + (proficienciesSet.has('Investigation') ? (expertiseSet.has('Investigation') ? profBonus * 2 : profBonus) : 0),
      passiveInsight: 10 + wisMod + (proficienciesSet.has('Insight') ? (expertiseSet.has('Insight') ? profBonus * 2 : profBonus) : 0)
    },
    skills: skillsMap,
    skillsProficient: Array.from(proficienciesSet),
    proficiencies: {
      skills: Array.from(proficienciesSet),
      expertise: Array.from(expertiseSet),
      savingThrows: Array.from(savingThrowsSet)
    },
    spellSlots: spellcastingStats,
    spellcasting: spellcastingStats,
    saveDC: spellcastingStats.saveDC,
    spellAttackBonus: spellcastingStats.attackBonus,
    spells: {
      racial: racialSpellsList,
      classSpells: characterState.spells || {}
    },
    unarmedStrike: resolveUnarmedStrike(characterState)
  };
};
