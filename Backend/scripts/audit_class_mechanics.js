const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dnd_project'
    });

    const keywords = ['proficiency', 'bonus to ac', 'cantrip', 'expertise', 'speed', 'advantage'];

    console.log("--- CLASS FEATURES AUDIT ---");
    const [classes] = await pool.query('SELECT class_name, features FROM classes');
    for (const cls of classes) {
        if (!cls.features) continue;
        const feats = JSON.parse(cls.features);
        for (const feat of feats) {
            if (feat.logic) continue; // Already has mechanics
            const desc = (feat.description || feat.desc || '').toLowerCase();
            const matches = keywords.filter(k => desc.includes(k));
            if (matches.length > 0) {
                console.log(`[Class] ${cls.class_name}: ${feat.name} (Matched: ${matches.join(', ')})`);
            }
        }
    }

    console.log("\n--- SUBCLASS FEATURES AUDIT ---");
    const [subclasses] = await pool.query('SELECT subclass_name, class_id, features FROM subclasses');
    for (const sub of subclasses) {
        if (!sub.features) continue;
        let feats = [];
        try {
            feats = JSON.parse(sub.features);
        } catch(e) { continue; }
        
        for (const feat of feats) {
            if (feat.logic && feat.logic.granted_spells) continue; // we just added this
            if (feat.logic) continue; // Already has other mechanics
            
            const desc = (feat.description || feat.desc || '').toLowerCase();
            const matches = keywords.filter(k => desc.includes(k));
            if (matches.length > 0) {
                console.log(`[Subclass - ${sub.class_id}] ${sub.subclass_name}: ${feat.name} (Matched: ${matches.join(', ')})`);
            }
        }
    }

    pool.end();
}

run().catch(console.error);
