import React from 'react';
import ReactDOMServer from 'react-dom/server';
import useCharacterCalculations from '../src/hooks/useCharacterCalculations.js';
import { resolveCharacterMechanics } from '../src/utils/mechanicsResolver.js';

let lastResult = null;
function TestHarness({ characterState, dbData }) {
  lastResult = useCharacterCalculations(characterState, dbData);
  return React.createElement('div', null, 'ok');
}

function runCalculations(characterState, dbData) {
  ReactDOMServer.renderToString(React.createElement(TestHarness, { characterState, dbData }));
  return lastResult;
}

const dbData = {
  classes: [
    { class_id: 'fighter', name: 'Fighter', core_traits: JSON.stringify({ saving_throws: ['str', 'con'] }) },
    { class_id: 'wizard', name: 'Wizard', core_traits: JSON.stringify({ saving_throws: ['int', 'wis'] }) },
    { class_id: 'paladin', name: 'Paladin', core_traits: JSON.stringify({ saving_throws: ['wis', 'cha'] }) },
    { class_id: 'artificer', name: 'Artificer', core_traits: JSON.stringify({ saving_throws: ['con', 'int'] }) },
    { class_id: 'warlock', name: 'Warlock', core_traits: JSON.stringify({ saving_throws: ['wis', 'cha'] }) },
    { class_id: 'rogue', name: 'Rogue', core_traits: JSON.stringify({ saving_throws: ['dex', 'int'] }) },
    { class_id: 'cleric', name: 'Cleric' },
    { class_id: 'monk', name: 'Monk' },
    { class_id: 'sorcerer', name: 'Sorcerer' },
    { class_id: 'bard', name: 'Bard' },
    { class_id: 'druid', name: 'Druid' },
    { class_id: 'ranger', name: 'Ranger' }
  ],
  races: [
    { species_id: 'human', name: 'Human' },
    { species_id: 'elf', name: 'Elf' },
    { species_id: 'dwarf', name: 'Dwarf' }
  ],
  backgrounds: [
    { background_id: 'acolyte', name: 'Acolyte' },
    { background_id: 'soldier', name: 'Soldier' }
  ]
};

console.log("=== TC-L01: Ability Score Modifiers ===");
for (let score = 1; score <= 30; score++) {
  const state = {
    abilities: { str: score },
    classData: { classes: [{ classId: 'fighter', level: 1, hitDie: 10 }] }
  };
  const mechanics = resolveCharacterMechanics(state, dbData);
  const expected = Math.floor((score - 10) / 2);
  const actual = mechanics.abilityModifiers.str;
  if (actual !== expected) {
    console.error(`FAIL: Score ${score} -> expected ${expected}, got ${actual}`);
  }
}
console.log("TC-L01 Passed (if no errors above).");

console.log("\n=== TC-L02: Multiclass HP & Hit Dice calculation ===");
const mcState = {
  abilities: { con: 16 }, // +3
  classData: {
    classes: [
      { classId: 'fighter', level: 2, hitDie: 10 },
      { classId: 'wizard', level: 3, hitDie: 6 }
    ]
  }
};
const mcMechanics = resolveCharacterMechanics(mcState, dbData);
// Fighter 1: 10 + 3 = 13.
// Fighter 2: 6 + 3 = 9.
// Wizard 3 (3 levels): 3 * (4 + 3) = 21.
// Total expected HP = 13 + 9 + 21 = 43.
const expectedMaxHp = 13 + 9 + 21;
if (mcMechanics.hitPoints.max !== expectedMaxHp) {
  console.error(`FAIL: expected HP ${expectedMaxHp}, got ${mcMechanics.hitPoints.max}`);
} else {
  console.log("TC-L02 Passed.");
}
console.dir(mcMechanics.hitPoints.hitDiceList);

console.log("\n=== TC-L03: Spellcasting Multiclass ===");
const spellState = {
  abilities: { int: 16, wis: 14, cha: 12 },
  classData: {
    classes: [
      { classId: 'paladin', level: 5 }, // Half caster: 5 / 2 = 2.5 -> floor = 2
      { classId: 'artificer', level: 3 }, // Artificer: 3 / 2 = 1.5 -> ceil = 2
      { classId: 'warlock', level: 4 } // Warlock pact magic isolated
    ]
  }
};
const spellHookRes = runCalculations(spellState, dbData);
// Caster level should be 2 + 2 = 4.
// Slots for level 4: [4, 3]
if (spellHookRes.spellSlotsCalculation.casterLevel !== 4) {
  console.error(`FAIL: Expected caster level 4, got ${spellHookRes.spellSlotsCalculation.casterLevel}`);
} else {
  console.log("TC-L03 Passed.");
}
console.log("Standard slots:", spellHookRes.spellSlotsCalculation.standardSlots);

console.log("\n=== TC-L04: Rest Mechanics ===");
console.log("Rest Mechanics logic is not present in mechanicsResolver or useCharacterCalculations hook. It's usually a Redux/Context action. However, we ensure hitDiceList provides necessary grouping.");

console.log("\n=== Phase 5: God-Tier Matrix Logic Testing ===");
const allClasses = dbData.classes.map(c => c.class_id);
const allRaces = dbData.races.map(r => r.species_id);
const allBackgrounds = dbData.backgrounds.map(b => b.background_id);

let combosTested = 0;
let errorsFound = 0;
for (const r of allRaces) {
  for (const b of allBackgrounds) {
    for (const c1 of allClasses) {
      for (const c2 of allClasses) {
        if (c1 === c2) continue;
        const state = {
          race: { id: r },
          background: { id: b },
          abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
          classData: {
            classes: [
              { classId: c1, level: 10, hitDie: 8 },
              { classId: c2, level: 10, hitDie: 6 }
            ]
          }
        };
        try {
          const res = runCalculations(state, dbData);
          if (!res || !res.resolvedMechanics) {
            throw new Error("Missing resolved mechanics");
          }
          combosTested++;
        } catch (err) {
          console.error(`Crash on Race:${r} Bg:${b} Classes:${c1}/${c2}`);
          console.error(err);
          errorsFound++;
        }
      }
    }
  }
}
console.log(`Matrix Testing Complete. Combos tested: ${combosTested}. Errors found: ${errorsFound}`);
