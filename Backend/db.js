const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // ปรับแก้ password ตรงนี้หาก XAMPP ของคุณมีการตั้งรหัสผ่านไว้
  database: 'dnd_project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
