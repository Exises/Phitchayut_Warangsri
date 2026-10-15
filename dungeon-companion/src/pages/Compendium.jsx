import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import useLocalStorageState from '../hooks/useLocalStorageState';

// --- ส่วนแสดงผลย่อย: ตาราง Progression (แยกออกมาเพื่อให้โค้ดอ่านง่าย) ---
function ClassTable({ classId, levels }) {
    if (!levels || levels.length === 0) return null;

    // ฟังก์ชันสร้าง Header ของตารางตามอาชีพ
    const renderHeaders = () => {
        let headersRow1 = [<th key="lvl" rowSpan="2">Level</th>, <th key="pb" rowSpan="2">PB</th>, <th key="feat" rowSpan="2">Class Features</th>];
        let headersRow2 = [];
        let spellSlotCount = 0;
        
        // เพิ่มคอลัมน์พิเศษตามอาชีพ (Logic เดียวกับ script.js เดิม)
        switch (classId) {
            case 'barbarian':
                headersRow1.push(<th key="rgs" rowSpan="2" className="extra-col">Rages</th>, <th key="rdm" rowSpan="2" className="extra-col">Rage Damage</th>, <th key="mst" rowSpan="2" className="extra-col">Weapon Mastery</th>);
                break;
            case 'bard':
                headersRow1.push(<th key="bd" rowSpan="2" className="extra-col">Bardic Die</th>, <th key="can" rowSpan="2" className="extra-col">Cantrips</th>, <th key="prep" rowSpan="2" className="extra-col">Prepared Spells</th>);
                spellSlotCount = 9;
                break;
            case 'cleric':
            case 'druid':
            case 'wizard':
                if(classId === 'cleric') headersRow1.push(<th key="cd" rowSpan="2" className="extra-col">Channel Divinity</th>);
                if(classId === 'druid') headersRow1.push(<th key="ws" rowSpan="2" className="extra-col">Wild Shape</th>);
                headersRow1.push(<th key="can" rowSpan="2" className="extra-col">Cantrips</th>, <th key="prep" rowSpan="2" className="extra-col">Prepared Spells</th>);
                spellSlotCount = 9;
                break;
            case 'fighter':
                headersRow1.push(<th key="wm" rowSpan="2" className="extra-col">Mastery</th>, <th key="sw" rowSpan="2" className="extra-col">Second Wind</th>);
                break;
            case 'monk':
                headersRow1.push(<th key="ma" rowSpan="2" className="extra-col">Martial Arts</th>, <th key="fp" rowSpan="2" className="extra-col">Focus Points</th>, <th key="mv" rowSpan="2" className="extra-col">Movement</th>);
                break;
            case 'paladin':
            case 'ranger':
                if(classId === 'paladin') headersRow1.push(<th key="cd" rowSpan="2" className="extra-col">Channel Divinity</th>);
                if(classId === 'ranger') headersRow1.push(<th key="fe" rowSpan="2" className="extra-col">Favored Enemy</th>);
                headersRow1.push(<th key="prep" rowSpan="2" className="extra-col">Prepared</th>);
                spellSlotCount = 5;
                break;
            case 'rogue':
                headersRow1.push(<th key="sa" rowSpan="2" className="extra-col">Sneak Attack</th>);
                break;
            case 'sorcerer':
                headersRow1.push(<th key="sp" rowSpan="2" className="extra-col">Sorcery Points</th>, <th key="can" rowSpan="2" className="extra-col">Cantrips</th>, <th key="prep" rowSpan="2" className="extra-col">Prepared</th>);
                spellSlotCount = 9;
                break;
            case 'warlock':
                headersRow1.push(<th key="inv" rowSpan="2" className="extra-col">Invocations</th>, <th key="can" rowSpan="2" className="extra-col">Cantrips</th>, <th key="prep" rowSpan="2" className="extra-col">Prepared</th>, <th key="slt" rowSpan="2" className="extra-col">Slots</th>, <th key="slv" rowSpan="2" className="extra-col">Slot Lv</th>);
                break;
            default:
                break;
        }

        if (spellSlotCount > 0) {
            headersRow1.push(<th key="slots-header" colSpan={spellSlotCount} className="extra-col" style={{textAlign: 'center'}}>——Spell Slots per Spell Level——</th>);
            for(let i=1; i<=spellSlotCount; i++) {
                headersRow2.push(<th key={`s${i}`} className="slot-col" style={{textAlign: 'center', fontSize: '0.85rem', padding: '4px'}}>{i}</th>);
            }
        }

        if (headersRow2.length > 0) {
            return (
                <>
                    <tr style={{ backgroundColor: 'var(--bg-white)', borderBottom: '2px solid #d1d5db' }}>{headersRow1}</tr>
                    <tr style={{ backgroundColor: 'var(--bg-white)', borderBottom: '2px solid #d1d5db' }}>{headersRow2}</tr>
                </>
            );
        } else {
            return (
                <tr style={{ backgroundColor: 'var(--bg-white)', borderBottom: '2px solid #d1d5db' }}>
                    {headersRow1.map((el) => {
                        return { ...el, props: { ...el.props, rowSpan: undefined } };
                    })}
                </tr>
            );
        }
    };

    // ฟังก์ชันสร้างแถวข้อมูล (Row)
    const renderRow = (lvl) => {
        const spec = lvl.class_specific || {};
        const cantrips = lvl.cantrips_known || spec.cantrips || '-';
        const prepared = lvl.spells_known || spec.prepared_spells || '-';
        
        let slotsArray = Array(9).fill('-');
        if (lvl.spell_slots?.logic?.slots) {
            slotsArray = lvl.spell_slots.logic.slots;
        } else if (Array.isArray(lvl.spell_slots)) {
            slotsArray = [...lvl.spell_slots, ...Array(9 - lvl.spell_slots.length).fill('-')];
        } else if (spec.spell_slots_1 !== undefined) {
            slotsArray = [
                spec.spell_slots_1, spec.spell_slots_2, spec.spell_slots_3,
                spec.spell_slots_4, spec.spell_slots_5, spec.spell_slots_6,
                spec.spell_slots_7, spec.spell_slots_8, spec.spell_slots_9
            ];
        }

        let cells = [
            <td key="lvl"><strong>{lvl.level}</strong></td>,
            <td key="pb">+{lvl.prof_bonus}</td>,
            <td key="feat">{formatTableFeatureNames(classId || lvl.class_name, lvl.level, lvl.features)}</td>
        ];

        // ใส่ข้อมูลช่องพิเศษตามอาชีพ
        if (classId === 'barbarian') {
            cells.push(
                <td key="rgs">{spec.rages || '-'}</td>,
                <td key="rdm">{spec.rage_damage || '-'}</td>,
                <td key="mst">{spec.weapon_mastery || '-'}</td>
            );
        } else if (classId === 'bard') {
            cells.push(<td key="bd">{spec.bardic_die || '-'}</td>, <td key="can">{cantrips}</td>, <td key="prep">{prepared}</td>);
            slotsArray.forEach((s, i) => cells.push(<td key={`sl${i}`}>{s || '-'}</td>));
        } else if (classId === 'cleric' || classId === 'druid' || classId === 'wizard') {
            if(classId === 'cleric') cells.push(<td key="cd">{spec.channel_divinity || '-'}</td>);
            if(classId === 'druid') cells.push(<td key="ws">{spec.wild_shape || '-'}</td>);
            cells.push(<td key="can">{cantrips}</td>, <td key="prep">{prepared}</td>);
            slotsArray.forEach((s, i) => cells.push(<td key={`sl${i}`}>{s || '-'}</td>));
        } else if (classId === 'fighter') {
            cells.push(<td key="wm">{spec.weapon_mastery || '-'}</td>, <td key="sw">{spec.second_wind || '-'}</td>);
        } else if (classId === 'monk') {
            cells.push(<td key="ma">{spec.martial_arts || '-'}</td>, <td key="fp">{spec.focus_points || '-'}</td>, <td key="mv">{spec.movement || '-'}</td>);
        } else if (classId === 'paladin' || classId === 'ranger') {
            if(classId === 'paladin') cells.push(<td key="cd">{spec.channel_divinity || '-'}</td>);
            if(classId === 'ranger') cells.push(<td key="fe">{spec.favored_enemy || '-'}</td>);
            cells.push(<td key="prep">{prepared}</td>);
            slotsArray.slice(0,5).forEach((s, i) => cells.push(<td key={`sl${i}`}>{s || '-'}</td>));
        } else if (classId === 'rogue') {
            cells.push(<td key="sa">{spec.sneak_attack || '-'}</td>);
        } else if (classId === 'sorcerer') {
            cells.push(<td key="sp">{spec.sorcery_points || '-'}</td>, <td key="can">{cantrips}</td>, <td key="prep">{prepared}</td>);
            slotsArray.forEach((s, i) => cells.push(<td key={`sl${i}`}>{s || '-'}</td>));
        } else if (classId === 'warlock') {
            const warlockSlots = lvl.spell_slots?.logic?.pact_slots || spec.slots || '-';
            const warlockSlotLevel = lvl.spell_slots?.logic?.pact_level || spec.slot_level || '-';
            cells.push(<td key="inv">{spec.invocations || '-'}</td>, <td key="can">{cantrips}</td>, <td key="prep">{prepared}</td>, <td key="slt">{warlockSlots}</td>, <td key="slv">{warlockSlotLevel}</td>);
        }

        return <tr key={lvl.level}>{cells}</tr>;
    };

    return (
        <div className="class-section">
            <h3>{levels[0]?.class_name || 'Class'} Features</h3>
            <div className="table-responsive">
                <table className="dnd-table">
                    <thead>{renderHeaders()}</thead>
                    <tbody>{levels.map(lvl => renderRow(lvl))}</tbody>
                </table>
            </div>
        </div>
    );
}


