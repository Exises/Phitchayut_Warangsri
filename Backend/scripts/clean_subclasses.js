const pool = require('./db');

async function removeNonSrdSubclasses() {
    const allowedSubclasses = [
        'berserker', 'lore', 'life', 'land', 'champion', 'open_hand',
        'devotion', 'hunter', 'thief', 'draconic-sorcery', 'fiend-patron', 'evoker'
    ];

    try {
        const [result] = await pool.query(
            "DELETE FROM subclasses WHERE subclass_id NOT IN (?)",
            [allowedSubclasses]
        );
        console.log(`Deleted ${result.affectedRows} subclasses that are not in the SRD 5.1/2024.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

removeNonSrdSubclasses();
