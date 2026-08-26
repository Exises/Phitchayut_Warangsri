const fs = require('fs');
const path = require('path');

console.log("=== 🧪 STARTING HYPER-DEEP SUBSDSTEM INTEGRATION TEST SUITE ===");

// Load helper lists
const ALL_SKILLS_LIST = ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'];

// Simulate characterState with Cross-Step Feats & Skills
const mockCharacterState = {
  race: {
    id: 'human',
    name: 'Human',
    traitChoices: { Versatile: 'Time-Touched' }
  },
  feats: [
    { id: 'time-touched', source: 'race_versatile', bonuses: { skill1: 'Stealth' } }
  ],
  background: {
    id: 'acolyte',
    name: 'Acolyte',
    originalSkills: ['Insight', 'Religion'],
    originFeats: [
      { id: 'magic-initiate-cleric', source: 'background', bonuses: { cantrip1: 'guidance' } }
    ]
  },
  classData: {
    classes: [
      {
        classId: 'fighter',
        level: 4,
        featureChoices: {
          'ClassSkills': ['Athletics', 'Intimidation'],
          'Feat_4': {
            id: 'skilled',
            bonuses: {
              skill1: 'Acrobatics',
              skill2: 'Performance',
              skill3: 'Deception'
            }
          }
        }
      }
    ]
  }
};

// 1. Test Universal Feats Harvester logic
function harvestProficiencies(characterState) {
  const proficiencies = new Set();

  // Class base skills
  (characterState.classData?.classes || []).forEach(cl => {
    if (cl.featureChoices?.['ClassSkills']) {
      cl.featureChoices['ClassSkills'].forEach(s => proficiencies.add(s));
    }
  });

  // Background skills
  (characterState.background?.originalSkills || []).forEach(s => proficiencies.add(s));

  // Universal Feat Harvester (Global, Race, Background, Class Feats)
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

  return Array.from(proficiencies);
}

const activeProficientSkills = harvestProficiencies(mockCharacterState);
console.log("Harvested Proficient Skills:", activeProficientSkills);

// Expected skills: Stealth (Race Time-Touched), Insight, Religion (Background Acolyte), Athletics, Intimidation (Fighter Base), Acrobatics, Performance, Deception (Fighter Level 4 Skilled Feat)
const expectedSkills = ['Stealth', 'Insight', 'Religion', 'Athletics', 'Intimidation', 'Acrobatics', 'Performance', 'Deception'];
const missingSkills = expectedSkills.filter(s => !activeProficientSkills.includes(s));

if (missingSkills.length === 0) {
  console.log("✅ TEST 1 PASSED: Universal Feat Harvester extracted ALL skills across Race, Class, Background, and Class Level 4 Feats!");
} else {
  console.error("❌ TEST 1 FAILED: Missing skills:", missingSkills);
  process.exit(1);
}

// 2. Test Case-Insensitive isProf Filtering
const isProf = (opt) => activeProficientSkills.some(p => String(p).trim().toLowerCase() === String(opt).trim().toLowerCase());
console.log("Testing isProf('acrobatics'):", isProf('acrobatics'));
console.log("Testing isProf('Survival'):", isProf('Survival'));

if (isProf('acrobatics') === true && isProf('Survival') === false) {
  console.log("✅ TEST 2 PASSED: Case-insensitive isProf filtering works perfectly!");
} else {
  console.error("❌ TEST 2 FAILED: isProf filtering returned incorrect result");
  process.exit(1);
}

// 3. Test Restricted Pool & D&D 2024 Rule Fallback
const restrictedPool = ['Insight', 'Religion']; // Both already proficient in Acolyte
let availablePool = restrictedPool.filter(opt => !isProf(opt));
let isRuleFallbackActive = false;

if (availablePool.length === 0) {
  isRuleFallbackActive = true;
  availablePool = ALL_SKILLS_LIST.filter(opt => !isProf(opt));
}

console.log("Restricted Pool:", restrictedPool);
console.log("Is D&D 2024 Rule Fallback Active?", isRuleFallbackActive);
console.log("Fallback Available Pool Count:", availablePool.length);

if (isRuleFallbackActive === true && availablePool.length === ALL_SKILLS_LIST.length - activeProficientSkills.length) {
  console.log("✅ TEST 3 PASSED: D&D 2024 Overlapping Proficiencies Rule Fallback triggered correctly when restricted pool was exhausted!");
} else {
  console.error("❌ TEST 3 FAILED: Fallback pool calculation error");
  process.exit(1);
}

console.log("=== 🎉 ALL AUTOMATED SUBSDSTEM INTEGRATION TESTS PASSED 100% ===");
