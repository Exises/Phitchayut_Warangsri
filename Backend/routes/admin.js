const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Middleware to check if user is admin
const checkAdmin = async (req, res, next) => {
    try {
        const admin_id = req.body.admin_id || req.query.admin_id;
        
        if (!admin_id) {
            return res.status(403).json({ status: 'error', message: 'ไม่ระบุตัวตน' });
        }

        const [users] = await pool.query("SELECT role FROM users WHERE user_id = ?", [admin_id]);
        
        if (users.length > 0 && users[0].role === 'admin') {
            next();
        } else {
            return res.status(403).json({ status: 'error', message: 'สิทธิ์การเข้าถึงไม่ถูกต้อง' });
        }
    } catch (err) {
        return res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
};

router.post('/stats', checkAdmin, async (req, res) => {
    try {
        const [users] = await pool.query("SELECT COUNT(*) as count FROM users");
        const [characters] = await pool.query("SELECT COUNT(*) as count FROM characters");
        const [spells] = await pool.query("SELECT COUNT(*) as count FROM spells");
        const [items] = await pool.query("SELECT COUNT(*) as count FROM items");
        const [species] = await pool.query("SELECT COUNT(*) as count FROM species");
        const [classes] = await pool.query("SELECT COUNT(*) as count FROM classes");
        const [feats] = await pool.query("SELECT COUNT(*) as count FROM feats");
        const [backgrounds] = await pool.query("SELECT COUNT(*) as count FROM backgrounds");
        const [feedbacks] = await pool.query("SELECT COUNT(*) as count FROM feedbacks");
        const [unread_feedbacks] = await pool.query("SELECT COUNT(*) as count FROM feedbacks WHERE is_read = 0 OR is_read IS NULL");
        const [bug_feedbacks] = await pool.query("SELECT COUNT(*) as count FROM feedbacks WHERE LOWER(category) = 'bug'");

        res.json({
            status: 'success',
            stats: {
                users: users[0].count,
                characters: characters[0].count,
                spells: spells[0].count,
                items: items[0].count,
                races: species[0].count,
                classes: classes[0].count,
                feats: feats[0].count,
                backgrounds: backgrounds[0].count,
                feedbacks: feedbacks[0].count,
                unread_feedbacks: unread_feedbacks[0].count,
                bug_feedbacks: bug_feedbacks[0].count
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/users', checkAdmin, async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.user_id, u.user_name, u.user_email, u.role, COALESCE(u.status, 'active') as status, u.avatar_url, u.created_at, COUNT(c.char_id) as character_count 
            FROM users u 
            LEFT JOIN characters c ON u.user_id = c.user_id 
            GROUP BY u.user_id 
            ORDER BY u.created_at DESC
        `);
        res.json({ status: 'success', users });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/update_user', checkAdmin, async (req, res) => {
    try {
        const { target_user_id, role, status, user_name, user_email, new_password } = req.body;
        
        if (target_user_id === req.body.admin_id && status && status !== 'active') {
             return res.status(400).json({ status: 'error', message: 'คุณไม่สามารถระงับบัญชีตัวเองได้' });
        }

        let query = "UPDATE users SET ";
        let params = [];
        
        if (user_name) {
            query += "user_name = ?, ";
            params.push(user_name);
        }
        if (user_email) {
            query += "user_email = ?, ";
            params.push(user_email);
        }
        if (role) {
            query += "role = ?, ";
            params.push(role);
        }
        if (status) {
            query += "status = ?, ";
            params.push(status);
        }
        if (new_password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(new_password, salt);
            query += "user_password = ?, ";
            params.push(hashedPassword);
        }
        
        if (params.length === 0) {
            return res.json({ status: 'success', message: 'ไม่มีข้อมูลที่ต้องอัปเดต' });
        }

        query = query.slice(0, -2); 
        query += " WHERE user_id = ?";
        params.push(target_user_id);

        await pool.query(query, params);
        res.json({ status: 'success', message: 'อัปเดตผู้ใช้สำเร็จ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/delete_user', checkAdmin, async (req, res) => {
    try {
        const { target_user_id, admin_id } = req.body;
        
        if (target_user_id === admin_id) {
             return res.status(400).json({ status: 'error', message: 'คุณไม่สามารถลบบัญชีตัวเองได้' });
        }

        await pool.query("DELETE FROM characters WHERE user_id = ?", [target_user_id]);
        await pool.query("DELETE FROM users WHERE user_id = ?", [target_user_id]);
        
        res.json({ status: 'success', message: 'ลบผู้ใช้และตัวละครที่เกี่ยวข้องสำเร็จ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Helper for dynamic fields
const processItemData = (data) => {
    const processed = { ...data };
    const jsonFields = [
        'hit_points', 'proficiencies', 'equipment', 'multiclassing', 'becoming', 'features', 'level_progression', 'spell_list', 
        'properties', 'damage', 'range', 'armor_class',
        'ability_scores', 'skill_proficiencies', 'tool_proficiencies', 'traits', 'granted_spells', 'feat_choices', 'mechanics'
    ];
    for (let f of jsonFields) {
        if (processed[f] && typeof processed[f] !== 'string') {
            processed[f] = JSON.stringify(processed[f]);
        }
    }
    return processed;
};

router.post('/create_compendium_item', checkAdmin, async (req, res) => {
    try {
        const { target_table, item_data } = req.body;
        const allowed_tables = ['classes', 'subclasses', 'species', 'lineages', 'spells', 'items', 'backgrounds', 'feats'];
        if (!allowed_tables.includes(target_table)) return res.status(400).json({ status: 'error', message: 'ตารางข้อมูลไม่ถูกต้อง' });

        const id_field_map = {
            'classes': 'class_id', 'subclasses': 'subclass_id', 'species': 'species_id',
            'lineages': 'lineage_id', 'spells': 'spell_id', 'items': 'item_id',
            'backgrounds': 'background_id', 'feats': 'feat_id'
        };
        const pk = id_field_map[target_table];

        let processedData = processItemData(item_data);

        if (!processedData[pk]) {
            const name = processedData['name'] || processedData[target_table.replace(/s$/, '') + '_name'] || processedData[target_table + '_name'] || 'custom_' + Date.now();
            processedData[pk] = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        }

        const columns = Object.keys(processedData);
        const values = Object.values(processedData);
        const placeholders = new Array(columns.length).fill('?').join(', ');
        const colString = columns.map(c => `\`${c}\``).join(', ');

        await pool.query(`INSERT INTO \`${target_table}\` (${colString}) VALUES (${placeholders})`, values);
        res.json({ status: 'success', message: 'เพิ่มข้อมูลสำเร็จ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก: ' + err.message });
    }
});

router.post('/update_compendium_item', checkAdmin, async (req, res) => {
    try {
        const { target_table, item_data } = req.body;
        const allowed_tables = ['classes', 'subclasses', 'species', 'lineages', 'spells', 'items', 'backgrounds', 'feats'];
        if (!allowed_tables.includes(target_table)) return res.status(400).json({ status: 'error', message: 'ตารางข้อมูลไม่ถูกต้อง' });

        const id_field_map = {
            'classes': 'class_id', 'subclasses': 'subclass_id', 'species': 'species_id',
            'lineages': 'lineage_id', 'spells': 'spell_id', 'items': 'item_id',
            'backgrounds': 'background_id', 'feats': 'feat_id'
        };
        const pk = id_field_map[target_table];

        let processedData = processItemData(item_data);

        if (!processedData[pk]) {
            return res.status(400).json({ status: 'error', message: 'ไม่พบรหัสข้อมูลที่จะอัปเดต' });
        }

        const id_val = processedData[pk];
        const update_fields = [];
        const values = [];

        for (const [key, val] of Object.entries(processedData)) {
            if (key !== pk) {
                update_fields.push(`\`${key}\` = ?`);
                values.push(val);
            }
        }
        values.push(id_val);

        await pool.query(`UPDATE \`${target_table}\` SET ${update_fields.join(', ')} WHERE \`${pk}\` = ?`, values);
        res.json({ status: 'success', message: 'อัปเดตข้อมูลสำเร็จ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัปเดต: ' + err.message });
    }
});

router.post('/delete_compendium_item', checkAdmin, async (req, res) => {
    try {
        const { target_table, item_data } = req.body;
        const id_val = req.body.item_id || (item_data ? item_data.item_id : null);
        
        const allowed_tables = ['classes', 'subclasses', 'species', 'lineages', 'spells', 'items', 'backgrounds', 'feats'];
        if (!allowed_tables.includes(target_table)) {
            return res.status(400).json({ status: 'error', message: 'ตารางข้อมูลไม่ถูกต้อง' });
        }

        const id_field_map = {
            'classes': 'class_id', 'subclasses': 'subclass_id', 'species': 'species_id',
            'lineages': 'lineage_id', 'spells': 'spell_id', 'items': 'item_id',
            'backgrounds': 'background_id', 'feats': 'feat_id'
        };
        const pk = id_field_map[target_table];

        if (!id_val) {
            return res.status(400).json({ status: 'error', message: 'ไม่พบรหัสข้อมูลที่จะลบ' });
        }

        await pool.query(`UPDATE \`${target_table}\` SET \`deleted_at\` = NOW() WHERE \`${pk}\` = ?`, [id_val]);
        res.json({ status: 'success', message: 'ลบข้อมูลสำเร็จ (Soft Delete)' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
