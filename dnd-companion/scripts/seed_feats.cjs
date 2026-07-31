const fs = require('fs');
const path = require('path');

const markdownPath = path.join(__dirname, '../DND/feats.md');

function generateId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseFeatsMarkdown(content) {
    const lines = content.split('\n');
    const feats = [];
    let currentFeat = null;
    let currentType = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('### ')) {
            currentType = line.substring(4).trim().replace(' Feats', ''); // e.g., "Origin", "General"
            continue;
        }

        if (line.startsWith('#### ')) {
            if (currentFeat) {
                feats.push(currentFeat);
            }
            const featName = line.substring(5).trim();
            currentFeat = {
                id: generateId(featName),
                name: featName,
                type: currentType + ' Feat',
                prerequisite: null,
                desc: [],
                stat_options: null
            };
            continue;
        }

        if (currentFeat) {
            if (line.startsWith('_') && line.endsWith('_') && !currentFeat.desc.length && !currentFeat.parsedMeta) {
                // Parse metadata like "_General Feat (Prerequisite: Level 4+)_"
                const metaRaw = line.substring(1, line.length - 1);
                currentFeat.parsedMeta = true;
                
                const parenMatch = metaRaw.match(/\(Prerequisite:\s*(.*?)\)/);
                if (parenMatch) {
                    currentFeat.prerequisite = parenMatch[1].trim();
                }
                
                // If the type inside matches the heading, we can refine it
                const typeMatch = metaRaw.split(' (')[0].trim();
                if (typeMatch) currentFeat.type = typeMatch;
                continue;
            }

            if (line) {
                currentFeat.desc.push(line);
            }
        }
    }
    
    if (currentFeat) feats.push(currentFeat);

    // Process descriptions and determine stat_options
    feats.forEach(feat => {
        const fullDesc = feat.desc.join('\n\n');
        
        // Convert markdown formatting to HTML for storing
        feat.descHtml = fullDesc
            .replace(/_([^_]+)_/g, '<em>$1</em>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            
        // Look for ASI logic
        if (feat.name === 'Ability Score Improvement') {
            feat.stat_options = { type: 'asi', points: 2, max: 20 };
        } else {
            // Check for Half Feats / Epic Boons
            const matchAny = fullDesc.match(/Increase one ability score of your choice by (\d+), to a maximum of (\d+)/i);
            const matchSpecific = fullDesc.match(/Increase your ([a-zA-Z, ]+?) score by (\d+), to a maximum of (\d+)/i);
            
            if (matchAny) {
                feat.stat_options = {
                    type: 'half',
                    choices: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
                    points: parseInt(matchAny[1]),
                    max: parseInt(matchAny[2])
                };
            } else if (matchSpecific) {
                const statString = matchSpecific[1].toLowerCase();
                const points = parseInt(matchSpecific[2]);
                const max = parseInt(matchSpecific[3]);
                
                const allStats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
                const shortStats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
                
                const choices = [];
                allStats.forEach((st, idx) => {
                    if (statString.includes(st)) choices.push(shortStats[idx]);
                });
                
                if (choices.length > 0) {
                    feat.stat_options = {
                        type: 'half',
                        choices: choices,
                        points: points,
                        max: max
                    };
                }
            }
        }
    });

    return feats;
}

function escapeSql(str) {
    if (!str) return 'NULL';
    return "'" + str.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

function main() {
    try {
        const markdown = fs.readFileSync(markdownPath, 'utf8');
        const feats = parseFeatsMarkdown(markdown);
        
        console.log(`Parsed ${feats.length} feats from markdown.`);
        
        let sql = 'USE dnd_project;\n';
        sql += 'SET FOREIGN_KEY_CHECKS = 0;\n';
        sql += 'TRUNCATE TABLE feats;\n\n';
        
        for (const feat of feats) {
            const statJson = feat.stat_options ? escapeSql(JSON.stringify(feat.stat_options)) : 'NULL';
            const prerequisite = feat.prerequisite ? escapeSql(feat.prerequisite) : 'NULL';
            const featDesc = escapeSql(feat.descHtml);
            
            sql += `INSERT INTO feats (feat_id, feat_name, feat_type, prerequisite, feat_desc, stat_options, is_homebrew) VALUES ` +
                   `(${escapeSql(feat.id)}, ${escapeSql(feat.name)}, ${escapeSql(feat.type)}, ${prerequisite}, ${featDesc}, ${statJson}, 0);\n`;
        }
        
        sql += '\nSET FOREIGN_KEY_CHECKS = 1;\n';
        
        fs.writeFileSync(path.join(__dirname, 'seed_feats.sql'), sql);
        console.log('Successfully generated seed_feats.sql!');
        
    } catch (err) {
        console.error('Error during seeding:', err);
    }
}

main();
