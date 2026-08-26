import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ALL_SKILLS_LIST, ARTISAN_TOOLS_LIST, MUSICAL_INSTRUMENTS_LIST, STAT_OPTIONS, getFeatConfig } from '../../utils/workshopHelpers';

export const CustomLevelSelect = ({ value, maxLevel, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = Array.from({length: maxLevel}, (_, i) => i + 1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'var(--bg-white)', cursor: 'pointer', fontWeight: 'bold', width: '65px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
      >
        <span>{value}</span>
        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}></i>
      </div>
      {isOpen && (
        <React.Fragment>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setIsOpen(false)}></div>
          <ul style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-white)', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '4px 0', margin: 0, listStyle: 'none', width: '100%', maxHeight: '360px', overflowY: 'auto', zIndex: 99999 }}>
            {options.map(lvl => (
              <li 
                key={lvl}
                onClick={() => { onChange(lvl); setIsOpen(false); }}
                style={{ padding: '8px 12px', cursor: 'pointer', background: value === lvl ? '#fef2f2' : 'transparent', color: value === lvl ? '#711a19' : '#374151', fontWeight: value === lvl ? 'bold' : 'normal', textAlign: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-white)'}
                onMouseLeave={e => e.currentTarget.style.background = value === lvl ? '#fef2f2' : 'transparent'}
              >
                {lvl}
              </li>
            ))}
          </ul>
        </React.Fragment>
      )}
    </div>
  );
};

