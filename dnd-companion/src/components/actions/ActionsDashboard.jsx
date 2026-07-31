import React, { useState } from 'react';
import ActionFilterPills from './ActionFilterPills';
import ActionTableAttack from './ActionTableAttack';
import ActionCard from './ActionCard';
import { resolveUnarmedStrike } from '../../utils/mechanicsResolver';

const STANDARD_ACTIONS = [
  { name: 'Attack', icon: 'fa-khanda', subtitle: 'Main Combat Action', desc: 'Make one melee or ranged attack with a weapon or unarmed strike. Certain features like <strong>Extra Attack</strong> allow multiple attacks per Attack action.' },
  { name: 'Dash', icon: 'fa-person-running', subtitle: 'Movement Action', desc: 'Gain extra movement for the current turn equal to your Speed after applying any modifiers.' },
  { name: 'Disengage', icon: 'fa-shield-halved', subtitle: 'Defensive Action', desc: 'Your movement does not provoke Opportunity Attacks for the rest of the current turn.' },
  { name: 'Dodge', icon: 'fa-user-shield', subtitle: 'Defensive Action', desc: 'Focus entirely on avoiding attacks. Attack rolls against you have Disadvantage if you can see the attacker, and you make Dexterity saving throws with Advantage.' },
  { name: 'Grapple', icon: 'fa-hand-back-fist', subtitle: 'Special Melee Attack', desc: 'Make a special melee attack to grab a target. Target must succeed on a Strength or Dexterity saving throw against your Grapple DC (8 + PB + STR) or suffer the Grappled condition.' },
  { name: 'Help', icon: 'fa-handshake', subtitle: 'Support Action', desc: 'Aid an ally, granting them Advantage on their next ability check or attack roll against a creature within 5 ft. of you.' },
  { name: 'Hide', icon: 'fa-eye-slash', subtitle: 'Stealth Action', desc: 'Make a Dexterity (Stealth) check against enemy passive Perception to conceal yourself.' },
  { name: 'Improvise', icon: 'fa-lightbulb', subtitle: 'Creative Action', desc: 'Perform an action not detailed in the standard rules. The GM determines if possible and what D20 Test is required.' },
  { name: 'Influence', icon: 'fa-comments', subtitle: 'Social Action', desc: 'Make a Charisma check (Persuasion, Deception, Intimidation) to alter a creature\'s attitude or behavior.' },
  { name: 'Magic', icon: 'fa-wand-magic-sparkles', subtitle: 'Spellcasting Action', desc: 'Cast a spell that requires 1 Action to cast.' },
  { name: 'Ready', icon: 'fa-stopwatch', subtitle: 'Delayed Action', desc: 'Prepare an action to occur instantly in response to a specific trigger before your next turn. Consumes your Reaction when triggered.' },
  { name: 'Search', icon: 'fa-magnifying-glass', subtitle: 'Exploration Action', desc: 'Devote your attention to finding something, typically requiring a Wisdom (Perception) or Intelligence (Investigation) check.' },
  { name: 'Shove', icon: 'fa-hand', subtitle: 'Special Melee Attack', desc: 'Push a creature 5 feet away or knock it prone. Target must succeed on a Strength or Dexterity saving throw against your Shove DC.' },
  { name: 'Study', icon: 'fa-book-open', subtitle: 'Knowledge Action', desc: 'Recall important lore or inspect a subject using an Intelligence check (Arcana, History, Nature, Religion).' },
  { name: 'Utilize', icon: 'fa-toolbox', subtitle: 'Object Action', desc: 'Interact with a second object on your turn or operate a device or tool requiring an action.' },
];

