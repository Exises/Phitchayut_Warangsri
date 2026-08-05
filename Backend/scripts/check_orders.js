const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', database: 'dnd_project' });
    const [rows] = await pool.query("SELECT class_id, features FROM classes WHERE class_id IN ('cleric', 'druid')");
    rows.forEach(r => {
        const feats = JSON.parse(r.features);
        console.log(`\n=== ${r.class_id} ===`);
        console.log(JSON.stringify(feats.filter(f => f.name.includes('Order')), null, 2));
    });
    process.exit();
}
run();
