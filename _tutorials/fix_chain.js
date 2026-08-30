const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);
// 1) 删 QUESTS_EXTRA 里的「失窃的剑胚」条目（从条目行到 '剑炉开炉' 行之前）
const qi = lines.findIndex(l => l.includes("'剑炉开炉':{ title:'剑炉开炉'"));
const si = lines.findIndex(l => l.includes("'失窃的剑胚':{ title:'失窃的剑胚'"));
if (qi < 0 || si < 0 || qi < si) { console.error('条目定位失败 qi=' + qi + ' si=' + si); process.exit(1); }
lines.splice(si, qi - si);
console.log('已删除「失窃的剑胚」条目（' + (qi - si) + ' 行）');
// 2) 合并行后追加：链式 + 深谈去重
const mi = lines.findIndex(l => l.includes('Object.keys(QUESTS_EXTRA).forEach'));
if (mi < 0) { console.error('合并行未找到'); process.exit(1); }
const add = [
  "if(QUESTS['铸剑'] && !QUESTS['铸剑'].next) QUESTS['铸剑'].next='剑炉开炉';",
  '// 深谈：按话题名去重追加，不覆盖既有批次',
  'Object.keys(NPC_DEEP_EXTRA).forEach(function(n){',
  '  if(!NPC_DEEP[n]) NPC_DEEP[n]=NPC_DEEP_EXTRA[n];',
  '  else { const have=(NPC_DEEP[n]||[]).map(function(t){return t.t;}); NPC_DEEP_EXTRA[n].forEach(function(tp){ if(have.indexOf(tp.t)===-1) NPC_DEEP[n].push(tp); }); }',
  '});'
];
lines.splice(mi + 1, 0, ...add);
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('OK: 铸剑→剑炉开炉 链接 + 深谈去重追加');
