const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const line = L[3587];
let out = [];
for (let i = 0; i < line.length; i++) {
  const c = line.charCodeAt(i);
  if (c < 32 || c === 0x7f) out.push('ctrl@' + i + ' code' + c + ' ctx=' + JSON.stringify(line.slice(Math.max(0, i - 25), i + 25)));
}
out.push('len=' + line.length + ' dq=' + (line.match(/"/g) || []).length + ' sq=' + (line.match(/'/g) || []).length);
fs.writeFileSync('_tutorials/_diag.txt', out.join('\n') || 'clean');
console.log('done');
