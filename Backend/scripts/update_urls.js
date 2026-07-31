const pool = require('./db');

async function updateUrls() {
    try {
        const [result] = await pool.query("UPDATE users SET avatar_url = REPLACE(avatar_url, 'http://localhost/dnd-companion/uploads', 'http://localhost:5000/uploads') WHERE avatar_url LIKE '%http://localhost/dnd-companion/uploads%'");
        console.log('Updated rows:', result.affectedRows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateUrls();
