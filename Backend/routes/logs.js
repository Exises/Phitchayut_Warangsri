const express = require('express');
const pool = require('../db');

const router = express.Router();

router.post('/add', async (req, res) => {
    try {
        const data = req.body;
        const char_id = parseInt(data.char_id || 0);
        const user_id = parseInt(data.user_id || 1);
        const category = data.category || 'gameplay';
        const action_type = data.action_type || 'GENERAL';
        const log_text_th = data.log_text_th?.trim() || '';
        const metadata_json = data.metadata_json ? JSON.stringify(data.metadata_json) : null;

        if (!char_id || !log_text_th) {
            return res.status(400).json({ status: 'error', message: 'ข้อมูล char_id หรือ log_text_th ไม่ถูกต้อง' });
        }

        const [result] = await pool.query(
            "INSERT INTO character_logs (char_id, user_id, category, action_type, log_text_th, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [char_id, user_id, category, action_type, log_text_th, metadata_json]
        );

        res.json({ status: 'success', message: 'บันทึก Log สำเร็จ', log_id: result.insertId });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก Log: ' + err.message });
    }
});

router.all('/get', async (req, res) => {
    try {
        const char_id = parseInt(req.body?.char_id || req.query?.char_id || 0);
        const category = req.body?.category || req.query?.category || 'all';
        
        if (!char_id) {
            return res.json([]);
        }

        let logs;
        if (category !== 'all' && ['gameplay', 'inventory', 'build'].includes(category)) {
            [logs] = await pool.query("SELECT * FROM character_logs WHERE char_id = ? AND category = ? ORDER BY created_at DESC LIMIT 100", [char_id, category]);
        } else {
            [logs] = await pool.query("SELECT * FROM character_logs WHERE char_id = ? ORDER BY created_at DESC LIMIT 100", [char_id]);
        }

        logs.forEach(l => {
            if (l.metadata_json && typeof l.metadata_json === 'string') {
                try {
                    l.metadata_json = JSON.parse(l.metadata_json);
                } catch (e) {
                    // keep as string
                }
            }
        });

        res.json(logs);
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/clear', async (req, res) => {
    try {
        const char_id = parseInt(req.body.char_id || 0);
        const user_id = parseInt(req.body.user_id || 1);
        const category = req.body.category || 'all';
        
        if (!char_id) {
            return res.status(400).json({ status: 'error', message: 'ข้อมูล char_id ไม่ถูกต้อง' });
        }

        if (category !== 'all' && ['gameplay', 'inventory', 'build'].includes(category)) {
            await pool.query("DELETE FROM character_logs WHERE char_id = ? AND user_id = ? AND category = ?", [char_id, user_id, category]);
        } else {
            await pool.query("DELETE FROM character_logs WHERE char_id = ? AND user_id = ?", [char_id, user_id]);
        }

        res.json({ status: 'success', message: 'ล้างประวัติ Log สำเร็จ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
