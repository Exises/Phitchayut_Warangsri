const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { category, id, q, index } = req.query;

        // 1. Search All Categories
        if (q) {
            const term = `%${q}%`;
            let results = [];

            const [classes] = await pool.query("SELECT class_id as id, class_name as name, 'classes' as category, 'อาชีพ' as type FROM classes WHERE class_name LIKE ? LIMIT 5", [term]);
            const [backgrounds] = await pool.query("SELECT background_id as id, background_name as name, 'backgrounds' as category, 'ภูมิหลัง' as type FROM backgrounds WHERE background_name LIKE ? LIMIT 5", [term]);
            const [species] = await pool.query("SELECT species_id as id, species_name as name, 'species' as category, 'เผ่าพันธุ์' as type FROM species WHERE species_name LIKE ? LIMIT 5", [term]);
            const [feats] = await pool.query("SELECT feat_id as id, feat_name as name, 'feats' as category, 'ความสามารถพิเศษ' as type FROM feats WHERE feat_name LIKE ? LIMIT 5", [term]);
            const [items] = await pool.query("SELECT item_id as id, item_name as name, 'items' as category, 'ไอเทม' as type FROM items WHERE item_name LIKE ? LIMIT 5", [term]);
            const [spells] = await pool.query("SELECT spell_id as id, spell_name as name, 'spells' as category, 'คาถา' as type FROM spells WHERE spell_name LIKE ? LIMIT 5", [term]);

            results = [...classes, ...backgrounds, ...species, ...feats, ...items, ...spells];
            return res.json(results);
        }

        // 2. All Indices for Sidebar
        if (index === 'all') {
            const [classes] = await pool.query("SELECT class_id as id, class_name as name, 'classes' as category FROM classes ORDER BY class_name");
            const [weapons] = await pool.query("SELECT item_id as id, item_name as name, 'weapons' as category FROM items WHERE item_type = 'weapon' ORDER BY item_name");
            const [armor] = await pool.query("SELECT item_id as id, item_name as name, 'armor' as category FROM items WHERE item_type = 'armor' ORDER BY item_name");
            const [items] = await pool.query("SELECT item_id as id, item_name as name, 'items' as category FROM items ORDER BY item_name");
            
            return res.json([...classes, ...weapons, ...armor, ...items]);
        }

        // 3. Get Specific Item by ID
        if (id && category) {
            let sql = '';
            let idField = '';
            
            if (category === 'classes') idField = 'class_id';
            else if (category === 'backgrounds') idField = 'background_id';
            else if (category === 'species') idField = 'species_id';
            else if (category === 'feats') idField = 'feat_id';
            else if (category === 'spells') idField = 'spell_id';
            else if (category === 'conditions') idField = 'condition_id';
            else if (['items', 'weapons', 'armor'].includes(category)) idField = 'item_id';

            if (idField) {
                // Determine the correct table
                const table = ['weapons', 'armor'].includes(category) ? 'items' : category;
                const [itemData] = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [id]);
                
                if (itemData.length === 0) {
                    return res.status(404).json({ error: 'Item not found' });
                }

                let item = itemData[0];

                // Parse common JSON fields
                const jsonFields = [
                    'hit_points', 'proficiencies', 'equipment', 'multiclassing', 'becoming', 'features', 'level_progression', 'spell_list', 
                    'properties', 'damage', 'range', 'armor_class',
                    'ability_scores', 'skill_proficiencies', 'tool_proficiencies', 'traits', 'granted_spells', 'feat_choices', 'mechanics'
                ];
                
                for (let f of jsonFields) {
                    if (item[f] && typeof item[f] === 'string') {
                        try {
                            item[f] = JSON.parse(item[f]);
                        } catch(e) {
                            // ignore invalid JSON
                        }
                    }
                }

                // If it's a class, we need subclasses
                if (category === 'classes') {
                    // Structure the levels
                    const levels = item.level_progression || [];
                    const featuresByLevel = {};
                    if (item.features) {
                        item.features.forEach(f => {
                            if (!featuresByLevel[f.level]) featuresByLevel[f.level] = [];
                            featuresByLevel[f.level].push(f);
                        });
                    }

                    levels.forEach(l => {
                        l.level = parseInt(l.level);
                        l.prof_bonus = parseInt(l.prof_bonus);
                        l.features = featuresByLevel[l.level] || [];
                    });
                    item.levels = levels;

                    const [subclasses] = await pool.query("SELECT * FROM subclasses WHERE class_id = ?", [id]);
                    subclasses.forEach(sub => {
                        if (sub.features && typeof sub.features === 'string') {
                            try { sub.features = JSON.parse(sub.features); } catch(e){}
                        }
                        sub.flavor = sub.subclass_desc || sub.description || '';
                    });
                    item.subclasses = subclasses;
                }
                
                // If it's a species, we need lineages
                if (category === 'species') {
                    const [lineages] = await pool.query("SELECT * FROM lineages WHERE species_id = ? AND deleted_at IS NULL", [id]);
                    lineages.forEach(sub => {
                        if (sub.granted_spells && typeof sub.granted_spells === 'string') {
                            try { sub.granted_spells = JSON.parse(sub.granted_spells); } catch(e){}
                        }
                    });
                    item.lineages = lineages;
                }

                item.data_type = category; // Important for Compendium.jsx routing logic!

                return res.json(item);
            } else {
                return res.status(400).json({ error: 'Invalid category' });
            }
        }

        // 4. Get List by Category
        if (category && !id) {
            let sql = '';
            switch (category) {
                case 'classes':
                    sql = "SELECT class_id as id, class_name as name FROM classes ORDER BY class_name";
                    break;
                case 'backgrounds':
                    sql = "SELECT background_id as id, background_name as name FROM backgrounds ORDER BY background_name";
                    break;
                case 'species':
                    sql = "SELECT species_id as id, species_name as name FROM species ORDER BY species_name";
                    break;
                case 'feats':
                    sql = "SELECT feat_id as id, feat_name as name, feat_type as type, prerequisite FROM feats ORDER BY feat_name";
                    break;
                case 'spells':
                    sql = "SELECT spell_id as id, spell_name as name, spell_level as level, school FROM spells ORDER BY spell_level, spell_name";
                    break;
                case 'items':
                case 'weapons':
                case 'armor':
                    sql = "SELECT item_id as id, item_name as name FROM items ORDER BY item_name";
                    break;
                default:
                    return res.json([]);
            }
            const [results] = await pool.query(sql);
            return res.json(results);
        }

        // 5. If no specific category, return everything (for Character Builder)
        const [races] = await pool.query("SELECT * FROM species WHERE deleted_at IS NULL ORDER BY species_name");
        const [lineages] = await pool.query("SELECT * FROM lineages WHERE deleted_at IS NULL ORDER BY lineage_name");
        const [classes] = await pool.query("SELECT * FROM classes WHERE deleted_at IS NULL ORDER BY class_name");
        const [subclasses] = await pool.query("SELECT * FROM subclasses WHERE deleted_at IS NULL");
        const [backgrounds] = await pool.query("SELECT * FROM backgrounds WHERE deleted_at IS NULL ORDER BY background_name");
        const [spells] = await pool.query("SELECT * FROM spells WHERE deleted_at IS NULL ORDER BY spell_level, spell_name");
        const [feats] = await pool.query("SELECT * FROM feats WHERE deleted_at IS NULL ORDER BY feat_name");
        const [items] = await pool.query("SELECT * FROM items WHERE deleted_at IS NULL ORDER BY item_type, item_name");

        res.json({
            races,
            lineages,
            classes,
            subclasses,
            backgrounds,
            spells,
            feats,
            items
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

module.exports = router;