const CLASS_ICONS = {
    barbarian: "fa-solid fa-gavel",
    bard: "fa-solid fa-music",
    cleric: "fa-solid fa-staff-snake",
    druid: "fa-solid fa-leaf",
    fighter: "fa-solid fa-shield-halved",
    monk: "fa-solid fa-fist-raised",
    paladin: "fa-solid fa-cross",
    ranger: "fa-solid fa-bullseye",
    rogue: "fa-solid fa-mask",
    sorcerer: "fa-solid fa-fire",
    warlock: "fa-solid fa-skull",
    wizard: "fa-solid fa-hat-wizard"
};

const CLASS_META = {
    barbarian: { hit_die: 'd12', primary: ['Strength'] },
    bard: { hit_die: 'd8', primary: ['Charisma'] },
    cleric: { hit_die: 'd8', primary: ['Wisdom'] },
    druid: { hit_die: 'd8', primary: ['Wisdom'] },
    fighter: { hit_die: 'd10', primary: ['Strength', 'Dexterity'] },
    monk: { hit_die: 'd8', primary: ['Dexterity', 'Wisdom'] },
    paladin: { hit_die: 'd10', primary: ['Strength', 'Charisma'] },
    ranger: { hit_die: 'd10', primary: ['Dexterity', 'Wisdom'] },
    rogue: { hit_die: 'd8', primary: ['Dexterity'] },
    sorcerer: { hit_die: 'd6', primary: ['Charisma'] },
    warlock: { hit_die: 'd8', primary: ['Charisma'] },
    wizard: { hit_die: 'd6', primary: ['Intelligence'] }
};

const SPECIES_META = {
    dragonborn: { size: 'Medium' },
    dwarf: { size: 'Medium' },
    elf: { size: 'Medium' },
    gnome: { size: 'Small' },
    goliath: { size: 'Medium' },
    halfling: { size: 'Small' },
    human: { size: 'Medium' },
    orc: { size: 'Medium' },
    tiefling: { size: 'Medium' },
    aasimar: { size: 'Medium' }
};

// --- Component หลัก ---

