// 删除零引用的 CHENG_POS 手摆坐标死表（const CHENG_POS = { ... };）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const CHENG_POS = {')) { start = i; break; }
}
if (start < 0) { console.error('未找到 CHENG_POS'); process.exit(1); }
// 大括号平衡找结束行
let depth = 0, end = -1;
for (let i = start; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  if (depth === 0 && i > start) { end = i; break; }
}
if (end < 0) { console.error('未找到 CHENG_POS 结束行'); process.exit(1); }
console.log('CHENG_POS: 行 ' + (start + 1) + ' .. ' + (end + 1) + '，共 ' + (end - start + 1) + ' 行');
console.log('首行: ' + lines[start].slice(0, 50));
console.log('尾行: ' + lines[end].slice(0, 50));
const out = lines.slice(0, start).concat(lines.slice(end + 1));
fs.writeFileSync(file, out.join(nl), 'utf8');
console.log('OK: 删除后总行数 ' + lines.length + ' -> ' + out.length);
