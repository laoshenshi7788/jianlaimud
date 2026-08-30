// 读 feature/skill.c 的 improve_skill / potential 消耗逻辑（latin1 直读，行号）
const fs = require('fs');
const s = fs.readFileSync('E:/1/mud/2/mhsj-main/mhsj-main/feature/skill.c', 'latin1');
const L = s.split(/\r?\n/);
const out = [];
let capture = 0;
L.forEach((l, i) => {
  if (/improve_skill|can_improve|potential|skill_level|valid_learn/.test(l)) {
    // 抓上下文
    for (let j = Math.max(0, i - 3); j < Math.min(L.length, i + 18); j++) {
      out.push((j + 1) + ': ' + L[j].slice(0, 118));
    }
    out.push('=======');
  }
});
fs.writeFileSync('_tutorials/_mhsj_skill.txt', out.join('\n'));
console.log('lines written: ' + out.length);
