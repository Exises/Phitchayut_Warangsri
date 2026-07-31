const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/users/');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const userId = req.body.user_id || 'unknown';
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `user_${userId}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ (JPG, PNG, GIF, WebP) เท่านั้น'), false);
    }
};

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter 
});

router.post('/avatar', upload.single('avatar'), async (req, res) => {
    try {
        const user_id = req.body.user_id;

        if (!user_id || !req.file) {
            return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน' });
        }

        // 1. Get old avatar to delete
        const [users] = await pool.query("SELECT avatar_url FROM users WHERE user_id = ?", [user_id]);
        if (users.length > 0 && users[0].avatar_url) {
            const oldAvatar = users[0].avatar_url;
            const oldFileName = path.basename(oldAvatar);
            const oldFilePath = path.join(__dirname, '../uploads/users/', oldFileName);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // 2. Generate new URL and update database
        // Use http://localhost:5000 for the Node server instead of the PHP one
        const newFileName = req.file.filename;
        const avatar_url = `http://localhost:5000/uploads/users/${newFileName}`;

        await pool.query("UPDATE users SET avatar_url = ? WHERE user_id = ?", [avatar_url, user_id]);

        // 3. Get updated user
        const [updatedUsers] = await pool.query("SELECT * FROM users WHERE user_id = ?", [user_id]);
        const updatedUser = updatedUsers[0];
        delete updatedUser.user_password;

        res.json({
            status: 'success',
            message: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
            avatar_url,
            user: updatedUser
        });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

router.post('/delete_avatar', async (req, res) => {
    try {
        const user_id = req.body.user_id;

        if (!user_id) {
            return res.status(400).json({ status: 'error', message: 'ไม่พบข้อมูลผู้ใช้' });
        }

        // 1. Get old avatar to delete
        const [users] = await pool.query("SELECT avatar_url FROM users WHERE user_id = ?", [user_id]);
        if (users.length > 0 && users[0].avatar_url) {
            const avatarUrl = users[0].avatar_url;
            const fileName = path.basename(avatarUrl);
            const filePath = path.join(__dirname, '../uploads/users/', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // 2. Update database
        await pool.query("UPDATE users SET avatar_url = NULL WHERE user_id = ?", [user_id]);

        // 3. Get updated user
        const [updatedUsers] = await pool.query("SELECT * FROM users WHERE user_id = ?", [user_id]);
        const updatedUser = updatedUsers[0];
        delete updatedUser.user_password;

        res.json({
            status: 'success',
            message: 'ลบรูปโปรไฟล์สำเร็จ',
            user: updatedUser
        });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'ระบบขัดข้อง: ' + err.message });
    }
});

module.exports = router;
