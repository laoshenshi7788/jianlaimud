// 章节扩展收尾：通关主线判定 5 -> 7（终章已移至 6、大结局 7）
const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');
let n1 = 0, n2 = 0, n3 = 0;
s = s.replace(/game\.chapter>=5/g, function () { n1++; return 'game.chapter>=7'; });
s = s.replace(/game\.chapter===5/g, function () { n2++; return 'game.chapter===7'; });
s = s.replace(/game\.chapter<5/g, function () { n3++; return 'game.chapter<7'; });
fs.writeFileSync('index.html', s);
console.log('replaced >=5:' + n1 + '  ===5:' + n2 + '  <5:' + n3);
const left = (s.match(/game\.chapter\s*(>=|===|<|>)\s*5/g) || []).length;
console.log('remaining chapter-5 refs: ' + left);
