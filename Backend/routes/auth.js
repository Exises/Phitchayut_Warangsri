const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const [existing] = await pool.query("SELECT user_id FROM users WHERE user_email = ? OR user_name = ?", [email, username]);
        if (existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO users (user_name, user_email, user_password, created_at) VALUES (?, ?, ?, NOW())",
            [username, email, hashedPassword]
        );

        res.json({ status: 'success', message: 'สมัครสมาชิกสำเร็จ' });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.query("SELECT * FROM users WHERE user_email = ?", [email]);
        const user = users[0];

        if (user && await bcrypt.compare(password, user.user_password)) {
            delete user.user_password;
            res.json({ status: 'success', user });
        } else {
            res.status(401).json({ status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาใส่ใหม่อีครั้ง' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

router.post('/verify_password', async (req, res) => {
    try {
        const { user_id, password } = req.body;
        const [users] = await pool.query("SELECT user_password FROM users WHERE user_id = ?", [user_id]);
        const user = users[0];

        if (user && await bcrypt.compare(password, user.user_password)) {
            res.json({ status: 'success' });
        } else {
            res.status(401).json({ status: 'error', message: 'รหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

router.post('/update_profile', async (req, res) => {
    try {
        const { user_id, user_name, user_email, bio } = req.body;

        if (!user_id || !user_name || !user_email) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const [existing] = await pool.query("SELECT user_id FROM users WHERE user_name = ? AND user_id != ?", [user_name, user_id]);
        if (existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        }

        await pool.query("UPDATE users SET user_name = ?, user_email = ?, bio = ? WHERE user_id = ?", [user_name, user_email, bio || '', user_id]);

        const [updatedUsers] = await pool.query("SELECT * FROM users WHERE user_id = ?", [user_id]);
        const updatedUser = updatedUsers[0];
        delete updatedUser.user_password;

        res.json({ status: 'success', user: updatedUser });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

router.post('/change_password', async (req, res) => {
    try {
        const { user_id, current_password, new_password } = req.body;

        if (!user_id || !current_password || !new_password) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const [users] = await pool.query("SELECT user_password FROM users WHERE user_id = ?", [user_id]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(current_password, user.user_password))) {
            return res.status(401).json({ status: 'error', message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query("UPDATE users SET user_password = ? WHERE user_id = ?", [hashedPassword, user_id]);

        res.json({ status: 'success', message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

module.exports = router;
