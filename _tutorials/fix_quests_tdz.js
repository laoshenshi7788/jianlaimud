const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
// 1) 删除 QUESTS 声明前的两行合并/钩子
const qi = lines.findIndex(l => l.trim() === 'const QUESTS = {');
if (qi < 0) { console.error('QUESTS 声明未找到'); process.exit(1); }
let pre1 = lines[qi - 1], pre2 = lines[qi - 2];
const isMerge = l => l.includes('Object.keys(QUESTS_EXTRA).forEach');
const isHook = l => l.includes("NPCS['阮邛'] && !NPCS['阮邛'].quest");
if (!(isHook(pre1) && isMerge(pre2))) { console.error('锚点不符: ' + JSON.stringify([pre2, pre1])); process.exit(1); }
lines.splice(qi - 2, 2);
// 2) 找 QUESTS 字面量闭合行，在其后插入
let depth = 0, end = -1;
for (let i = qi - 2; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > qi - 2) { end = i; break; }
}
if (end < 0) { console.error('QUESTS 闭合未找到'); process.exit(1); }
const insert = [
  'Object.keys(QUESTS_EXTRA).forEach(function(k){ if(!QUESTS[k]) QUESTS[k]=QUESTS_EXTRA[k]; });',
  "if(NPCS['阮邛'] && !NPCS['阮邛'].quest) NPCS['阮邛'].quest='失窃的剑胚';"
];
lines.splice(end + 1, 0, ...insert);
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('OK: 合并行已移至 QUESTS 声明之后（闭合行 ' + (end + 1) + '）');