export default function ActionsDashboard({
  characterState,
  activeWeaponsList = [],
  attackSpellsList = [],
  bonusActionSpells = [],
  reactionSpells = [],
  ritualSpells = [],
  strMod = 0,
  dexMod = 0,
  spellMod = 0,
  profBonus = 2,
  /* totalLvl = 1, */
  fmtMod,
  triggerQuickRoll,
  onAddWeaponClick,
  /* liveSpellSlots = {}, */
  /* setLiveSpellSlots, */
  resolvedMechanics = null
}) {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const unarmed = resolvedMechanics?.unarmedStrike || resolveUnarmedStrike(characterState || {}) || {
    hitBonus: strMod + profBonus,
    dmgMod: strMod,
    diceStr: 'Flat 1',
    damageType: 'Bludgeoning',
    sourceNote: 'Standard Unarmed Strike'
  };

  // Calculate dynamic attacks per action
  const classList = characterState?.classData?.classes || [];
  const hasExtraAttack = classList.some(cl => ['fighter', 'paladin', 'ranger', 'barbarian', 'monk'].includes(String(cl.classId).toLowerCase()) && cl.level >= 5);
  const attacksPerAction = hasExtraAttack ? 2 : 1;

  // Check Two-Weapon Fighting eligibility
  const lightWeapons = activeWeaponsList.filter(w => {
    const props = Array.isArray(w.properties) ? w.properties : (w.properties || '').split(',');
    return props.some(p => p.toLowerCase().includes('light'));
  });
  const canTwoWeaponFight = lightWeapons.length >= 2 || activeWeaponsList.length >= 2;

  const showAttack = activeFilter === 'ALL' || activeFilter === 'ATTACK';
  const showAction = activeFilter === 'ALL' || activeFilter === 'ACTION';
  const showBonus = activeFilter === 'ALL' || activeFilter === 'BONUS ACTION';
  const showReaction = activeFilter === 'ALL' || activeFilter === 'REACTION';
  const showOther = activeFilter === 'ALL' || activeFilter === 'OTHER';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
      <ActionFilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* 1. ATTACK SECTION */}
      {showAttack && (
        <ActionTableAttack
          characterState={characterState}
          resolvedMechanics={resolvedMechanics}
          activeWeaponsList={activeWeaponsList}
          attackSpellsList={attackSpellsList}
          strMod={strMod}
          dexMod={dexMod}
          spellMod={spellMod}
          profBonus={profBonus}
          attacksPerAction={attacksPerAction}
          fmtMod={fmtMod}
          triggerQuickRoll={triggerQuickRoll}
          onAddWeaponClick={onAddWeaponClick}
        />
      )}

      {/* 2. ACTION SECTION */}
      {showAction && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.05rem', color: '#711a19', borderBottom: '2px solid #711a19', paddingBottom: '4px', marginBottom: '12px', textTransform: 'uppercase' }}>
            Standard Actions in Combat
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Unarmed Strike Detailed Card */}
            <ActionCard
              title="Unarmed Strike"
              subtitle={`Melee Attack • 5 ft. Reach (${unarmed.sourceNote})`}
              icon="fa-hand-fist"
              defaultExpanded={false}
              actionButtons={
                <>
                  <button
                    type="button"
                    onClick={() => triggerQuickRoll('Unarmed Strike Hit', unarmed.hitBonus)}
                    style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Hit {fmtMod(unarmed.hitBonus)}
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerQuickRoll('Unarmed Strike Damage', unarmed.dmgMod, unarmed.diceStr)}
                    style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: '#991b1b' }}
                  >
                    {unarmed.diceStr.startsWith('Flat') ? Math.max(1, 1 + unarmed.dmgMod) : `${unarmed.diceStr}${unarmed.dmgMod >= 0 ? `+${unarmed.dmgMod}` : unarmed.dmgMod}`} Dmg
                  </button>
                </>
              }
              description={
                <div>
                  <p style={{ margin: '0 0 6px 0' }}>Instead of using a weapon to make a melee weapon attack, you can use an Unarmed Strike: a punch, kick, headbutt, or similar forceful blow. On a hit, choose one of the following options:</p>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    <li><strong>Damage:</strong> You deal {unarmed.damageType} damage ({unarmed.diceStr.startsWith('Flat') ? `Flat 1 + Modifier` : `${unarmed.diceStr} + Modifier`}).</li>
                    <li><strong>Grapple:</strong> The target must succeed on a Strength or Dexterity saving throw (DC = 8 + Proficiency Bonus + STR Mod) or suffer the Grappled condition.</li>
                    <li><strong>Shove:</strong> The target must succeed on a Strength or Dexterity saving throw (DC = 8 + Proficiency Bonus + STR Mod) or be pushed 5 feet away or knocked Prone.</li>
                  </ul>
                </div>
              }
            />

            {/* Standard Actions Grid / List */}
            {STANDARD_ACTIONS.map(act => (
              <ActionCard
                key={act.name}
                title={act.name}
                subtitle={act.subtitle}
                icon={act.icon}
                description={act.desc}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. BONUS ACTION SECTION */}
      {showBonus && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.05rem', color: '#711a19', borderBottom: '2px solid #711a19', paddingBottom: '4px', marginBottom: '12px', textTransform: 'uppercase' }}>
            Bonus Actions
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Two-Weapon Fighting */}
            {canTwoWeaponFight && (
              <ActionCard
                title="Two-Weapon Fighting (Off-Hand Attack)"
                subtitle="Combat Action • Bonus Action"
                icon="fa-khanda"
                defaultExpanded={true}
                description="When you take the Attack action and attack with a Light melee weapon that you're holding in one hand, you can use a Bonus Action to attack with a different Light melee weapon that you're holding in the other hand. You don't add your ability modifier to the damage of the bonus attack, unless that modifier is negative or you have the Two-Weapon Fighting Style."
              />
            )}

            {/* Bonus Action Spells */}
            {bonusActionSpells.map((sp, idx) => (
              <ActionCard
                key={`ba_${idx}`}
                title={sp.name}
                subtitle={`Level ${sp.level || 0} Spell • 1 Bonus Action`}
                icon="fa-wand-magic-sparkles"
                actionButtons={
                  <button
                    type="button"
                    onClick={() => triggerQuickRoll(`✨ Cast ${sp.name} (Bonus Action)`, spellMod + profBonus)}
                    style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', padding: '3px 10px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    CAST
                  </button>
                }
                description={sp.effect || sp.spellDesc || 'Cast this spell as a Bonus Action on your turn.'}
              />
            ))}

            {/* Placeholder if empty */}
            {!canTwoWeaponFight && bonusActionSpells.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-gray)', fontStyle: 'italic', fontSize: '0.85rem', backgroundColor: 'var(--bg-white)', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                No active Bonus Actions available. Equip Light weapons or prepare spells with a 1 Bonus Action casting time.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. REACTION SECTION */}
      {showReaction && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.05rem', color: '#711a19', borderBottom: '2px solid #711a19', paddingBottom: '4px', marginBottom: '12px', textTransform: 'uppercase' }}>
            Reactions
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Opportunity Attack */}
            <ActionCard
              title="Opportunity Attack"
              subtitle="Trigger: Hostile creature leaves reach"
              icon="fa-bolt"
              defaultExpanded={true}
              actionButtons={
                <button
                  type="button"
                  onClick={() => triggerQuickRoll('Opportunity Attack Hit', strMod + profBonus)}
                  style={{ backgroundColor: '#711a19', color: 'var(--bg-white)', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
                >
                  Strike
                </button>
              }
              description="You can make an Opportunity Attack when a hostile creature that you can see moves out of your reach. To make the Opportunity Attack, you use a Reaction to make one melee attack against the provoking creature. The attack occurs right before the creature leaves your reach."
            />

            {/* Reaction Spells */}
            {reactionSpells.map((sp, idx) => (
              <ActionCard
                key={`re_${idx}`}
                title={sp.name}
                subtitle={`Level ${sp.level || 0} Spell • 1 Reaction`}
                icon="fa-shield-halved"
                actionButtons={
                  <button
                    type="button"
                    onClick={() => triggerQuickRoll(`✨ Cast ${sp.name} (Reaction)`, spellMod + profBonus)}
                    style={{ backgroundColor: '#1d4ed8', color: 'var(--bg-white)', border: 'none', padding: '3px 10px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    REACT
                  </button>
                }
                description={sp.effect || sp.spellDesc || 'Cast this spell immediately when its Reaction trigger occurs.'}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. OTHER SECTION */}
      {showOther && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.05rem', color: '#711a19', borderBottom: '2px solid #711a19', paddingBottom: '4px', marginBottom: '12px', textTransform: 'uppercase' }}>
            Other & Ritual Actions
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ActionCard
              title="Interact with an Object"
              subtitle="Free Interaction • 1/Turn"
              icon="fa-hand"
              description="You can interact with one object or feature of the environment for free, during either your move or action (e.g. drawing a sword, opening a door). Interacting with a second object requires taking the Utilize action."
            />

            {/* Ritual Spells */}
            {ritualSpells.map((sp, idx) => (
              <ActionCard
                key={`rit_${idx}`}
                title={sp.name}
                subtitle={`Level ${sp.level || 1} Spell • Ritual (10+ Minutes)`}
                icon="fa-book-journal-whills"
                actionButtons={
                  <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--border-color)', color: 'var(--color-gray)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    No Slot Cost
                  </span>
                }
                description={`<strong>Ritual Casting:</strong> You can cast this spell as a ritual if you have it prepared. A ritual version takes 10 minutes longer to cast than normal and does not expend a spell slot.<br/><br/>${sp.effect || sp.spellDesc || ''}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
