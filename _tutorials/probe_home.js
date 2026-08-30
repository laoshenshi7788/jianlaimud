const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const out = [];
L.forEach((l, i) => {
  if (/function openHome|function ensureHomeRooms|function ensureVillaRooms|manor\.tier|function upgradeManor|function homeRoomList|function sleepHome|function restAction|安睡|function buyManor/.test(l)) {
    out.push((i + 1) + ': ' + l.trim().slice(0, 125));
  }
});
// TUT_STEPS 第6步（置办宅子）与毕业奖励段
const i1 = L.findIndex(l => l.indexOf('const TUT_STEPS') > -1);
for (let j = i1; j < i1 + 14; j++) out.push('T' + (j + 1) + ': ' + L[j].trim().slice(0, 130));
const i2 = L.findIndex(l => l.indexOf('新手引路 · 毕') > -1);
for (let j = i2 - 6; j < i2 + 4; j++) out.push('G' + (j + 1) + ': ' + L[j].trim().slice(0, 130));
require('fs').writeFileSync('_tutorials/_home.txt', out.join('\n'));
console.log('ok');
