const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
['practicedOnce=true', 'savedOnce=true', 'packOnce=true', 'giftOnce=true'].forEach(k => console.log(k + ': ' + (s.indexOf(k) > -1 ? '✓' : '✗')));
// 找赠礼执行函数与 openBackpack 实际写法
const L = s.split(/\r?\n/);
L.forEach((l, i) => {
  if (/function openBackpack|function giveGift|function doGive|function givePresent|function giftTo|赠礼.*fn|function giveAffItem/.test(l)) console.log((i + 1) + ': ' + l.trim().slice(0, 110));
});
// openGiftPicker 内的执行点
const i = L.findIndex(l => l.indexOf('function openGiftPicker') > -1);
if (i > -1) for (let j = i; j < i + 30; j++) if (/addItem|removeItem|affGain|likes/.test(L[j])) console.log('G' + (j + 1) + ': ' + L[j].trim().slice(0, 120));
