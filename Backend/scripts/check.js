const fs = require('fs');
const code = fs.readFileSync('server.js', 'utf8');
const start = code.indexOf("case 'save_character':");
const end = code.indexOf("case 'delete_character':");
console.log(code.substring(start, end));
