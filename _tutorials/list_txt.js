const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.txt'));
console.log(JSON.stringify(files));
const s = fs.readFileSync('参考.txt', 'utf8');
const idx = s.indexOf('境界');
console.log('idx=' + idx);
if (idx > -1) console.log(s.slice(Math.max(0, idx - 200), idx + 2200));
