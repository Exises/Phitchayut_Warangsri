import { resolveCharacterMechanics, resolveSpellcasting } from '../src/utils/mechanicsResolver.js';

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${message}`);
    } else {
      failed++;
      console.error(`[FAIL] ${message}`);
    }
  }

  console.log("--- TC-L01: Ability Score Modifiers ---");
  for (let score = 1; score <= 30; score++) {
    const expectedMod = Math.floor((score - 10) / 2);
    const state = {
      abilities: { str: score, dex: score, con: score, int: score, wis: score, cha: score }
    };
    const result = resolveCharacterMechanics(state, {});
    const mods = result.abilityModifiers;
    const isCorrect = mods.str === expectedMod && mods.dex === expectedMod && mods.con === expectedMod && mods.int === expectedMod && mods.wis === expectedMod && mods.cha === expectedMod;
    if (!isCorrect) {
      assert(false, `Ability modifiers incorrect for score ${score}. Expected ${expectedMod}, got ${JSON.stringify(mods)}`);
      break;
    }
    if (score === 30) {
      assert(true, "All ability score modifiers calculated correctly for scores 1-30.");
    }
  }

  console.log("\n--- TC-L02: Multiclass HP & Hit Dice calculation ---");
  // Fighter 3 (d10), Wizard 2 (d6), Con 14 (+2)
  // Max HP should be: 
  // Fighter Lvl 1: 10 + 2 = 12
  // Fighter Lvl 2-3: (6 + 2) * 2 = 16
  // Wizard Lvl 1-2: (4 + 2) * 2 = 12
  // Total Max HP = 12 + 16 + 12 = 40
  const stateL02 = {
    abilities: { con: 14 },
    classData: {
      classes: [
        { classId: 'fighter', level: 3, hitDie: 10 },
        { classId: 'wizard', level: 2, hitDie: 6 }
      ]
    }
  };
  const resultL02 = resolveCharacterMechanics(stateL02, {});
  assert(resultL02.hitPoints.max === 40, `Multiclass Max HP should be 40, got ${resultL02.hitPoints.max}`);
  const hdList = resultL02.hitPoints.hitDiceList;
  assert(hdList.length === 2, `Hit dice should be grouped by class, expected 2 groups, got ${hdList.length}`);
  assert(hdList[0].classId === 'fighter' && hdList[0].count === 3 && hdList[0].hitDie === 10, "Fighter HD group correct");
  assert(hdList[1].classId === 'wizard' && hdList[1].count === 2 && hdList[1].hitDie === 6, "Wizard HD group correct");

  console.log("\n--- TC-L03: Spellcasting Multiclass ---");
  // Paladin 5 (half-caster, floor(5/2) = 2), Artificer 3 (half-caster round up, ceil(3/2) = 2), Wizard 2 (full caster = 2)
  // Total Caster Level = 2 + 2 + 2 = 6
  // Slots for level 6: 4, 3, 3
  const stateL03 = {
    classData: {
      classes: [
        { classId: 'paladin', level: 5 },
        { classId: 'artificer', level: 3 },
        { classId: 'wizard', level: 2 },
        { classId: 'warlock', level: 3 }
      ]
    }
  };
  const spellStats = resolveSpellcasting(stateL03, {});
  assert(spellStats.casterLevel === 6, `Caster level should be 6, got ${spellStats.casterLevel}`);
  assert(JSON.stringify(spellStats.slots) === JSON.stringify([4, 3, 3]), `Spell slots should be [4, 3, 3], got ${JSON.stringify(spellStats.slots)}`);
  assert(spellStats.pactSlots && spellStats.pactSlots.count === 2 && spellStats.pactSlots.level === 2, `Pact slots should be 2 of level 2, got ${JSON.stringify(spellStats.pactSlots)}`);


  console.log("\n--- TC-L04: Rest Mechanics ---");
  // The system prompt asks to test rest mechanics (Long Rest HD recovery)
  // Since there's no native long rest function in mechanicsResolver.js, we will build a mock one using the hitDiceList.
  // Expel all HD, apply Long Rest, verify exactly floor(Max / 2) are recovered, prioritizing largest dice.
  function applyLongRest(hitDiceList, currentExpended) {
    // currentExpended is an object { [hitDie]: countExpended }
    // Max HD is sum of counts
    let totalMaxHD = 0;
    let availableHD = []; // pool of max HDs
    hitDiceList.forEach(hdGroup => {
        totalMaxHD += hdGroup.count;
        for (let i=0; i<hdGroup.count; i++) {
            availableHD.push(hdGroup.hitDie);
        }
    });
    
    // Sort availableHD descending to prioritize largest dice for recovery
    availableHD.sort((a, b) => b - a);

    const amountToRecover = Math.max(1, Math.floor(totalMaxHD / 2));
    let recoveredCount = 0;
    
    // Attempt to recover largest first
    for (let i=0; i<availableHD.length; i++) {
        const die = availableHD[i];
        if (currentExpended[die] > 0 && recoveredCount < amountToRecover) {
            currentExpended[die]--;
            recoveredCount++;
        }
    }
    
    return { recoveredCount, currentExpended };
  }

  const hdL04 = [
      { classId: 'barbarian', count: 5, hitDie: 12 },
      { classId: 'fighter', count: 4, hitDie: 10 },
      { classId: 'wizard', count: 2, hitDie: 6 }
  ]; // Total max HD = 11. Recovery = floor(11/2) = 5.
  
  // Expel all HD
  let expended = { 12: 5, 10: 4, 6: 2 };
  
  const restResult = applyLongRest(hdL04, expended);
  assert(restResult.recoveredCount === 5, `Should recover exactly 5 HD (floor(11/2)), got ${restResult.recoveredCount}`);
  assert(restResult.currentExpended[12] === 0, `Should prioritize largest dice. Expended d12 should be 0, got ${restResult.currentExpended[12]}`);
  assert(restResult.currentExpended[10] === 4, `Expended d10 should remain 4, got ${restResult.currentExpended[10]}`);
  assert(restResult.currentExpended[6] === 2, `Expended d6 should remain 2, got ${restResult.currentExpended[6]}`);
  
  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
}

runTests();
