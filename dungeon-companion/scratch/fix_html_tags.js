const fs = require('fs');
let code = fs.readFileSync('./src/components/workshop/steps/Step7Review.jsx', 'utf-8');

// Fix title={sp.spellDesc || ''}
code = code.replace(/title={sp\.spellDesc \|\| ''}/g, 	itle={(sp.spellDesc || '').replace(/<[^>]+>/g, '')});
// Fix title={spell.spell_desc || ''}
code = code.replace(/title={spell\.spell_desc \|\| ''}/g, 	itle={(spell.spell_desc || '').replace(/<[^>]+>/g, '')});

// Fix {sp.spellDesc || 'No description available for this spell.'}
code = code.replace(
  /\{sp\.spellDesc \|\| 'No description available for this spell\.'\}/g,
  <div dangerouslySetInnerHTML={{ __html: sp.spellDesc || 'No description available for this spell.' }} />
);

// Fix {spell.spell_desc} inside the modal
code = code.replace(
  /\{spell\.spell_desc\}/g,
  <div dangerouslySetInnerHTML={{ __html: spell.spell_desc }} />
);

fs.writeFileSync('./src/components/workshop/steps/Step7Review.jsx', code);
console.log('Fixed HTML tags in spell descriptions');
