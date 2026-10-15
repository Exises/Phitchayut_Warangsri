import React, { useState } from 'react';
import ActionFilterPills from './ActionFilterPills';
import ActionTableAttack from './ActionTableAttack';
import ActionCard from './ActionCard';
import { resolveUnarmedStrike } from '../../utils/mechanicsResolver';

const STANDARD_ACTIONS = [
  { name: 'Attack', icon: 'fa-khanda', subtitle: 'Main Combat Action', desc: 'ทำการโจมตีแบบ Melee หรือ Ranged Attack 1 ครั้งด้วยอาวุธหรือ Unarmed Strike ความสามารถบางอย่างเช่น <strong>Extra Attack</strong> จะช่วยให้โจมตีได้มากกว่า 1 ครั้งต่อการทำ Attack action' },
  { name: 'Dash', icon: 'fa-person-running', subtitle: 'Movement Action', desc: 'เพิ่มระยะการเคลื่อนที่ (Movement) ในเทิร์นปัจจุบันเป็นจำนวนเท่ากับค่า Speed ของคุณหลังจากคำนวณ Modifier ทั้งหมด' },
  { name: 'Disengage', icon: 'fa-shield-halved', subtitle: 'Defensive Action', desc: 'การเคลื่อนที่ของคุณจะไม่กระตุ้นให้เกิด Opportunity Attacks ตลอดช่วงเวลาที่เหลือของเทิร์นปัจจุบัน' },
  { name: 'Dodge', icon: 'fa-user-shield', subtitle: 'Defensive Action', desc: 'มุ่งเน้นการหลบหลีกการโจมตีอย่างเต็มที่ การทอย Attack Roll เพื่อโจมตีใส่คุณจะมี Disadvantage (หากคุณมองเห็นผู้โจมตี) และคุณจะทอย Dexterity Saving Throw ด้วย Advantage' },
  { name: 'Grapple', icon: 'fa-hand-back-fist', subtitle: 'Special Melee Attack', desc: 'ทำการโจมตีระยะประชิดแบบพิเศษเพื่อจับยึดเป้าหมาย เป้าหมายต้องทอย Strength หรือ Dexterity Saving Throw แข่งกับ Grapple DC ของคุณ (8 + PB + STR) ให้ผ่าน มิฉะนั้นจะติดสถานะ Grappled' },
  { name: 'Help', icon: 'fa-handshake', subtitle: 'Support Action', desc: 'ช่วยเหลือเพื่อนร่วมทีม มอบ Advantage ให้กับการทอย Ability Check หรือ Attack Roll ครั้งถัดไปของพวกเขาต่อเป้าหมายที่อยู่ภายในระยะ 5 ฟุตจากคุณ' },
  { name: 'Hide', icon: 'fa-eye-slash', subtitle: 'Stealth Action', desc: 'ทอย Dexterity (Stealth) Check แข่งกับค่า Passive Perception ของศัตรูเพื่อซ่อนตัวไม่ให้ถูกตรวจพบ' },
  { name: 'Improvise', icon: 'fa-lightbulb', subtitle: 'Creative Action', desc: 'กระทำสิ่งใดก็ตามที่ไม่ได้ระบุไว้ในกฎมาตรฐาน DM จะเป็นผู้ตัดสินว่าสามารถทำได้หรือไม่ และต้องทอย D20 Test ใดบ้าง' },
  { name: 'Influence', icon: 'fa-comments', subtitle: 'Social Action', desc: 'ทอย Charisma Check (Persuasion, Deception, หรือ Intimidation) เพื่อโน้มน้าวหรือเปลี่ยนทัศนคติและพฤติกรรมของสิ่งมีชีวิต' },
  { name: 'Magic', icon: 'fa-wand-magic-sparkles', subtitle: 'Spellcasting Action', desc: 'ร่ายเวทมนตร์ (Cast a Spell) ที่ใช้เวลาในการร่าย 1 Action' },
  { name: 'Ready', icon: 'fa-stopwatch', subtitle: 'Delayed Action', desc: 'เตรียม Action ไว้ล่วงหน้าเพื่อให้ทำงานได้ทันทีเมื่อเกิดเหตุการณ์กระตุ้น (Trigger) ที่กำหนดไว้ก่อนถึงเทิร์นถัดไปของคุณ เมื่อทำงานจะใช้ Reaction ของคุณ' },
  { name: 'Search', icon: 'fa-magnifying-glass', subtitle: 'Exploration Action', desc: 'เพ่งสมาธิในการค้นหาบางสิ่ง ซึ่งโดยทั่วไปจะต้องทอย Wisdom (Perception) หรือ Intelligence (Investigation) Check' },
  { name: 'Shove', icon: 'fa-hand', subtitle: 'Special Melee Attack', desc: 'ผลักสิ่งมีชีวิตออกไป 5 ฟุต หรือทำให้ล้มลงสู่สถานะ Prone เป้าหมายต้องทอย Strength หรือ Dexterity Saving Throw แข่งกับ Shove DC ของคุณให้ผ่าน' },
  { name: 'Study', icon: 'fa-book-open', subtitle: 'Knowledge Action', desc: 'ระลึกความรู้สำคัญหรือตรวจสอบวิเคราะห์สิ่งต่าง ๆ โดยใช้ Intelligence Check (Arcana, History, Nature, หรือ Religion)' },
  { name: 'Utilize', icon: 'fa-toolbox', subtitle: 'Object Action', desc: 'โต้ตอบกับวัตถุชิ้นที่สองในเทิร์นของคุณ หรือเปิดใช้งานอุปกรณ์/เครื่องมือที่จำเป็นต้องใช้ Action' },
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
                  <p style={{ margin: '0 0 6px 0' }}>แทนที่จะใช้อาวุธในการโจมตีแบบ Melee Weapon Attack คุณสามารถใช้ Unarmed Strike: เช่น การต่อย, เตะ, โขกศีรษะ หรือการจู่โจมด้วยร่างกายในลักษณะเดียวกัน เมื่อโจมตีโดน (On a hit) ให้เลือกหนึ่งในตัวเลือกดังนี้:</p>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    <li><strong>Damage:</strong> สร้างความเสียหายแบบ {unarmed.damageType} damage ({unarmed.diceStr.startsWith('Flat') ? `Flat 1 + Modifier` : `${unarmed.diceStr} + Modifier`})</li>
                    <li><strong>Grapple:</strong> เป้าหมายต้องทอย Strength หรือ Dexterity Saving Throw แข่งกับ DC (8 + Proficiency Bonus + STR Mod) ให้ผ่าน มิฉะนั้นจะติดสถานะ Grappled</li>
                    <li><strong>Shove:</strong> เป้าหมายต้องทอย Strength หรือ Dexterity Saving Throw แข่งกับ DC (8 + Proficiency Bonus + STR Mod) ให้ผ่าน มิฉะนั้นจะถูกผลักถอยไป 5 ฟุต หรือล้มลงสู่สถานะ Prone</li>
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
                description="เมื่อคุณใช้ Attack action และโจมตีด้วยอาวุธระยะประชิดที่มีคุณสมบัติ Light ในมือข้างหนึ่ง คุณสามารถใช้ Bonus Action เพื่อโจมตีด้วยอาวุธ Light ในมืออีกข้างหนึ่งได้ โดยจะไม่นำ Ability Modifier ไปบวกกับ Damage ของการโจมตีจากโบนัสแอ็กชัน เว้นแต่ Modifier นั้นจะติดลบ หรือคุณมี Fighting Style: Two-Weapon Fighting"
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
                ไม่มี Bonus Action ที่พร้อมใช้งาน สวมใส่อาวุธ Light หรือเตรียมเวทมนตร์ที่มี Casting Time 1 Bonus Action
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
              description="คุณสามารถทำ Opportunity Attack ได้เมื่อมีศัตรูที่คุณมองเห็นเคลื่อนที่ออกจากระยะ Reach ของคุณ โดยใช้ Reaction ในการโจมตีแบบ Melee 1 ครั้งใส่เป้าหมายนั้น การโจมตีจะเกิดขึ้นทันทีก่อนที่เป้าหมายจะหลุดออกจากระยะของคุณ"
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
              description="คุณสามารถโต้ตอบกับวัตถุหรือสภาพแวดล้อมได้ฟรี 1 ครั้งระหว่างการเคลื่อนที่หรือการกระทำ (เช่น ชักดาบ หรือเปิดประตู) หากต้องการโต้ตอบกับวัตถุชิ้นที่สองจะต้องใช้ Utilize action"
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
                description={`<strong>Ritual Casting:</strong> คุณสามารถร่ายเวทมนตร์นี้เป็นพิธีกรรม (Ritual) ได้หากคุณเตรียมไว้ การร่ายแบบ Ritual จะใช้เวลาเพิ่มขึ้น 10 นาทีจากการร่ายปกติ แต่จะไม่เสีย Spell Slot<br/><br/>${sp.effect || sp.spellDesc || ''}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
