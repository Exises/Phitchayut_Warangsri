const fs = require('fs');
let code = fs.readFileSync('./src/components/workshop/steps/Step2Class.jsx', 'utf-8');

// Block 2 (Spellbook)
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

const block2FooterOriginal = `                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })
                                          ) : (`;

const block2FooterNew = `                                                    </button>
                                                  </div>
                                                </div>
                                                {expandedSpells[spellId] && spell?.spell_desc && (
                                                  <div style={{ padding: '8px 10px 8px 26px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                                )}
                                              </div>
                                              );
                                            })
                                          ) : (`;

code = code.replace(block2Original, block2New);
code = code.replace(block2FooterOriginal, block2FooterNew);

// Block 3 (Cantrips)
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

const block3FooterOriginal = `                                                  <i className="fa-solid fa-xmark"></i>
                                                </button>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>No cantrips selected.</p>`;

const block3FooterNew = `                                                  <i className="fa-solid fa-xmark"></i>
                                                </button>
                                              </div>
                                              {expandedSpells[spellId] && spell?.spell_desc && (
                                                <div style={{ padding: '8px 10px 8px 26px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                              )}
                                            </div>
                                            );
                                          })
                                        ) : (
                                          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>No cantrips selected.</p>`;

code = code.replace(block3Original, block3New);
code = code.replace(block3FooterOriginal, block3FooterNew);

// Block 4 (Leveled)
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

const block4FooterOriginal = `                                                <i className="fa-solid fa-xmark"></i>
                                              </button>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>`;

const block4FooterNew = `                                                <i className="fa-solid fa-xmark"></i>
                                              </button>
                                            </div>
                                            {expandedSpells[spellId] && spell?.spell_desc && (
                                              <div style={{ padding: '8px 10px 8px 26px', fontSize: '0.75rem', color: 'var(--color-ink)', borderTop: '1px solid #bbf7d0', backgroundColor: '#f8fafc' }} dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
                                            )}
                                          </div>
                                          );
                                        })
                                      ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>`;

code = code.replace(block4Original, block4New);
code = code.replace(block4FooterOriginal, block4FooterNew);

fs.writeFileSync('./src/components/workshop/steps/Step2Class.jsx', code);
console.log("Updated Step2Class.jsx with blocks 2, 3, 4");
