const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
const lines = f.split(/\r?\n/);
// openBackpack 全文
const bi = lines.findIndex(l => l.includes('function openBackpack'));
if (bi > -1) {
  console.log('--- openBackpack (' + (bi + 1) + ') ---');
  for (let i = bi; i < Math.min(bi + 80, lines.length); i++) console.log((i + 1) + '\t' + lines[i]);
}
// 任务发放机制
const qi = lines.findIndex(l => l.includes('QUESTS['));
console.log('--- QUESTS 引用 ---');
lines.forEach((l, i) => { if (/QUESTS\[|QUESTS\b/.test(l) && i !== 3663) console.log((i + 1) + '\t' + l.trim().slice(0, 110)); });
// 装备迁移（旧档补槽）
lines.forEach((l, i) => {
  if (/head:null|hands:null|waist:null|feet:null/.test(l) && i !== 4233) console.log('MIG ' + (i + 1) + '\t' + l.trim().slice(0, 130));
});
