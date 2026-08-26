const fs = require('fs');
const md = fs.readFileSync('DND/classes.md', 'utf8');
const start = md.indexOf('### Eldritch Invocation Options');
const end = md.indexOf('### Warlock Spell List');
const chunk = md.substring(start, end);
const parts = chunk.split(/#### /).slice(1);

const invs = parts.map(p => {
  const lines = p.trim().split('\n');
  const name = lines[0].trim();
  let prereq = '';
  let descLines = lines.slice(1).filter(l => l.trim() !== '');
  if (descLines[0] && descLines[0].trim().startsWith('_Prerequisite:')) {
    prereq = descLines[0].trim().replace(/^_|_$/g, '');
    descLines = descLines.slice(1);
  }
  const desc = descLines.join(' ').replace(/_([^_]+)_/g, '<em>$1</em>').trim();
  return { name, prereq, desc };
});

fs.writeFileSync('scratch/warlock_invocations.json', JSON.stringify(invs, null, 2));
console.log('Successfully generated', invs.length, 'invocations');
