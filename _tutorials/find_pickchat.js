const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const i = L.findIndex(l => l.indexOf('function pickChat') > -1);
const out = [];
if (i > -1) for (let j = i; j < i + 40; j++) out.push((j + 1) + ': ' + L[j].trim().slice(0, 125));
else out.push('pickChat not found');
// 另找低好感防备文案池
L.forEach((l, k) => {
  if (/防备|戒备的|不太熟|不熟|外乡人|passersby|WARY_CHAT|LOW_AFF/.test(l) && /pool|CHAT|\[/.test(l)) out.push('P' + (k + 1) + ': ' + l.trim().slice(0, 110));
});
require('fs').writeFileSync('_tutorials/_pc.txt', out.join('\n'));
console.log('ok');
