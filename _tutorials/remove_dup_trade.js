// 删除误加的重复行商块（游戏已有大航海式贸易系统）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);
const start = lines.findIndex(l => l.includes('============ 行商带货：六货×城差×日行情'));
const end = lines.findIndex(l => l.includes('// —— 家园门户 ——'));
if (start < 0 || end < 0 || end <= start) { console.error('定位失败 ' + start + ',' + end); process.exit(1); }
lines.splice(start, end - start);
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('OK: 重复块已移除（' + (end - start) + ' 行）');
