// 查找新手引导相关标识符
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const hits = {};
lines.forEach((l, i) => {
  const m = l.match(/[A-Za-z_$][A-Za-z0-9_$]*]*(tut|Tut|TUT)[A-Za-z0-9_$]*|\bnewbie\b|\bguide\b|\b引导\b/g);
  if (m) m.forEach(k => {
    hits[k] = hits[k] || [];
    if (hits[k].length < 4) hits[k].push(i + 1);
  });
});
Object.keys(hits).sort().forEach(k => console.log(k + '  @ ' + hits[k].join(',')));
console.log('---done---');
