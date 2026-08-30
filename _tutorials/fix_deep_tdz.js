const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);
// 1) 删除 QUESTS 合并行后误插的去重块（6 行：注释+5 行）
const qi = lines.findIndex(l => l.includes('Object.keys(QUESTS_EXTRA).forEach'));
let delStart = -1;
for (let i = qi + 1; i < Math.min(qi + 5, lines.length); i++) {
  if (lines[i].includes('按话题名去重追加')) { delStart = i; break; }
}
if (delStart < 0) { console.error('去重块定位失败'); process.exit(1); }
lines.splice(delStart, 5); // 注释 + 5 行代码
console.log('已移除误插的去重块');
// 2) 替换 NPC_DEEP_EXTRA 之后的简单合并为去重追加版
const di = lines.findIndex(l => l.includes('Object.keys(NPC_DEEP_EXTRA).forEach'));
if (di < 0) { console.error('NPC_DEEP 合并行未找到'); process.exit(1); }
lines[di] = [
  'Object.keys(NPC_DEEP_EXTRA).forEach(function(n){',
  '  if(!NPC_DEEP[n]) NPC_DEEP[n]=NPC_DEEP_EXTRA[n];',
  '  else { const have=(NPC_DEEP[n]||[]).map(function(t){return t.t;}); NPC_DEEP_EXTRA[n].forEach(function(tp){ if(have.indexOf(tp.t)===-1) NPC_DEEP[n].push(tp); }); }',
  '});'
].join('\r\n').split(/\r?\n/).length ? '' : '';
// 上一行占位错误，改为直接拼接：
lines.splice(di, 1,
  'Object.keys(NPC_DEEP_EXTRA).forEach(function(n){',
  '  if(!NPC_DEEP[n]) NPC_DEEP[n]=NPC_DEEP_EXTRA[n];',
  '  else { const have=(NPC_DEEP[n]||[]).map(function(t){return t.t;}); NPC_DEEP_EXTRA[n].forEach(function(tp){ if(have.indexOf(tp.t)===-1) NPC_DEEP[n].push(tp); }); }',
  '});'
);
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('OK: 深谈合并已改为去重追加，且位于 NPC_DEEP_EXTRA 声明之后');
