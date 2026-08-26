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

// ==========================================
// Forgot Password Flow
// ==========================================
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ตั้งค่า Transport สำหรับส่งอีเมล
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // ใช้เซิร์ฟเวอร์ของ Gmail/Google Workspace (ใช้ได้กับ @ku.th ถ้าเป็น Google Workspace)
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// 1. ขอรีเซ็ตรหัสผ่าน (ส่งอีเมล)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ status: 'error', message: 'กรุณากรอกอีเมล' });

        const [users] = await pool.query("SELECT user_id, user_name FROM users WHERE user_email = ?", [email]);
        if (users.length === 0) {
            // เพื่อความปลอดภัย มักจะไม่บอกตรงๆ ว่าไม่มีอีเมลนี้ในระบบ
            return res.json({ status: 'success', message: 'หากอีเมลนี้มีอยู่ในระบบ ลิงก์สำหรับรีเซ็ตรหัสผ่านจะถูกส่งไป' });
        }

        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 3600000); // 1 ชั่วโมง

        await pool.query(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?",
            [resetToken, tokenExpires, user.user_id]
        );

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"D&D Companion" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'รีเซ็ตรหัสผ่านบัญชี D&D Companion ของคุณ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #711a19; text-align: center;">D&D Companion</h2>
                    <p>สวัสดีคุณ <strong>${user.user_name}</strong>,</p>
                    <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านบัญชีของคุณ หากคุณเป็นคนดำเนินการคำขอนี้ กรุณาคลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #711a19; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">รีเซ็ตรหัสผ่าน</a>
                    </div>
                    <p style="color: #555; font-size: 0.9em;">หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
                    <p style="word-break: break-all; font-size: 0.85em; color: #0066cc;">${resetLink}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 0.85em; color: #888;">ลิงก์นี้จะมีอายุ 1 ชั่วโมง หากคุณไม่ได้ร้องขอการรีเซ็ตรหัสผ่าน โปรดเพิกเฉยต่ออีเมลฉบับนี้</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Mail Error:", error);
                return res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการส่งอีเมล' });
            }
            res.json({ status: 'success', message: 'ลิงก์สำหรับรีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว (โปรดเช็คในโฟลเดอร์จดหมายขยะด้วย)' });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

// 2. ยืนยันรหัสผ่านใหม่ด้วย Token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, new_password } = req.body;
        
        if (!token || !new_password) {
            return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน' });
        }

        const [users] = await pool.query(
            "SELECT user_id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()", 
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ status: 'error', message: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือหมดอายุไปแล้ว (เกิน 1 ชม.)' });
        }

        const user_id = users[0].user_id;
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // อัปเดตรหัสผ่านใหม่และลบ Token ทิ้ง
        await pool.query(
            "UPDATE users SET user_password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?",
            [hashedPassword, user_id]
        );

        res.json({ status: 'success', message: 'รีเซ็ตรหัสผ่านใหม่เรียบร้อยแล้ว' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

module.exports = router;
