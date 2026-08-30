const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const out = [];
L.forEach((l, i) => {
  if (/function affMulFor|const AFF_TIERS|function affTier|npc\.aff\b|\.aff\b.*\|\|\s*0.*base|function gainAff/.test(l)) {
    out.push((i + 1) + ': ' + l.trim().slice(0, 125));
  }
});
const i0 = L.findIndex(l => /function affMulFor/.test(l));
if (i0 > -1) for (let j = i0; j < i0 + 14; j++) out.push('M' + (j + 1) + ': ' + L[j].trim().slice(0, 130));
const i1 = L.findIndex(l => /const AFF_TIERS/.test(l));
if (i1 > -1) { out.push('---TIERS---'); for (let j = i1; j < i1 + 8; j++) out.push('T' + (j + 1) + ': ' + L[j].trim().slice(0, 130)); }
const i2 = L.findIndex(l => /function gainAff/.test(l));
if (i2 > -1) { out.push('---gainAff---'); for (let j = i2; j < i2 + 14; j++) out.push('G' + (j + 1) + ': ' + L[j].trim().slice(0, 130)); }
require('fs').writeFileSync('_tutorials/_aff.txt', out.join('\n'));
console.log('ok');
