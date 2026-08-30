// 列出 ITEMS 中的兵器（按 wclass / 名字推断）
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');
// 抓 ITEMS['x']={...} 定义行，筛 weapon
const re = /ITEMS\['([^']+)'\]=\{([^}]*)\}/g;
let m;
const out = [];
while ((m = re.exec(src))) {
  const name = m[1], body = m[2];
  if (/type:'weapon'|type:' Weapon'/.test(body) || /wclass/.test(body)) {
    const q = (body.match(/quality:'([^']+)'/) || [])[1] || '';
    const w = (body.match(/wclass:'([^']+)'/) || [])[1] || '';
    const pr = (body.match(/price:(\d+)/) || [])[1] || '';
    out.push(name + ' | ' + q + ' | ' + w + ' | ' + pr);
  }
}
console.log(out.join('\n'));
console.log('total: ' + out.length);
