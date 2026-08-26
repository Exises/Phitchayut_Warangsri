const fs = require('fs');
const path = require('path');

const targetFe = 'fe=()=>{let _=p.size,t=.5,f=_*yt/2-t,g=_*yt/-2+t,j=_/2-t,V=_/-2+t,X=dt(f,g,Math.random()),U=dt(j,V,Math.random()),G=Math.round(Math.random()),v=Math.round(Math.random()),Q=Math.round(Math.random());p.startPosition=[Q?X:v?g:f,p.startingHeight,Q?G?V:j:U]}';
const newFe = 'fe=()=>{let _=p.size,t=.5,f=_*yt/2-t,V=_/-2+t;p.startPosition=[f-Math.random()*1.5,p.startingHeight,V+Math.random()*1.5]}';

const filesToPatch = [
  'node_modules/@3d-dice/dice-box/dist/dice-box.es.js',
  'node_modules/@3d-dice/dice-box/dist/dice-box.es.min.js'
];

console.log('[patch-dice-box] Checking @3d-dice/dice-box worker physics configuration...');

filesToPatch.forEach(relPath => {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`[patch-dice-box] File not found: ${relPath}`);
    return;
  }

  const code = fs.readFileSync(fullPath, 'utf8');
  
  // Match base64 string
  const base64Regex = /(ml = "|["'])([A-Za-z0-9+/=]{1000,})("|["'])/;
  const match = code.match(base64Regex);
  
  if (!match) {
    console.log(`[patch-dice-box] Could not locate base64 physics worker inside ${relPath}`);
    return;
  }

  const prefix = match[1];
  const originalBase64 = match[2];
  const suffix = match[3];

  const originalWorkerCode = Buffer.from(originalBase64, 'base64').toString('utf8');

  if (originalWorkerCode.includes(newFe)) {
    console.log(`[patch-dice-box] ${relPath} is already patched with bottom-right trajectory.`);
    return;
  }

  const oldPatchFe = 'fe=()=>{let _=p.size,t=.5,g=_*yt/-2+t,j=_/2-t;p.startPosition=[g+Math.random()*1.5,p.startingHeight,j-Math.random()*1.5]}';

  let newWorkerCode = originalWorkerCode;
  if (originalWorkerCode.includes(targetFe)) {
    newWorkerCode = originalWorkerCode.replace(targetFe, newFe);
  } else if (originalWorkerCode.includes(oldPatchFe)) {
    newWorkerCode = originalWorkerCode.replace(oldPatchFe, newFe);
  } else {
    console.log(`[patch-dice-box] Target fe() function not found precisely in ${relPath}. No changes made.`);
    return;
  }

  const newBase64 = Buffer.from(newWorkerCode, 'utf8').toString('base64');

  const newCode = code.replace(prefix + originalBase64 + suffix, prefix + newBase64 + suffix);
  fs.writeFileSync(fullPath, newCode, 'utf8');
  console.log(`[patch-dice-box] Successfully patched ${relPath} -> Dice will roll from bottom-right corner.`);

});

console.log('[patch-dice-box] Copying dice themes to public/assets/dice-box/themes...');
const themesSourcePath = path.resolve(__dirname, '..', 'node_modules/@3d-dice/dice-themes/themes');
const themesDestPath = path.resolve(__dirname, '..', 'public/assets/dice-box/themes');

if (fs.existsSync(themesSourcePath)) {
  if (!fs.existsSync(themesDestPath)) {
    fs.mkdirSync(themesDestPath, { recursive: true });
  }
  
  const themes = fs.readdirSync(themesSourcePath);
  themes.forEach(theme => {
    const src = path.join(themesSourcePath, theme);
    const dest = path.join(themesDestPath, theme);
    
    // Simple recursive copy
    const copyRecursiveSync = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(childItemName => {
          copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    
    copyRecursiveSync(src, dest);
  });
  console.log('[patch-dice-box] Successfully copied dice themes.');
} else {
  console.log('[patch-dice-box] @3d-dice/dice-themes not found in node_modules.');
}
