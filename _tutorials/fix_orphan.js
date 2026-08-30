// 定位并删除 SMITH 块前误插的孤行（'九转还魂丹' + '};'）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);
const smithIdx = lines.findIndex(l => l.includes('// —— 锻造（炼器）：材料成兵'));
if (smithIdx < 0) { console.error('锻造块未找到'); process.exit(1); }
// 锻造块前两行应为孤行：'九转还魂丹':{...} 与 '};'
const a = lines[smithIdx - 2] || '', b = lines[smithIdx - 1] || '';
console.log('锻造块前两行: [' + a.trim().slice(0, 60) + '] [' + b.trim().slice(0, 40) + ']');
if (a.includes('九转还魂丹') && b.trim() === '};') {
  lines.splice(smithIdx - 2, 2);
  fs.writeFileSync(file, lines.join(nl), 'utf8');
  console.log('OK: 孤行已删除');
} else {
  console.log('无需修复（结构正常）');
}
