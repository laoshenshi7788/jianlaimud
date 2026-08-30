// 核查练气士境界序列
const fs = require('fs');
const s = fs.readFileSync('剑来.txt', 'utf8');
const terms = ['铜皮境', '草根境', '柳筋境', '燕耳', '骨气境', '筑庐境', '洞府境', '观海境', '龙门境', '金丹境', '元婴境', '玉璞境', '仙人境', '飞升境', '下五境', '中五境', '上五境'];
terms.forEach(t => {
  let count = 0, i = s.indexOf(t);
  while (i > -1) { count++; i = s.indexOf(t, i + 1); }
  let show = '';
  if (count > 0) { const f = s.indexOf(t); show = s.slice(Math.max(0, f - 50), f + 70).replace(/\r?\n/g, ' '); }
  console.log(t + '  x' + count + (show ? '  …' + show + '…' : ''));
});
