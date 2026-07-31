const pool = require('./db');

async function checkSubclasses() {
    try {
        const [subclasses] = await pool.query("SELECT subclass_id, subclass_name, class_id FROM subclasses");
        const [classes] = await pool.query("SELECT class_id, class_name FROM classes");
        
        const classMap = {};
        classes.forEach(c => classMap[c.class_id] = c.class_name);
        
        const result = subclasses.map(s => ({
            id: s.subclass_id,
            name: s.subclass_name,
            class: classMap[s.class_id] || 'Unknown'
        }));
        
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSubclasses();
