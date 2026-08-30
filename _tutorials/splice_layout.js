// 按行号把 computeGridLayout 的旧布局核心（方向化BFS+微型松弛+图距离校正失败补丁）
// 整段替换为 BFS 层级布局块。带边界断言，防止切错段。
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
// 1-based 行号：旧块 5665..5824
const START = 5665, END = 5824;
const a = lines[START - 1], b = lines[END - 1];
if (!a.includes('方向化布局')) { console.error('断言失败 START: ' + JSON.stringify(a && a.slice(0, 60))); process.exit(1); }
if (b.trim() !== '})();') { console.error('断言失败 END: ' + JSON.stringify(b)); process.exit(1); }
// 再核对块尾上文是图距离校正（确保覆盖失败补丁）
if (!lines[END - 2].includes('if(!improved) break;') && !lines[END - 3].includes('if(!improved) break;')) {
  // 宽松检查：只提示不阻断
  console.log('提示: END 前文未见 if(!improved) break; -> ' + JSON.stringify((lines[END - 2] || '').slice(0, 60)));
}
const block = fs.readFileSync('E:/1/mud/2/JianLai mud/_tutorials/layout_block.txt', 'utf8').replace(/\r?\n$/, '');
const newLines = block.split(/\r?\n/);
const out = lines.slice(0, START - 1).concat(newLines, lines.slice(END));
fs.writeFileSync(file, out.join(nl), 'utf8');
console.log('OK: 替换 ' + (END - START + 1) + ' 行 -> ' + newLines.length + ' 行，总行数 ' + lines.length + ' -> ' + out.length);
