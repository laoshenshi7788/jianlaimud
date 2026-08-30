const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const out = [];
for (let i = 3370; i < 3400 && i < L.length; i++) out.push((i + 1) + ': ' + L[i].trim().slice(0, 140));
// 年龄修正行
L.forEach((l, i) => { if (/ageAdj/.test(l)) out.push('AGE ' + (i + 1) + ': ' + l.trim().slice(0, 120)); });
require('fs').writeFileSync('_tutorials/_view.txt', out.join('\n'));
console.log('done');
