const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
const lines = f.split(/\r?\n/);
// 1) equipment 初始化
lines.forEach((l, i) => {
  if (/player\.equipment\s*=|equipment:\s*\{/.test(l)) console.log('INIT ' + (i + 1) + '\t' + l.trim().slice(0, 130));
});
// 2) 装备按钮/穿装函数
lines.forEach((l, i) => {
  if (/function (equip[A-Za-z]*|takeOff[A-Za-z]*)\(/.test(l)) console.log('FN ' + (i + 1) + '\t' + l.trim().slice(0, 90));
});
// 3) 行囊/装备 UI 关键词
lines.forEach((l, i) => {
  if (/行囊|穿上|卸下|装备中/.test(l) && /function|addEventListener|btn|innerHTML/.test(l)) console.log('UI ' + (i + 1) + '\t' + l.trim().slice(0, 110));
});
// 4) ALCHEMY_RECIPES 全部
const ai = lines.findIndex(l => l.includes('const ALCHEMY_RECIPES'));
console.log('--- ALCHEMY_RECIPES ---');
for (let i = ai; i < Math.min(ai + 30, lines.length); i++) console.log((i + 1) + '\t' + lines[i].trim().slice(0, 130));
// 5) ITEMS 结束位置（下一个顶层 const 之前）
const ii = lines.findIndex(l => l.includes('const ITEMS = {'));
let depth = 0;
for (let i = ii; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > ii) { console.log('ITEMS ends at line ' + (i + 1) + ': ' + lines[i].trim().slice(0, 40)); break; }
}
