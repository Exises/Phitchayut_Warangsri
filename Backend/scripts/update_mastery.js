const mysql = require('mysql2/promise');

async function updateMastery() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        database: 'dnd_project'
    });

    try {
        const [rows] = await pool.query("SELECT class_id, features FROM classes WHERE class_id IN ('barbarian', 'fighter')");
        
        for (const row of rows) {
            let features = JSON.parse(row.features);
            
            // Remove any existing Weapon Mastery for level > 1 just in case
            features = features.filter(f => !(f.name.includes('Weapon Mastery') && f.level > 1));
            
            if (row.class_id === 'barbarian') {
                const addFeats = [4, 10].map(lvl => ({
                    level: lvl,
                    name: "Weapon Mastery",
                    description: "<p style='margin-bottom: 15px; line-height: 1.6;'>You gain the ability to use the mastery properties of 1 more kind of Simple or Martial Melee weapon of your choice.</p>",
                    desc: "<p style='margin-bottom: 15px; line-height: 1.6;'>You gain the ability to use the mastery properties of 1 more kind of Simple or Martial Melee weapon of your choice.</p>",
                    mechanics: null,
                    modifiers: []
                }));
                features.push(...addFeats);
            } else if (row.class_id === 'fighter') {
                const addFeats = [4, 10, 16].map(lvl => ({
                    level: lvl,
                    name: "Weapon Mastery",
                    description: "<p style='margin-bottom: 15px; line-height: 1.6;'>You gain the ability to use the mastery properties of 1 more kind of Simple or Martial weapon of your choice.</p>",
                    desc: "<p style='margin-bottom: 15px; line-height: 1.6;'>You gain the ability to use the mastery properties of 1 more kind of Simple or Martial weapon of your choice.</p>",
                    mechanics: null,
                    modifiers: []
                }));
                features.push(...addFeats);
            }
            
            // Sort by level
            features.sort((a, b) => a.level - b.level);
            
            await pool.query("UPDATE classes SET features = ? WHERE class_id = ?", [JSON.stringify(features), row.class_id]);
            console.log(`Updated ${row.class_id}`);
        }
        
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
updateMastery();
