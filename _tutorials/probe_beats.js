const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const i0 = L.findIndex(l => l.indexOf('CHAPTER_BEATS') > -1 && /const CHAPTER_BEATS/.test(l));
console.log('CHAPTER_BEATS at ' + (i0 + 1));
const out = [];
for (let i = i0; i < i0 + 120 && i < L.length; i++) {
  out.push((i + 1) + ': ' + L[i].trim().slice(0, 110));
  if (i > i0 + 3 && /^\];/.test(L[i].trim())) break;
}
require('fs').writeFileSync('_tutorials/_beats.txt', out.join('\n'));
console.log('written');
