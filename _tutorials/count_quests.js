const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const i0 = s.indexOf('const QUESTS_HUB=');
const i1 = s.indexOf('//<<QHUB-END>>', i0);
const hub = s.slice(i0, i1);
const n = (hub.match(/Object\.assign\(/g) || []).length;
// 分类统计
const cats = {};
const re = /"cat":"([^"]+)"/g;
let m;
while ((m = re.exec(hub))) cats[m[1]] = (cats[m[1]] || 0) + 1;
console.log('QUESTS_HUB total: ' + n);
console.log(JSON.stringify(cats));
// 原 QUESTS 条目数（静态定义区）
const q0 = s.indexOf('const QUESTS = {');
const q1 = s.indexOf('\n};', q0);
console.log('原 QUESTS 区（含 EXTRA 合并前）: 约 ' + ((s.slice(q0, q1).match(/^  '/gm) || []).length) + ' 条');
