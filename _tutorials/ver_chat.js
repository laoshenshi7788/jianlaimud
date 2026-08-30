const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const i = s.indexOf('const CHAT_POOL={');
const j = s.indexOf('// —— 低好感提防话', i);
const out = 'pool block chars: ' + (j - i) + '\n' + s.slice(i, i + 600);
fs.writeFileSync('_tutorials/_vchat.txt', out);
console.log('ok');
