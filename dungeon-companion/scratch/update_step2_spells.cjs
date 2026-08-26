const fs = require('fs');
let code = fs.readFileSync('./src/components/workshop/steps/Step2Class.jsx', 'utf-8');

// 1. Update imports to include useState if not already there
if (code.includes("import React from 'react';")) {
  code = code.replace("import React from 'react';", "import React, { useState } from 'react';");
}

// 2. Add expandedSpells state
const funcSignature = `  proficientSkills,
  expertiseSkills
}) {`;
if (!code.includes("const [expandedSpells, setExpandedSpells] = useState({});")) {
  code = code.replace(funcSignature, funcSignature + "\n        const [expandedSpells, setExpandedSpells] = useState({});");
}

// 3. Fix the double checkmark on Known background
code = code.replace(
  /✓ Known \(\$\{\(knownSourceLabel \|\| 'Source'\)\.split\(' '\)\[0\]\}\)/g,
  `Known (\${(knownSourceLabel || 'Source').split(' ')[0]})`
);

// 4. Block 1 (Available Spells)
const block1Original = `                                            <div key={spell.spell_id} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isAlreadySelected ? 'var(--bg-white)' : 'var(--bg-white)' }}>
                                              <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  <strong style={{ display: 'block', color: 'var(--color-ink)' }}>{spell.spell_name}</strong>
                                                  {isKnownFromFeatOrOther && (
                                                    <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{knownSourceLabel}</span>
                                                  )}
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>{isCantrip ? 'Cantrip' : \`Level \${spell.spell_level}\`} • {spell.school}</span>
                                              </div>`;

const block1New = `                                            <div key={spell.spell_id} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', flexDirection: 'column', backgroundColor: isAlreadySelected ? 'var(--bg-white)' : 'var(--bg-white)' }}>
                                              <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <button onClick={() => setExpandedSpells(prev => ({ ...prev, [spell.spell_id]: !prev[spell.spell_id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--color-ink)' }}>
                                                      <i className={\`fa-solid fa-chevron-\${expandedSpells[spell.spell_id] ? 'up' : 'down'}\`}></i>
                                                    </button>
                                                    <strong style={{ display: 'block', color: 'var(--color-ink)' }}>{spell.spell_name}</strong>
                                                    {isKnownFromFeatOrOther && (
                                                      <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{knownSourceLabel}</span>
                                                    )}
                                                  </div>
                                                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)', marginLeft: '16px' }}>{isCantrip ? 'Cantrip' : \`Level \${spell.spell_level}\`} • {spell.school}</span>
                                                </div>`;

