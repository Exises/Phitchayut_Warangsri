const fs = require('fs');
let code = fs.readFileSync('./src/components/workshop/steps/Step7Review.jsx', 'utf-8');

const targetStart = `                    {/* Main 3-Column Layout */}`;
const targetEnd = `                    {/* Footer */}`;

let parts = code.split(targetStart);
if (parts.length < 2) {
  console.log("Could not find any instances of targetStart");
  process.exit(1);
}

// Generate the new accordion-based layout
const newLayout = `\n                    {/* Main Accordion Layout */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', minHeight: '350px', paddingRight: '8px' }}>
                      
                      {/* Section 1: Prepared Spells & Cantrips */}
                      <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #bbf7d0', borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
                        <h5 
                          onClick={() => setManageSpellsAccordion(prev => ({ ...prev, prepared: !prev.prepared }))}
                          style={{ margin: '0', fontSize: '1rem', color: '#166534', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'rgba(22, 101, 52, 0.05)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                        >
                          <span>✨ Prepared & Cantrips ({((activeSpellState.cantrips?.length || 0) + (activeSpellState.prepared?.length || 0))})</span>
                          <i className={\`fa-solid fa-chevron-\${manageSpellsAccordion.prepared ? 'up' : 'down'}\`}></i>
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
                                    <div key={\`prep-can-\${spellId}\`} style={{ display: 'flex', flexDirection: 'column', borderRadius: '6px', backgroundColor: 'var(--bg-white)', border: '1px solid #bbf7d0', fontSize: '0.8rem', marginBottom: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <button
                                            onClick={() => setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }))}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#166534' }}
                                          >
                                            <i className={\`fa-solid fa-chevron-\${expandedSpells[spellId] ? 'up' : 'down'}\`}></i>
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
                                          {spell.spell_desc}
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
                                    <div key={\`prep-sp-\${spellId}\`} style={{ display: 'flex', flexDirection: 'column', borderRadius: '6px', backgroundColor: 'var(--bg-white)', border: '1px solid #bbf7d0', fontSize: '0.8rem', marginBottom: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <button
                                            onClick={() => setExpandedSpells(prev => ({ ...prev, [spellId]: !prev[spellId] }))}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#166534' }}
                                          >
                                            <i className={\`fa-solid fa-chevron-\${expandedSpells[spellId] ? 'up' : 'down'}\`}></i>
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
                                          {spell.spell_desc}
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
                              <i className={\`fa-solid fa-chevron-\${manageSpellsAccordion.spellbook ? 'up' : 'down'}\`}></i>
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
                                      ...Array.from({ length: 9 }).map((_, i) => ({ label: \`LVL \${i+1}\`, val: String(i+1) }))
                                    ].map(filterBtn => {
                                      const isSel = (sheetSpellbookLevels || ['all']).includes(filterBtn.val);
                                      return (
                                        <button
                                          key={\`book-lvl-\${filterBtn.val}\`}
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
                                              <i className={\`fa-solid fa-chevron-\${expandedSpells[spellId] ? 'up' : 'down'}\`}></i>
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
                                            {spell.spell_desc}
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
                          <i className={\`fa-solid fa-chevron-\${manageSpellsAccordion.available ? 'up' : 'down'}\`}></i>
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
                                  ...Array.from({ length: 9 }).map((_, i) => ({ label: \`LVL \${i+1}\`, val: String(i+1) }))
                                ].map(filterBtn => {
                                  const isSel = (sheetManageSpellLevel || ['all']).includes(filterBtn.val);
                                  return (
                                    <button
                                      key={\`avail-lvl-\${filterBtn.val}\`}
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
                                          <i className={\`fa-solid fa-chevron-\${expandedSpells[spell.spell_id] ? 'up' : 'down'}\`}></i>
                                        </button>
                                        <div>
                                          <div style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>{spell.spell_name}</div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>{isLvl0 ? 'Cantrip' : \`Level \${spell.spell_level}\`} • {spell.school || 'Magic'}</div>
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
                                        {spell.spell_desc}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>\n`;

let newCode = parts[0];
for (let i = 1; i < parts.length; i++) {
  let chunk = parts[i];
  let endIdx = chunk.indexOf(targetEnd);
  if (endIdx !== -1) {
    newCode += newLayout + chunk.substring(endIdx);
  } else {
    // Failsafe, should not happen if file is structured correctly
    newCode += targetStart + chunk;
  }
}

fs.writeFileSync('./src/components/workshop/steps/Step7Review.jsx', newCode);
console.log('Successfully reorganized all instances of the modal');