function Compendium() {
    const { category } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();


    // State สำหรับเก็บข้อมูล
    const [categories, setCategories] = useState({ classes: [], backgrounds: [], species: [], feats: [], items: [], spells: [] });
    const [selectedItem, setSelectedItem] = useState(null); // เก็บข้อมูลสิ่งที่เลือกดูอยู่
    const [loading, setLoading] = useState(false);
    const [activeSubclass, setActiveSubclass] = useState(0); // เก็บ index ของ subclass ที่เลือก
    const [searchQuery, setSearchQuery] = useLocalStorageState('compendium_searchQuery', "");
    const [showFilters, setShowFilters] = useState(false);
    const [featFilter, setFeatFilter] = useLocalStorageState('compendium_featFilter', "All");
    const [itemFilter, setItemFilter] = useLocalStorageState('compendium_itemFilter', "All");
    const [itemRarityFilter, setItemRarityFilter] = useLocalStorageState('compendium_itemRarityFilter', "All");
    const [spellLevelFilter, setSpellLevelFilter] = useLocalStorageState('compendium_spellLevelFilter', "All");
    const [spellSchoolFilter, setSpellSchoolFilter] = useLocalStorageState('compendium_spellSchoolFilter', "All");
    const [classFilter, setClassFilter] = useLocalStorageState('compendium_classFilter', "All");
    const [speciesFilter, setSpeciesFilter] = useLocalStorageState('compendium_speciesFilter', "All");
    const [bgFilter, setBgFilter] = useLocalStorageState('compendium_bgFilter', "All");
    
    // (ลบ openCategory ออกเพราะใช้แสดงแค่หมวดหมู่เดียวตาม URL)

    // โหลด Index เมื่อเข้าหน้าเว็บครั้งแรก
    useEffect(() => {
        const loadIndices = async () => {
            try {
                // ดึงข้อมูล Index จากไฟล์ JSON ใน public/data/
                // ดึงข้อมูล Index จาก API
                const [classRes, bgRes, spRes, featRes, itemRes, spellRes] = await Promise.all([
                    fetch('http://localhost:5000/api?category=classes'),
                    fetch('http://localhost:5000/api?category=backgrounds'),
                    fetch('http://localhost:5000/api?category=species'),
                    fetch('http://localhost:5000/api?category=feats'),
                    fetch('http://localhost:5000/api?category=items'),
                    fetch('http://localhost:5000/api?category=spells')
                ]);
                
                let classes = classRes.ok ? await classRes.json() : [];
                classes = classes.map(c => ({
                    ...c,
                    id: c.class_id || c.id,
                    name: c.class_name || c.name,
                    icon: CLASS_ICONS[c.class_id || c.id] || "fa-solid fa-circle"
                }));

                let backgrounds = bgRes.ok ? await bgRes.json() : [];
                let species = spRes.ok ? await spRes.json() : [];
                let feats = featRes.ok ? await featRes.json() : [];
                let items = itemRes.ok ? await itemRes.json() : [];
                let spells = spellRes.ok ? await spellRes.json() : [];

                // ใส่ไอคอน
                backgrounds = backgrounds.map(b => ({ ...b, icon: "fa-solid fa-tree" }));
                species = species.map(s => ({ ...s, icon: "fa-solid fa-users" }));
                feats = feats.map(f => ({ ...f, type: f.feat_type || f.type, icon: "fa-solid fa-medal" }));
                items = items.map(i => ({ ...i, id: i.item_id || i.id, name: i.item_name || i.name, icon: "fa-solid fa-shield-halved" }));
                spells = spells.map(s => ({ ...s, id: s.spell_id || s.id, name: s.spell_name || s.name, icon: "fa-solid fa-wand-sparkles" }));

                setCategories({ classes, backgrounds, species, feats, items, spells });
            } catch (err) {
                console.error("Error loading indices:", err);
            }
        };
        loadIndices();
    }, []);

    // โหลดข้อมูลเมื่อ URL มี ID (จากการค้นหาหน้า Hub)
    useEffect(() => {
        const id = searchParams.get('id');
        if (id && category) {
            loadItemData(id, category);
        }
    }, [searchParams, category]);

    // ฟังก์ชันโหลดข้อมูล Generic Item รายตัว (classes, backgrounds, species)
    const loadItemData = async (id, cat) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api?id=${id}&category=${cat}`);
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSelectedItem({ type: cat === 'classes' ? 'class' : cat, data });
            if (cat === 'classes') setActiveSubclass(0); // Reset Tab เป็นอันแรก
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const stripAppendixFromFeature = (rawHtml) => {
        if (!rawHtml || typeof rawHtml !== 'string') return rawHtml;
        if (!rawHtml.includes('Metamagic Options') && !rawHtml.includes('Spell List') && !rawHtml.includes('Eldritch Invocation')) return rawHtml;

        const match = rawHtml.match(/(?:<p[^>]*>\s*)?###\s*(?:Metamagic Options|Eldritch Invocation Options|[A-Za-z\s]+Spell List)/i);
        if (match) {
            return rawHtml.substring(0, match.index).trim();
        }
        return rawHtml;
    };

    const renderClassAppendix = (items) => {
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
                                    `▼ แสดง / ซ่อนข้อมูล` +
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
                <h3 style={{ color: 'var(--color-ink)', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>เอกสารอ้างอิงประจำคลาส (Class Appendix)</h3>
                {sections.map((sec, idx) => (
                    <div key={idx} dangerouslySetInnerHTML={{ __html: buildBoxHtml(sec.chunk, sec.type) }}></div>
                ))}
            </div>
        );
    };

    // Helper: แปลง HTML String เป็น JSX (ระวัง XSS แต่ใช้กับ JSON ของเราเองปลอดภัย)
    const createMarkup = (htmlString) => {
        if (typeof htmlString !== 'string') return { __html: '' };
        let formatted = htmlString;
        
        // 1. Normalize line breaks
        formatted = formatted.replace(/\\n/g, '\n');
        formatted = formatted.replace(/\\t/g, ''); 
        formatted = formatted.replace(/>(?:\s*n\s*)+</g, '><'); 
        formatted = stripAppendixFromFeature(formatted);
        
        // 2. Markdown Parsing
        // Bold Italics
        formatted = formatted.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
        // Bold
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Italics (Underscores or single asterisks, non-greedy)
        formatted = formatted.replace(/_([\s\S]+?)_/g, '<em style="font-weight: 600; color: #1e293b; font-style: italic;">$1</em>');
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em style="font-weight: 600; color: #1e293b; font-style: italic;">$1</em>');
        
        // 3. Paragraph Formatting
        // Split by double newline to create paragraphs
        let paragraphs = formatted.split(/\n\n/);
        formatted = paragraphs.map(p => {
            p = p.trim();
            if (!p) return '';
            
            // Auto-format known 5e headers if they lack Markdown
            // Matches 1 to 4 capitalized words at the start of a paragraph, followed by a period.
            p = p.replace(/^((?:[A-Z][a-zA-Z\-\']*\s+){0,3}[A-Z][a-zA-Z\-\']*)\.(?=\s|$)/, '<strong>$1.</strong>');
            
            // Convert remaining single newlines to spaces to prevent line breaking in the middle of sentences
            p = p.replace(/\n/g, ' ');

            return `<p style="margin-top: 0; margin-bottom: 0.9em; line-height: 1.7;">${p}</p>`;
        }).join('');
        
        // 4. Table styling
        formatted = formatted.replace(/<table\b[^>]*>/gi, '<table style="width: 100%; border-collapse: collapse; margin: 12px 0 16px 0; border: 1px solid #94a3b8; text-align: left; font-size: 0.85rem; background-color: white;">');
        formatted = formatted.replace(/<th\b[^>]*>/gi, '<th style="padding: 8px 12px; border: 1px solid #94a3b8; background-color: #1e293b; color: white; font-weight: 600; text-align: left;">');
        formatted = formatted.replace(/<td\b[^>]*>/gi, '<td style="padding: 8px 12px; border: 1px solid #94a3b8; color: #1e293b;">');
        
        return { __html: formatted };
    };



    return (
        <div id="page-compendium" className="page">
            <div className="compendium-layout">
                
                {/* --- Sidebar ซ้าย --- */}
                <aside className="compendium-sidebar">
                    <div className="sidebar-back-area">
                        <button 
                            onClick={() => navigate('/compendium')} 
                            className="sidebar-back-btn"
                        >
                            <i className="fa-solid fa-arrow-left"></i> กลับหน้าหลัก Compendium
                        </button>
                    </div>
                    <div className="sidebar-search-box">
                        <div className="search-input-wrapper">
                            <input 
                                type="text" 
                                placeholder={`ค้นหา ${category}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                            />
                            <i className="fa-solid fa-search search-icon"></i>
                        </div>
                        {['classes', 'backgrounds', 'species', 'feats', 'items', 'spells'].includes(category) && (
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className="filter-btn"
                                style={showFilters ? { backgroundColor: 'var(--color-red)', color: 'var(--bg-white)', borderColor: 'var(--color-red)' } : {}}
                            >
                                <i className="fa-solid fa-filter"></i> Filter
                            </button>
                        )}
                    </div>

                    {/* Classes Filter Panel */}
                    {category === 'classes' && showFilters && (
                        <div className="filter-panel animate-fade-in" style={{ padding: '15px', borderBottom: '2px solid #eee', backgroundColor: '#fdfbf7', margin: '0 10px 10px 10px', borderRadius: '8px', border: '1px solid #e8e1d5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 'bold', color: '#8b0000', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ค่าพลังหลัก (Primary Ability)</div>
                                <button onClick={() => setClassFilter('All')} style={{ fontSize: '0.75rem', color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Reset</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {['All', 'Strength', 'Dexterity', 'Intelligence', 'Wisdom', 'Charisma'].map(ability => (
                                    <label key={ability} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', backgroundColor: classFilter === ability ? '#f0ebe0' : 'transparent', fontSize: '0.85rem' }}>
                                        <input type="radio" name="classAbility" checked={classFilter === ability} onChange={() => setClassFilter(ability)} style={{ cursor: 'pointer', accentColor: '#8b0000' }} />
                                        <span style={{ color: classFilter === ability ? '#8b0000' : '#444', fontWeight: classFilter === ability ? 'bold' : 'normal' }}>{ability === 'All' ? 'ทั้งหมด' : ability}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Backgrounds Filter Panel */}
                    {category === 'backgrounds' && showFilters && (
                        <div className="filter-panel animate-fade-in" style={{ padding: '15px', borderBottom: '2px solid #eee', backgroundColor: '#fdfbf7', margin: '0 10px 10px 10px', borderRadius: '8px', border: '1px solid #e8e1d5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 'bold', color: '#8b0000', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>เพิ่มค่าสถานะ (Ability Boost)</div>
                                <button onClick={() => setBgFilter('All')} style={{ fontSize: '0.75rem', color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Reset</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {['All', 'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].map(ability => (
                                    <label key={ability} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', backgroundColor: bgFilter === ability ? '#f0ebe0' : 'transparent', fontSize: '0.85rem' }}>
                                        <input type="radio" name="bgAbility" checked={bgFilter === ability} onChange={() => setBgFilter(ability)} style={{ cursor: 'pointer', accentColor: '#8b0000' }} />
                                        <span style={{ color: bgFilter === ability ? '#8b0000' : '#444', fontWeight: bgFilter === ability ? 'bold' : 'normal' }}>{ability === 'All' ? 'ทั้งหมด' : ability}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Species Filter Panel */}
                    {category === 'species' && showFilters && (
                        <div className="filter-panel animate-fade-in" style={{ padding: '15px', borderBottom: '2px solid #eee', backgroundColor: '#fdfbf7', margin: '0 10px 10px 10px', borderRadius: '8px', border: '1px solid #e8e1d5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 'bold', color: '#8b0000', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ขนาดรูปร่าง (Size)</div>
                                <button onClick={() => setSpeciesFilter('All')} style={{ fontSize: '0.75rem', color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Reset</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {['All', 'Medium', 'Small'].map(size => (
                                    <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', backgroundColor: speciesFilter === size ? '#f0ebe0' : 'transparent', fontSize: '0.85rem' }}>
                                        <input type="radio" name="speciesSize" checked={speciesFilter === size} onChange={() => setSpeciesFilter(size)} style={{ cursor: 'pointer', accentColor: '#8b0000' }} />
                                        <span style={{ color: speciesFilter === size ? '#8b0000' : '#444', fontWeight: speciesFilter === size ? 'bold' : 'normal' }}>{size === 'All' ? 'ทั้งหมด' : size}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feats Filter Panel */}
                    {category === 'feats' && showFilters && (
                        <div className="filter-panel animate-fade-in" style={{ padding: '15px', borderBottom: '2px solid #eee', backgroundColor: '#fdfbf7', margin: '0 10px 10px 10px', borderRadius: '8px', border: '1px solid #e8e1d5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 'bold', color: '#8b0000', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>หมวดหมู่ความสามารถ</div>
                                <button onClick={() => setFeatFilter('All')} style={{ fontSize: '0.75rem', color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Reset</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {['All', 'General', 'Origin', 'Epic Boon', 'Fighting Style'].map(type => (
                                    <label key={type} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        cursor: 'pointer', 
                                        padding: '6px 10px', 
                                        borderRadius: '4px',
                                        backgroundColor: featFilter === type ? '#f0ebe0' : 'transparent',
                                        transition: 'background 0.2s',
                                        fontSize: '0.85rem'
                                    }}>
                                        <input 
                                            type="radio" 
                                            name="featType" 
                                            checked={featFilter === type}
                                            onChange={() => setFeatFilter(type)}
                                            style={{ cursor: 'pointer', accentColor: '#8b0000' }}
                                        />
                                        <span style={{ color: featFilter === type ? '#8b0000' : '#444', fontWeight: featFilter === type ? 'bold' : 'normal' }}>{type === 'All' ? 'ทั้งหมด' : type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Items Filter Panel */}
                    {category === 'items' && showFilters && (
                        <div className="filter-panel animate-fade-in" style={{ padding: '15px', borderBottom: '2px solid #eee', backgroundColor: '#fdfbf7', margin: '0 10px 10px 10px', borderRadius: '8px', border: '1px solid #e8e1d5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 'bold', color: '#8b0000', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ประเภทไอเทม</div>
                                <button onClick={() => { setItemFilter('All'); setItemRarityFilter('All'); }} style={{ fontSize: '0.75rem', color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Reset</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                                {['All', 'Weapon', 'Armor', 'Magic Item', 'Gear', 'Tool', 'Mount / Vehicle'].map(type => (
                                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', backgroundColor: itemFilter === type ? '#f0ebe0' : 'transparent', transition: 'background 0.2s', fontSize: '0.85rem' }}>
                                        <input type="radio" name="itemType" checked={itemFilter === type} onChange={() => setItemFilter(type)} style={{ cursor: 'pointer', accentColor: '#8b0000' }} />
                                        <span style={{ color: itemFilter === type ? '#8b0000' : '#444', fontWeight: itemFilter === type ? 'bold' : 'normal' }}>{type === 'All' ? 'ทั้งหมด' : type}</span>
                                    </label>
                                ))}
                            </div>
                            <div style={{ borderTop: '1px solid #e8e1d5', paddingTop: '10px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666', marginBottom: '6px' }}>ระดับความหายาก (Rarity)</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    {['All', 'Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'].map(rarity => (
                                        <label key={rarity} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', backgroundColor: itemRarityFilter === rarity ? '#f0ebe0' : 'transparent', fontSize: '0.8rem' }}>
                                            <input type="radio" name="itemRarity" checked={itemRarityFilter === rarity} onChange={() => setItemRarityFilter(rarity)} style={{ cursor: 'pointer', accentColor: '#8b0000' }} />
                                            <span style={{ color: itemRarityFilter === rarity ? '#8b0000' : '#444', fontWeight: itemRarityFilter === rarity ? 'bold' : 'normal' }}>{rarity === 'All' ? 'ทั้งหมด' : rarity}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Spells Filter Panel */}
                    {category === 'spells' && showFilters && (
                        <div className="filter-panel animate-fade-in" style={{ padding: '15px', borderBottom: '2px solid #eee', backgroundColor: '#fdfbf7', margin: '0 10px 10px 10px', borderRadius: '8px', border: '1px solid #e8e1d5', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 'bold', color: '#8b0000', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>กรองเวทมนตร์</div>
                                <button onClick={() => { setSpellLevelFilter('All'); setSpellSchoolFilter('All'); }} style={{ fontSize: '0.75rem', color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Reset</button>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666', marginBottom: '6px' }}>ระดับเวทมนตร์ (Spell Level)</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {['All', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(lvl => (
                                        <button key={lvl} onClick={() => setSpellLevelFilter(lvl)} style={{ padding: '4px 10px', borderRadius: '14px', border: '1px solid #e8e1d5', fontSize: '0.78rem', fontWeight: spellLevelFilter === lvl ? 'bold' : 'normal', backgroundColor: spellLevelFilter === lvl ? '#8b0000' : '#fdfbf7', color: spellLevelFilter === lvl ? '#fff' : '#444', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            {lvl === 'All' ? 'ทั้งหมด' : lvl === '0' ? 'Cantrip' : `Lv.${lvl}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666', marginBottom: '6px' }}>สำนัก (School)</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    {['All', 'Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'].map(school => (
                                        <label key={school} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', backgroundColor: spellSchoolFilter === school ? '#f0ebe0' : 'transparent', fontSize: '0.8rem' }}>
                                            <input type="radio" name="spellSchool" checked={spellSchoolFilter === school} onChange={() => setSpellSchoolFilter(school)} style={{ cursor: 'pointer', accentColor: '#8b0000' }} />
                                            <span style={{ color: spellSchoolFilter === school ? '#8b0000' : '#444', fontWeight: spellSchoolFilter === school ? 'bold' : 'normal' }}>{school === 'All' ? 'ทั้งหมด' : school}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div id="compendium-nav" className="sidebar-nav pt-4">
                        {category === 'classes' && categories.classes
                            .filter(c => {
                                const matchesSearch = c.name.toLowerCase().includes(searchQuery);
                                const meta = CLASS_META[c.id] || {};
                                const primaryList = c.primary_ability ? c.primary_ability.split(/,|and|or/).map(s=>s.trim()) : (meta.primary || []);
                                const matchesClass = classFilter === 'All' || primaryList.some(p => p.toLowerCase().includes(classFilter.toLowerCase()));
                                return matchesSearch && matchesClass;
                            })
                            .map(c => (
                                <div key={c.id} 
                                    className={`sidebar-item ${selectedItem?.data?.class_id === c.id ? 'active' : ''}`} 
                                    onClick={() => loadItemData(c.id, 'classes')}
                                >
                                    <i className={c.icon || "fa-solid fa-circle"}></i> {c.name}
                                </div>
                            ))
                        }

                        {category === 'backgrounds' && categories.backgrounds
                            .filter(b => {
                                const matchesSearch = b.name.toLowerCase().includes(searchQuery);
                                const matchesBg = bgFilter === 'All' || (b.ability_scores && b.ability_scores.toLowerCase().includes(bgFilter.toLowerCase()));
                                return matchesSearch && matchesBg;
                            })
                            .map(b => (
                                <div key={b.id} 
                                    className={`sidebar-item ${selectedItem?.data?.background_id === b.id ? 'active' : ''}`} 
                                    onClick={() => loadItemData(b.id, 'backgrounds')}
                                >
                                    <i className={b.icon || "fa-solid fa-circle"}></i> {b.name}
                                </div>
                            ))
                        }

                        {category === 'species' && categories.species
                            .filter(s => {
                                const matchesSearch = s.name.toLowerCase().includes(searchQuery);
                                const meta = SPECIES_META[s.id] || {};
                                const size = s.size || meta.size || 'Medium';
                                const matchesSpecies = speciesFilter === 'All' || size.toLowerCase().includes(speciesFilter.toLowerCase());
                                return matchesSearch && matchesSpecies;
                            })
                            .map(s => (
                                <div key={s.id} 
                                    className={`sidebar-item ${selectedItem?.data?.species_id === s.id ? 'active' : ''}`} 
                                    onClick={() => loadItemData(s.id, 'species')}
                                >
                                    <i className={s.icon || "fa-solid fa-circle"}></i> {s.name}
                                </div>
                            ))
                        }

                        {category === 'feats' && categories.feats
                            .filter(f => {
                                const matchesSearch = f.name.toLowerCase().includes(searchQuery);
                                const featType = (f.type || f.feat_type || '').toLowerCase();
                                const matchesType = featFilter === 'All' || featType.includes(featFilter.toLowerCase());
                                return matchesSearch && matchesType;
                            })
                            .map(f => (
                                <div key={f.id} 
                                     className={`sidebar-item ${selectedItem?.data?.feat_id === f.id ? 'active' : ''}`} 
                                     onClick={() => loadItemData(f.id, 'feats')}
                                     style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <i className={f.icon || "fa-solid fa-medal"}></i> 
                                        <span>{f.name}</span>
                                    </div>
                                    {f.type && (
                                        <span style={{ 
                                            fontSize: '0.65rem', 
                                            padding: '2px 6px', 
                                            backgroundColor: f.type.toLowerCase().includes('origin') ? '#e8f5e9' : f.type.toLowerCase().includes('fighting style') ? '#e3f2fd' : f.type.toLowerCase().includes('epic boon') ? '#f3e5f5' : '#f5f5f5',
                                            color: f.type.toLowerCase().includes('origin') ? '#2e7d32' : f.type.toLowerCase().includes('fighting style') ? '#1565c0' : f.type.toLowerCase().includes('epic boon') ? '#7b1fa2' : '#666',
                                            borderRadius: '10px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                            {f.type.replace(/\s*feat$/i, '')}
                                        </span>
                                    )}
                                </div>
                            ))
                        }

                        {category === 'items' && (
                            <div className="items-table-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd', fontSize: '0.75rem', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
                                <span>Name</span>
                                <span>Cost</span>
                            </div>
                        )}
                        {category === 'items' && categories.items
                            .filter(i => {
                                const matchesSearch = i.name.toLowerCase().includes(searchQuery);
                                let matchesType = itemFilter === 'All';
                                if (!matchesType) {
                                    if (itemFilter === 'Mount / Vehicle') {
                                        matchesType = i.item_type === 'Mount' || i.item_type === 'Vehicle';
                                    } else {
                                        matchesType = i.item_type?.toLowerCase() === itemFilter.toLowerCase();
                                    }
                                }
                                const matchesRarity = itemRarityFilter === 'All' || i.rarity?.toLowerCase() === itemRarityFilter.toLowerCase();
                                return matchesSearch && matchesType && matchesRarity;
                            })
                            .map(i => (
                                <div key={i.id} 
                                    className={`sidebar-item ${selectedItem?.data?.item_id === i.id ? 'active' : ''}`}
                                    onClick={() => loadItemData(i.id, 'items')} 
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #f0f0f0' }}>
                                    <div className="flex items-center gap-3">
                                        <i className={i.icon || "fa-solid fa-circle"} style={{ fontSize: '0.8rem', color: '#607d8b' }}></i>
                                        <span style={{ fontWeight: '500' }}>{i.name}</span>
                                    </div>
                                    <span style={{ color: '#b89c72', fontSize: '0.75rem', fontWeight: 'bold' }}>{i.cost || (i.rarity && i.rarity !== 'None' ? i.rarity : '—')}</span>
                                </div>
                            ))
                        }

                        {category === 'spells' && (
                            <div className="items-table-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#f4f4f4', borderBottom: '1px solid #ddd', fontSize: '0.75rem', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
                                <span>Name</span>
                                <span>Level</span>
                            </div>
                        )}
                        {category === 'spells' && categories.spells
                            .filter(s => {
                                const matchesSearch = s.name.toLowerCase().includes(searchQuery);
                                const matchesLevel = spellLevelFilter === 'All' || String(s.level) === String(spellLevelFilter);
                                const matchesSchool = spellSchoolFilter === 'All' || s.school?.toLowerCase() === spellSchoolFilter.toLowerCase();
                                return matchesSearch && matchesLevel && matchesSchool;
                            })
                            .map(s => (
                                <div key={s.id} 
                                    className={`sidebar-item ${selectedItem?.data?.spell_id === s.id ? 'active' : ''}`}
                                    onClick={() => loadItemData(s.id, 'spells')} 
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #f0f0f0' }}>
                                    <div className="flex items-center gap-3">
                                        <i className={s.icon || "fa-solid fa-wand-sparkles"} style={{ fontSize: '0.8rem', color: '#8b0000' }}></i>
                                        <span style={{ fontWeight: '500' }}>{s.name}</span>
                                    </div>
                                    <span style={{ color: '#b89c72', fontSize: '0.75rem', fontWeight: 'bold' }}>{s.level === 0 ? 'Cantrip' : `Lvl ${s.level}`}</span>
                                </div>
                            ))
                        }

                        {!['classes', 'backgrounds', 'species', 'feats', 'items', 'spells'].includes(category) && (
                            <div className="p-4 text-sm text-gray-500 text-center">
                                ไม่มีข้อมูลสำหรับหมวดหมู่นี้
                            </div>
                        )}
                    </div>
                </aside>

                {/* --- เนื้อหาหลัก ขวา --- */}
                <main className="compendium-content">
                    {loading && <div className="text-center">Loading...</div>}

                    {/* 1. Empty State (ยังไม่เลือกอะไร) */}
                    {!selectedItem && !loading && (
                        <div className="empty-state">
                            <i className="fa-solid fa-book-open-reader"></i>
                            <h3>คลังข้อมูลกฎ 5th Edition (2024)</h3>
                            <p>เลือกหมวดหมู่จากเมนู หรือพิมพ์ค้นหาเพื่อเริ่มใช้งาน</p>
                        </div>
                    )}

                    {/* 2. Class View */}
                    {selectedItem?.type === 'class' && !loading && (
                        <div className="detail-view animate-fade-in">
                            {/* Banner Header */}
                            <div className="class-header-banner">
                                <div className="class-icon-large">
                                    <i className="fa-solid fa-dungeon"></i>
                                </div>
                                <div className="class-title-group">
                                    <h1>{selectedItem.data.class_name}</h1>
                                    <div className="class-meta-tags">
                                        <span>Class</span>
                                        <span>5th Edition</span>
                                    </div>
                                </div>
                            </div>

                            <div className="class-body">
                                {/* Intro / Flavor */}
                                <div className="intro-box">
                                    <div className="flavor-text">
                                        <div dangerouslySetInnerHTML={createMarkup(selectedItem.data.class_desc)}></div>
                                    </div>

                                    {/* Stats Panel */}
                                    <div className="stats-panel">
                                        <h3>Class Basics</h3>
                                        <div className="stat-group">
                                            <h4>Hit Points</h4>
                                            <p><strong>Hit Dice:</strong> {selectedItem.data.hit_points?.display?.hit_dice || '-'}</p>
                                            <p><strong>At 1st Level:</strong> {selectedItem.data.hit_points?.display?.hp_at_level_1 || '-'}</p>
                                            <p><strong>Higher Levels:</strong> {selectedItem.data.hit_points?.display?.hp_higher_levels || '-'}</p>
                                        </div>
                                        <div className="stat-group">
                                            <h4>Proficiencies</h4>
                                            <p><strong>Armor:</strong> {selectedItem.data.proficiencies?.granted?.armor?.join(', ') || 'None'}</p>
                                            <p><strong>Weapons:</strong> {selectedItem.data.proficiencies?.granted?.weapons?.join(', ') || 'None'}</p>
                                            <p><strong>Tools:</strong> {selectedItem.data.proficiencies?.granted?.tools?.join(', ') || 'None'}</p>
                                            <p><strong>Saving Throws:</strong> {selectedItem.data.proficiencies?.granted?.saving_throws?.join(', ') || 'None'}</p>
                                            <p><strong>Skills:</strong> {selectedItem.data.proficiencies?.display?.skills || 'None'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Table */}
                                <ClassTable classId={selectedItem.data.class_id} levels={selectedItem.data.levels} />

                                {/* Features List */}
                                <div className="feature-list">
                                    {selectedItem.data.levels?.flatMap(lvl => 
                                        lvl.features.filter(f => {
                                            if (f.name === 'Ability Score Improvement' && f.level > 4) return false;
                                            if ((f.name.includes('Subclass') || f.name.includes('Oath') || f.name.includes('Circle') || f.name.includes('College') || f.name.includes('Domain') || f.name.includes('Path')) && f.level > 3) return false;
                                            if (f.name.includes('(two uses)') || f.name.includes('(three uses)')) return false;
                                            if (f.name.includes('Mystic Arcanum') && f.level > 11) return false;
                                            return true;
                                        }).map((f, idx) => (
                                            <div key={`${lvl.level}-${idx}`} className="feature-section-wrapper">
                                                <div className="feature-box">
                                                    <div className="feature-title">Level {lvl.level}: {f.name.replace(' (one use)', '')}</div>
                                                    <div className="feature-desc" dangerouslySetInnerHTML={createMarkup(Array.isArray(f.display || f.description || f.desc) ? (f.display || f.description || f.desc).join('') : (f.display || f.description || f.desc))}></div>
                                                    {f.collapsible_content && (
                                                        <div className="feature-desc" style={{ marginTop: '10px' }} dangerouslySetInnerHTML={createMarkup(f.collapsible_content)}></div>
                                                    )}
                                                </div>
                                                <div className="feature-divider"></div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Subclasses */}
                                {selectedItem.data.subclasses?.length > 0 && (
                                    <div className="subclass-section">
                                        <div className="section-divider"><span>Subclasses</span></div>
                                        
                                        <div className="subclass-buttons">
                                            {selectedItem.data.subclasses.map((sub, idx) => (
                                                <button 
                                                    key={idx} 
                                                    className={`sub-btn ${activeSubclass === idx ? 'active' : ''}`}
                                                    onClick={() => setActiveSubclass(idx)}
                                                >
                                                    {sub.subclass_name || sub.name}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="subclass-display animate-fade-in">
                                            <div className="subclass-card">
                                                <div className="subclass-title">{selectedItem.data.subclasses[activeSubclass].subclass_name || selectedItem.data.subclasses[activeSubclass].name}</div>
                                                <div className="subclass-tagline">{selectedItem.data.subclasses[activeSubclass].tagline}</div>
                                                <div className="subclass-flavor" dangerouslySetInnerHTML={createMarkup(selectedItem.data.subclasses[activeSubclass].flavor)}></div>
                                                <hr style={{margin: '20px 0', borderTop: '1px dashed #ccc'}}/>
                                                {selectedItem.data.subclasses[activeSubclass].features?.map((f, i) => (
                                                    <div key={i} className="feature-box" style={{borderLeft: '3px solid var(--color-red)'}}>
                                                        <div className="feature-title">Level {f.level}: {f.name}</div>
                                                        <div className="feature-desc" dangerouslySetInnerHTML={createMarkup(Array.isArray(f.display || f.description || f.desc) ? (f.display || f.description || f.desc).join('') : (f.display || f.description || f.desc))}></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Standalone Class Appendix */}
                                {renderClassAppendix(selectedItem.data.levels)}
                            </div>
                        </div>
                    )}

                    {/* 3. Background View */}
                    {selectedItem?.type === 'backgrounds' && (
                        <div className="detail-view animate-fade-in">
                            <div className="class-header-banner" style={{borderColor: '#2e8b57'}}>
                                <div className="class-icon-large" style={{backgroundColor: '#2e8b57'}}>
                                    <i className="fa-solid fa-tree"></i>
                                </div>
                                <div className="class-title-group">
                                    <h1>{selectedItem.data.background_name}</h1>
                                    <div className="class-meta-tags"><span>Background</span><span>5th Edition</span></div>
                                </div>
                            </div>
                            
                            <div className="class-body">
                                <div className="intro-box">
                                    <div className="flavor-text">
                                        <div dangerouslySetInnerHTML={createMarkup(selectedItem.data.background_desc)}></div>
                                    </div>
                                    
                                    <div className="stats-panel">
                                        <h3>Background Details</h3>
                                        <div className="stat-group">
                                            <p><strong>Ability Scores:</strong> {(() => {
                                                const val = selectedItem.data.ability_scores;
                                                if (!val) return '-';
                                                let data = val;
                                                if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) { return data; } }
                                                if (typeof data === 'object') {
                                                    if (data.display) return data.display;
                                                    if (Array.isArray(data)) return data.join(', ');
                                                    if (data.logic?.allowed_attributes) return data.logic.allowed_attributes.join(', ');
                                                }
                                                return String(data);
                                            })()}</p>
                                            <p><strong>Skill Proficiencies:</strong> {(() => {
                                                const val = selectedItem.data.skill_proficiencies;
                                                if (!val) return '-';
                                                let data = val;
                                                if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) { return data; } }
                                                if (typeof data === 'object') {
                                                    if (data.display) return data.display;
                                                    if (Array.isArray(data)) return data.join(', ');
                                                    if (data.logic?.granted) return Array.isArray(data.logic.granted) ? data.logic.granted.join(', ') : data.logic.granted;
                                                }
                                                return String(data);
                                            })()}</p>
                                            {(() => {
                                                const val = selectedItem.data.tool_proficiencies;
                                                if (!val) return (
                                                    <>
                                                        <p><strong>Tool Proficiencies:</strong> -</p>
                                                        <p><strong>Languages:</strong> -</p>
                                                    </>
                                                );

                                                let rawList = [];
                                                let data = val;
                                                if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) { rawList = [data]; } }
                                                if (typeof data === 'object') {
                                                    if (Array.isArray(data)) rawList = data;
                                                    else if (data.logic?.granted) rawList = Array.isArray(data.logic.granted) ? data.logic.granted : [data.logic.granted];
                                                    else if (data.display) rawList = data.display.split(/,\s*|\s+and\s+/);
                                                }

                                                const KNOWN_LANGS = [
                                                    "Common", "Elvish", "Dwarvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc",
                                                    "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon"
                                                ];

                                                const tools = [];
                                                const languages = [];

                                                rawList.forEach(item => {
                                                    if (typeof item !== 'string') return;
                                                    const trimmed = item.trim();
                                                    if (KNOWN_LANGS.some(l => l.toLowerCase() === trimmed.toLowerCase()) || trimmed.toLowerCase().includes('language')) {
                                                        languages.push(trimmed);
                                                    } else {
                                                        tools.push(trimmed);
                                                    }
                                                });

                                                return (
                                                    <>
                                                        <p><strong>Tool Proficiencies:</strong> {tools.length > 0 ? tools.join(', ') : '-'}</p>
                                                        <p><strong>Languages:</strong> {languages.length > 0 ? languages.join(', ') : '-'}</p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className="stat-group">
                                            <p><strong>Equipment:</strong> {(() => {
                                                const val = selectedItem.data.equipment;
                                                if (!val) return '-';
                                                let data = val;
                                                if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) { return data; } }
                                                if (typeof data === 'object') {
                                                    if (data.display) return data.display;
                                                    if (Array.isArray(data)) return data.map(i => typeof i === 'object' ? (i.item_name ? `${i.item_name} x${i.quantity || 1}` : JSON.stringify(i)) : i).join(', ');
                                                    if (data.logic?.items) return data.logic.items.join(', ') + (data.logic.gold ? `, ${data.logic.gold} GP` : '');
                                                }
                                                return String(data);
                                            })()}</p>
                                            {selectedItem.data.feat_id && (
                                                <p><strong>Granted Feat:</strong> <span className="text-amber-700 font-semibold">{selectedItem.data.feat_id.replace(/-/g, ' ').toUpperCase()}</span></p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Species View */}
                    {selectedItem?.type === 'species' && (
                        <div className="detail-view animate-fade-in">
                            <div className="class-header-banner" style={{borderColor: 'var(--color-red)', backgroundColor: '#fff'}}>
                                <div className="class-icon-large" style={{backgroundColor: 'var(--color-red)', color: '#fff'}}>
                                    <i className="fa-solid fa-users"></i>
                                </div>
                                <div className="class-title-group">
                                    <h1 style={{color: 'var(--color-ink)'}}>{selectedItem.data.species_name}</h1>
                                    <div className="class-meta-tags"><span style={{backgroundColor: 'var(--bg-white)', color: 'var(--color-ink)'}}>Species</span></div>
                                </div>
                            </div>
                            
                            <div className="class-body">
                                <div className="intro-box" style={{backgroundColor: 'transparent', border: 'none', padding: '0 0 20px 0'}}>
                                    <div className="flavor-text" style={{fontStyle: 'italic', color: 'var(--color-gray)', borderLeft: '4px solid var(--color-red)', paddingLeft: '20px', marginBottom: '30px', fontSize: '1.1em'}}>
                                        <div dangerouslySetInnerHTML={createMarkup(selectedItem.data.species_desc)}></div>
                                    </div>
                                    
                                    <div className="stats-panel" style={{display: 'flex', gap: '15px', backgroundColor: '#f5f2e6', padding: '15px 20px', borderRadius: '8px', border: '1px solid #e6dfcc'}}>
                                        <div className="stat-badge" style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                                            <i className="fa-solid fa-expand" style={{color: '#b89c72', fontSize: '1.5em'}}></i>
                                            <div>
                                                <div style={{fontSize: '0.85em', color: '#8c7b65', textTransform: 'uppercase', fontWeight: 'bold'}}>Size</div>
                                                <div style={{fontSize: '1.2em', color: '#4a3f35', fontWeight: 'bold'}}>{selectedItem.data.size || 'Medium'}</div>
                                            </div>
                                        </div>
                                        <div style={{width: '1px', backgroundColor: '#d1c7b3'}}></div>
                                        <div className="stat-badge" style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                                            <i className="fa-solid fa-person-running" style={{color: '#b89c72', fontSize: '1.5em'}}></i>
                                            <div>
                                                <div style={{fontSize: '0.85em', color: '#8c7b65', textTransform: 'uppercase', fontWeight: 'bold'}}>Speed</div>
                                                <div style={{fontSize: '1.2em', color: '#4a3f35', fontWeight: 'bold'}}>{selectedItem.data.speed || 30} ft.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="feature-list" style={{marginTop: '30px'}}>
                                    <h3 style={{fontFamily: 'var(--font-heading)', color: '#4a3f35', borderBottom: '1px solid #d1c7b3', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.5em'}}>Species Traits</h3>
                                    <div style={{display: 'grid', gap: '20px'}}>
                                        {selectedItem.data.traits?.map((t, idx) => (
                                            <div key={idx} className="feature-box" style={{backgroundColor: '#fff', border: '1px solid #e6dfcc', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'}}>
                                                <div className="feature-title" style={{color: '#8b0000', fontSize: '1.2em', marginBottom: '10px'}}>{t.name}</div>
                                                <div className="feature-desc" style={{color: '#333', lineHeight: '1.6'}} dangerouslySetInnerHTML={createMarkup(t.display || t.desc || '')}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedItem.data.lineages && selectedItem.data.lineages.length > 0 && (
                                    <div className="feature-list" style={{marginTop: '40px'}}>
                                        {(() => {
                                            const hasSpells = selectedItem.data.lineages.some(l => l.granted_spells && l.granted_spells.length > 0);
                                            
                                            // Helper to format spells text
                                            const getSpellNames = (lineage, level) => {
                                                if (!lineage.granted_spells) return '';
                                                const spells = lineage.granted_spells.filter(s => s.level === level);
                                                if (spells.length === 0) return '';
                                                return spells.map(s => s.spell_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ');
                                            };

                                            return (
                                                <>
                                                    <h3 style={{fontFamily: 'var(--font-heading)', color: '#4a3f35', borderBottom: '1px solid #d1c7b3', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.5em'}}>
                                                        <i className="fa-solid fa-droplet" style={{color: '#b89c72', marginRight: '10px'}}></i>
                                                        Subraces / Lineages
                                                    </h3>
                                                    <table style={{width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e6dfcc'}}>
                                                        <thead>
                                                            <tr style={{backgroundColor: '#8b0000', color: '#fff', textAlign: 'left'}}>
                                                                <th style={{padding: '14px 20px', borderBottom: '2px solid #5a0000', fontFamily: 'Cinzel, serif', width: hasSpells ? '20%' : '25%', fontSize: '1.15em', letterSpacing: '0.5px'}}>Lineage</th>
                                                                <th style={{padding: '14px 20px', borderBottom: '2px solid #5a0000', fontFamily: 'Cinzel, serif', width: hasSpells ? '50%' : '75%', fontSize: '1.15em', letterSpacing: '0.5px'}}>{hasSpells ? 'Level 1' : 'Description'}</th>
                                                                {hasSpells && <th style={{padding: '14px 20px', borderBottom: '2px solid #5a0000', fontFamily: 'Cinzel, serif', width: '15%', fontSize: '1.15em', letterSpacing: '0.5px'}}>Level 3</th>}
                                                                {hasSpells && <th style={{padding: '14px 20px', borderBottom: '2px solid #5a0000', fontFamily: 'Cinzel, serif', width: '15%', fontSize: '1.15em', letterSpacing: '0.5px'}}>Level 5</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedItem.data.lineages.map((lineage, idx) => {
                                                                const lvl1Spells = getSpellNames(lineage, 1);
                                                                return (
                                                                    <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? '#fffcf7' : '#ffffff', borderBottom: idx === selectedItem.data.lineages.length - 1 ? 'none' : '1px solid #e6dfcc'}}>
                                                                        <td style={{padding: '18px 20px', color: '#8b0000', fontWeight: 'bold', verticalAlign: 'top', fontSize: '1.05em', fontFamily: 'Cinzel, serif'}}>{lineage.lineage_name}</td>
                                                                        {hasSpells ? (
                                                                            <>
                                                                                <td style={{padding: '18px 20px', color: '#333333', lineHeight: '1.7', verticalAlign: 'top', fontSize: '0.98em'}}>
                                                                                    <div dangerouslySetInnerHTML={createMarkup(lineage.lineage_desc)}></div>
                                                                                    {lvl1Spells && <div style={{marginTop: '8px', color: '#8b0000'}}><strong>Spells:</strong> <em>{lvl1Spells}</em></div>}
                                                                                </td>
                                                                                <td style={{padding: '18px 20px', color: '#333333', verticalAlign: 'top', fontSize: '0.98em', fontStyle: 'italic'}}>{getSpellNames(lineage, 3) || '-'}</td>
                                                                                <td style={{padding: '18px 20px', color: '#333333', verticalAlign: 'top', fontSize: '0.98em', fontStyle: 'italic'}}>{getSpellNames(lineage, 5) || '-'}</td>
                                                                            </>
                                                                        ) : (
                                                                            <td style={{padding: '18px 20px', color: '#333333', lineHeight: '1.7', verticalAlign: 'top', fontSize: '0.98em'}} dangerouslySetInnerHTML={createMarkup(lineage.lineage_desc)}></td>
                                                                        )}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 5. Feats View */}
                    {selectedItem?.type === 'feats' && (
                        <div className="detail-view animate-fade-in">
                            <div className="class-header-banner" style={{borderColor: '#8b0000', backgroundColor: '#fdfcf0'}}>
                                <div className="class-icon-large" style={{backgroundColor: '#8b0000', color: '#fff'}}>
                                    <i className="fa-solid fa-medal"></i>
                                </div>
                                <div className="class-title-group">
                                    <h1 style={{color: '#4a3f35'}}>{selectedItem.data.feat_name}</h1>
                                    <div className="class-meta-tags">
                                        <span style={{backgroundColor: '#e6dfcc', color: '#4a3f35'}}>{selectedItem.data.feat_type} Feat</span>
                                        {selectedItem.data.prerequisite && <span style={{backgroundColor: '#f5e6e6', color: '#8b0000'}}>Prerequisite: {selectedItem.data.prerequisite}</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="class-body">
                                <div className="intro-box" style={{backgroundColor: '#fff', border: '1px solid #e6dfcc', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'}}>
                                    <div className="flavor-text" style={{color: '#333', lineHeight: '1.8', fontSize: '1.05em'}}>
                                        <div dangerouslySetInnerHTML={createMarkup(selectedItem.data.feat_desc)}></div>
                                    </div>
                                    
                                    {selectedItem.data.feat_choices?.display && (
                                        <div style={{marginTop: '25px', padding: '20px', backgroundColor: '#f5f2e6', borderRadius: '6px', borderLeft: '4px solid #b89c72'}}>
                                            <h4 style={{margin: '0 0 10px 0', color: '#8b0000'}}>Benefit:</h4>
                                            <p style={{margin: 0, color: '#4a3f35'}}>{selectedItem.data.feat_choices.display}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* 6. Items View */}
                    {selectedItem?.type === 'items' && (
                        <div className="detail-view animate-fade-in" style={{ backgroundColor: '#fff', border: '1px solid #d1c7b3', borderRadius: '4px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
                            <div className="item-header-v2" style={{ borderBottom: '2px solid #8b0000', paddingBottom: '15px', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <h1 style={{ color: '#8b0000', fontSize: '2.8rem', margin: 0, fontFamily: 'serif', fontWeight: 'bold', letterSpacing: '0.5px' }}>{selectedItem.data.item_name}</h1>
                                    <span style={{ color: '#8b0000', fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'serif' }}>{selectedItem.data.srd_source?.split(',')[0] || 'PHB\'24'}</span>
                                </div>
                                <div style={{ fontStyle: 'italic', color: '#666', fontSize: '1.2rem', marginTop: '5px', fontWeight: '500' }}>
                                    {selectedItem.data.item_type} {selectedItem.data.subcategory && <span style={{ opacity: 0.7 }}>— {selectedItem.data.subcategory}</span>}
                                </div>
                                <div style={{ color: '#333', fontSize: '1.1rem', marginTop: '10px', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                    <span><span style={{ color: '#666', fontWeight: 'normal' }}>Cost: </span>{selectedItem.data.cost || (selectedItem.data.item_type === 'Magic Item' ? (selectedItem.data.rarity && selectedItem.data.rarity !== 'None' ? `ตามระดับความหายาก (${selectedItem.data.rarity})` : '—') : '—')}</span>
                                    {selectedItem.data.weight && <span><span style={{ color: '#666', fontWeight: 'normal' }}>Weight: </span>{selectedItem.data.weight} lb.</span>}
                                    {selectedItem.data.rarity && selectedItem.data.rarity !== 'None' && selectedItem.data.item_type === 'Magic Item' && (
                                        <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '600' }}>{selectedItem.data.rarity}</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="item-content-v2" style={{ color: '#2c3e50', lineHeight: '1.8', fontSize: '1.15rem', fontFamily: 'var(--font-body)' }}>
                                <div className="item-description-v2" dangerouslySetInnerHTML={createMarkup(selectedItem.data.item_desc)}></div>
                                
                                {(selectedItem.data.properties || selectedItem.data.ac || selectedItem.data.damage) && (
                                    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f7f2', border: '1px solid #e8e1d5', borderRadius: '8px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                                            {selectedItem.data.damage && (
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase' }}>Damage</div>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{selectedItem.data.damage}</div>
                                                </div>
                                            )}
                                            {selectedItem.data.ac && (
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase' }}>Armor Class</div>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{selectedItem.data.ac}</div>
                                                </div>
                                            )}
                                            {selectedItem.data.properties && (
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase' }}>Properties</div>
                                                    <div style={{ fontSize: '1.1rem' }}>{selectedItem.data.properties}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="item-footer-v2" style={{ marginTop: '50px', padding: '15px 20px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #d1c7b3', borderRadius: '0 4px 4px 0', fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
                                    <strong>Source:</strong> {selectedItem.data.srd_source}. Available in the SRD 5.2.1 and the Basic Rules.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. Spells View */}
                    {selectedItem?.type === 'spells' && (
                        <div className="detail-view animate-fade-in" style={{ backgroundColor: '#fff', border: '1px solid #d1c7b3', borderRadius: '4px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
                            <div className="item-header-v2" style={{ borderBottom: '2px solid #8b0000', paddingBottom: '15px', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <h1 style={{ color: '#8b0000', fontSize: '2.8rem', margin: 0, fontFamily: 'serif', fontWeight: 'bold', letterSpacing: '0.5px' }}>{selectedItem.data.spell_name}</h1>
                                    <span style={{ color: '#8b0000', fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'serif' }}>{selectedItem.data.srd_source?.split(',')[0] || 'PHB\'24'}</span>
                                </div>
                                <div style={{ fontStyle: 'italic', color: '#666', fontSize: '1.2rem', marginTop: '5px', fontWeight: '500' }}>
                                    {selectedItem.data.spell_level === 0 ? 'Cantrip' : `Level ${selectedItem.data.spell_level}`} {selectedItem.data.school}
                                </div>
                                
                                { (selectedItem.data.casting_time || selectedItem.data.range_dist || selectedItem.data.components || selectedItem.data.duration) && (
                                <div className="spell-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                    {selectedItem.data.casting_time && <div>
                                        <div style={{ fontSize: '0.7rem', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase' }}>Casting Time</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '500' }}>{selectedItem.data.casting_time}</div>
                                    </div>}
                                    {selectedItem.data.range_dist && <div>
                                        <div style={{ fontSize: '0.7rem', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase' }}>Range/Area</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '500' }}>{selectedItem.data.range_dist}</div>
                                    </div>}
                                    {selectedItem.data.components && <div>
                                        <div style={{ fontSize: '0.7rem', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase' }}>Components</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '500' }}>{selectedItem.data.components}</div>
                                    </div>}
                                    {selectedItem.data.duration && <div>
                                        <div style={{ fontSize: '0.7rem', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase' }}>Duration</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '500' }}>{selectedItem.data.duration}</div>
                                    </div>}
                                </div>
                                )}
                            </div>
                            
                            <div className="item-content-v2" style={{ color: '#2c3e50', lineHeight: '1.8', fontSize: '1.15rem', fontFamily: 'var(--font-body)' }}>
                                <div className="spell-description-v2" dangerouslySetInnerHTML={createMarkup(selectedItem.data.spell_desc)}></div>
                                
                                {selectedItem.data.mechanics?.display && (
                                    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f7f2', border: '1px solid #e8e1d5', borderRadius: '8px', borderLeft: '4px solid #8b0000' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Quick Effect</div>
                                        <div style={{ fontSize: '1.1rem', color: '#4a3f35' }}>{selectedItem.data.mechanics.display}</div>
                                    </div>
                                )}
                                
                                <div className="item-footer-v2" style={{ marginTop: '50px', padding: '15px 20px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #d1c7b3', borderRadius: '0 4px 4px 0', fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
                                    <strong>Source:</strong> {selectedItem.data.srd_source}. Available in the SRD 5.2.1 and the Basic Rules.
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
const formatTableFeatureNames = (clsName, level, features) => {
    const cName = clsName ? clsName.charAt(0).toUpperCase() + clsName.slice(1).toLowerCase() : '';
    const cid = clsName ? clsName.toLowerCase() : '';
    const lvlNum = typeof level === 'object' && level !== null ? parseInt(level.level) : parseInt(level);

    const blankLevels = {
        bard: [11, 13, 15, 17],
        cleric: [9, 11, 13, 15, 18],
        druid: [9, 11, 13, 17],
        paladin: [13, 17],
        sorcerer: [9, 11, 13, 15],
        warlock: [5, 7, 18],
        wizard: [7, 11, 13, 15, 17]
    };

    if (blankLevels[cid]?.includes(lvlNum)) {
        return '—';
    }

    const subclassLevels = {
        barbarian: [6, 10, 14],
        bard: [6, 14],
        cleric: [6, 17],
        druid: [6, 10, 14],
        fighter: [6, 10, 15],
        monk: [6, 11, 17],
        paladin: [7, 15],
        ranger: [7, 11, 15],
        rogue: [9, 13, 17],
        sorcerer: [6, 14, 18],
        warlock: [6, 10, 14],
        wizard: [6, 10, 14]
    };

    if ((!features || features.length === 0) && subclassLevels[cid]?.includes(lvlNum)) {
        return 'Subclass feature';
    }
    if (!features || features.length === 0) {
        return '—';
    }

    let names = features.map(f => {
        let name = typeof f === 'string' ? f : (f.name || '');
        name = name.replace(/\s*\((?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+uses?\)/gi, '')
                   .replace(/\s*\([dD]\d+\)/g, '')
                   .replace(new RegExp(`\\s*\\(${cName}\\)`, 'gi'), '');
        return name.trim();
    }).filter(Boolean);

    if (lvlNum === 3) {
        const subName = `${cName} Subclass`;
        names = names.map(n => {
            if (['primal path', 'bardic college', 'divine domain', 'druid circle', 'martial archetype', 'monastic tradition', 'sacred oath', 'ranger archetype', 'roguish archetype', 'sorcerous origin', 'otherworldly patron', 'arcane tradition'].includes(n.toLowerCase()) || n.toLowerCase().includes('subclass')) {
                return subName;
            }
            return n;
        });
        if (!names.includes(subName)) {
            names.unshift(subName);
        }
    }

    if (subclassLevels[cid]?.includes(lvlNum)) {
        names = names.map(n => {
            if (n.toLowerCase().includes('subclass') || n.toLowerCase().includes('tradition') || n.toLowerCase().includes('circle') || n.toLowerCase().includes('domain') || n.toLowerCase().includes('path') || n.toLowerCase().includes('college') || n.toLowerCase().includes('archetype') || n.toLowerCase().includes('oath') || n.toLowerCase().includes('patron') || n.toLowerCase().includes('origin')) {
                return 'Subclass feature';
            }
            return n;
        });
        if (names.length === 0) names = ['Subclass feature'];
    }

    if (cid === 'fighter') {
        names = names.map(n => {
            if (n === 'Action Surge') {
                if (lvlNum === 2) return 'Action Surge (one use)';
                if (lvlNum === 17) return 'Action Surge (two uses)';
            }
            if (n === 'Indomitable') {
                if (lvlNum === 9) return 'Indomitable (one use)';
                if (lvlNum === 13) return 'Indomitable (two uses)';
                if (lvlNum === 17) return 'Indomitable (three uses)';
            }
            return n;
        });
    }

    if (cid === 'monk' && lvlNum === 4) {
        if (names.includes('Slow Fall') && names.includes('Ability Score Improvement')) {
            return 'Ability Score Improvement, Slow Fall';
        }
    }

    names = [...new Set(names)];
    return names.length > 0 ? names.join(', ') : '—';
};

export default Compendium;