export const CustomSelect = ({ value, onChange, style, children, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0, bottom: 0, width: 0, openUpwards: false, maxH: 360 });
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxH = Math.max(140, openUpwards ? Math.min(360, spaceAbove - 15) : Math.min(360, spaceBelow - 15));
    setCoords({
      left: rect.left,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      openUpwards,
      maxH
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      document.body.style.overflow = 'hidden';
      const handleScroll = (e) => {
        if (listRef.current && !listRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      const handleResize = () => setIsOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const flattenOptions = (ch) => {
    let opts = [];
    React.Children.toArray(ch).forEach(child => {
      if (!child) return;
      if (child.type === React.Fragment) {
        opts = opts.concat(flattenOptions(child.props.children));
      } else if (child.props && child.props.value !== undefined) {
        opts.push({
          value: child.props.value,
          label: child.props.children,
          disabled: Boolean(child.props.disabled)
        });
      }
    });
    return opts;
  };

  const options = flattenOptions(children);
  const selectedOpt = options.find(o => String(o.value) === String(value));
  const displayLabel = selectedOpt ? selectedOpt.label : (options[0]?.label || '-- Choose --');

  return (
    <div
      ref={triggerRef}
      style={{ position: 'relative', width: style?.width || '100%', maxWidth: style?.maxWidth || '100%', display: style?.display || 'block', marginBottom: style?.marginBottom || 0 }}
    >
      <div
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updateCoords();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          ...style,
          width: '100%',
          maxWidth: '100%',
          background: disabled ? 'var(--bg-white)' : 'var(--bg-white)',
          color: disabled ? '#9ca3af' : 'var(--color-ink)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          boxSizing: 'border-box',
          minHeight: '34px',
          borderRadius: style?.borderRadius || '4px',
          border: style?.border || '1px solid #d1d5db',
          padding: style?.padding || '6px 10px',
          fontSize: style?.fontSize || '0.85rem'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
          {displayLabel}
        </span>
        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', color: 'var(--color-gray)', flexShrink: 0 }}></i>
      </div>
      {isOpen && !disabled && createPortal(
        <React.Fragment>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setIsOpen(false)}></div>
          <ul
            ref={listRef}
            style={{
              position: 'fixed',
              ...(coords.openUpwards
                ? { bottom: `${window.innerHeight - coords.top + 4}px` }
                : { top: `${coords.bottom + 4}px` }),
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxH}px`,
              background: 'var(--bg-white)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
              padding: '4px 0',
              margin: 0,
              listStyle: 'none',
              overflowY: 'auto',
              zIndex: 99999,
              boxSizing: 'border-box'
            }}
          >
            {options.map((opt, oIdx) => (
              <li
                key={oIdx}
                onClick={() => {
                  if (!opt.disabled) {
                    onChange({ target: { value: opt.value } });
                    setIsOpen(false);
                  }
                }}
                style={{
                  padding: '8px 12px',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  color: opt.disabled ? '#9ca3af' : (opt.value === '' ? 'var(--color-gray)' : (String(value) === String(opt.value) ? '#711a19' : '#374151')),
                  background: opt.disabled ? 'var(--bg-white)' : (String(value) === String(opt.value) ? '#fef2f2' : 'transparent'),
                  fontWeight: String(value) === String(opt.value) ? 'bold' : 'normal',
                  fontSize: style?.fontSize || '0.85rem',
                  borderBottom: oIdx === 0 ? '1px solid #f3f4f6' : 'none',
                  textAlign: 'left'
                }}
                onMouseEnter={e => { if (!opt.disabled) e.currentTarget.style.background = 'var(--bg-white)'; }}
                onMouseLeave={e => { if (!opt.disabled) e.currentTarget.style.background = opt.disabled ? 'var(--bg-white)' : (String(value) === String(opt.value) ? '#fef2f2' : 'transparent'); }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </React.Fragment>,
        document.body
      )}
    </div>
  );
};

export const FeatChoiceEditor = ({ featId, currentBonuses = {}, onBonusChange, dbData, proficientSkills = [], allKnownSpellIds = [], characterState, style = {} }) => {
  const cleanId = String(featId || '').toLowerCase();
  const featConfig = getFeatConfig(featId, dbData);

  // 1. Magic Initiate
  if (cleanId.startsWith('magic-initiate') || cleanId.startsWith('magic initiate')) {
    // Harvest spell lists used in OTHER Magic Initiate selections (deep scan across Race, Class, Background, and Feats)
    const usedLists = new Set();
    
    // Deep recursive scanner helper
    const scanObjectForList = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(item => scanObjectForList(item));
        return;
      }
      if (obj.list && typeof obj.list === 'string' && obj !== currentBonuses) {
        usedLists.add(obj.list.toLowerCase());
      }
      Object.values(obj).forEach(val => {
        if (val && typeof val === 'object' && val !== currentBonuses) {
          scanObjectForList(val);
        }
      });
    };

    if (characterState) {
      if (characterState.race?.traitChoices) scanObjectForList(characterState.race.traitChoices);
      if (characterState.classData?.classes) scanObjectForList(characterState.classData.classes);
      if (characterState.background?.featBonuses) scanObjectForList(characterState.background.featBonuses);
      if (Array.isArray(characterState.feats)) scanObjectForList(characterState.feats);
    }

    const presetList = cleanId.includes('wizard') ? 'wizard' : cleanId.includes('cleric') ? 'cleric' : cleanId.includes('druid') ? 'druid' : '';
    let spellClass = currentBonuses.list || presetList || 'wizard';
    if (usedLists.has(spellClass) && !currentBonuses.list) {
      // Find first unused list
      const availableLists = ['wizard', 'cleric', 'druid'].filter(l => !usedLists.has(l));
      if (availableLists.length > 0) spellClass = availableLists[0];
    }
    const clInfo = dbData?.classes?.find(c => c.class_id === spellClass);
    const spellIds = clInfo?.spell_list ? JSON.parse(clInfo.spell_list) : [];
    
    const availableCantrips = dbData?.spells?.filter(s => s.spell_level === 0 && (spellIds.includes(s.spell_id) || (s.classes && s.classes.toLowerCase().includes(spellClass)))) || [];
    const availableLevel1 = dbData?.spells?.filter(s => s.spell_level === 1 && (spellIds.includes(s.spell_id) || (s.classes && s.classes.toLowerCase().includes(spellClass)))) || [];

    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#711a19' }}></i> Magic Initiate Spellcasting Options:
        </div>

        <CustomSelect
            value={spellClass}
            onChange={(e) => onBonusChange({ ...currentBonuses, list: e.target.value, cantrip1: '', cantrip2: '', spell1: '' })}
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="">-- Choose Spell List (D&D 2024 Rules) --</option>
            {(!usedLists.has('cleric') || spellClass === 'cleric') && <option value="cleric">Cleric Spell List</option>}
            {(!usedLists.has('druid') || spellClass === 'druid') && <option value="druid">Druid Spell List</option>}
            {(!usedLists.has('wizard') || spellClass === 'wizard') && <option value="wizard">Wizard Spell List</option>}
          </CustomSelect>

        <CustomSelect
          value={currentBonuses.stat || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, stat: e.target.value })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose Spellcasting Ability --</option>
          <option value="int">Intelligence</option>
          <option value="wis">Wisdom</option>
          <option value="cha">Charisma</option>
        </CustomSelect>

        {spellClass && (
          <>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gray)', marginTop: '4px' }}>Choose 2 Cantrips:</div>
            {[1, 2].map(num => (
              <CustomSelect
                key={`cantrip-${num}`}
                value={currentBonuses[`cantrip${num}`] || ''}
                onChange={(e) => onBonusChange({ ...currentBonuses, [`cantrip${num}`]: e.target.value })}
                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="">-- Choose Cantrip #{num} --</option>
                {availableCantrips.map(s => {
                  const isSelected = [1, 2].some(n => n !== num && currentBonuses[`cantrip${n}`] === s.spell_id);
                  const isAlreadyKnown = !isSelected && currentBonuses[`cantrip${num}`] !== s.spell_id && allKnownSpellIds.includes(String(s.spell_id).toLowerCase());
                  if (isSelected || isAlreadyKnown) return null;
                  return <option key={s.spell_id} value={s.spell_id}>{s.spell_name}</option>;
                })}
              </CustomSelect>
            ))}

            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gray)', marginTop: '4px' }}>Choose 1st-Level Spell:</div>
            <CustomSelect
              value={currentBonuses.spell1 || ''}
              onChange={(e) => onBonusChange({ ...currentBonuses, spell1: e.target.value })}
              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">-- Choose 1st-Level Spell --</option>
              {availableLevel1.map(s => {
                const isAlreadyKnown = currentBonuses.spell1 !== s.spell_id && allKnownSpellIds.includes(String(s.spell_id).toLowerCase());
                if (isAlreadyKnown) return null;
                return <option key={s.spell_id} value={s.spell_id}>{s.spell_name}</option>;
              })}
            </CustomSelect>
          </>
        )}
      </div>
    );
  }

  // 1b. Fey Touched & Shadow Touched
  if (cleanId.includes('fey-touched') || cleanId.includes('fey touched') || cleanId.includes('shadow-touched') || cleanId.includes('shadow touched')) {
    const isFey = cleanId.includes('fey');
    const fixedSpellName = isFey ? 'Misty Step' : 'Invisibility';
    const allowedSchools = isFey ? ['Divination', 'Enchantment'] : ['Illusion', 'Necromancy'];
    const availableLevel1 = dbData?.spells?.filter(s => parseInt(s.spell_level || 0, 10) === 1 && allowedSchools.includes(s.school)) || [];

    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-sparkles" style={{ color: '#711a19' }}></i> {isFey ? 'Fey Touched' : 'Shadow Touched'} Options:
        </div>
        <div style={{ fontSize: '0.8rem', color: '#15803d', backgroundColor: '#dcfce7', padding: '6px 10px', borderRadius: '6px', border: '1px solid #86efac' }}>
          <strong>Learned Spell:</strong> {fixedSpellName} (Free cast 1/Long Rest).
        </div>
        <CustomSelect
          value={currentBonuses.stat || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, stat: e.target.value })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose Spellcasting Ability (+1) --</option>
          <option value="int">Intelligence (+1)</option>
          <option value="wis">Wisdom (+1)</option>
          <option value="cha">Charisma (+1)</option>
        </CustomSelect>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gray)', marginTop: '4px' }}>Choose 1st-Level {allowedSchools.join(' / ')} Spell:</div>
        <CustomSelect
          value={currentBonuses.spell1 || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, spell1: e.target.value })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose 1st-Level Spell --</option>
          {availableLevel1.map(s => {
            const isAlreadyKnown = currentBonuses.spell1 !== s.spell_id && allKnownSpellIds.includes(String(s.spell_id).toLowerCase());
            if (isAlreadyKnown) return null;
            return <option key={s.spell_id} value={s.spell_id}>{s.spell_name} ({s.school})</option>;
          })}
        </CustomSelect>
      </div>
    );
  }

  // 1c. Spell Sniper
  if (cleanId.includes('spell-sniper') || cleanId.includes('spell sniper')) {
    const spellClass = currentBonuses.list || 'wizard';
    const clInfo = dbData?.classes?.find(c => c.class_id === spellClass);
    const spellIds = clInfo?.spell_list ? JSON.parse(clInfo.spell_list) : [];
    const availableCantrips = dbData?.spells?.filter(s => parseInt(s.spell_level || 0, 10) === 0 && (spellIds.includes(s.spell_id) || (s.classes && s.classes.toLowerCase().includes(spellClass)))) || [];

    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-crosshairs" style={{ color: '#711a19' }}></i> Spell Sniper Options:
        </div>
        <CustomSelect
          value={currentBonuses.list || 'wizard'}
          onChange={(e) => onBonusChange({ ...currentBonuses, list: e.target.value, cantrip1: '' })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="wizard">Wizard Spell List</option>
          <option value="cleric">Cleric Spell List</option>
          <option value="druid">Druid Spell List</option>
        </CustomSelect>
        <CustomSelect
          value={currentBonuses.stat || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, stat: e.target.value })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose Spellcasting Ability (+1) --</option>
          <option value="int">Intelligence (+1)</option>
          <option value="wis">Wisdom (+1)</option>
          <option value="cha">Charisma (+1)</option>
        </CustomSelect>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gray)', marginTop: '4px' }}>Choose Attack Cantrip:</div>
        <CustomSelect
          value={currentBonuses.cantrip1 || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, cantrip1: e.target.value })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose Cantrip --</option>
          {availableCantrips.map(s => {
            const isAlreadyKnown = currentBonuses.cantrip1 !== s.spell_id && allKnownSpellIds.includes(String(s.spell_id).toLowerCase());
            return <option key={s.spell_id} value={s.spell_id} disabled={isAlreadyKnown}>{s.spell_name}{isAlreadyKnown ? ' (Already Known)' : ''}</option>;
          })}
        </CustomSelect>
      </div>
    );
  }

  // 1d. Telepathic & Telekinetic
  if (cleanId.includes('telepathic') || cleanId.includes('telekinetic')) {
    const isTelepathic = cleanId.includes('telepathic');
    const spellName = isTelepathic ? 'Detect Thoughts' : 'Mage Hand';
    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-brain" style={{ color: '#711a19' }}></i> {isTelepathic ? 'Telepathic' : 'Telekinetic'} Options:
        </div>
        <div style={{ fontSize: '0.8rem', color: '#15803d', backgroundColor: '#dcfce7', padding: '6px 10px', borderRadius: '6px', border: '1px solid #86efac' }}>
          <strong>Learned Spell:</strong> {spellName} {isTelepathic ? '(Free cast 1/Long Rest or without components)' : '(Cantrip / Invisible)'}.
        </div>
        <CustomSelect
          value={currentBonuses.stat || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, stat: e.target.value })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose Ability (+1) --</option>
          <option value="int">Intelligence (+1)</option>
          <option value="wis">Wisdom (+1)</option>
          <option value="cha">Charisma (+1)</option>
        </CustomSelect>
      </div>
    );
  }

  // 1e. Aberrant Dragonmark
  if (cleanId.includes('aberrant-dragonmark') || cleanId.includes('aberrant dragonmark')) {
    const clInfo = dbData?.classes?.find(c => c.class_id === 'sorcerer');
    const spellIds = clInfo?.spell_list ? JSON.parse(clInfo.spell_list) : [];
    const availableCantrips = dbData?.spells?.filter(s => parseInt(s.spell_level || 0, 10) === 0 && (spellIds.includes(s.spell_id) || (s.classes && s.classes.toLowerCase().includes('sorcerer')))) || [];
    const availableLevel1 = dbData?.spells?.filter(s => parseInt(s.spell_level || 0, 10) === 1 && (spellIds.includes(s.spell_id) || (s.classes && s.classes.toLowerCase().includes('sorcerer')))) || [];

    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-dragon" style={{ color: '#711a19' }}></i> Aberrant Dragonmark Options (CON is Spellcasting Ability):
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gray)', marginTop: '4px' }}>Choose Sorcerer Cantrip:</div>
        <CustomSelect
          value={currentBonuses.cantrip1 || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, cantrip1: e.target.value, stat: 'con' })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose Cantrip --</option>
          {availableCantrips.map(s => {
            const isAlreadyKnown = currentBonuses.cantrip1 !== s.spell_id && allKnownSpellIds.includes(String(s.spell_id).toLowerCase());
            return <option key={s.spell_id} value={s.spell_id} disabled={isAlreadyKnown}>{s.spell_name}{isAlreadyKnown ? ' (Already Known)' : ''}</option>;
          })}
        </CustomSelect>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-gray)', marginTop: '4px' }}>Choose 1st-Level Sorcerer Spell (Free cast 1/Short or Long Rest):</div>
        <CustomSelect
          value={currentBonuses.spell1 || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, spell1: e.target.value, stat: 'con' })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose 1st-Level Spell --</option>
          {availableLevel1.map(s => {
            const isAlreadyKnown = currentBonuses.spell1 !== s.spell_id && allKnownSpellIds.includes(String(s.spell_id).toLowerCase());
            return <option key={s.spell_id} value={s.spell_id} disabled={isAlreadyKnown}>{s.spell_name}{isAlreadyKnown ? ' (Already Known)' : ''}</option>;
          })}
        </CustomSelect>
      </div>
    );
  }

  // 1f. Time-Touched (Echoes of Another Era: 1 Skill or Tool Choice)
  if (cleanId.includes('time-touched') || cleanId.includes('time touched')) {
    const fullPool = [...ALL_SKILLS_LIST, ...ARTISAN_TOOLS_LIST, ...MUSICAL_INSTRUMENTS_LIST];
    const isProf = (opt) => proficientSkills.some(p => String(p).trim().toLowerCase() === String(opt).trim().toLowerCase());
    const availablePool = fullPool.filter(opt => !isProf(opt) || String(currentBonuses.skill1 || '').toLowerCase() === String(opt).toLowerCase());

    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-hourglass-half" style={{ color: '#711a19' }}></i> Echoes of Another Era: Choose 1 Skill or Tool:
        </div>
        <CustomSelect
          value={currentBonuses.skill1 || currentBonuses.tool1 || ''}
          onChange={(e) => onBonusChange({ ...currentBonuses, skill1: e.target.value })}
          style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">-- Choose 1 Skill or Tool Proficiency --</option>
          {availablePool.map(opt => {
            const isAlreadyProficient = (proficientSkills || []).includes(opt) && (currentBonuses.skill1 || currentBonuses.tool1) !== opt;
            if (isAlreadyProficient) return null;
            return <option key={opt} value={opt}>{opt}</option>;
          })}
        </CustomSelect>
      </div>
    );
  }

  // 2. Skilled
  if (cleanId === 'skilled' || cleanId.includes('skilled')) {
    const allOptions = [...ALL_SKILLS_LIST, ...ARTISAN_TOOLS_LIST];
    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-graduation-cap" style={{ color: '#711a19' }}></i> Skilled: Choose 3 Skills or Tools:
        </div>
        {[1, 2, 3].map(num => (
          <CustomSelect
            key={`skill-${num}`}
            value={currentBonuses[`skill${num}`] || ''}
            onChange={(e) => onBonusChange({ ...currentBonuses, [`skill${num}`]: e.target.value })}
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="">-- Choose Skill or Tool #{num} --</option>
            {allOptions.map(opt => {
              const isSelectedElsewhere = [1, 2, 3].some(n => n !== num && currentBonuses[`skill${n}`] === opt);
              const isAlreadyProficient = proficientSkills.includes(opt) && currentBonuses[`skill${num}`] !== opt;
              if (isSelectedElsewhere || isAlreadyProficient) return null;
              return <option key={opt} value={opt}>{opt}</option>;
            })}
          </CustomSelect>
        ))}
      </div>
    );
  }

  // 3. Crafter
  if (cleanId === 'crafter' || cleanId.includes('crafter')) {
    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-hammer" style={{ color: '#711a19' }}></i> Crafter: Choose 3 Artisan's Tools:
        </div>
        {[1, 2, 3].map(num => (
          <CustomSelect
            key={`tool-${num}`}
            value={currentBonuses[`tool${num}`] || ''}
            onChange={(e) => onBonusChange({ ...currentBonuses, [`tool${num}`]: e.target.value })}
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="">-- Choose Artisan's Tool #{num} --</option>
            {ARTISAN_TOOLS_LIST.map(opt => {
              const isSelectedElsewhere = [1, 2, 3].some(n => n !== num && currentBonuses[`tool${n}`] === opt);
              return <option key={opt} value={opt} disabled={isSelectedElsewhere}>{opt}</option>;
            })}
          </CustomSelect>
        ))}
      </div>
    );
  }

  // 4. Musician
  if (cleanId === 'musician' || cleanId.includes('musician')) {
    return (
      <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-music" style={{ color: '#711a19' }}></i> Musician: Choose 3 Musical Instruments:
        </div>
        {[1, 2, 3].map(num => (
          <CustomSelect
            key={`inst-${num}`}
            value={currentBonuses[`tool${num}`] || ''}
            onChange={(e) => onBonusChange({ ...currentBonuses, [`tool${num}`]: e.target.value })}
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="">-- Choose Musical Instrument #{num} --</option>
            {MUSICAL_INSTRUMENTS_LIST.map(opt => {
              const isSelectedElsewhere = [1, 2, 3].some(n => n !== num && currentBonuses[`tool${n}`] === opt);
              return <option key={opt} value={opt} disabled={isSelectedElsewhere}>{opt}</option>;
            })}
          </CustomSelect>
        ))}
      </div>
    );
  }

  // 5. Ability Score Improvement (or type === 'asi' / 'half')
  if (cleanId === 'ability score improvement' || featConfig.type === 'asi' || featConfig.type === 'half') {
    if (featConfig.type === 'half') {
      return (
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-arrow-up-right-dots" style={{ color: '#711a19' }}></i> Choose Ability Score (+1):
          </div>
          <CustomSelect
            value={currentBonuses.stat1 || ''}
            onChange={(e) => onBonusChange({ ...currentBonuses, stat1: e.target.value })}
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="">-- Choose Ability --</option>
            {STAT_OPTIONS.filter(o => !featConfig.choices || featConfig.choices.includes(o.value)).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </CustomSelect>
        </div>
      );
    } else {
      // ASI
      const mode = currentBonuses.mode || 'plus_two';
      return (
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-arrow-up-right-dots" style={{ color: '#711a19' }}></i> Choose Ability Score Improvement Type:
          </div>
          <CustomSelect
            value={mode}
            onChange={(e) => onBonusChange({ ...currentBonuses, mode: e.target.value })}
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="plus_two">+2 to one Ability Score</option>
            <option value="plus_one_twice">+1 to two Ability Scores</option>
          </CustomSelect>

          {mode === 'plus_two' ? (
            <CustomSelect
              value={currentBonuses.stat1 || ''}
              onChange={(e) => onBonusChange({ ...currentBonuses, mode: 'plus_two', stat1: e.target.value })}
              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">-- Choose Ability (+2) --</option>
              {STAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </CustomSelect>
          ) : (
            <>
              <CustomSelect
                value={currentBonuses.stat1 || ''}
                onChange={(e) => onBonusChange({ ...currentBonuses, stat1: e.target.value })}
                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="">-- Choose 1st Ability (+1) --</option>
                {STAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value} disabled={opt.value === currentBonuses.stat2}>{opt.label}</option>)}
              </CustomSelect>
              <CustomSelect
                value={currentBonuses.stat2 || ''}
                onChange={(e) => onBonusChange({ ...currentBonuses, stat2: e.target.value })}
                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="">-- Choose 2nd Ability (+1) --</option>
                {STAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value} disabled={opt.value === currentBonuses.stat1}>{opt.label}</option>)}
              </CustomSelect>
            </>
          )}
        </div>
      );
    }
  }

  // 6. Universal Generic Modifiers Engine Fallback (Supports Restricted Pools [a,b,c] & D&D 2024 Rule Fallback)
  if (dbData?.feats) {
    const featObj = dbData.feats.find(f => f.feat_id === featId || (f.feat_name || '').toLowerCase() === cleanId);
    if (featObj && featObj.modifiers) {
      let mods = [];
      try {
        mods = typeof featObj.modifiers === 'string' ? JSON.parse(featObj.modifiers) : featObj.modifiers;
      } catch (e) {}

      if (Array.isArray(mods) && mods.length > 0) {
        const choiceMods = mods.filter(m => 
          m.sub_type === 'skill' || 
          m.sub_type === 'tool' || 
          (m.value && String(m.value).includes('choice')) || 
          m.type === 'proficiency'
        );

        if (choiceMods.length > 0) {
          const mod = choiceMods[0];
          // Check if admin specified restricted options [a, b, c]
          let restrictedOptions = null;
          if (mod.options) {
            restrictedOptions = Array.isArray(mod.options) ? mod.options : String(mod.options).split(',').map(s => s.trim()).filter(Boolean);
          } else if (mod.target && mod.target !== 'skill' && mod.target !== 'tool' && mod.target.includes(',')) {
            restrictedOptions = mod.target.split(',').map(s => s.trim()).filter(Boolean);
          }

          const fullDefaultPool = [...ALL_SKILLS_LIST, ...ARTISAN_TOOLS_LIST, ...MUSICAL_INSTRUMENTS_LIST];
          let basePool = restrictedOptions && restrictedOptions.length > 0 ? restrictedOptions : fullDefaultPool;
          const isProf = (opt) => proficientSkills.some(p => String(p).trim().toLowerCase() === String(opt).trim().toLowerCase());
          let availablePool = basePool.filter(opt => !isProf(opt) || String(currentBonuses.skill1 || '').toLowerCase() === String(opt).toLowerCase());
          
          let isRuleFallbackActive = false;
          // D&D 2024 PHB Duplicate Proficiency Rule: If all restricted options [a,b,c] are already proficient, allow ANY Skill/Tool!
          if (restrictedOptions && restrictedOptions.length > 0 && availablePool.length === 0) {
            isRuleFallbackActive = true;
            availablePool = fullDefaultPool.filter(opt => !isProf(opt) || String(currentBonuses.skill1 || '').toLowerCase() === String(opt).toLowerCase());
          }

          return (
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', ...style }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-sliders" style={{ color: '#711a19' }}></i> {featObj.feat_name || 'Feat'} Options:
              </div>

              {isRuleFallbackActive && (
                <div style={{ padding: '8px 10px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '0.78rem', color: '#92400e', lineHeight: '1.4' }}>
                  <i className="fa-solid fa-scale-balanced" style={{ marginRight: '4px' }}></i>
                  <strong>กฎ D&D 2024 (Overlapping Proficiencies):</strong> คุณมีความชำนาญในตัวเลือกเฉพาะคลังนี้ ({restrictedOptions.join(', ')}) ทั้งหมดแล้ว! ระบบจึงเปิดให้คุณเลือกความชำนาญใน Skill หรือ Tool อื่นแทนได้ตามกฎหลัก:
                </div>
              )}

              <CustomSelect
                value={currentBonuses.skill1 || currentBonuses.tool1 || ''}
                onChange={(e) => onBonusChange({ ...currentBonuses, skill1: e.target.value })}
                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="">-- Choose Proficiency Option --</option>
                {availablePool.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </CustomSelect>
            </div>
          );
        }
      }
    }
  }

  return null;
};

// eslint-disable-next-line react-refresh/only-export-components
export const renderClassAppendix = (items) => {
  if (!items || !Array.isArray(items)) return null;

  let rawAppendixHtml = "";
  for (const item of items) {
    const feats = (item && item.features && Array.isArray(item.features)) ? item.features : [item];
    for (const f of feats) {
      if (!f) continue;
      const desc = Array.isArray(f.display || f.description || f.desc)
        ? (f.display || f.description || f.desc).join('')
        : (f.display || f.description || f.desc || '');
      if (typeof desc === 'string' && (desc.includes('### Metamagic Options') || desc.includes('Spell List') || desc.includes('### Eldritch Invocation'))) {
        const match = desc.match(/(?:<p[^>]*>\s*)?###\s*(?:Metamagic Options|Eldritch Invocation Options|[A-Za-z\s]+Spell List)/i);
        if (match) {
          rawAppendixHtml += desc.substring(match.index) + "\n";
        }
      }
    }
  }

  if (!rawAppendixHtml) return null;

  const regex = /(?:<p[^>]*>\s*)?###\s*(Metamagic Options|Eldritch Invocation Options|[A-Za-z\s]+Spell List)/gi;
  let matches = [...rawAppendixHtml.matchAll(regex)];
  if (matches.length === 0) return null;

  let sections = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = matches[i+1] ? matches[i+1].index : rawAppendixHtml.length;
    const chunk = rawAppendixHtml.substring(start, end).trim();
    const title = matches[i][1];
    let type = 'spell';
    if (title.includes('Metamagic')) type = 'meta';
    if (title.includes('Invocation')) type = 'inv';
    sections.push({ title, type, chunk });
  }

  const buildBoxHtml = (chunk, type) => {
    if (!chunk) return "";
    const isMeta = type === 'meta';
    const isInv = type === 'inv';

    const headerRegex = /(?:<p[^>]*>\s*)?###\s*([^<]+)(?:\s*<\/p>)?/i;
    const hMatch = chunk.match(headerRegex);
    const rawTitle = hMatch ? hMatch[1].trim() : (isMeta ? "Metamagic Options" : (isInv ? "Eldritch Invocation Options" : "Spell List"));
    const title = rawTitle;
    const icon = isMeta ? "fa-wand-magic-sparkles" : (isInv ? "fa-book-skull" : "fa-book-open");

    const defaultIntro = isMeta
      ? "The following options are available to your Metamagic feature. The options are presented in alphabetical order."
      : (isInv ? "The following options are available to your Eldritch Invocations feature. Invocations appear in alphabetical order." : `This section presents the ${title.replace('List', 'list')}. The spells are organized by spell level and then alphabetized, and each spell's school of magic is listed. In the Special column, C means the spell requires Concentration, R means it's a Ritual, and M means it requires a specific Material component.`);

    let afterHeader = chunk.replace(headerRegex, '').trim();

    const subMatch = afterHeader.match(/(?:<p[^>]*>\s*)?####|<table/i);
    let intro = defaultIntro;
    let content = afterHeader;

    if (subMatch) {
      const extractedIntro = afterHeader.substring(0, subMatch.index).replace(/<\/?p[^>]*>/gi, '').trim();
      if (extractedIntro) intro = extractedIntro;
      content = afterHeader.substring(subMatch.index);
    }

    intro = intro.replace(/<em>([CRM])<\/em>|_([CRM])_/gi, '<strong>$1</strong>');
    content = content.replace(/<em>([CRM])<\/em>|_([CRM])_/gi, '<strong>$1</strong>');

    content = content.replace(/(?:<p[^>]*>\s*)?####\s*([^<]+)(?:\s*<\/p>)?/gi, (m, hText) => {
      const iconClass = isMeta ? "fa-diamond" : (isInv ? "fa-bolt-lightning" : "fa-diamond");
      return `<h4 style="color: #711a19; font-size: 1.05rem; font-weight: bold; margin: 20px 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #d1d5db; display: flex; align-items: center; gap: 8px;"><i class="fa-solid ${iconClass}" style="color: #991b1b; font-size: 0.6rem;"></i> ${hText.trim()}</h4>`;
    });

    if (content.includes('<table') || content.includes('<thead')) {
      if (content.includes('<thead') && !content.includes('<table')) {
        content = content.replace(/(<thead[\s\S]*?<\/tbody>)/gi, '<table>$1</table>');
      }
      content = content.replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, '');
      content = content.replace(/<p>\s*(<table[\s\S]*?<\/table>)\s*<\/p>/gi, '$1');
      content = content.replace(/<tr>\s*(?:<td>\s*<\/td>|<th>\s*<\/th>|\s)*<\/tr>/gi, '');

      content = content.replace(/<table\b[^>]*>/gi, '<table style="width: 100%; border-collapse: collapse; margin: 12px 0 16px 0; border: 1px solid #94a3b8; text-align: left; font-size: 0.85rem; background-color: white;">');
      content = content.replace(/<th\b[^>]*>/gi, '<th style="padding: 8px 12px; border: 1px solid #94a3b8; background-color: #1e293b; color: white; font-weight: 600; text-align: left;">');
      content = content.replace(/<td\b[^>]*>/gi, '<td style="padding: 8px 12px; border: 1px solid #94a3b8; color: #1e293b;">');
    }

    return (
      `<div style="border: 1px solid #d1d5db; border-radius: 0; margin: 24px 0; background-color: #ffffff; text-align: left;">` +
        `<details style="padding: 0; margin: 0;">` +
          `<summary style="padding: 14px 18px; background-color: #f9fafb; color: #711a19; font-weight: 700; font-size: 1.05rem; cursor: pointer; outline: none; display: block; border-bottom: 1px solid #e5e7eb; user-select: none;">` +
            `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">` +
              `<span style="display: flex; align-items: center; gap: 10px; color: #711a19; font-size: 1.1rem;">` +
                `<i class="fa-solid ${icon}"></i> ${title}` +
              `</span>` +
              `<span style="font-size: 0.8rem; color: #4b5563; font-weight: 600; border: 1px solid #d1d5db; padding: 3px 10px; background: white; border-radius: 0;">` +
                `▼ Show / Hide Details` +
              `</span>` +
            `</div>` +
            `<p style="margin: 0; font-size: 0.88rem; color: #4b5563; line-height: 1.5; font-weight: normal;">${intro}</p>` +
          `</summary>` +
          `<div style="padding: 20px; background-color: white; overflow-x: auto; color: #374151; font-size: 0.94rem; line-height: 1.6;">` +
            content +
          `</div>` +
        `</details>` +
      `</div>`
    );
  };

  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
      <h3 style={{ color: 'var(--color-ink)', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Class Reference Appendix</h3>
      {sections.map((sec, idx) => (
        <div key={idx} dangerouslySetInnerHTML={{ __html: buildBoxHtml(sec.chunk, sec.type) }}></div>
      ))}
    </div>
  );
};
