const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const out = [];
L.forEach((l, i) => {
  if (/function computeGridLayout|_freeNear|freeSlot|function bakedPos|BAKED_MAP_POS\[|function layoutFallback/.test(l)) {
    out.push((i + 1) + ': ' + l.trim().slice(0, 120));
  }
});
const i0 = L.findIndex(l => l.indexOf('function computeGridLayout') > -1);
for (let j = i0; j < i0 + 80 && j < L.length; j++) out.push('C' + (j + 1) + ': ' + L[j].slice(0, 118));
require('fs').writeFileSync('_tutorials/_grid.txt', out.join('\n'));
console.log('ok');
