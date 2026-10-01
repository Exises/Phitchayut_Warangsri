const fs = require('fs');
let content = fs.readFileSync('src/components/WorkshopCharacterBuilder.jsx', 'utf8');

// The garbled text might be read as strange characters. 
// We will replace them by looking for the English word (Species) which survived.

content = content.replace(/alert\(".*?\s*\(Species\)\s*.*?"\);/g, 'alert("กรุณาเลือกเผ่าพันธุ์ (Species) ของคุณ");');

// We also have one with "ก่อน" (first)
content = content.replace(/alert\(".*?\s*\(Species\)\s*.*?"\);/, 'alert("กรุณาเลือกเผ่าพันธุ์ (Species) ก่อน");'); 
// Wait, regex with 'g' will replace both with the same text. 
// Let's do it based on location.
