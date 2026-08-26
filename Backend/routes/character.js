const express = require('express');
const pool = require('../db');

const router = express.Router();

const parseJSON = (str) => {
    if (typeof str !== 'string') return str;
    try { return JSON.parse(str); } catch (e) { return str; }
};

const stringifyJSON = (data) => {
    if (typeof data === 'string') return data;
    return JSON.stringify(data || []);
};

// Get User Characters
router.get('/user/:user_id', async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id, 10);
        const [chars] = await pool.query(
            "SELECT char_id, user_id, char_name, species_id, lineage_id, background_id, primary_class_id, classes_data, char_alignment, char_level, hp_max, hp_current, str_score, dex_score, con_score, int_score, wis_score, cha_score, build_data, updated_at, created_at FROM characters WHERE user_id = ? ORDER BY updated_at DESC, char_id DESC",
            [userId]
        );

        chars.forEach(c => {
            c.classes_data = parseJSON(c.classes_data);
            c.build_data = parseJSON(c.build_data);
            if (c.build_data?.description?.avatarUrl) {
                c.avatar_url = c.build_data.description.avatarUrl;
            }
        });

        res.json(chars);
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Get Single Character By ID
router.get('/:char_id', async (req, res) => {
    try {
        const charId = parseInt(req.params.char_id, 10);
        const userId = req.query.user_id ? parseInt(req.query.user_id, 10) : null;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User ID is required' });
        }

        const [chars] = await pool.query("SELECT * FROM characters WHERE char_id = ? AND user_id = ?", [charId, userId]);
        
        if (chars.length === 0) {
            return res.status(403).json({ error: 'Character not found or you do not have permission to access it.' });
        }

        const char = chars[0];
        const jsonFields = ['classes_data', 'proficiencies_choices', 'spellcasting_data', 'inventory', 'currency', 'hit_dice_current', 'feats_data', 'build_data', 'play_data'];
        
        jsonFields.forEach(f => {
            char[f] = parseJSON(char[f]);
        });

        res.json(char);
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Save Character
router.post('/save', async (req, res) => {
    try {
        const data = req.body;
        const user_id = parseInt(data.user_id || 1);
        const char_name = data.char_name?.trim() || 'Unnamed Hero';
        const species_id = data.species_id || null;
        const lineage_id = data.lineage_id || null;
        const background_id = data.background_id || null;
        const primary_class_id = data.primary_class_id || null;
        const classes_data = stringifyJSON(data.classes_data);
        const char_alignment = data.char_alignment || 'True Neutral';
        const char_level = parseInt(data.char_level || 1);
        const hp_max = parseInt(data.hp_max || 10);
        const hp_current = parseInt(data.hp_current || hp_max);
        const str_score = parseInt(data.str_score || 10);
        const dex_score = parseInt(data.dex_score || 10);
        const con_score = parseInt(data.con_score || 10);
        const int_score = parseInt(data.int_score || 10);
        const wis_score = parseInt(data.wis_score || 10);
        const cha_score = parseInt(data.cha_score || 10);
        const proficiencies_choices = stringifyJSON(data.proficiencies_choices);
        const spellcasting_data = stringifyJSON(data.spellcasting_data);
        const inventory = stringifyJSON(data.inventory);
        const currency = stringifyJSON(data.currency || {cp:0, sp:0, ep:0, gp:0, pp:0});
        const feats_data = stringifyJSON(data.feats_data);
        const hit_dice_current = stringifyJSON(data.hit_dice_current);
        const death_save_success = parseInt(data.death_save_success || 0);
        const death_save_failure = parseInt(data.death_save_failure || 0);
        const inspiration = parseInt(data.inspiration || 0);
        const exhaustion_level = parseInt(data.exhaustion_level || 0);
        const base_ac = parseInt(data.base_ac || 10);
        const build_data = data.build_data ? JSON.stringify(data.build_data) : null;
        const play_data = data.play_data ? JSON.stringify(data.play_data) : null;

        const char_id = parseInt(data.char_id || 0);

        // Validation Rules (TF-VAL-001, TF-VAL-002)
        if (hp_max < 1 || hp_max > 1000) {
            return res.status(400).json({ status: 'error', message: 'Validation Error: ค่า Max HP ต้องอยู่ระหว่าง 1 ถึง 1000' });
        }
        if (char_level < 1 || char_level > 20) {
            return res.status(400).json({ status: 'error', message: 'Validation Error: เลเวลต้องอยู่ระหว่าง 1 ถึง 20' });
        }
        const stats = [str_score, dex_score, con_score, int_score, wis_score, cha_score];
        if (stats.some(score => score < 1 || score > 30)) {
            return res.status(400).json({ status: 'error', message: 'Validation Error: ค่า Ability Score (STR, DEX, etc.) ต้องอยู่ระหว่าง 1 ถึง 30' });
        }

        if (char_id) {
            const [updateResult] = await pool.query(
                `UPDATE characters SET 
                    char_name=?, species_id=?, lineage_id=?, background_id=?, primary_class_id=?, classes_data=?, 
                    char_alignment=?, char_level=?, hp_max=?, hp_current=?, str_score=?, dex_score=?, con_score=?, int_score=?, 
                    wis_score=?, cha_score=?, proficiencies_choices=?, spellcasting_data=?, inventory=?, currency=?, feats_data=?, 
                    hit_dice_current=?, death_save_success=?, death_save_failure=?, inspiration=?, exhaustion_level=?, base_ac=?, 
                    build_data=?, play_data=?, updated_at=NOW() 
                 WHERE char_id=? AND user_id=?`,
                [char_name, species_id, lineage_id, background_id, primary_class_id, classes_data, char_alignment, char_level, 
                 hp_max, hp_current, str_score, dex_score, con_score, int_score, wis_score, cha_score, proficiencies_choices, 
                 spellcasting_data, inventory, currency, feats_data, hit_dice_current, death_save_success, death_save_failure, 
                 inspiration, exhaustion_level, base_ac, build_data, play_data, char_id, user_id]
            );
            
            if (updateResult.affectedRows === 0) {
                return res.status(403).json({ status: 'error', message: 'You do not have permission to update this character.' });
            }
            
            res.json({ status: 'success', message: 'บันทึกอัปเดตตัวละครลงฐานข้อมูลสำเร็จ', char_id });
        } else {
            const [result] = await pool.query(
                `INSERT INTO characters (
                    user_id, char_name, species_id, lineage_id, background_id, primary_class_id, classes_data, char_alignment, 
                    char_level, hp_max, hp_current, str_score, dex_score, con_score, int_score, wis_score, cha_score, 
                    proficiencies_choices, spellcasting_data, inventory, currency, feats_data, hit_dice_current, death_save_success, 
                    death_save_failure, inspiration, exhaustion_level, base_ac, build_data, play_data, created_at, updated_at
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [user_id, char_name, species_id, lineage_id, background_id, primary_class_id, classes_data, char_alignment, char_level, 
                 hp_max, hp_current, str_score, dex_score, con_score, int_score, wis_score, cha_score, proficiencies_choices, 
                 spellcasting_data, inventory, currency, feats_data, hit_dice_current, death_save_success, death_save_failure, 
                 inspiration, exhaustion_level, base_ac, build_data, play_data]
            );
            res.json({ status: 'success', message: 'บันทึกตัวละครใหม่ลงฐานข้อมูลสำเร็จ', char_id: result.insertId });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกตัวละคร: ' + err.message });
    }
});

// Delete Character
router.post('/delete', async (req, res) => {
    try {
        const char_id = parseInt(req.body.char_id || 0);
        const user_id = parseInt(req.body.user_id || 1);
        
        if (!char_id) {
            return res.status(400).json({ status: 'error', message: 'ไม่ระบุรหัสตัวละครที่ต้องการลบ' });
        }

        await pool.query("DELETE FROM characters WHERE char_id = ? AND user_id = ?", [char_id, user_id]);
        res.json({ status: 'success', message: 'ลบตัวละครสำเร็จ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการลบ: ' + err.message });
    }
});

module.exports = router;
