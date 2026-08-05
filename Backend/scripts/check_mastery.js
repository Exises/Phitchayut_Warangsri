const mysql = require('mysql2/promise');

async function checkMastery() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        database: 'dnd_project'
    });
    const [rows] = await pool.query("SELECT class_id, features FROM classes WHERE class_id IN ('barbarian', 'fighter')");
    rows.forEach(r => {
        const feats = JSON.parse(r.features);
        const masteries = feats.filter(f => f.name && f.name.includes('Weapon Mastery'));
        console.log(`\n=== ${r.class_id} ===`);
        console.log(JSON.stringify(masteries, null, 2));
    });
    process.exit();
}
checkMastery();
