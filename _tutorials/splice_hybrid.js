// 用「方向化种子 + 全局微松弛」替换 BFS 层级布局块（按内容标记定位，不依赖行号）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
  if (start < 0 && lines[i].includes('BFS 层级布局（方案二定稿')) start = i;
  else if (start >= 0 && lines[i].includes('网格参数（城镇/内室）')) { end = i; break; }
}
if (start < 0 || end < 0) { console.error('标记未找到 start=' + start + ' end=' + end); process.exit(1); }
console.log('替换范围: 行 ' + (start + 1) + ' .. ' + end + '（' + (end - start) + ' 行）');
const block = fs.readFileSync('E:/1/mud/2/JianLai mud/_tutorials/hybrid_block.txt', 'utf8').replace(/\r?\n$/, '');
const newLines = block.split(/\r?\n/);
const out = lines.slice(0, start).concat(newLines, lines.slice(end));
fs.writeFileSync(file, out.join(nl), 'utf8');
console.log('OK: 新块 ' + newLines.length + ' 行，总行数 ' + lines.length + ' -> ' + out.length);
