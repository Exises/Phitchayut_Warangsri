const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dnd_project'
    });

    const [subclasses] = await pool.query("SELECT subclass_id, subclass_name, class_id, features FROM subclasses WHERE class_id IN ('paladin', 'ranger')");
    
    // Helper to extract spell names from <td> elements in the description
    const extractSpellsFromHtml = (html) => {
        const spells = [];
        // Match <td>Spell 1, Spell 2</td>
        const tdRegex = /<td>([^<]+)<\/td>/g;
        let match;
        
        while ((match = tdRegex.exec(html)) !== null) {
            const content = match[1].trim();
            // Ignore if it's just a level like '3rd', '5th'
            if (/^\d+(st|nd|rd|th)?$/.test(content)) continue;
            
            // Split by comma
            const spellNames = content.split(',').map(s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-and-/g, '-and-').replace(/--/g, '-'));
            spells.push(...spellNames);
        }
        return spells;
    };

    let updatedCount = 0;

    for (const sub of subclasses) {
        if (!sub.features) continue;
        let features = [];
        try {
            features = JSON.parse(sub.features);
        } catch (e) {
            continue;
        }

        let modified = false;

        for (let i = 0; i < features.length; i++) {
            const feat = features[i];
            // Check if feature is named "Oath of X Spells" or "X Magic"
            if (feat.name.toLowerCase().includes('spells') || feat.name.toLowerCase().includes('magic')) {
                const extractedSpells = extractSpellsFromHtml(feat.description || feat.desc || '');
                if (extractedSpells.length > 0) {
                    // Update logic
                    feat.logic = feat.logic || {};
                    feat.logic.granted_spells = extractedSpells;
                    modified = true;
                    console.log(`Updated ${sub.subclass_name} - ${feat.name} with ${extractedSpells.length} spells:`, extractedSpells);
                }
            }
        }

        if (modified) {
            await pool.query('UPDATE subclasses SET features = ? WHERE subclass_id = ?', [JSON.stringify(features), sub.subclass_id]);
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} subclasses.`);
    pool.end();
}

run().catch(console.error);
