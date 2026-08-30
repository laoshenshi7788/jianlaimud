// 行级扫描武器定义
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const out = [];
lines.forEach(l => {
  const m = l.match(/ITEMS\['([^']+)'\]=\{(.*)/);
  if (!m) return;
  if (!/type:\s*'weapon'/.test(m[2])) return;
  const q = (m[2].match(/quality:\s*'([^']+)'/) || [])[1] || '';
  const w = (m[2].match(/wclass:\s*'([^']+)'/) || [])[1] || '';
  const pr = (m[2].match(/price:\s*(\d+)/) || [])[1] || '';
  const lvl = (m[2].match(/reqLevel:\s*(\d+)/) || [])[1] || '';
  out.push(m[1] + ' | ' + q + ' | wclass:' + w + ' | 价' + pr + (lvl ? ' | 需' + lvl + '级' : ''));
});
console.log(out.join('\n'));
console.log('total: ' + out.length);