const block1FooterRegex = /(                                                title=\{isAdded \? 'Click to Remove\/Unprepare' : [^]+?<\/button>\n                                            <\/div>)/;

// We will do manual replacement for the bottom of Block 1
let block1Matches = code.match(block1FooterRegex);
if (block1Matches) {
    code = code.replace(block1Original, block1New);
    code = code.replace(block1Matches[0], block1Matches[0].replace('                                            </div>', `                                            </div>
                                              {expandedSpells[spell.spell_id] && spell?.spell_desc && (
                                                <div style={{ padding: '8px 10px 8px 26px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                              )}
                                            </div>`));
}

// 5. Block 2 (Spellbook)
const block2Original = `                                                <div key={\`sb-\${spellId}\`} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isPrepared ? '#f0fdf4' : 'var(--bg-white)' }}>
                                                  <div>
                                                    <strong style={{ display: 'block', color: 'var(--color-ink)' }}>{spell.spell_name}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>Level {spell.spell_level} • {spell.school}</span>
                                                  </div>`;

const block2New = `                                                <div key={\`sb-\${spellId}\`} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', flexDirection: 'column', backgroundColor: isPrepared ? '#f0fdf4' : 'var(--bg-white)' }}>
                                                  <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                      <button onClick={() => setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--color-ink)' }}>
                                                        <i className={\`fa-solid fa-chevron-\${expandedSpells[spellId] ? 'up' : 'down'}\`}></i>
                                                      </button>
                                                      <div>
                                                        <strong style={{ display: 'block', color: 'var(--color-ink)' }}>{spell.spell_name}</strong>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>Level {spell.spell_level} • {spell.school}</span>
                                                      </div>
                                                    </div>`;

const block2FooterRegex = /(                                                    <\/button>\n                                                  <\/div>\n                                                <\/div>)/;
let block2Matches = code.match(block2FooterRegex);
if (block2Matches) {
    code = code.replace(block2Original, block2New);
    code = code.replace(block2Matches[0], block2Matches[0].replace('                                                </div>', `                                                </div>
                                                  </div>
                                                  {expandedSpells[spellId] && spell?.spell_desc && (
                                                    <div style={{ padding: '8px 10px 8px 26px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                                  )}
                                                </div>`));
}

// 6. Block 3 (Cantrips)
const block3Original = `                                              <div key={\`prep-\${spellId}\`} style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', backgroundColor: 'var(--bg-white)' }}>
                                                <div>
                                                  <strong style={{ display: 'block', color: 'var(--color-ink)', fontSize: '0.9rem' }}>{spell.spell_name}</strong>
                                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{spell.school}</span>
                                                </div>`;

const block3New = `                                              <div key={\`prep-\${spellId}\`} style={{ border: '1px solid #d1d5db', borderRadius: '6px', display: 'flex', flexDirection: 'column', marginBottom: '8px', backgroundColor: 'var(--bg-white)' }}>
                                                <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <button onClick={() => setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--color-ink)' }}>
                                                      <i className={\`fa-solid fa-chevron-\${expandedSpells[spellId] ? 'up' : 'down'}\`}></i>
                                                    </button>
                                                    <div>
                                                      <strong style={{ display: 'block', color: 'var(--color-ink)', fontSize: '0.9rem' }}>{spell.spell_name}</strong>
                                                      <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{spell.school}</span>
                                                    </div>
                                                  </div>`;

const block3FooterRegex = /(                                                  <i className="fa-solid fa-xmark"><\/i>\n                                                <\/button>\n                                              <\/div>)/;
let block3Matches = code.match(block3FooterRegex);
if (block3Matches) {
    code = code.replace(block3Original, block3New);
    code = code.replace(block3Matches[0], block3Matches[0].replace('                                              </div>', `                                              </div>
                                                </div>
                                                {expandedSpells[spellId] && spell?.spell_desc && (
                                                  <div style={{ padding: '8px 10px 8px 26px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                                )}
                                              </div>`));
}

// 7. Block 4 (Leveled)
const block4Original = `                                            <div key={\`prep-\${spellId}\`} style={{ border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', backgroundColor: '#f0fdf4' }}>
                                              <div>
                                                <strong style={{ display: 'block', color: '#166534' }}>{spell.spell_name}</strong>
                                                <span style={{ fontSize: '0.8rem', color: '#15803d' }}>Level {spell.spell_level} • {spell.school}</span>
                                              </div>`;

const block4New = `                                            <div key={\`prep-\${spellId}\`} style={{ border: '1px solid #bbf7d0', borderRadius: '6px', display: 'flex', flexDirection: 'column', marginBottom: '8px', backgroundColor: '#f0fdf4' }}>
                                              <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  <button onClick={() => setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#166534' }}>
                                                    <i className={\`fa-solid fa-chevron-\${expandedSpells[spellId] ? 'up' : 'down'}\`}></i>
                                                  </button>
                                                  <div>
                                                    <strong style={{ display: 'block', color: '#166534' }}>{spell.spell_name}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: '#15803d' }}>Level {spell.spell_level} • {spell.school}</span>
                                                  </div>
                                                </div>`;

const block4FooterRegex = /(                                                <i className="fa-solid fa-xmark"><\/i>\n                                              <\/button>\n                                            <\/div>)/;
let block4Matches = code.match(block4FooterRegex);
if (block4Matches) {
    code = code.replace(block4Original, block4New);
    code = code.replace(block4Matches[0], block4Matches[0].replace('                                            </div>', `                                            </div>
                                              </div>
                                              {expandedSpells[spellId] && spell?.spell_desc && (
                                                <div style={{ padding: '8px 10px 8px 26px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #bbf7d0', backgroundColor: '#f8fafc' }} dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                              )}
                                            </div>`));
}

fs.writeFileSync('./src/components/workshop/steps/Step2Class.jsx', code);
console.log("Updated Step2Class.jsx");
