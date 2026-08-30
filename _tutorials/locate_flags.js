const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const out = [];
let i = L.findIndex(l => l.indexOf('function practiceSkill') > -1);
for (let j = i; j < i + 16; j++) out.push('P' + (j + 1) + ': ' + L[j].trim().slice(0, 120));
i = L.findIndex(l => l.indexOf("registerCmd('save'") > -1);
out.push('S' + (i + 1) + ': ' + L[i].trim().slice(0, 120));
i = L.findIndex(l => l.indexOf('function openBackpack') > -1);
out.push('B' + (i + 1) + ': ' + L[i].trim().slice(0, 90));
i = L.findIndex(l => l.indexOf('function openGiftPicker') > -1);
for (let j = i; j < i + 10; j++) out.push('G' + (j + 1) + ': ' + L[j].trim().slice(0, 125));
// 赠礼的真正执行函数
L.forEach((l, k) => { if (/function giveGift|function giveTo/.test(l)) out.push('GG' + (k + 1) + ': ' + l.trim().slice(0, 120)); });
require('fs').writeFileSync('_tutorials/_flags.txt', out.join('\n'));
console.log('ok');
