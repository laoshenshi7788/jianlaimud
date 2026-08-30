// 在剑来.txt 中核查武夫境界序列（英魄/羽化/金身/远游/山巅/止境）
const fs = require('fs');
const s = fs.readFileSync('剑来.txt', 'utf8');
const terms = ['炼体三境', '炼气三境', '神到三境', '英魄', '英魂', '羽化境', '金身境', '远游境', '山巅境', '止境', '泥胚', '木胎', '水银', '武胆', '雄魄'];
terms.forEach(t => {
  let i = s.indexOf(t);
  let count = 0, show = '';
  while (i > -1 && count < 10000) { count++; i = s.indexOf(t, i + 1); }
  if (count > 0) {
    const first = s.indexOf(t);
    show = s.slice(Math.max(0, first - 40), first + 60).replace(/\r?\n/g, ' ');
  }
  console.log(t + '  x' + count + (show ? '  …' + show + '…' : ''));
});
