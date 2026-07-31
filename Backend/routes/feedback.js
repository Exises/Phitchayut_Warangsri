const express = require('express');
const pool = require('../db');

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

router.post('/submit', async (req, res) => {
    try {
        const { user_id, user_name, rating, category, title, priority, device_info, message } = req.body;

        if (!user_id || !title || !category || !message) {
            return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน' });
        }

        await pool.query(
            "INSERT INTO feedbacks (user_id, user_name, rating, category, title, priority, device_info, message, status, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 0)",
            [user_id, user_name, rating || 5, category, title, priority || 'medium', device_info || 'Desktop', message]
        );

        res.json({ status: 'success', message: 'ส่งข้อเสนอแนะสำเร็จ ขอบคุณสำหรับความเห็นของคุณ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด: ' + err.message });
    }
});

router.post('/get', checkAdmin, async (req, res) => {
    try {
        const [feedbacks] = await pool.query(`
            SELECT f.*, u.user_name as acc_user_name, u.user_email 
            FROM feedbacks f 
            LEFT JOIN users u ON f.user_id = u.user_id 
            ORDER BY f.created_at DESC
        `);
        res.json({ status: 'success', feedbacks });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/get_user', async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        const [feedbacks] = await pool.query(`
            SELECT * FROM feedbacks 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [user_id]);
        res.json({ status: 'success', feedbacks });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/update', checkAdmin, async (req, res) => {
    try {
        const { feedback_id, status, admin_response, priority, is_read } = req.body;
        
        if (!feedback_id) {
             return res.status(400).json({ status: 'error', message: 'ไม่พบรหัสข้อเสนอแนะ' });
        }

        let query = "UPDATE feedbacks SET ";
        let params = [];
        
        if (status) {
            query += "status = ?, ";
            params.push(status);
        }
        if (admin_response !== undefined) {
            query += "admin_response = ?, ";
            params.push(admin_response);
        }
        if (priority !== undefined) {
            query += "priority = ?, ";
            params.push(priority);
        }
        if (is_read !== undefined) {
            query += "is_read = ?, ";
            params.push(is_read);
        }
        
        // Remove trailing comma and space
        if (params.length > 0) {
            query = query.slice(0, -2);
            query += " WHERE feedback_id = ?";
            params.push(feedback_id);
            await pool.query(query, params);
            res.json({ status: 'success', message: 'อัปเดตสถานะสำเร็จ' });
        } else {
            res.status(400).json({ status: 'error', message: 'ไม่มีข้อมูลให้อัปเดต' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/mark_read', checkAdmin, async (req, res) => {
    try {
        const { feedback_id } = req.body;
        if (!feedback_id) return res.status(400).json({ status: 'error', message: 'ไม่พบรหัส' });
        await pool.query("UPDATE feedbacks SET is_read = 1 WHERE feedback_id = ?", [feedback_id]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/delete', checkAdmin, async (req, res) => {
    try {
        const { feedback_id } = req.body;
        
        if (!feedback_id) {
             return res.status(400).json({ status: 'error', message: 'ไม่พบรหัสข้อเสนอแนะ' });
        }

        await pool.query("DELETE FROM feedbacks WHERE feedback_id = ?", [feedback_id]);
        res.json({ status: 'success', message: 'ลบข้อเสนอแนะสำเร็จ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
