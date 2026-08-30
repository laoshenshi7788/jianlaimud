const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);
// 1) 移除 19060 的早合并（4 行）
const mi = lines.findIndex(l => l.trim() === 'Object.keys(NPC_DEEP_EXTRA).forEach(function(n){');
if (mi < 0) { console.error('早合并未找到'); process.exit(1); }
// 校验后 3 行结构
if (!lines[mi+1].includes('if(!NPC_DEEP[n])') || !lines[mi+3].trim() === '});') {
  if (!lines[mi+1].includes('if(!NPC_DEEP[n])')) { console.error('结构不符'); process.exit(1); }
}
lines.splice(mi, 4);
console.log('已移除早合并（4 行）');
// 2) 找最后一个 Object.assign(NPC_DEEP 的闭合，其后插入去重合并
let last = -1;
lines.forEach((l, i) => { if (l.includes('Object.assign(NPC_DEEP,{')) last = i; });
if (last < 0) { console.error('assign 批次未找到'); process.exit(1); }
let depth = 0, end = -1;
for (let i = last; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > last) { end = i; break; }
}
if (end < 0) { console.error('assign 闭合未找到'); process.exit(1); }
const insert = [
  '// —— 深谈最终合并：去重追加（必须置于所有批次之后） ——',
  'Object.keys(NPC_DEEP_EXTRA).forEach(function(n){',
  '  if(!NPC_DEEP[n]) NPC_DEEP[n]=NPC_DEEP_EXTRA[n];',
  '  else { const have=(NPC_DEEP[n]||[]).map(function(t){return t.t;}); NPC_DEEP_EXTRA[n].forEach(function(tp){ if(have.indexOf(tp.t)===-1) NPC_DEEP[n].push(tp); }); }',
  '});'
];
lines.splice(end + 1, 0, ...insert);
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('OK: 去重合并已移至最后批次之后（插入行 ' + (end + 2) + '）');
